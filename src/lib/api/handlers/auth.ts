import { NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";

import { sessionCookieOptions, hashPassword, cookieName } from "@/lib/auth";
import { authenticateLogin } from "@/lib/auth/authenticateLogin";
import { createSession, revokeSession } from "@/lib/sessionStore";
import { auditContextFromRequest, writeAudit } from "@/lib/audit";
import { getSessionUserId, getCurrentSessionId } from "@/lib/session";
import { readJsonRecord, badRequest, conflict, json, tooManyRequests } from "@/lib/api/http";
import { clientKeyFromRequest, rateLimit } from "@/lib/api/rateLimit";
import { notifyUserLogin, notifyUserRegistered } from "@/lib/ops/notify";
import * as userRepo from "@/lib/repos/userRepo";

export async function postLogin(req: Request): Promise<NextResponse> {
  const rl = await rateLimit(clientKeyFromRequest(req, "auth:login"), { limit: 30, windowMs: 15 * 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const body = await readJsonRecord(req);
  if (!body) return badRequest("Invalid JSON body");

  const raw = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  const auth = await authenticateLogin(raw, password);
  if (!auth.ok) {
    return json({ error: auth.error }, auth.status);
  }

  const ctx = auditContextFromRequest(req);

  await userRepo.touchUserLastLogin(auth.userId);

  const session = await createSession({ userId: auth.userId, ip: ctx.ip, userAgent: ctx.userAgent });

  void writeAudit({
    userId: auth.userId,
    ...ctx,
    action: AuditAction.USER_LOGIN,
    entityType: "User",
    entityId: auth.userId,
  });

  const profile = await userRepo.findUserProfile(auth.userId).catch(() => null);
  void notifyUserLogin({
    id: auth.userId,
    email: auth.email,
    login: profile?.login,
    firstName: profile?.firstName,
    lastName: profile?.lastName,
  });

  const { name, options } = sessionCookieOptions();
  const res = json({ user: { id: auth.userId, email: auth.email } });
  res.cookies.set(name, session.token, options);
  return res;
}

export async function postRegister(req: Request): Promise<NextResponse> {
  const rl = await rateLimit(clientKeyFromRequest(req, "auth:register"), { limit: 12, windowMs: 60 * 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const body = await readJsonRecord(req);
  if (!body) return badRequest("Invalid JSON body");

  const emailRaw = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const passwordConfirm = typeof body.passwordConfirm === "string" ? body.passwordConfirm : password;
  if (password !== passwordConfirm) {
    return badRequest("Passwords do not match");
  }
  const firstName = typeof body.firstName === "string" ? body.firstName.trim().slice(0, 80) : "";
  const lastName = typeof body.lastName === "string" ? body.lastName.trim().slice(0, 80) : "";
  const loginRaw = typeof body.login === "string" ? body.login.trim().toLowerCase() : "";
  const loginNormalized = loginRaw.replace(/[^a-z0-9_]/g, "");
  const marketingOptIn = body.marketingOptIn === true;

  if (!emailRaw || !emailRaw.includes("@")) {
    return badRequest("Valid email is required");
  }
  if (!password || password.length < 8) {
    return badRequest("Password must be at least 8 characters");
  }
  if (!loginNormalized || loginNormalized.length < 3 || loginNormalized.length > 30) {
    return badRequest("Login must be 3–30 characters (letters, numbers, underscore)");
  }
  if (!/^[a-z0-9_]{3,30}$/.test(loginNormalized)) {
    return badRequest("Login must be 3–30 characters (letters, numbers, underscore)");
  }

  const existingEmail = await userRepo.findUserByEmail(emailRaw);
  if (existingEmail) {
    return conflict("Email is already registered");
  }

  const existingLogin = await userRepo.findUserByLogin(loginNormalized);
  if (existingLogin) {
    return conflict("Login is already taken");
  }

  const passwordHash = await hashPassword(password);
  const user = await userRepo.createUser({
    email: emailRaw,
    login: loginNormalized,
    firstName,
    lastName,
    marketingOptIn,
    passwordHash,
  });

  const ctx = auditContextFromRequest(req);
  const session = await createSession({ userId: user.id, ip: ctx.ip, userAgent: ctx.userAgent });

  void writeAudit({
    userId: user.id,
    ...ctx,
    action: AuditAction.USER_REGISTERED,
    entityType: "User",
    entityId: user.id,
  });
  await notifyUserRegistered({
    id: user.id,
    email: user.email,
    login: loginNormalized,
    firstName,
    lastName,
    createdAt: user.createdAt,
  });

  const { name, options } = sessionCookieOptions();
  const res = json({ user }, 201);
  res.cookies.set(name, session.token, options);
  return res;
}

export async function getMe(): Promise<NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) return json({ user: null });

  const user = await userRepo.findUserProfile(userId);
  return json({ user });
}

export async function postLogout(req: Request): Promise<NextResponse> {
  const ctx = auditContextFromRequest(req);
  const sessionId = await getCurrentSessionId();

  if (sessionId) {
    const sess = await userRepo.findSessionById(sessionId);
    await revokeSession(sessionId, "user_logout");
    if (sess) {
      void writeAudit({
        userId: sess.userId,
        ...ctx,
        action: AuditAction.USER_LOGOUT,
        entityType: "User",
        entityId: sess.userId,
      });
      void writeAudit({
        userId: sess.userId,
        ...ctx,
        action: AuditAction.SESSION_REVOKED,
        entityType: "Session",
        entityId: sessionId,
        metadata: { reason: "user_logout" },
      });
    }
  }

  const res = json({ ok: true });
  res.cookies.set(cookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}
