import { listPlatformAccounts } from "@/lib/api/handlers/platformAccounts";
import { syncDemoPlatformConnection } from "@/lib/api/handlers/platformAccountsMutate";

export const dynamic = "force-dynamic";

export async function GET() {
  return listPlatformAccounts();
}

export async function POST(req: Request) {
  return syncDemoPlatformConnection(req);
}
