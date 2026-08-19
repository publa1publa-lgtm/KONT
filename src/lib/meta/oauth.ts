import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { facebookDialogBase, graphBase, graphGet, readGraphJson } from "./graph";
import { sanitizeMetaScopes } from "./permissions";
import {
  MetaConfigError,
  MetaError,
  type MetaConnectIntent,
  type MetaOAuthConfig,
  type MetaOAuthTokens,
  type MetaPageProfile,
  type MetaTokenResponse,
  type MetaUserProfile,
} from "./types";

export const META_OAUTH_STATE_COOKIE = "meta_oauth_state";
export const META_OAUTH_STATE_MAX_AGE_SEC = 10 * 60;

const LONG_LIVED_MIN_EXPIRES_SEC = 2 * 24 * 60 * 60;

export type MetaOAuthState = {
  userId: string;
  returnTo: string;
  nonce: string;
  exp: number;
  intent: MetaConnectIntent;
  requestedScopes: string[];
  requestedPermissionIds: string[];
};

function requiredEnv(name: "META_APP_ID" | "META_APP_SECRET"): string {
  const value = process.env[name]?.trim();
  if (!value) throw new MetaConfigError(`${name} is not set.`);
  return value;
}

function metaRedirectUri(): string {
  const explicit = process.env.META_REDIRECT_URI?.trim();
  if (explicit) return explicit;
  const appUrl = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl) return `${appUrl.replace(/\/+$/, "")}/api/meta/oauth/callback`;
  throw new MetaConfigError("META_REDIRECT_URI is not set.");
}

function getMetaOAuthConfig(): MetaOAuthConfig {
  return {
    appId: requiredEnv("META_APP_ID"),
    appSecret: requiredEnv("META_APP_SECRET"),
    redirectUri: metaRedirectUri(),
  };
}

function stateSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.META_APP_SECRET?.trim();
  if (!secret) {
    throw new MetaConfigError("AUTH_SECRET or META_APP_SECRET is required to sign OAuth state.");
  }
  return secret;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function b64urlDecode(value: string): Buffer {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  return Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/") + pad, "base64");
}

export function createOAuthState(input: Omit<MetaOAuthState, "nonce" | "exp">): string {
  const payload: MetaOAuthState = {
    ...input,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + META_OAUTH_STATE_MAX_AGE_SEC * 1000,
  };
  const body = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = b64urlEncode(createHmac("sha256", stateSecret()).update(body).digest());
  return `${body}.${sig}`;
}

export function parseOAuthState(raw: string | undefined | null): MetaOAuthState {
  if (!raw || !raw.includes(".")) {
    throw new MetaError("Missing or invalid OAuth state.", { code: "OAUTH_STATE", status: 400 });
  }
  const [body, sig] = raw.split(".");
  if (!body || !sig) {
    throw new MetaError("Malformed OAuth state.", { code: "OAUTH_STATE", status: 400 });
  }
  const expected = b64urlEncode(createHmac("sha256", stateSecret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new MetaError("OAuth state signature mismatch.", { code: "OAUTH_STATE", status: 400 });
  }

  let rec: Record<string, unknown>;
  try {
    rec = JSON.parse(b64urlDecode(body).toString("utf8")) as Record<string, unknown>;
  } catch {
    throw new MetaError("OAuth state payload is not valid JSON.", { code: "OAUTH_STATE", status: 400 });
  }
  if (typeof rec.userId !== "string" || typeof rec.returnTo !== "string" || typeof rec.exp !== "number") {
    throw new MetaError("OAuth state is missing required fields.", { code: "OAUTH_STATE", status: 400 });
  }
  if (rec.exp <= Date.now()) {
    throw new MetaError("OAuth state expired. Start the Meta connection again.", {
      code: "OAUTH_STATE_EXPIRED",
      status: 400,
    });
  }

  return {
    userId: rec.userId,
    returnTo: rec.returnTo,
    intent: rec.intent === "instagram" ? "instagram" : "facebook",
    requestedScopes: Array.isArray(rec.requestedScopes)
      ? rec.requestedScopes.filter((item): item is string => typeof item === "string")
      : [],
    requestedPermissionIds: Array.isArray(rec.requestedPermissionIds)
      ? rec.requestedPermissionIds.filter((item): item is string => typeof item === "string")
      : [],
    nonce: typeof rec.nonce === "string" ? rec.nonce : "",
    exp: rec.exp,
  };
}

export function generateAuthUrl(options: {
  state: string;
  intent: MetaConnectIntent;
  scopes?: readonly string[];
}): string {
  const config = getMetaOAuthConfig();
  const params = new URLSearchParams({
    client_id: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: sanitizeMetaScopes(options.intent, options.scopes).join(","),
    state: options.state,
  });
  return `${facebookDialogBase()}/dialog/oauth?${params.toString()}`;
}

async function readTokenResponse(res: Response, fallback: string): Promise<MetaOAuthTokens> {
  const body = await readGraphJson<MetaTokenResponse>(res);
  if (!res.ok || body.error || !body.access_token) {
    throw new MetaError(body.error?.message || fallback, {
      code: body.error?.code != null ? `META_${body.error.code}` : "META_TOKEN",
      status: res.status >= 400 ? res.status : 502,
      details: body,
    });
  }
  return {
    userAccessToken: body.access_token,
    userTokenExpiresAt: new Date(Date.now() + Math.max(1, body.expires_in ?? 3600) * 1000),
    tokenType: body.token_type ?? "bearer",
    scope: "",
  };
}

async function exchangeForLongLivedUserToken(shortLivedUserToken: string): Promise<MetaOAuthTokens> {
  const config = getMetaOAuthConfig();
  const body = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: config.appId,
    client_secret: config.appSecret,
    fb_exchange_token: shortLivedUserToken,
  });
  const res = await fetch(`${graphBase()}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  return readTokenResponse(res, "Failed to exchange Meta token for a long-lived user token.");
}

export async function exchangeCodeForTokens(code: string): Promise<MetaOAuthTokens> {
  const trimmed = code.trim();
  if (!trimmed) throw new MetaError("Authorization code is required.", { code: "OAUTH_CODE", status: 400 });

  const config = getMetaOAuthConfig();
  const body = new URLSearchParams({
    client_id: config.appId,
    client_secret: config.appSecret,
    redirect_uri: config.redirectUri,
    code: trimmed,
  });
  const res = await fetch(`${graphBase()}/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });
  const shortLived = await readTokenResponse(res, "Meta authorization code exchange failed.");
  const expiresInSec = Math.round((shortLived.userTokenExpiresAt.getTime() - Date.now()) / 1000);
  if (expiresInSec >= LONG_LIVED_MIN_EXPIRES_SEC) return shortLived;

  try {
    return await exchangeForLongLivedUserToken(shortLived.userAccessToken);
  } catch (err) {
    if (err instanceof MetaError) {
      throw new MetaError(
        "Could not get a long-lived Meta token. Use Facebook Login (not a Page token) and confirm META_APP_SECRET.",
        { code: "META_LONG_LIVED", status: 502, details: err.details },
      );
    }
    throw err;
  }
}

export async function debugUserToken(userAccessToken: string): Promise<{
  scopes: string[];
  expiresAt: Date | null;
}> {
  const config = getMetaOAuthConfig();
  const body = await graphGet<{
    data?: { type?: string; expires_at?: number; is_valid?: boolean; scopes?: string[] };
  }>("/debug_token", `${config.appId}|${config.appSecret}`, { input_token: userAccessToken });
  const data = body.data;
  if (!data?.is_valid) {
    throw new MetaError("Meta rejected the access token.", { code: "META_TOKEN_INVALID", status: 401, details: body });
  }
  if (data.type && data.type !== "USER") {
    throw new MetaError("Expected a user access token, not a Page token.", {
      code: "META_TOKEN_TYPE",
      status: 400,
      details: body,
    });
  }
  return {
    scopes: Array.isArray(data.scopes) ? data.scopes.filter((s): s is string => typeof s === "string") : [],
    expiresAt: data.expires_at && data.expires_at > 0 ? new Date(data.expires_at * 1000) : null,
  };
}

export async function fetchMetaUser(userAccessToken: string): Promise<MetaUserProfile> {
  const me = await graphGet<{ id?: string; name?: string }>("/me", userAccessToken, { fields: "id,name" });
  if (!me.id) throw new MetaError("Could not load the Meta user profile.", { code: "META_PROFILE", status: 502 });
  return { userId: me.id, name: me.name?.trim() || me.id };
}

type RawPage = {
  id?: string;
  name?: string;
  access_token?: string;
  instagram_business_account?: { id?: string; username?: string; name?: string };
};

function rawPageToProfile(row: RawPage): MetaPageProfile | null {
  if (!row.id || !row.access_token) return null;
  return {
    pageId: row.id,
    name: row.name?.trim() || row.id,
    accessToken: row.access_token,
    igUserId: row.instagram_business_account?.id ?? null,
    igUsername: row.instagram_business_account?.username ?? null,
    igName: row.instagram_business_account?.name ?? null,
  };
}

function logPages(source: string, data: RawPage[]) {
  if (process.env.NODE_ENV === "production") return;
  console.log(
    `[meta.fetchManagedPages] ${source}`,
    data.map((p) => ({
      pageId: p.id ?? null,
      igUserId: p.instagram_business_account?.id ?? null,
      igUsername: p.instagram_business_account?.username ?? null,
    })),
  );
}

/**
 * Fetch pages via me/accounts first; if empty, fall back to
 * business-owned pages (me/businesses → {id}/owned_pages).
 * This handles the common case where Pages belong to a Business Manager
 * rather than the personal profile.
 */
export async function fetchManagedPages(userAccessToken: string): Promise<MetaPageProfile[]> {
  const pageFields = "id,name,access_token,instagram_business_account{id,username,name}";

  // 1. Try me/accounts (personal pages)
  const body = await graphGet<{ data?: RawPage[] }>("/me/accounts", userAccessToken, {
    fields: pageFields,
    limit: "100",
  });

  const directPages = body.data ?? [];
  logPages("me/accounts", directPages);

  if (directPages.length > 0) {
    return directPages.map(rawPageToProfile).filter((p): p is MetaPageProfile => p !== null);
  }

  // 2. Fallback: fetch pages through Business Manager
  console.log("[meta.fetchManagedPages] me/accounts empty, trying me/businesses fallback");

  let businesses: Array<{ id?: string }> = [];
  try {
    const biz = await graphGet<{ data?: Array<{ id?: string; name?: string }> }>(
      "/me/businesses",
      userAccessToken,
      { fields: "id,name", limit: "50" },
    );
    businesses = biz.data ?? [];
    console.log("[meta.fetchManagedPages] businesses", businesses.map((b) => b.id));
  } catch (err) {
    console.log("[meta.fetchManagedPages] me/businesses failed, skipping fallback", err);
    return [];
  }

  const bizResults = await Promise.allSettled(
    businesses
      .filter((b): b is { id: string } => Boolean(b.id))
      .map(async (biz) => {
        const owned = await graphGet<{ data?: RawPage[] }>(
          `/${biz.id}/owned_pages`,
          userAccessToken,
          { fields: pageFields, limit: "100" },
        );
        const pages = owned.data ?? [];
        logPages(`business/${biz.id}/owned_pages`, pages);
        return pages;
      }),
  );

  const allPages: MetaPageProfile[] = [];
  for (const result of bizResults) {
    if (result.status === "rejected") {
      console.warn("[meta.fetchManagedPages] owned_pages failed", result.reason);
      continue;
    }
    for (const row of result.value) {
      const p = rawPageToProfile(row);
      if (p) allPages.push(p);
    }
  }

  return allPages;
}

export function pickFacebookPage(pages: MetaPageProfile[]): MetaPageProfile {
  const first = pages[0];
  if (!first) {
    throw new MetaError("No Facebook Pages found. Create a Page and grant pages_show_list.", {
      code: "NO_FACEBOOK_PAGES",
      status: 400,
    });
  }
  return first;
}

export function pickInstagramPage(pages: MetaPageProfile[]): MetaPageProfile {
  const withIg = pages.find((page) => page.igUserId);
  if (!withIg?.igUserId) {
    throw new MetaError(
      "No Instagram professional account is linked to a Facebook Page. Convert the IG account to Business/Creator and link it in Meta Business Suite.",
      { code: "NO_INSTAGRAM_ACCOUNT", status: 400 },
    );
  }
  return withIg;
}

export async function revokeMetaGrant(userAccessToken: string): Promise<void> {
  const url = new URL(`${graphBase()}/me/permissions`);
  url.searchParams.set("access_token", userAccessToken);
  await fetch(url, { method: "DELETE", cache: "no-store" }).catch((err) =>
    console.warn("[meta] revoke grant failed", err),
  );
}
