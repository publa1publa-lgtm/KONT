import { NextResponse } from "next/server";
import { syncContentTargets } from "@/lib/api/handlers/contentSync";
import { clientKeyFromRequest, rateLimit } from "@/lib/api/rateLimit";
import { tooManyRequests } from "@/lib/api/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const rl = await rateLimit(clientKeyFromRequest(req, "content:sync"), { limit: 20, windowMs: 15 * 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);
  return syncContentTargets(req, ctx.params);
}
