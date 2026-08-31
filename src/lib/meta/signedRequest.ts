import { createHmac, timingSafeEqual } from "node:crypto";

function b64urlDecode(value: string): Buffer {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  return Buffer.from(value.replaceAll("-", "+").replaceAll("_", "/") + pad, "base64");
}

export type MetaSignedRequest = {
  userId: string;
  issuedAt?: number;
};

export function parseMetaSignedRequest(raw: string | null | undefined, appSecret: string): MetaSignedRequest | null {
  if (!raw || !raw.includes(".") || !appSecret) return null;
  const dot = raw.indexOf(".");
  const encodedSig = raw.slice(0, dot);
  const payload = raw.slice(dot + 1);
  if (!encodedSig || !payload) return null;

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = createHmac("sha256", appSecret).update(payload).digest();
    actual = b64urlDecode(encodedSig);
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(b64urlDecode(payload).toString("utf8")) as Record<string, unknown>;
  } catch {
    return null;
  }

  const algorithm = typeof data.algorithm === "string" ? data.algorithm.toUpperCase() : "";
  if (algorithm && algorithm !== "HMAC-SHA256") return null;

  const userId = typeof data.user_id === "string" ? data.user_id.trim() : "";
  if (!userId) return null;

  return {
    userId,
    issuedAt: typeof data.issued_at === "number" ? data.issued_at : undefined,
  };
}

export async function readSignedRequestFromMetaPost(req: Request): Promise<string> {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as { signed_request?: unknown } | null;
    return typeof body?.signed_request === "string" ? body.signed_request : "";
  }
  const form = await req.formData().catch(() => null);
  const value = form?.get("signed_request");
  return typeof value === "string" ? value : "";
}
