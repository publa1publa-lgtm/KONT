import { withRateLimit } from "@/lib/api/withRateLimit";
import { postMetaInboxReply } from "@/lib/api/handlers/metaInbox";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const POST = withRateLimit("meta:inbox-reply", { limit: 40, windowMs: 15 * 60_000 }, postMetaInboxReply);
