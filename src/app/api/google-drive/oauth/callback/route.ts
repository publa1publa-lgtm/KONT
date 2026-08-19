import { AuditAction } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { withLocale, type AppLocale } from "@/i18n/config";
import { getServerLocale } from "@/i18n/server";
import { auditContextFromRequest, writeAudit } from "@/lib/audit";
import { json } from "@/lib/api/http";
import { safeStudioRedirect } from "@/lib/safeRedirectPath";
import {
  DRIVE_OAUTH_STATE_COOKIE,
  exchangeCodeForTokens,
  fetchGoogleUser,
  parseOAuthState,
  type DriveOAuthState,
} from "@/lib/google-drive/oauth";
import { diffDrivePermissions } from "@/lib/google-drive/permissions";
import { saveTokens } from "@/lib/google-drive/storage";
import { GoogleDriveError, type DriveUserProfile } from "@/lib/google-drive/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CompletedDriveOAuth = {
  userId: string;
  profile: DriveUserProfile | null;
  handle: string;
  hasRefreshToken: boolean;
  expiresAt: string;
  returnTo: string;
  grantedIds: string[];
  missingIds: string[];
  extraIds: string[];
};

function studioRedirect(req: Request, locale: AppLocale, returnTo: string, params: Record<string, string>): URL {
  const safe = safeStudioRedirect(returnTo) ?? "/studio/platforms";
  const url = new URL(withLocale(locale, safe), req.url);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

function clearStateCookie(res: NextResponse): NextResponse {
  res.cookies.set(DRIVE_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

function accountHandle(profile: DriveUserProfile | null): string {
  if (!profile) return "Google Drive";
  return profile.email || profile.name || "Google Drive";
}

async function readOAuthState(queryState: string | null): Promise<DriveOAuthState> {
  const jar = await cookies();
  const cookieState = jar.get(DRIVE_OAUTH_STATE_COOKIE)?.value ?? null;
  if (cookieState && queryState && cookieState !== queryState) {
    throw new GoogleDriveError("OAuth state mismatch.", { code: "OAUTH_STATE", status: 400 });
  }
  return parseOAuthState(cookieState ?? queryState);
}

async function completeDriveOAuth(req: Request, code: string): Promise<CompletedDriveOAuth> {
  const incoming = new URL(req.url);
  const state = await readOAuthState(incoming.searchParams.get("state"));
  const tokens = await exchangeCodeForTokens(code);
  const requestedIds = state.requestedPermissionIds;
  const diff = diffDrivePermissions(requestedIds, tokens.scope);
  const profile = await fetchGoogleUser(tokens.accessToken);
  const now = new Date();

  await saveTokens(state.userId, {
    ...tokens,
    profile,
    createdAt: now,
    updatedAt: now,
  });

  void writeAudit({
    userId: state.userId,
    ...auditContextFromRequest(req),
    action: AuditAction.PLATFORM_CONNECTED,
    entityType: "PlatformAccount",
    metadata: {
      platform: "GOOGLE_DRIVE",
      googleUserId: profile?.googleUserId ?? null,
      hasRefreshToken: Boolean(tokens.refreshToken),
      requestedScopes: state.requestedScopes,
      grantedScopes: tokens.scope,
      missingPermissionIds: diff.missingIds,
      extraPermissionIds: diff.extraIds,
    },
  });

  return {
    userId: state.userId,
    profile,
    handle: accountHandle(profile),
    hasRefreshToken: Boolean(tokens.refreshToken),
    expiresAt: tokens.expiresAt.toISOString(),
    returnTo: state.returnTo,
    grantedIds: diff.grantedIds,
    missingIds: diff.missingIds,
    extraIds: diff.extraIds,
  };
}

/** Exchanges `?code=` for tokens, stores them, and returns the user to Studio. */
export async function callback(req: Request): Promise<NextResponse> {
  const locale = await getServerLocale();
  const incoming = new URL(req.url);
  const code = incoming.searchParams.get("code");
  const providerError = incoming.searchParams.get("error");

  let returnTo = "/studio/platforms";
  try {
    returnTo = (await readOAuthState(incoming.searchParams.get("state"))).returnTo;
  } catch {
    // fall back to accounts
  }

  if (providerError) {
    return clearStateCookie(
      NextResponse.redirect(
        studioRedirect(req, locale, returnTo, {
          drive: "error",
          reason: providerError === "access_denied" ? "access_denied" : "provider_error",
        }),
      ),
    );
  }

  if (!code) {
    return clearStateCookie(
      NextResponse.redirect(studioRedirect(req, locale, returnTo, { drive: "error", reason: "missing_code" })),
    );
  }

  try {
    const result = await completeDriveOAuth(req, code);
    const params: Record<string, string> = {
      drive: "connected",
      account: result.handle,
      granted: result.grantedIds.join(","),
    };
    if (result.missingIds.length) params.missing = result.missingIds.join(",");
    if (result.extraIds.length) params.extra = result.extraIds.join(",");
    return clearStateCookie(
      NextResponse.redirect(studioRedirect(req, locale, result.returnTo || returnTo, params)),
    );
  } catch (err) {
    const reason = err instanceof GoogleDriveError ? err.code.toLowerCase() : "token_exchange_failed";
    console.error("[drive.oauth.callback]", err);
    return clearStateCookie(
      NextResponse.redirect(studioRedirect(req, locale, returnTo, { drive: "error", reason })),
    );
  }
}

export async function GET(req: Request) {
  const accept = req.headers.get("accept") ?? "";
  if (accept.includes("application/json") && !accept.includes("text/html")) {
    try {
      const code = new URL(req.url).searchParams.get("code");
      if (!code) return json({ ok: false, error: "Missing authorization code." }, 400);

      const result = await completeDriveOAuth(req, code);
      const res = json({
        ok: true,
        connected: true,
        profile: result.profile,
        expiresAt: result.expiresAt,
        hasRefreshToken: result.hasRefreshToken,
        granted: result.grantedIds,
        missing: result.missingIds,
        extra: result.extraIds,
      });
      return clearStateCookie(res);
    } catch (err) {
      if (err instanceof GoogleDriveError) {
        return json({ ok: false, error: err.message, code: err.code }, err.status);
      }
      return json({ ok: false, error: "Google Drive OAuth callback failed." }, 500);
    }
  }

  return callback(req);
}
