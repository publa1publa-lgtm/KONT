import { dateKeyLocal } from "@/components/calendar/dateUtils";
import type { CalendarEvent, Platform, ScheduledPost } from "@/components/calendar/types";
import { isReelPlatformId, type ReelPlatformId } from "@/lib/reelPlatformIds";
import type { ComposerPublishSelection } from "./composerPublish";
import type { ContentApiItem } from "./contentApi";

/** Legacy metadata from older saves (subtitles step removed). */
type LegacySubtitle = { start: number; end: number; text: string };

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** Maps reel platform ids to calendar `Platform` (Facebook has no calendar chip). */
const PLATFORM_TO_CALENDAR: Record<ReelPlatformId, Platform | null> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram",
  facebook: null,
  pinterest: "Pinterest",
  linkedin: "LinkedIn",
};

export function localScheduleToIso(dateKey: string, time: string): string {
  const [y, mo, d] = dateKey.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  if (![y, mo, d, hh, mm].every((n) => Number.isFinite(n))) {
    throw new Error("Invalid date or time");
  }
  return new Date(y, mo - 1, d, hh, mm, 0, 0).toISOString();
}

export function scheduledAtToDateKeyAndTime(scheduledAt: string): { dateKey: string; time: string } | null {
  const dt = new Date(scheduledAt);
  if (Number.isNaN(dt.getTime())) return null;
  return {
    dateKey: dateKeyLocal(dt),
    time: `${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`,
  };
}

export function platformIdsToCalendarPlatforms(ids: ReelPlatformId[]): Platform[] {
  return ids.map((id) => PLATFORM_TO_CALENDAR[id]).filter((x): x is Platform => x !== null);
}

export function apiItemToPublishSelection(c: ContentApiItem): ComposerPublishSelection {
  if (c.status === "ARCHIVED") return { kind: "draft" };
  const meta =
    c.metadata && typeof c.metadata === "object" && !Array.isArray(c.metadata)
      ? (c.metadata as { publishMode?: unknown })
      : {};
  const mode = meta.publishMode;
  const ids = metadataPlatforms(c.metadata);
  if (mode === "platforms" && ids.length > 0) {
    return { kind: "platforms", platformIds: ids };
  }
  if (ids.length > 0 && (c.status === "SCHEDULED" || c.status === "READY")) {
    return { kind: "platforms", platformIds: ids };
  }
  return { kind: "draft" };
}

export function metadataPlatforms(meta: unknown): ReelPlatformId[] {
  if (!meta || typeof meta !== "object") return [];
  const pl = (meta as { platforms?: unknown }).platforms;
  if (!Array.isArray(pl)) return [];
  return pl.filter((x): x is ReelPlatformId => typeof x === "string" && isReelPlatformId(x));
}

function metadataSubtitles(meta: unknown): LegacySubtitle[] {
  if (!meta || typeof meta !== "object") return [];
  const raw = (meta as { subtitles?: unknown }).subtitles;
  if (!Array.isArray(raw)) return [];
  const out: LegacySubtitle[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as { start?: unknown; end?: unknown; text?: unknown };
    if (typeof o.start !== "number" || typeof o.end !== "number" || typeof o.text !== "string") continue;
    out.push({ start: o.start, end: o.end, text: o.text });
  }
  return out;
}

export function contentToCalendarEvent(c: ContentApiItem): CalendarEvent | null {
  if (c.status === "ARCHIVED") return null;
  if (c.type !== "REEL" || !c.scheduledAt || !c.videoUrl) return null;
  const slot = scheduledAtToDateKeyAndTime(c.scheduledAt);
  if (!slot) return null;
  const platforms = metadataPlatforms(c.metadata)
    .map((id) => PLATFORM_TO_CALENDAR[id])
    .filter((x): x is Platform => x !== null);
  return {
    id: c.id,
    dateKey: slot.dateKey,
    time: slot.time,
    videoUrl: c.videoUrl,
    title: c.title,
    description: c.description ?? "",
    hashtags: c.hashtags,
    platforms,
    tags: Array.isArray(c.tags) ? c.tags : [],
    createdAt: new Date(c.createdAt).getTime(),
  };
}

/** Scheduled posts + reels for a calendar day (non-archived). */
export function apiItemsForDateKey(items: ContentApiItem[], dateKey: string): ContentApiItem[] {
  const out: ContentApiItem[] = [];
  for (const c of items) {
    if (c.status === "ARCHIVED" || !c.scheduledAt) continue;
    const slot = scheduledAtToDateKeyAndTime(c.scheduledAt);
    if (!slot || slot.dateKey !== dateKey) continue;
    out.push(c);
  }
  out.sort((a, b) => {
    const sa = scheduledAtToDateKeyAndTime(a.scheduledAt!)!;
    const sb = scheduledAtToDateKeyAndTime(b.scheduledAt!)!;
    if (sa.dateKey !== sb.dateKey) return sa.dateKey.localeCompare(sb.dateKey);
    if (sa.time !== sb.time) return sa.time.localeCompare(sb.time);
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
  return out;
}

export function contentToScheduledPost(c: ContentApiItem): ScheduledPost | null {
  if (c.status === "ARCHIVED") return null;
  if (c.type !== "POST" || !c.scheduledAt) return null;
  const slot = scheduledAtToDateKeyAndTime(c.scheduledAt);
  if (!slot) return null;
  return {
    id: c.id,
    kind: "post",
    title: c.title,
    dateKey: slot.dateKey,
    time: slot.time,
    createdAt: new Date(c.createdAt).getTime(),
  };
}

export type PostListItem = {
  id: string;
  kind: "post";
  status: string;
  title: string;
  text: string;
  imageUrl: string | null;
  dateKey?: string;
  time?: string;
  hashtags?: string[];
  platforms?: ReelPlatformId[];
  createdAt: number;
};

export type ReelListItem = {
  id: string;
  kind: "reel";
  status: string;
  title: string;
  description: string;
  videoUrl: string;
  time?: string;
  dateKey?: string;
  hashtags: string[];
  tags: string[];
  platforms?: ReelPlatformId[];
  subtitles?: LegacySubtitle[];
  createdAt: number;
};

export type ContentListItem = PostListItem | ReelListItem;

function isContentListItem(x: ContentListItem | null): x is ContentListItem {
  return x !== null;
}

export function contentToListItem(c: ContentApiItem): ContentListItem | null {
  if (c.type === "POST") {
    const slot = c.scheduledAt ? scheduledAtToDateKeyAndTime(c.scheduledAt) : null;
    return {
      id: c.id,
      kind: "post",
      status: c.status,
      title: c.title,
      text: c.text ?? "",
      imageUrl: c.imageUrl,
      dateKey: slot?.dateKey,
      time: slot?.time,
      hashtags: c.hashtags,
      platforms: metadataPlatforms(c.metadata),
      createdAt: new Date(c.createdAt).getTime(),
    };
  }
  if (c.type === "REEL") {
    const slot = c.scheduledAt ? scheduledAtToDateKeyAndTime(c.scheduledAt) : null;
    return {
      id: c.id,
      kind: "reel",
      status: c.status,
      title: c.title,
      description: c.description ?? "",
      videoUrl: c.videoUrl ?? "",
      time: slot?.time,
      dateKey: slot?.dateKey,
      hashtags: c.hashtags,
      tags: c.tags,
      platforms: metadataPlatforms(c.metadata),
      subtitles: metadataSubtitles(c.metadata),
      createdAt: new Date(c.createdAt).getTime(),
    };
  }
  return null;
}

export function mapApiItemsToListItems(items: ContentApiItem[]): ContentListItem[] {
  return items.map(contentToListItem).filter(isContentListItem);
}

export function contentsToCalendarMaps(items: ContentApiItem[]) {
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  const scheduledPosts: ScheduledPost[] = [];

  for (const c of items) {
    const ev = contentToCalendarEvent(c);
    if (ev) {
      (eventsByDate[ev.dateKey] ??= []).push(ev);
    }
    const sp = contentToScheduledPost(c);
    if (sp) scheduledPosts.push(sp);
  }

  for (const key of Object.keys(eventsByDate)) {
    eventsByDate[key].sort((a, b) => (a.time === b.time ? a.createdAt - b.createdAt : a.time.localeCompare(b.time)));
  }
  scheduledPosts.sort((a, b) => (a.dateKey === b.dateKey ? a.time.localeCompare(b.time) : a.dateKey.localeCompare(b.dateKey)));

  return { eventsByDate, scheduledPosts };
}
