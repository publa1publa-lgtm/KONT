import { NextResponse } from "next/server";
import { deleteContent, patchContent } from "@/lib/api/handlers/content";
import { clientKeyFromRequest, rateLimit } from "@/lib/api/rateLimit";
import { tooManyRequests } from "@/lib/api/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const rl = await rateLimit(clientKeyFromRequest(req, "content:update"), { limit: 60, windowMs: 15 * 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);
  return patchContent(req, ctx.params);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const rl = await rateLimit(clientKeyFromRequest(req, "content:delete"), { limit: 30, windowMs: 15 * 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);
  return deleteContent(req, ctx.params);
}
