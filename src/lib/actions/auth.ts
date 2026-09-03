"use server";

import { AuditAction } from "@prisma/client";

import { authenticateLogin } from "@/lib/auth/authenticateLogin";
import { establishSessionAndRedirect } from "@/lib/auth/establishSession";
import { hashPassword } from "@/lib/auth";
import {
  type AuthErrorCode,
  type FieldErrors,
  type LoginField,
  type RegisterField,
  firstError,
  hasFieldErrors,
  loginErrorCode,
  normalizeLogin,
  validateLoginFields,
  validateRegisterFields,
} from "@/lib/auth/validation";
import { createSession } from "@/lib/sessionStore";
import { auditContextFromServerHeaders, writeAudit } from "@/lib/audit";
import { notifyUserLogin, notifyUserRegistered } from "@/lib/ops/notify";
import * as userRepo from "@/lib/repos/userRepo";

export type AuthActionState = {
  error?: AuthErrorCode;
  fieldErrors?: FieldErrors<LoginField | RegisterField>;
} | null;

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const identifier = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fieldErrors = validateLoginFields(identifier, password);
  if (hasFieldErrors(fieldErrors)) {
    return { error: firstError(fieldErrors), fieldErrors };
  }

  const auth = await authenticateLogin(identifier, password);
  if (!auth.ok) {
    return { error: loginErrorCode(auth.error) };
  }

  const ctx = await auditContextFromServerHeaders();
  await userRepo.touchUserLastLogin(auth.userId);

  const session = await createSession({
    userId: auth.userId,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

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

  await establishSessionAndRedirect(session.token, formData);
  throw new Error("Unreachable");
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const values = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
    login: String(formData.get("login") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    passwordConfirm: String(formData.get("passwordConfirm") ?? ""),
  };
  const fieldErrors = validateRegisterFields(values);
  if (hasFieldErrors(fieldErrors)) {
    return { error: firstError(fieldErrors), fieldErrors };
  }

  const emailRaw = values.email.trim().toLowerCase();
  const loginNormalized = normalizeLogin(values.login);
  const firstName = values.firstName.trim().slice(0, 80);
  const lastName = values.lastName.trim().slice(0, 80);
  const marketingOptIn = formData.get("marketingOptIn") === "on";

  const existingEmail = await userRepo.findUserByEmail(emailRaw);
  if (existingEmail) {
    return { error: "emailTaken", fieldErrors: { email: "emailTaken" } };
  }

  const existingLogin = await userRepo.findUserByLogin(loginNormalized);
  if (existingLogin) {
    return { error: "loginTaken", fieldErrors: { login: "loginTaken" } };
  }

  const passwordHash = await hashPassword(values.password);
  const user = await userRepo.createUser({
    email: emailRaw,
    login: loginNormalized,
    firstName,
    lastName,
    marketingOptIn,
    passwordHash,
  });

  const ctx = await auditContextFromServerHeaders();
  const session = await createSession({
    userId: user.id,
    ip: ctx.ip,
    userAgent: ctx.userAgent,
  });

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

  await establishSessionAndRedirect(session.token, formData);
  throw new Error("Unreachable");
}
