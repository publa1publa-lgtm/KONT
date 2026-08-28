import { postDemoRequest } from "@/lib/api/handlers/demoRequest";
import { withRateLimit } from "@/lib/api/withRateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withRateLimit("demo-request", { limit: 8, windowMs: 15 * 60_000 }, postDemoRequest);
