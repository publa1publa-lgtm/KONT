import { withRateLimit } from "@/lib/api/withRateLimit";
import { getMetaInbox } from "@/lib/api/handlers/metaInbox";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const GET = withRateLimit("meta:inbox", { limit: 30, windowMs: 15 * 60_000 }, getMetaInbox);
