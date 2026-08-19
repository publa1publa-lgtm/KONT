import { uploadMedia } from "@/lib/api/handlers/upload";
import { withRateLimit } from "@/lib/api/withRateLimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export const POST = withRateLimit("upload", { limit: 30, windowMs: 15 * 60_000 }, uploadMedia);
