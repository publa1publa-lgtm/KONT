import { getLinkPage, putLinkPage } from "@/lib/api/handlers/linkPage";
import { withRateLimit } from "@/lib/api/withRateLimit";

export const dynamic = "force-dynamic";

export async function GET() {
  return getLinkPage();
}

export const PUT = withRateLimit("link-page", { limit: 20, windowMs: 15 * 60_000 }, putLinkPage);
