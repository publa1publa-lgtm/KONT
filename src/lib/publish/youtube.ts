import "server-only";

import {
  ContentStatus,
  ContentTargetStatus,
  MediaKind,
  PlatformAccountStatus,
  PlatformKind,
  PublishAttemptStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { uploadVideo } from "@/lib/youtube/client";
import { hasYouTubeUploadScope } from "@/lib/youtube/permissions";
import { YouTubeError } from "@/lib/youtube/types";

export type YouTubePublishResult =
  | { ok: true; videoId: string; scheduled: boolean }
  | { ok: false; error: string; code?: string };

const SCHEDULE_AHEAD_MS = 2 * 60_000;
const YOUTUBE_DESC_MAX = 5000;
const YOUTUBE_TAG_MAX = 30;

function youtubeDescription(description: string | null, hashtags: string[]): string {
  const tags = hashtags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");
  const text = [description?.trim() ?? "", tags].filter(Boolean).join("\n\n");
  return text.slice(0, YOUTUBE_DESC_MAX);
}

function youtubeTags(hashtags: string[]): string[] {
  const tags: string[] = [];
  for (const raw of hashtags) {
    const tag = raw.replace(/^#/, "").trim();
    if (tag.length >= 2 && tag.length <= 30) tags.push(tag);
    if (tags.length >= YOUTUBE_TAG_MAX) break;
  }
  return tags;
}

async function nextAttemptNo(contentTargetId: string): Promise<number> {
  const last = await prisma.publishAttempt.aggregate({
    where: { contentTargetId },
    _max: { attemptNo: true },
  });
  return (last._max.attemptNo ?? 0) + 1;
}

async function failTarget(
  targetId: string,
  attemptId: string,
  error: string,
  code?: string,
): Promise<YouTubePublishResult> {
  const finishedAt = new Date();
  await prisma.$transaction([
    prisma.publishAttempt.update({
      where: { id: attemptId },
      data: {
        status: PublishAttemptStatus.FAILED,
        errorCode: code ?? "YOUTUBE_PUBLISH",
        errorMessage: error.slice(0, 1000),
        finishedAt,
      },
    }),
    prisma.contentTarget.update({
      where: { id: targetId },
      data: {
        status: ContentTargetStatus.FAILED,
        lastErrorCode: code ?? "YOUTUBE_PUBLISH",
        lastErrorMessage: error.slice(0, 1000),
      },
    }),
  ]);
  return { ok: false, error, code };
}

/** Upload a reel to the user's connected YouTube channel. */
export async function publishReelToYouTube(userId: string, contentId: string): Promise<YouTubePublishResult> {
  const content = await prisma.content.findFirst({
    where: { id: contentId, userId, deletedAt: null },
    include: {
      media: {
        orderBy: { position: "asc" },
        include: { media: true },
      },
    },
  });
  if (!content) return { ok: false, error: "Content was not found.", code: "NOT_FOUND" };
  if (content.type !== "REEL") {
    return { ok: false, error: "Only videos can be published to YouTube.", code: "NOT_A_REEL" };
  }

  const account = await prisma.platformAccount.findFirst({
    where: {
      userId,
      platform: PlatformKind.YOUTUBE,
      status: PlatformAccountStatus.CONNECTED,
      revokedAt: null,
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!account) {
    return { ok: false, error: "YouTube is not connected.", code: "YOUTUBE_NOT_CONNECTED" };
  }
  if (!hasYouTubeUploadScope(account.scopes)) {
    return {
      ok: false,
      error: "Reconnect YouTube and allow video upload.",
      code: "YOUTUBE_UPLOAD_SCOPE",
    };
  }

  const existingTarget = await prisma.contentTarget.findUnique({
    where: { contentId_platformAccountId: { contentId, platformAccountId: account.id } },
  });
  if (
    existingTarget?.remoteId &&
    (existingTarget.status === ContentTargetStatus.PUBLISHED ||
      existingTarget.status === ContentTargetStatus.SCHEDULED)
  ) {
    return {
      ok: true,
      videoId: existingTarget.remoteId,
      scheduled: existingTarget.status === ContentTargetStatus.SCHEDULED,
    };
  }

  const target = await prisma.contentTarget.upsert({
    where: { contentId_platformAccountId: { contentId, platformAccountId: account.id } },
    create: {
      contentId,
      platformAccountId: account.id,
      status: ContentTargetStatus.PUBLISHING,
    },
    update: {
      status: ContentTargetStatus.PUBLISHING,
      lastErrorCode: null,
      lastErrorMessage: null,
    },
  });

  const attempt = await prisma.publishAttempt.create({
    data: {
      contentTargetId: target.id,
      attemptNo: await nextAttemptNo(target.id),
      status: PublishAttemptStatus.STARTED,
    },
  });

  const linked = content.media.find((row) => row.media.kind === MediaKind.VIDEO && row.media.deletedAt === null)?.media;
  const asset =
    linked ??
    (content.videoUrl
      ? await prisma.mediaAsset.findFirst({
          where: { userId, url: content.videoUrl, kind: MediaKind.VIDEO, deletedAt: null },
        })
      : null);

  if (!asset?.storageKey) {
    return failTarget(target.id, attempt.id, "This reel has no video file to upload.", "VIDEO_MISSING");
  }

  let bytes: Buffer;
  try {
    bytes = await getStorage().read(asset.storageKey);
  } catch {
    return failTarget(target.id, attempt.id, "Could not read the video file from storage.", "VIDEO_READ");
  }
  if (bytes.byteLength === 0) {
    return failTarget(target.id, attempt.id, "The video file is empty.", "VIDEO_EMPTY");
  }

  const scheduledAt = content.scheduledAt;
  const scheduleInFuture = Boolean(scheduledAt && scheduledAt.getTime() - Date.now() >= SCHEDULE_AHEAD_MS);

  try {
    const video = await uploadVideo(userId, {
      source: { type: "bytes", data: bytes, mimeType: asset.mimeType || "video/mp4" },
      snippet: {
        title: content.title.trim(),
        description: youtubeDescription(content.description, content.hashtags),
        tags: youtubeTags(content.hashtags),
      },
      status: scheduleInFuture
        ? { privacyStatus: "private", publishAt: scheduledAt!.toISOString() }
        : { privacyStatus: "public" },
    });

    const finishedAt = new Date();
    await prisma.$transaction([
      prisma.publishAttempt.update({
        where: { id: attempt.id },
        data: { status: PublishAttemptStatus.SUCCEEDED, finishedAt },
      }),
      prisma.contentTarget.update({
        where: { id: target.id },
        data: {
          status: scheduleInFuture ? ContentTargetStatus.SCHEDULED : ContentTargetStatus.PUBLISHED,
          publishedAt: scheduleInFuture ? scheduledAt : finishedAt,
          remoteId: video.id,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      }),
      prisma.content.update({
        where: { id: content.id },
        data: { status: scheduleInFuture ? ContentStatus.SCHEDULED : ContentStatus.READY },
      }),
    ]);

    return { ok: true, videoId: video.id, scheduled: scheduleInFuture };
  } catch (err) {
    console.error("[youtube.publish]", err);
    const message = err instanceof YouTubeError ? err.message : "YouTube upload failed.";
    const code = err instanceof YouTubeError ? err.code : "YOUTUBE_PUBLISH";
    return failTarget(target.id, attempt.id, message, code);
  }
}
