import { NextResponse } from "next/server";

const PRIVATE_NO_STORE = {
  "Cache-Control": "private, no-store, must-revalidate",
} as const;

export function json<T>(data: T, status = 200, headers?: HeadersInit): NextResponse {
  return NextResponse.json(data, { status, headers: { ...PRIVATE_NO_STORE, ...headers } });
}

export const unauthorized = () => json({ error: "Unauthorized" }, 401);
export const badRequest = (message: string) => json({ error: message }, 400);
export const notFound = (message = "Not found") => json({ error: message }, 404);
export const conflict = (message: string) => json({ error: message }, 409);
export const tooManyRequests = (retryAfterSec: number) =>
  json({ error: "Too many requests. Try again later." }, 429, { "Retry-After": String(retryAfterSec) });

export async function readJsonRecord(req: Request): Promise<Record<string, unknown> | null> {
  const raw = await req.json().catch(() => null);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  return raw as Record<string, unknown>;
}
