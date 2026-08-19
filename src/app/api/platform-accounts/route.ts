import { listPlatformAccounts } from "@/lib/api/handlers/platformAccounts";
import { syncDemoPlatformConnection } from "@/lib/api/handlers/platformAccountsMutate";
import { withRateLimit } from "@/lib/api/withRateLimit";

export const dynamic = "force-dynamic";

export async function GET() {
  return listPlatformAccounts();
}

export const POST = withRateLimit("platform:sync", { limit: 30, windowMs: 15 * 60_000 }, syncDemoPlatformConnection);
