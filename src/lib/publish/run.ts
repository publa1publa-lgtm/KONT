import "server-only";

import { ContentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isReelPlatformId, type ReelPlatformId } from "@/lib/reelPlatformIds";
import { publishReelToYouTube, type YouTubePublishResult } from "./youtube";

export type ContentPublishResult = {
  youtube?: YouTubePublishResult;
};

function platformIdsFromMetadata(metadata: unknown): ReelPlatformId[] {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
  const record = metadata as { publishMode?: unknown; platforms?: unknown };
  if (record.publishMode === "draft") return [];
  if (!Array.isArray(record.platforms)) return [];
  return record.platforms.filter((id): id is ReelPlatformId => typeof id === "string" && isReelPlatformId(id));
}

export function youtubeWasRequested(metadata: unknown): boolean {
  return platformIdsFromMetadata(metadata).includes("youtube");
}

/**
 * Publish due platform targets. YouTube uploads immediately (private + publishAt when scheduled).
 * Other platforms are recorded as targets only until their adapters exist.
 */
export async function publishContentTargets(userId: string, contentId: string): Promise<ContentPublishResult> {
  const content = await prisma.content.findFirst({
    where: { id: contentId, userId, deletedAt: null },
    select: { id: true, type: true, status: true, metadata: true },
  });
  if (!content || content.status === ContentStatus.DRAFT) return {};

  const platforms = platformIdsFromMetadata(content.metadata);
  if (platforms.length === 0) return {};

  const result: ContentPublishResult = {};
  if (platforms.includes("youtube") && content.type === "REEL") {
    result.youtube = await publishReelToYouTube(userId, content.id);
  } else if (platforms.includes("youtube")) {
    result.youtube = { ok: false, error: "Only videos can be published to YouTube.", code: "NOT_A_REEL" };
  }

  return result;
}
