import "server-only";

import { ContentStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { isReelPlatformId, type ReelPlatformId } from "@/lib/reelPlatformIds";
import { publishToFacebook, publishToInstagram, type MetaPublishResult } from "./meta";
import { publishReelToYouTube, type YouTubePublishResult } from "./youtube";

export type ContentPublishResult = {
  youtube?: YouTubePublishResult;
  facebook?: MetaPublishResult;
  instagram?: MetaPublishResult;
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

export function firstPublishError(publish: ContentPublishResult): { error: string; code?: string } | null {
  for (const result of [publish.youtube, publish.facebook, publish.instagram]) {
    if (result && !result.ok) return { error: result.error, code: result.code };
  }
  return null;
}

/**
 * Publish due platform targets. YouTube uploads immediately (private + publishAt when scheduled).
 * Facebook uses Page scheduling when the time is far enough ahead. Instagram publishes now.
 */
export async function publishContentTargets(userId: string, contentId: string): Promise<ContentPublishResult> {
  const content = await prisma.content.findFirst({
    where: { id: contentId, userId, deletedAt: null },
    select: { id: true, type: true, status: true, metadata: true },
  });
  if (!content || content.status === ContentStatus.DRAFT) return {};

  const platforms = platformIdsFromMetadata(content.metadata);
  if (platforms.length === 0) return {};

  const [youtube, facebook, instagram] = await Promise.allSettled([
    platforms.includes("youtube")
      ? content.type === "REEL"
        ? publishReelToYouTube(userId, content.id)
        : Promise.resolve({ ok: false as const, error: "Only videos can be published to YouTube.", code: "NOT_A_REEL" })
      : Promise.resolve(undefined),
    platforms.includes("facebook") ? publishToFacebook(userId, content.id) : Promise.resolve(undefined),
    platforms.includes("instagram") ? publishToInstagram(userId, content.id) : Promise.resolve(undefined),
  ]);

  function settled<T>(r: PromiseSettledResult<T | undefined>): T | undefined {
    if (r.status === "fulfilled") return r.value;
    console.error("[publish] platform threw", r.reason);
    return undefined;
  }

  return {
    youtube: settled(youtube) as YouTubePublishResult | undefined,
    facebook: settled(facebook) as MetaPublishResult | undefined,
    instagram: settled(instagram) as MetaPublishResult | undefined,
  };
}
