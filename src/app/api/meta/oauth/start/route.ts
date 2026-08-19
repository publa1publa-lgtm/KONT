import { NextResponse } from "next/server";

import { withLocale } from "@/i18n/config";
import { getServerLocale } from "@/i18n/server";
import { clientKeyFromRequest, rateLimit } from "@/lib/api/rateLimit";
import { json, tooManyRequests } from "@/lib/api/http";
import {
  createOAuthState,
  generateAuthUrl,
  META_OAUTH_STATE_COOKIE,
  META_OAUTH_STATE_MAX_AGE_SEC,
} from "@/lib/meta/oauth";
import { sanitizeMetaScopes } from "@/lib/meta/permissions";
import { MetaConfigError, MetaError, type MetaConnectIntent } from "@/lib/meta/types";
import { safeStudioRedirect } from "@/lib/safeRedirectPath";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request): Promise<NextResponse> {
  const rl = await rateLimit(clientKeyFromRequest(req, "meta:oauth:start"), { limit: 20, windowMs: 15 * 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const userId = await getSessionUserId();
  const locale = await getServerLocale();
  if (!userId) {
    const login = new URL(withLocale(locale, "/login"), req.url);
    login.searchParams.set("next", "/studio/platforms");
    return NextResponse.redirect(login);
  }

  const incoming = new URL(req.url);
  const intent: MetaConnectIntent = incoming.searchParams.get("intent") === "instagram" ? "instagram" : "facebook";
  const returnTo = safeStudioRedirect(incoming.searchParams.get("returnTo")) ?? "/studio/platforms";
  const scopes = sanitizeMetaScopes(intent, incoming.searchParams.get("scopes")?.split(/[,\s]+/) ?? []);
  const requestedPermissionIds = (incoming.searchParams.get("perms") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  try {
    const state = createOAuthState({ userId, returnTo, intent, requestedScopes: scopes, requestedPermissionIds });
    const res = NextResponse.redirect(generateAuthUrl({ state, intent, scopes }));
    res.cookies.set(META_OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: META_OAUTH_STATE_MAX_AGE_SEC,
    });
    return res;
  } catch (err) {
    if (err instanceof MetaConfigError || err instanceof MetaError) {
      return json({ error: err.message, code: err.code }, err instanceof MetaError ? err.status : 500);
    }
    console.error("[meta.oauth.start]", err);
    return json({ error: "Failed to start Meta OAuth." }, 500);
  }
}
