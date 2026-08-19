import "server-only";

import {
  ContentStatus,
  ContentTargetStatus,
  ContentType,
  MediaKind,
  PublishAttemptStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { graphGet, graphPost, graphPostMultipart } from "@/lib/meta/graph";
import { hasFacebookPublishScope, hasInstagramPublishScope } from "@/lib/meta/permissions";
import { getMetaAccount } from "@/lib/meta/storage";
import { MetaError, type MetaConnectIntent } from "@/lib/meta/types";
import { getStorage } from "@/lib/storage";

export type MetaPublishResult =
  | { ok: true; remoteId: string; scheduled: boolean }
  | { ok: false; error: string; code?: string };

const FB_SCHEDULE_MIN_MS = 10 * 60_000;
const FB_SCHEDULE_MAX_MS = 180 * 24 * 60 * 60_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function captionFrom(text: string | null, description: string | null, hashtags: string[], max: number): string {
  const tags = hashtags
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
    .join(" ");
  return [text?.trim() || description?.trim() || "", tags].filter(Boolean).join("\n\n").slice(0, max);
}

function facebookScheduleUnix(scheduledAt: Date | null): number | null {
  if (!scheduledAt) return null;
  const delta = scheduledAt.getTime() - Date.now();
  if (delta < FB_SCHEDULE_MIN_MS || delta > FB_SCHEDULE_MAX_MS) return null;
  return Math.floor(scheduledAt.getTime() / 1000);
}

type LoadedMedia = { bytes: Buffer; mimeType: string; filename: string };

function fileBlob(media: LoadedMedia): Blob {
  return new Blob([new Uint8Array(media.bytes)], { type: media.mimeType });
}

async function loadMediaBytes(
  userId: string,
  content: {
    imageUrl: string | null;
    videoUrl: string | null;
    media: Array<{ media: { kind: MediaKind; deletedAt: Date | null; storageKey: string | null; mimeType: string; filename: string } }>;
  },
  kind: MediaKind,
): Promise<LoadedMedia | null> {
  const linked = content.media.find((row) => row.media.kind === kind && row.media.deletedAt === null)?.media;
  const fallbackUrl = kind === MediaKind.VIDEO ? content.videoUrl : content.imageUrl;
  const asset =
    linked ??
    (fallbackUrl
      ? await prisma.mediaAsset.findFirst({ where: { userId, url: fallbackUrl, kind, deletedAt: null } })
      : null);
  if (!asset?.storageKey) return null;
  const bytes = await getStorage().read(asset.storageKey);
  if (bytes.byteLength === 0) return null;
  return {
    bytes,
    mimeType: asset.mimeType || (kind === MediaKind.VIDEO ? "video/mp4" : "image/jpeg"),
    filename: asset.filename || (kind === MediaKind.VIDEO ? "video.mp4" : "image.jpg"),
  };
}

type IdResponse = { id?: string; post_id?: string };

async function nextAttemptNo(contentTargetId: string): Promise<number> {
  const last = await prisma.publishAttempt.aggregate({ where: { contentTargetId }, _max: { attemptNo: true } });
  return (last._max.attemptNo ?? 0) + 1;
}

async function failTarget(targetId: string, attemptId: string, error: string, code?: string): Promise<MetaPublishResult> {
  const finishedAt = new Date();
  await prisma.$transaction([
    prisma.publishAttempt.update({
      where: { id: attemptId },
      data: { status: PublishAttemptStatus.FAILED, errorCode: code ?? "META_PUBLISH", errorMessage: error.slice(0, 1000), finishedAt },
    }),
    prisma.contentTarget.update({
      where: { id: targetId },
      data: { status: ContentTargetStatus.FAILED, lastErrorCode: code ?? "META_PUBLISH", lastErrorMessage: error.slice(0, 1000) },
    }),
  ]);
  return { ok: false, error, code };
}

async function postPageMedia(
  path: string,
  pageToken: string,
  media: LoadedMedia,
  fields: Record<string, string>,
): Promise<IdResponse> {
  const form = new FormData();
  form.append("access_token", pageToken);
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  form.append("source", fileBlob(media), media.filename);
  return graphPostMultipart<IdResponse>(path, form);
}

async function facebookUnpublishedImageUrl(pageId: string, pageToken: string, media: LoadedMedia): Promise<string> {
  const created = await postPageMedia(`/${pageId}/photos`, pageToken, media, { published: "false" });
  if (!created.id) {
    throw new MetaError("Could not host the image on Facebook for Instagram.", {
      code: "INSTAGRAM_IMAGE_HOST",
      status: 502,
      details: created,
    });
  }
  const photos = await graphGet<{ images?: Array<{ source?: string; width?: number }> }>(`/${created.id}`, pageToken, {
    fields: "images",
  });
  const url = (photos.images ?? []).slice().sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.source;
  if (!url) {
    throw new MetaError("Facebook did not return a public image URL for Instagram.", {
      code: "INSTAGRAM_IMAGE_URL",
      status: 502,
      details: photos,
    });
  }
  return url;
}

async function waitForIgContainer(containerId: string, pageToken: string): Promise<void> {
  for (let i = 0; i < 24; i += 1) {
    const status = await graphGet<{ status_code?: string; status?: string }>(`/${containerId}`, pageToken, {
      fields: "status_code",
    });
    if (status.status_code === "FINISHED") return;
    if (status.status_code === "ERROR" || status.status_code === "EXPIRED") {
      throw new MetaError(status.status || "Instagram media processing failed.", {
        code: "INSTAGRAM_CONTAINER",
        status: 502,
        details: status,
      });
    }
    await sleep(2500);
  }
  throw new MetaError("Instagram media is still processing. Try publishing again in a moment.", {
    code: "INSTAGRAM_TIMEOUT",
    status: 504,
  });
}

async function publishIgContainer(igUserId: string, pageToken: string, creationId: string): Promise<string> {
  await waitForIgContainer(creationId, pageToken);
  const published = await graphPost<IdResponse>(`/${igUserId}/media_publish`, pageToken, { creation_id: creationId });
  if (!published.id) {
    throw new MetaError("Instagram did not return a media id.", { code: "INSTAGRAM_PUBLISH", status: 502, details: published });
  }
  return published.id;
}

async function publishInstagramPhoto(
  igUserId: string,
  pageId: string,
  pageToken: string,
  media: LoadedMedia,
  caption: string,
): Promise<string> {
  const imageUrl = await facebookUnpublishedImageUrl(pageId, pageToken, media);
  const container = await graphPost<{ id?: string }>(`/${igUserId}/media`, pageToken, { image_url: imageUrl, caption });
  if (!container.id) {
    throw new MetaError("Instagram did not create a photo container.", { code: "INSTAGRAM_CONTAINER", status: 502, details: container });
  }
  return publishIgContainer(igUserId, pageToken, container.id);
}

async function publishInstagramReel(
  igUserId: string,
  pageToken: string,
  media: LoadedMedia,
  caption: string,
): Promise<string> {
  const started = await graphPost<{ id?: string; uri?: string }>(`/${igUserId}/media`, pageToken, {
    media_type: "REELS",
    upload_type: "resumable",
    caption,
    share_to_feed: "true",
  });
  if (!started.id || !started.uri) {
    throw new MetaError("Instagram did not start a resumable reel upload.", {
      code: "INSTAGRAM_REEL_UPLOAD",
      status: 502,
      details: started,
    });
  }
  const uploadRes = await fetch(started.uri, {
    method: "POST",
    headers: {
      Authorization: `OAuth ${pageToken}`,
      offset: "0",
      file_size: String(media.bytes.byteLength),
    },
    body: new Uint8Array(media.bytes),
    cache: "no-store",
  });
  if (!uploadRes.ok) {
    throw new MetaError("Instagram reel upload failed.", {
      code: "INSTAGRAM_REEL_UPLOAD",
      status: uploadRes.status,
      details: await uploadRes.text().catch(() => ""),
    });
  }
  return publishIgContainer(igUserId, pageToken, started.id);
}

async function publishToPlatform(userId: string, contentId: string, kind: MetaConnectIntent): Promise<MetaPublishResult> {
  const content = await prisma.content.findFirst({
    where: { id: contentId, userId, deletedAt: null },
    include: { media: { orderBy: { position: "asc" }, include: { media: true } } },
  });
  if (!content) return { ok: false, error: "Content was not found.", code: "NOT_FOUND" };

  const metaAccount = await getMetaAccount(userId, kind);
  if (!metaAccount?.accountId) {
    return {
      ok: false,
      error: kind === "facebook" ? "Facebook is not connected." : "Instagram is not connected.",
      code: kind === "facebook" ? "FACEBOOK_NOT_CONNECTED" : "INSTAGRAM_NOT_CONNECTED",
    };
  }

  const scopes = metaAccount.scope.split(/[,\s]+/);
  if (kind === "facebook" && !hasFacebookPublishScope(scopes)) {
    return { ok: false, error: "Reconnect Facebook and allow publishing to Pages.", code: "FACEBOOK_PUBLISH_SCOPE" };
  }
  if (kind === "instagram" && !hasInstagramPublishScope(scopes)) {
    return { ok: false, error: "Reconnect Instagram and allow content publishing.", code: "INSTAGRAM_PUBLISH_SCOPE" };
  }

  const existingTarget = await prisma.contentTarget.findUnique({
    where: { contentId_platformAccountId: { contentId, platformAccountId: metaAccount.accountId } },
  });
  if (
    existingTarget?.remoteId &&
    (existingTarget.status === ContentTargetStatus.PUBLISHED || existingTarget.status === ContentTargetStatus.SCHEDULED)
  ) {
    return { ok: true, remoteId: existingTarget.remoteId, scheduled: existingTarget.status === ContentTargetStatus.SCHEDULED };
  }

  const target = await prisma.contentTarget.upsert({
    where: { contentId_platformAccountId: { contentId, platformAccountId: metaAccount.accountId } },
    create: { contentId, platformAccountId: metaAccount.accountId, status: ContentTargetStatus.PUBLISHING },
    update: { status: ContentTargetStatus.PUBLISHING, lastErrorCode: null, lastErrorMessage: null },
  });
  const attempt = await prisma.publishAttempt.create({
    data: { contentTargetId: target.id, attemptNo: await nextAttemptNo(target.id), status: PublishAttemptStatus.STARTED },
  });

  const page = metaAccount.selectedPage;
  const scheduleUnix = kind === "facebook" ? facebookScheduleUnix(content.scheduledAt) : null;
  const caption = captionFrom(content.text, content.description, content.hashtags, kind === "instagram" ? 2200 : 63206);
  const scheduleFields: Record<string, string> = scheduleUnix
    ? { published: "false", scheduled_publish_time: String(scheduleUnix) }
    : {};

  try {
    let remoteId: string;
    if (kind === "facebook") {
      if (content.type === ContentType.REEL) {
        const media = await loadMediaBytes(userId, content, MediaKind.VIDEO);
        if (!media) return failTarget(target.id, attempt.id, "This reel has no video file to upload.", "VIDEO_MISSING");
        const body = await postPageMedia(`/${page.pageId}/videos`, page.accessToken, media, {
          title: content.title.slice(0, 255),
          description: caption,
          ...scheduleFields,
        });
        if (!body.id) return failTarget(target.id, attempt.id, "Facebook did not return a video id.", "FACEBOOK_VIDEO");
        remoteId = body.id;
      } else {
        const media = await loadMediaBytes(userId, content, MediaKind.IMAGE);
        if (media) {
          const body = await postPageMedia(`/${page.pageId}/photos`, page.accessToken, media, {
            caption: caption || content.title,
            ...scheduleFields,
          });
          remoteId = body.post_id || body.id || "";
          if (!remoteId) return failTarget(target.id, attempt.id, "Facebook did not return a photo id.", "FACEBOOK_PHOTO");
        } else if (caption || content.title) {
          const post = await graphPost<IdResponse>(`/${page.pageId}/feed`, page.accessToken, {
            message: caption || content.title,
            ...scheduleFields,
          });
          if (!post.id) return failTarget(target.id, attempt.id, "Facebook did not return a post id.", "FACEBOOK_FEED");
          remoteId = post.id;
        } else {
          return failTarget(target.id, attempt.id, "This post has no image or text to publish.", "MEDIA_MISSING");
        }
      }
    } else {
      if (!page.igUserId) {
        return failTarget(target.id, attempt.id, "No Instagram professional account is linked to the connected Page.", "NO_INSTAGRAM_ACCOUNT");
      }
      if (content.type === ContentType.REEL) {
        const media = await loadMediaBytes(userId, content, MediaKind.VIDEO);
        if (!media) return failTarget(target.id, attempt.id, "This reel has no video file to upload.", "VIDEO_MISSING");
        remoteId = await publishInstagramReel(page.igUserId, page.accessToken, media, caption || content.title);
      } else {
        const media = await loadMediaBytes(userId, content, MediaKind.IMAGE);
        if (!media) return failTarget(target.id, attempt.id, "This post has no image to publish to Instagram.", "IMAGE_MISSING");
        remoteId = await publishInstagramPhoto(page.igUserId, page.pageId, page.accessToken, media, caption || content.title);
      }
    }

    const finishedAt = new Date();
    const scheduled = Boolean(scheduleUnix);
    await prisma.$transaction([
      prisma.publishAttempt.update({ where: { id: attempt.id }, data: { status: PublishAttemptStatus.SUCCEEDED, finishedAt } }),
      prisma.contentTarget.update({
        where: { id: target.id },
        data: {
          status: scheduled ? ContentTargetStatus.SCHEDULED : ContentTargetStatus.PUBLISHED,
          publishedAt: scheduled ? content.scheduledAt : finishedAt,
          remoteId,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      }),
      prisma.content.update({
        where: { id: content.id },
        data: { status: scheduled ? ContentStatus.SCHEDULED : ContentStatus.READY },
      }),
    ]);
    return { ok: true, remoteId, scheduled };
  } catch (err) {
    console.error(`[${kind}.publish]`, err);
    const message = err instanceof MetaError ? err.message : `Failed to publish to ${kind}.`;
    const code = err instanceof MetaError ? err.code : "META_PUBLISH";
    return failTarget(target.id, attempt.id, message, code);
  }
}

export async function publishToFacebook(userId: string, contentId: string): Promise<MetaPublishResult> {
  return publishToPlatform(userId, contentId, "facebook");
}

export async function publishToInstagram(userId: string, contentId: string): Promise<MetaPublishResult> {
  return publishToPlatform(userId, contentId, "instagram");
}
