import { NextResponse } from "next/server";

import { json } from "@/lib/api/http";

/** Log server-side; return a stable message to clients (no stack / Prisma leaks). */
export function internalError(scope: string, err: unknown, publicMessage = "Internal server error"): NextResponse {
  console.error(scope, err);
  return json({ error: publicMessage }, 500);
}
