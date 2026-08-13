import { NextResponse } from "next/server";

import { getSessionUserId } from "@/lib/session";

import { unauthorized } from "./http";

/** `userId` or 401 `NextResponse` — for Node API routes only (not Edge middleware). */
export async function requireUser(): Promise<string | NextResponse> {
  const userId = await getSessionUserId();
  if (!userId) return unauthorized();
  return userId;
}
