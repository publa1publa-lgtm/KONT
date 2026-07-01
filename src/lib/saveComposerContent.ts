import { autoTagsForPlatforms } from "@/components/calendar/platformTags";
import type { ComposerPublishSelection } from "./composerPublish";
import { createContent, notifyContentListChanged, updateContent } from "./contentApi";
import { localScheduleToIso, platformIdsToCalendarPlatforms } from "./contentMappers";

export type ComposerPostPayload = {
  title: string;
  text: string;
  imageUrl: string | null;
  hashtags: string[];
  dateKey: string;
  time: string;
  publish: ComposerPublishSelection;
};

export type ComposerReelPayload = {
  title: string;
  description: string;
  videoUrl: string;
  hashtags: string[];
  dateKey: string;
  time: string;
  publish: ComposerPublishSelection;
};

function platformIdsForSave(publish: ComposerPublishSelection) {
  return publish.kind === "platforms" ? publish.platformIds : [];
}

function contentStatusForSave(publish: ComposerPublishSelection): "DRAFT" | "SCHEDULED" {
  return publish.kind === "draft" ? "DRAFT" : "SCHEDULED";
}

function metadataForSave(publish: ComposerPublishSelection) {
  return {
    publishMode: publish.kind,
    platforms: platformIdsForSave(publish),
  };
}

export async function saveComposerPost(payload: ComposerPostPayload): Promise<void> {
  const platformIds = platformIdsForSave(payload.publish);
  const tags =
    payload.publish.kind === "draft"
      ? []
      : autoTagsForPlatforms(platformIdsToCalendarPlatforms(platformIds));

  await createContent({
    type: "POST",
    title: payload.title,
    text: payload.text,
    imageUrl: payload.imageUrl,
    hashtags: payload.hashtags,
    tags,
    scheduledAt: localScheduleToIso(payload.dateKey, payload.time),
    status: contentStatusForSave(payload.publish),
    metadata: metadataForSave(payload.publish),
  });
  notifyContentListChanged();
}

export async function saveComposerReel(payload: ComposerReelPayload): Promise<void> {
  const platformIds = platformIdsForSave(payload.publish);
  const tags =
    payload.publish.kind === "draft"
      ? []
      : autoTagsForPlatforms(platformIdsToCalendarPlatforms(platformIds));

  await createContent({
    type: "REEL",
    title: payload.title,
    description: payload.description,
    videoUrl: payload.videoUrl,
    hashtags: payload.hashtags,
    tags,
    scheduledAt: localScheduleToIso(payload.dateKey, payload.time),
    status: contentStatusForSave(payload.publish),
    metadata: metadataForSave(payload.publish),
  });
  notifyContentListChanged();
}

export async function updateComposerPost(id: string, payload: ComposerPostPayload): Promise<void> {
  const platformIds = platformIdsForSave(payload.publish);
  const tags =
    payload.publish.kind === "draft"
      ? []
      : autoTagsForPlatforms(platformIdsToCalendarPlatforms(platformIds));

  await updateContent(id, {
    title: payload.title,
    text: payload.text,
    imageUrl: payload.imageUrl,
    hashtags: payload.hashtags,
    tags,
    scheduledAt: localScheduleToIso(payload.dateKey, payload.time),
    status: contentStatusForSave(payload.publish),
    metadata: metadataForSave(payload.publish),
  });
  notifyContentListChanged();
}

export async function updateComposerReel(id: string, payload: ComposerReelPayload): Promise<void> {
  const platformIds = platformIdsForSave(payload.publish);
  const tags =
    payload.publish.kind === "draft"
      ? []
      : autoTagsForPlatforms(platformIdsToCalendarPlatforms(platformIds));

  await updateContent(id, {
    title: payload.title,
    description: payload.description,
    videoUrl: payload.videoUrl,
    hashtags: payload.hashtags,
    tags,
    scheduledAt: localScheduleToIso(payload.dateKey, payload.time),
    status: contentStatusForSave(payload.publish),
    metadata: metadataForSave(payload.publish),
  });
  notifyContentListChanged();
}
