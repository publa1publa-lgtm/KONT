import { NextResponse } from "next/server";
import { deleteEvent, patchEvent } from "@/lib/api/handlers/events";
import { clientKeyFromRequest, rateLimit } from "@/lib/api/rateLimit";
import { tooManyRequests } from "@/lib/api/http";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const rl = await rateLimit(clientKeyFromRequest(req, "events:update"), { limit: 60, windowMs: 15 * 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);
  return patchEvent(req, ctx.params);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const rl = await rateLimit(clientKeyFromRequest(req, "events:delete"), { limit: 30, windowMs: 15 * 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);
  return deleteEvent(req, ctx.params);
}
