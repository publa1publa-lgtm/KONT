import crypto from "node:crypto";

/** Hex-encoded SHA-256 of the entire buffer. */
export function sha256Hex(buf: Buffer | Uint8Array): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  return crypto.createHash("sha256").update(b).digest("hex");
}
