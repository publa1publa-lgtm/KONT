import { listInstagramAnalytics } from "@/lib/api/handlers/instagramAnalytics";
import { withRateLimit } from "@/lib/api/withRateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export const GET = withRateLimit(
  "instagram:media",
  { limit: 40, windowMs: 15 * 60_000 },
  listInstagramAnalytics,
);
