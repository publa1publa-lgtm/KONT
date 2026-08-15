import { PlatformKind } from "@prisma/client";
import { NextResponse } from "next/server";

import { badRequest, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import * as platformAccountRepo from "@/lib/repos/platformAccountRepo";
import { isReelPlatformId, reelPlatformIdToPlatformKind } from "@/lib/reelPlatformIds";
import { deleteTokens as deleteYouTubeTokens } from "@/lib/youtube/storage";

export async function syncDemoPlatformConnection(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  if (!body || typeof body !== "object") return badRequest("Invalid body");

  const platformId = (body as { platformId?: unknown }).platformId;
  const connected = (body as { connected?: unknown }).connected;
  const handleRaw = (body as { handle?: unknown }).handle;

  if (typeof platformId !== "string" || !isReelPlatformId(platformId)) {
    return badRequest("platformId must be a supported social platform");
  }
  if (typeof connected !== "boolean") return badRequest("connected must be a boolean");

  const platform = reelPlatformIdToPlatformKind(platformId);
  const handle = typeof handleRaw === "string" ? handleRaw : null;

  if (connected) {
    if (platform === PlatformKind.YOUTUBE) {
      return badRequest("YouTube must be connected through Google OAuth.");
    }
    const row = await platformAccountRepo.upsertDemoPlatformAccount(userId, platform, handle);
    return json({ ok: true, account: { id: row.id, platformId, handle: row.handle } });
  }

  if (platform === PlatformKind.YOUTUBE) {
    await deleteYouTubeTokens(userId);
  } else {
    await platformAccountRepo.revokeDemoPlatformAccount(userId, platform);
  }
  return json({ ok: true });
}
