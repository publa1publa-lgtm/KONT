import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Envelope encryption for OAuth tokens at rest.
 *
 * - AES-256-GCM (authenticated; tampering fails closed)
 * - Unique 96-bit IV per encrypt
 * - AAD binds ciphertext to user + platform + field (copied ciphertext cannot be reused on another row)
 * - Plaintext is never written to Postgres
 *
 * Stored format: `v1.<iv>.<tag>.<ciphertext>` (base64url)
 */
export const TOKEN_ENC_VERSION = 1;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY_BYTES = 32;
const PREFIX = "v1";

export class TokenCipherError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenCipherError";
  }
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString("base64").replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function b64urlDecode(value: string): Buffer {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  return Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/") + pad, "base64");
}

function loadDataKey(): Buffer {
  const raw = process.env.TOKEN_ENC_KEY?.trim();
  if (!raw) {
    throw new TokenCipherError("TOKEN_ENC_KEY is not set.");
  }

  const key = raw.includes("-") && !raw.includes("+") && !raw.includes("/")
    ? b64urlDecode(raw)
    : Buffer.from(raw, "base64");

  if (key.length !== KEY_BYTES) {
    throw new TokenCipherError("TOKEN_ENC_KEY must decode to 32 bytes (AES-256).");
  }
  return key;
}

export type SecretAad = {
  userId: string;
  platform: string;
  field: "access" | "refresh";
};

export function tokenAad(parts: SecretAad): string {
  return `kont.oauth.${PREFIX}.${parts.platform}.${parts.field}.${parts.userId}`;
}

export function encryptSecret(plaintext: string, aad: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", loadDataKey(), iv);
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  if (tag.length !== AUTH_TAG_BYTES) {
    throw new TokenCipherError("Unexpected GCM auth tag length.");
  }
  return `${PREFIX}.${b64urlEncode(iv)}.${b64urlEncode(tag)}.${b64urlEncode(encrypted)}`;
}

export function decryptSecret(payload: string, aad: string): string {
  const parts = payload.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new TokenCipherError("Unsupported token ciphertext format.");
  }

  const iv = b64urlDecode(parts[1]);
  const tag = b64urlDecode(parts[2]);
  const ciphertext = b64urlDecode(parts[3]);
  if (iv.length !== IV_BYTES || tag.length !== AUTH_TAG_BYTES || ciphertext.length === 0) {
    throw new TokenCipherError("Malformed token ciphertext.");
  }

  const decipher = createDecipheriv("aes-256-gcm", loadDataKey(), iv);
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    throw new TokenCipherError("Token decrypt failed.");
  }
}

export function encryptOptionalSecret(plaintext: string | null | undefined, aad: string): string | null {
  if (!plaintext) return null;
  return encryptSecret(plaintext, aad);
}

export function decryptOptionalSecret(payload: string | null | undefined, aad: string): string | null {
  if (!payload) return null;
  return decryptSecret(payload, aad);
}
