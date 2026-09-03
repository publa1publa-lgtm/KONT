import { PlatformKind } from "@prisma/client";
import { NextResponse } from "next/server";

import { badRequest, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import * as platformAccountRepo from "@/lib/repos/platformAccountRepo";
import { isReelPlatformId, reelPlatformIdToPlatformKind } from "@/lib/reelPlatformIds";
import { deleteMetaAccount } from "@/lib/meta/storage";
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

  if (typeof platformId !== "string" || !isReelPlatformId(platformId)) {
    return badRequest("platformId must be a supported social platform");
  }
  if (typeof connected !== "boolean") return badRequest("connected must be a boolean");

  const platform = reelPlatformIdToPlatformKind(platformId);

  if (connected) {
    if (platform === PlatformKind.YOUTUBE) {
      return badRequest("YouTube must be connected through Google OAuth.");
    }
    if (platform === PlatformKind.FACEBOOK || platform === PlatformKind.INSTAGRAM) {
      return badRequest("Facebook and Instagram must be connected through Meta OAuth.");
    }
    return badRequest("This platform cannot be connected via demo sync. Use the official OAuth or Coming soon.");
  }

  if (platform === PlatformKind.YOUTUBE) {
    await deleteYouTubeTokens(userId);
  } else if (platform === PlatformKind.FACEBOOK) {
    await deleteMetaAccount(userId, "facebook");
  } else if (platform === PlatformKind.INSTAGRAM) {
    await deleteMetaAccount(userId, "instagram");
  } else {
    await platformAccountRepo.revokeDemoPlatformAccount(userId, platform);
  }
  return json({ ok: true });
}
