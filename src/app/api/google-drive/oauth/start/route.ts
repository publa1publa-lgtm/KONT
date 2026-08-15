import { NextResponse } from "next/server";

import { withLocale } from "@/i18n/config";
import { getServerLocale } from "@/i18n/server";
import { clientKeyFromRequest, rateLimit } from "@/lib/api/rateLimit";
import { json, tooManyRequests, unauthorized } from "@/lib/api/http";
import { safeStudioRedirect } from "@/lib/safeRedirectPath";
import { getSessionUserId } from "@/lib/session";
import {
  createOAuthState,
  DRIVE_OAUTH_STATE_COOKIE,
  DRIVE_OAUTH_STATE_MAX_AGE_SEC,
  generateAuthUrl,
  sanitizeDriveScopes,
} from "@/lib/google-drive/oauth";
import { GoogleDriveConfigError, GoogleDriveError } from "@/lib/google-drive/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function oauthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DRIVE_OAUTH_STATE_MAX_AGE_SEC,
  };
}

/** Starts Google OAuth2 Authorization Code Flow for Drive. */
export async function start(req: Request): Promise<NextResponse> {
  const rl = rateLimit(clientKeyFromRequest(req, "drive:oauth:start"), {
    limit: 20,
    windowMs: 15 * 60_000,
  });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const userId = await getSessionUserId();
  const locale = await getServerLocale();
  if (!userId) {
    const login = new URL(withLocale(locale, "/login"), req.url);
    login.searchParams.set("next", "/studio/accounts");
    return NextResponse.redirect(login);
  }

  const incoming = new URL(req.url);
  const returnTo = safeStudioRedirect(incoming.searchParams.get("returnTo")) ?? "/studio/accounts";
  const scopes = sanitizeDriveScopes(incoming.searchParams.get("scopes")?.split(/[,\s]+/) ?? []);
  const requestedPermissionIds = (incoming.searchParams.get("perms") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  try {
    const state = createOAuthState({ userId, returnTo, requestedScopes: scopes, requestedPermissionIds });
    const authUrl = generateAuthUrl({ state, scopes });
    const res = NextResponse.redirect(authUrl);
    res.cookies.set(DRIVE_OAUTH_STATE_COOKIE, state, oauthCookieOptions());
    return res;
  } catch (err) {
    if (err instanceof GoogleDriveConfigError) {
      return json({ error: err.message, code: err.code }, 500);
    }
    if (err instanceof GoogleDriveError) {
      return json({ error: err.message, code: err.code }, err.status);
    }
    console.error("[drive.oauth.start]", err);
    return json({ error: "Failed to start Google Drive OAuth." }, 500);
  }
}

export async function GET(req: Request) {
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("application/json") && !accept.includes("text/html")) {
    const userId = await getSessionUserId();
    if (!userId) return unauthorized();
    try {
      const incoming = new URL(req.url);
      const returnTo = safeStudioRedirect(incoming.searchParams.get("returnTo")) ?? "/studio/accounts";
      const scopes = sanitizeDriveScopes(incoming.searchParams.get("scopes")?.split(/[,\s]+/) ?? []);
      const requestedPermissionIds = (incoming.searchParams.get("perms") ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);
      const state = createOAuthState({ userId, returnTo, requestedScopes: scopes, requestedPermissionIds });
      const url = generateAuthUrl({ state, scopes });
      const res = json({ url });
      res.cookies.set(DRIVE_OAUTH_STATE_COOKIE, state, oauthCookieOptions());
      return res;
    } catch (err) {
      if (err instanceof GoogleDriveError) {
        return json({ error: err.message, code: err.code }, err.status);
      }
      return json({ error: "Failed to start Google Drive OAuth." }, 500);
    }
  }

  return start(req);
}
