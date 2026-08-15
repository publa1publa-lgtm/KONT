import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { DriveOAuthTokens, DriveUserProfile, GoogleOAuthConfig, GoogleTokenResponse } from "./types";
import {
  DRIVE_OAUTH_SCOPES,
  DRIVE_REQUIRED_OAUTH_SCOPES,
  GoogleDriveConfigError,
  GoogleDriveError,
} from "./types";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export const DRIVE_OAUTH_STATE_COOKIE = "gd_oauth_state";
export const DRIVE_OAUTH_STATE_MAX_AGE_SEC = 10 * 60;

export type DriveOAuthState = {
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

function requiredClientEnv(name: "GOOGLE_CLIENT_ID" | "GOOGLE_CLIENT_SECRET"): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new GoogleDriveConfigError(`${name} is not set.`);
  }
  return value;
}

function driveRedirectUri(): string {
  const explicit = process.env.GOOGLE_DRIVE_REDIRECT_URI?.trim();
  if (explicit) return explicit;

  const youtube = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (youtube?.includes("/api/youtube/oauth/callback")) {
    return youtube.replace("/api/youtube/oauth/callback", "/api/google-drive/oauth/callback");
  }

  throw new GoogleDriveConfigError("GOOGLE_DRIVE_REDIRECT_URI is not set.");
}

export function getGoogleDriveOAuthConfig(): GoogleOAuthConfig {
  return {
    clientId: requiredClientEnv("GOOGLE_CLIENT_ID"),
    clientSecret: requiredClientEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri: driveRedirectUri(),
  };
}

function stateSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim() || process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new GoogleDriveConfigError("AUTH_SECRET or GOOGLE_CLIENT_SECRET is required to sign OAuth state.");
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

export function createOAuthState(input: Omit<DriveOAuthState, "nonce" | "exp">): string {
  const payload: DriveOAuthState = {
    userId: input.userId,
    returnTo: input.returnTo,
    requestedScopes: input.requestedScopes,
    requestedPermissionIds: input.requestedPermissionIds,
    nonce: randomBytes(16).toString("hex"),
    exp: Date.now() + DRIVE_OAUTH_STATE_MAX_AGE_SEC * 1000,
  };
  const body = b64urlEncode(Buffer.from(JSON.stringify(payload), "utf8"));
  const sig = b64urlEncode(createHmac("sha256", stateSecret()).update(body).digest());
  return `${body}.${sig}`;
}

export function parseOAuthState(raw: string | undefined | null): DriveOAuthState {
  if (!raw || !raw.includes(".")) {
    throw new GoogleDriveError("Missing or invalid OAuth state.", { code: "OAUTH_STATE", status: 400 });
  }

  const [body, sig] = raw.split(".");
  if (!body || !sig) {
    throw new GoogleDriveError("Malformed OAuth state.", { code: "OAUTH_STATE", status: 400 });
  }

  const expected = b64urlEncode(createHmac("sha256", stateSecret()).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new GoogleDriveError("OAuth state signature mismatch.", { code: "OAUTH_STATE", status: 400 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(b64urlDecode(body).toString("utf8"));
  } catch {
    throw new GoogleDriveError("OAuth state payload is not valid JSON.", { code: "OAUTH_STATE", status: 400 });
  }

  if (!parsed || typeof parsed !== "object") {
    throw new GoogleDriveError("OAuth state payload is invalid.", { code: "OAUTH_STATE", status: 400 });
  }

  const rec = parsed as Record<string, unknown>;
  if (typeof rec.userId !== "string" || typeof rec.returnTo !== "string" || typeof rec.exp !== "number") {
    throw new GoogleDriveError("OAuth state is missing required fields.", { code: "OAUTH_STATE", status: 400 });
  }
  if (rec.exp <= Date.now()) {
    throw new GoogleDriveError("OAuth state expired. Start the Google Drive connection again.", {
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

const ALLOWED_DRIVE_SCOPES = new Set<string>(DRIVE_OAUTH_SCOPES);

export function sanitizeDriveScopes(input: readonly string[] | undefined): string[] {
  const requested = (input ?? []).map((raw) => raw.trim()).filter((scope) => ALLOWED_DRIVE_SCOPES.has(scope));
  return [...new Set([...DRIVE_REQUIRED_OAUTH_SCOPES, ...requested])];
}

export function generateAuthUrl(options: GenerateAuthUrlOptions): string {
  const config = getGoogleDriveOAuthConfig();
  const scopes = sanitizeDriveScopes(options.scopes);
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: scopes.join(" "),
    access_type: "offline",
    // YouTube + Drive scopes cannot be requested together. Keep this grant isolated.
    prompt: "consent",
    state: options.state,
  });
  if (options.loginHint) {
    params.set("login_hint", options.loginHint);
  }
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

function tokensFromGoogle(payload: GoogleTokenResponse, previousRefreshToken?: string | null): DriveOAuthTokens {
  if (!payload.access_token) {
    throw new GoogleDriveError("Google token response did not include access_token.", {
      code: "GOOGLE_TOKEN",
      status: 502,
      details: payload,
    });
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token ?? previousRefreshToken ?? null,
    expiresAt: new Date(Date.now() + Math.max(1, payload.expires_in ?? 3600) * 1000),
    scope: payload.scope ?? DRIVE_OAUTH_SCOPES.join(" "),
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
    throw new GoogleDriveError(err.error_description || err.error || "Google token exchange failed.", {
      code: err.error ?? "GOOGLE_TOKEN",
      status: res.status,
      details: body,
    });
  }

  if (!body || typeof body !== "object") {
    throw new GoogleDriveError("Google token response was empty.", { code: "GOOGLE_TOKEN", status: 502 });
  }

  return body as GoogleTokenResponse;
}

export async function exchangeCodeForTokens(code: string): Promise<DriveOAuthTokens> {
  const trimmed = code.trim();
  if (!trimmed) {
    throw new GoogleDriveError("Authorization code is required.", { code: "OAUTH_CODE", status: 400 });
  }

  const config = getGoogleDriveOAuthConfig();
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

export async function refreshToken(refreshTokenValue: string): Promise<DriveOAuthTokens> {
  const trimmed = refreshTokenValue.trim();
  if (!trimmed) {
    throw new GoogleDriveError("Refresh token is required.", { code: "OAUTH_REFRESH", status: 400 });
  }

  const config = getGoogleDriveOAuthConfig();
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

type GoogleUserInfoResponse = {
  id?: string;
  email?: string;
  name?: string;
  picture?: string;
};

export async function fetchGoogleUser(accessToken: string): Promise<DriveUserProfile | null> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const body = (await res.json().catch(() => null)) as GoogleUserInfoResponse | null;
  if (!res.ok) {
    throw new GoogleDriveError("Failed to load the Google account profile.", {
      code: "DRIVE_USERINFO",
      status: res.status,
      details: body,
    });
  }

  const googleUserId = body?.id?.trim();
  if (!googleUserId) return null;

  return {
    googleUserId,
    email: body?.email?.trim() || null,
    name: body?.name?.trim() || null,
    pictureUrl: body?.picture?.trim() || null,
  };
}
