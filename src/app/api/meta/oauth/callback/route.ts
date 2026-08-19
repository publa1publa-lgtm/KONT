import { AuditAction } from "@prisma/client";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { withLocale, type AppLocale } from "@/i18n/config";
import { getServerLocale } from "@/i18n/server";
import { auditContextFromRequest, writeAudit } from "@/lib/audit";
import {
  debugUserToken,
  exchangeCodeForTokens,
  fetchManagedPages,
  fetchMetaUser,
  parseOAuthState,
  pickFacebookPage,
  pickInstagramPage,
  type MetaOAuthState,
  META_OAUTH_STATE_COOKIE,
} from "@/lib/meta/oauth";
import { diffMetaPermissions } from "@/lib/meta/permissions";
import { saveMetaAccount } from "@/lib/meta/storage";
import { metaAccountHandle, MetaError, type MetaConnectIntent } from "@/lib/meta/types";
import { safeStudioRedirect } from "@/lib/safeRedirectPath";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function studioRedirect(req: Request, locale: AppLocale, returnTo: string, params: Record<string, string>): URL {
  const url = new URL(withLocale(locale, safeStudioRedirect(returnTo) ?? "/studio/platforms"), req.url);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url;
}

function clearStateCookie(res: NextResponse): NextResponse {
  res.cookies.set(META_OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

async function readOAuthState(queryState: string | null): Promise<MetaOAuthState> {
  const jar = await cookies();
  const cookieState = jar.get(META_OAUTH_STATE_COOKIE)?.value ?? null;
  if (cookieState && queryState && cookieState !== queryState) {
    throw new MetaError("OAuth state mismatch.", { code: "OAUTH_STATE", status: 400 });
  }
  return parseOAuthState(cookieState ?? queryState);
}

function failRedirect(
  req: Request,
  locale: AppLocale,
  returnTo: string,
  intent: MetaConnectIntent,
  reason: string,
): NextResponse {
  return clearStateCookie(NextResponse.redirect(studioRedirect(req, locale, returnTo, { [intent]: "error", reason })));
}

export async function GET(req: Request): Promise<NextResponse> {
  const locale = await getServerLocale();
  const incoming = new URL(req.url);
  const code = incoming.searchParams.get("code");
  const providerError = incoming.searchParams.get("error");

  let returnTo = "/studio/platforms";
  let intent: MetaConnectIntent = "facebook";
  try {
    const state = await readOAuthState(incoming.searchParams.get("state"));
    returnTo = state.returnTo;
    intent = state.intent;
  } catch {
    // fall back
  }

  if (providerError) {
    return failRedirect(req, locale, returnTo, intent, providerError === "access_denied" ? "access_denied" : "provider_error");
  }
  if (!code) return failRedirect(req, locale, returnTo, intent, "missing_code");

  try {
    const state = await readOAuthState(incoming.searchParams.get("state"));
    const tokens = await exchangeCodeForTokens(code);
    const debug = await debugUserToken(tokens.userAccessToken);
    const scope = debug.scopes.length ? debug.scopes.join(",") : state.requestedScopes.join(",");
    const expiresAt = debug.expiresAt ?? tokens.userTokenExpiresAt;
    const profile = await fetchMetaUser(tokens.userAccessToken);
    const pages = await fetchManagedPages(tokens.userAccessToken);
    const selectedPage = state.intent === "instagram" ? pickInstagramPage(pages) : pickFacebookPage(pages);
    const diff = diffMetaPermissions(state.intent, state.requestedPermissionIds, scope);

    await saveMetaAccount(state.userId, state.intent, {
      userAccessToken: tokens.userAccessToken,
      userTokenExpiresAt: expiresAt,
      tokenType: tokens.tokenType,
      scope,
      profile,
      pages,
      selectedPage,
    });

    const handle = metaAccountHandle(state.intent, selectedPage);
    void writeAudit({
      userId: state.userId,
      ...auditContextFromRequest(req),
      action: AuditAction.PLATFORM_CONNECTED,
      entityType: "PlatformAccount",
      metadata: {
        platform: state.intent === "instagram" ? "INSTAGRAM" : "FACEBOOK",
        pageId: selectedPage.pageId,
        igUserId: selectedPage.igUserId,
        longLived: true,
        grantedScopes: scope,
        missingPermissionIds: diff.missingIds,
      },
    });

    const params: Record<string, string> = {
      [state.intent]: "connected",
      account: handle,
      granted: diff.grantedIds.join(","),
    };
    if (diff.missingIds.length) params.missing = diff.missingIds.join(",");
    if (diff.extraIds.length) params.extra = diff.extraIds.join(",");
    return clearStateCookie(NextResponse.redirect(studioRedirect(req, locale, state.returnTo || returnTo, params)));
  } catch (err) {
    const reason = err instanceof MetaError ? err.code.toLowerCase() : "token_exchange_failed";
    console.error("[meta.oauth.callback]", err);
    return failRedirect(req, locale, returnTo, intent, reason);
  }
}
