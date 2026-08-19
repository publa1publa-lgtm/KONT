import crypto from "node:crypto";

import { SESSION_IDLE_SECONDS } from "@/lib/sessionTtl";

const TOKEN_COOKIE = "cf_session";
/** JWT signature lifetime; idle is enforced via lastSeenAt, not this. */
const SESSION_JWT_SECONDS = 60 * 60 * 24 * 7;

export { SESSION_IDLE_SECONDS };
export const SESSION_TTL_SECONDS = SESSION_IDLE_SECONDS;

function getAuthSecret(): string {
  const s = process.env.AUTH_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV !== "production") return "dev-insecure-auth-secret-change-me";
  throw new Error("AUTH_SECRET is not set");
}

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function b64urlEncodeJson(value: unknown): string {
  return b64urlEncode(Buffer.from(JSON.stringify(value), "utf8"));
}

function b64urlDecodeToBuffer(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replaceAll("-", "+").replaceAll("_", "/") + pad;
  return Buffer.from(b64, "base64");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export function cookieName(): string {
  return TOKEN_COOKIE;
}

export function generateJti(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function sha256Hex(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export function createSessionToken(payload: { userId: string; sessionId: string; jti: string }): string {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    sub: payload.userId,
    sid: payload.sessionId,
    jti: payload.jti,
    iat: now,
    exp: now + SESSION_JWT_SECONDS,
  };
  const signingInput = `${b64urlEncodeJson(header)}.${b64urlEncodeJson(body)}`;
  const sig = crypto.createHmac("sha256", getAuthSecret()).update(signingInput).digest();
  return `${signingInput}.${b64urlEncode(sig)}`;
}

export type DecodedSessionToken = {
  userId: string;
  sessionId: string;
  jti: string;
};

export function verifySessionToken(token: string): DecodedSessionToken | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  const signingInput = `${h}.${p}`;
  const expectedSig = b64urlEncode(crypto.createHmac("sha256", getAuthSecret()).update(signingInput).digest());
  if (!safeEqual(expectedSig, s)) return null;

  try {
    const payload = JSON.parse(b64urlDecodeToBuffer(p).toString("utf8")) as Record<string, unknown>;
    const exp = typeof payload.exp === "number" ? payload.exp : null;
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const sid = typeof payload.sid === "string" ? payload.sid : null;
    const jti = typeof payload.jti === "string" ? payload.jti : null;
    if (!exp || !sub || !sid || !jti) return null;
    const now = Math.floor(Date.now() / 1000);
    if (exp <= now) return null;
    return { userId: sub, sessionId: sid, jti };
  } catch {
    return null;
  }
}

export function sessionCookieOptions(): {
  name: string;
  options: { httpOnly: boolean; sameSite: "lax"; secure: boolean; path: string; maxAge: number };
} {
  return {
    name: TOKEN_COOKIE,
    options: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_IDLE_SECONDS,
    },
  };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const keyLen = 32;
  const N = 16384;
  const r = 8;
  const p = 1;
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keyLen, { N, r, p }, (err, derived) => {
      if (err) reject(err);
      else resolve(derived as Buffer);
    });
  });
  return `scrypt$${N}$${r}$${p}$${b64urlEncode(salt)}$${b64urlEncode(derivedKey)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6) return false;
  const [algo, nStr, rStr, pStr, saltB64, hashB64] = parts;
  if (algo !== "scrypt") return false;
  const N = Number(nStr);
  const r = Number(rStr);
  const p = Number(pStr);
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const salt = b64urlDecodeToBuffer(saltB64);
  const expected = b64urlDecodeToBuffer(hashB64);
  const keyLen = expected.length;
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, keyLen, { N, r, p }, (err, derived) => {
      if (err) reject(err);
      else resolve(derived as Buffer);
    });
  });
  return crypto.timingSafeEqual(expected, derivedKey);
}
