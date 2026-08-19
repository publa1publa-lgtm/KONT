import { createContent, listContent } from "@/lib/api/handlers/content";
import { withRateLimit } from "@/lib/api/withRateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  return listContent(req);
}

export const POST = withRateLimit("content:create", { limit: 30, windowMs: 15 * 60_000 }, createContent);
