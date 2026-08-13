import { NextResponse } from "next/server";

import { platformKindToReelPlatformId, type ReelPlatformId } from "@/lib/reelPlatformIds";
import { json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import * as platformAccountRepo from "@/lib/repos/platformAccountRepo";

export async function listPlatformAccounts(): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const rows = await platformAccountRepo.listConnectedPlatformAccounts(userId);

  const accounts = rows
    .map((r) => {
      const platformId = platformKindToReelPlatformId(r.platform);
      if (!platformId) return null;
      return { id: r.id, platformId, handle: r.handle };
    })
    .filter((x): x is { id: string; platformId: ReelPlatformId; handle: string | null } => x !== null);

  return json({ accounts });
}
