import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type {
  GoogleOAuthConfig,
  GoogleTokenResponse,
  YouTubeChannelProfile,
  YouTubeOAuthTokens,
} from "./types";
import {
  YouTubeConfigError,
  YouTubeError,
  YOUTUBE_OAUTH_SCOPES,
  YOUTUBE_REQUIRED_OAUTH_SCOPES,
} from "./types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const YOUTUBE_CHANNELS_URL = "https://www.googleapis.com/youtube/v3/channels";

export const YOUTUBE_OAUTH_STATE_COOKIE = "yt_oauth_state";
export const YOUTUBE_OAUTH_STATE_MAX_AGE_SEC = 10 * 60;

export type YouTubeOAuthState = {
  userId: string;
  returnTo: string;
  nonce: string;
  exp: number;
  requestedScopes: string[];
  requestedPermissionIds: string[];
};

export type GenerateAuthUrlOptions = {
  state: string;
  scopes?: readonly string[];
  loginHint?: string;
};

function requiredEnv(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET" | "GOOGLE_REDIRECT_URI"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new YouTubeConfigError(`${name} is not set.`);
  }
  return value;
}

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  return {
    clientId: requiredEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requiredEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: requiredEnv("GOOGLE_REDIRECT_URI"),
  };
}

function stateSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new YouTubeConfigError("AUTH_SECRET or GOOGLE_CLIENT_SECRET is required to sign OAuth state.");
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

export function createOAuthState(input: Omit<YouTubeOAuthState, "nonce" | "exp">): string {
  const payload: YouTubeOAuthState = {
    userId: input.userId,
    returnTo: input.returnTo,
    requestedScopes: input.requestedScopes,
    requestedPermissionIds: input.requestedPermissionIds,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + YOUTUBE_OAUTH_STATE_MAX_AGE_SEC * 1000,
  };
  const body = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = b64urlEncode(createHmac("sha256", stateSecret()).update(body).digest());
  return `${body}.${sig}`;
}

export function parseOAuthState(raw: string | undefined | null): YouTubeOAuthState {
  if (!raw || !raw.includes(".")) {
    throw new YouTubeError("Missing or invalid OAuth state.", { code: "OAUTH_STATE", status: 400 });
  }

  const [body, sig] = raw.split(".");
  if (!body || !sig) {
    throw new YouTubeError("Malformed OAuth state.", { code: "OAUTH_STATE", status: 400 });
  }

  const expected = b64urlEncode(createHmac("sha256", stateSecret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new YouTubeError("OAuth state signature mismatch.", { code: "OAUTH_STATE", status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(b64urlDecode(body).toString("utf8"));
  } catch {
    throw new YouTubeError("OAuth state payload is not valid JSON.", { code: "OAUTH_STATE", status: 400 });
  }

  if (!parsed || typeof parsed !== "object") {
    throw new YouTubeError("OAuth state payload is invalid.", { code: "OAUTH_STATE", status: 400 });
  }

  const rec = parsed as Record<string, unknown>;
  if (typeof rec.userId !== "string" || typeof rec.returnTo !== "string" || typeof rec.exp !== "number") {
    throw new YouTubeError("OAuth state is missing required fields.", { code: "OAUTH_STATE", status: 400 });
  }
  if (rec.exp <= Date.now()) {
    throw new YouTubeError("OAuth state expired. Start the YouTube connection again.", {
      code: "OAUTH_STATE_EXPIRED",
      status: 400,
    });
  }

  const requestedScopes = Array.isArray(rec.requestedScopes)
    ? rec.requestedScopes.filter((item): item is string => typeof item === "string")
    : [];

  const requestedPermissionIds = Array.isArray(rec.requestedPermissionIds)
    ? rec.requestedPermissionIds.filter((item): item is string => typeof item === "string")
    : [];

  return {
    userId: rec.userId,
    returnTo: rec.returnTo,
    requestedScopes,
    requestedPermissionIds,
    nonce: typeof rec.nonce === "string" ? rec.nonce : "",
    exp: rec.exp,
  };
}

const ALLOWED_YOUTUBE_SCOPES = new Set<string>(YOUTUBE_OAUTH_SCOPES);

export function sanitizeYouTubeScopes(input: readonly string[] | undefined): string[] {
  const requested = (input ?? []).map((raw) => raw.trim()).filter((scope) => ALLOWED_YOUTUBE_SCOPES.has(scope));
  return [...new Set([...YOUTUBE_REQUIRED_OAUTH_SCOPES, ...requested])];
}

export function generateAuthUrl(options: GenerateAuthUrlOptions): string {
  const config = getGoogleOAuthConfig();
  const scopes = sanitizeYouTubeScopes(options.scopes);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
    state: options.state,
  });
  if (options.loginHint) {
    params.set("login_hint", options.loginHint);
  }
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

function tokensFromGoogle(payload: GoogleTokenResponse, previousRefreshToken?: string | null): YouTubeOAuthTokens {
  if (!payload.access_token) {
    throw new YouTubeError("Google token response did not include access_token.", {
      code: "GOOGLE_TOKEN",
      status: 502,
      details: payload,
    });
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? previousRefreshToken ?? null,
    expiresAt: new Date(Date.now() + Math.max(1, payload.expires_in ?? 3600) * 1000),
    scope: payload.scope ?? YOUTUBE_OAUTH_SCOPES.join(" "),
    tokenType: payload.token_type ?? "Bearer",
  };
}

async function readGoogleTokenResponse(res: Response): Promise<GoogleTokenResponse> {
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const err = (body && typeof body === "object" ? body : {}) as {
      error?: string;
      error_description?: string;
    };
    throw new YouTubeError(err.error_description || err.error || "Google token exchange failed.", {
      code: err.error ?? "GOOGLE_TOKEN",
      status: res.status,
      details: body,
    });
  }

  if (!body || typeof body !== "object") {
    throw new YouTubeError("Google token response was empty.", { code: "GOOGLE_TOKEN", status: 502 });
  }

  return body as GoogleTokenResponse;
}

export async function exchangeCodeForTokens(code: string): Promise<YouTubeOAuthTokens> {
  const trimmed = code.trim();
  if (!trimmed) {
    throw new YouTubeError("Authorization code is required.", { code: "OAUTH_CODE", status: 400 });
  }

  const config = getGoogleOAuthConfig();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: trimmed,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });

  return tokensFromGoogle(await readGoogleTokenResponse(res));
}

export async function refreshToken(refreshTokenValue: string): Promise<YouTubeOAuthTokens> {
  const trimmed = refreshTokenValue.trim();
  if (!trimmed) {
    throw new YouTubeError("Refresh token is required.", { code: "OAUTH_REFRESH", status: 400 });
  }

  const config = getGoogleOAuthConfig();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: trimmed,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
  });

  return tokensFromGoogle(await readGoogleTokenResponse(res), trimmed);
}

type YouTubeChannelListResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      customUrl?: string;
      thumbnails?: { default?: { url?: string }; medium?: { url?: string } };
    };
  }>;
};

export async function fetchMineChannel(accessToken: string): Promise<YouTubeChannelProfile | null> {
  const url = new URL(YOUTUBE_CHANNELS_URL);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("mine", "true");

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const body = (await res.json().catch(() => null)) as YouTubeChannelListResponse | null;
  if (!res.ok) {
    throw new YouTubeError("Failed to load the YouTube channel profile.", {
      code: "YOUTUBE_CHANNEL",
      status: res.status,
      details: body,
    });
  }

  const item = body?.items?.[0];
  if (!item?.id) return null;

  return {
    channelId: item.id,
    title: item.snippet?.title?.trim() || item.id,
    customUrl: item.snippet?.customUrl?.trim() || null,
    thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || null,
  };
}

export { revokeGoogleGrant } from "@/lib/google/revoke";
