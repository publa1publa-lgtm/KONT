import "server-only";

import { exchangeCodeForTokens, fetchMineChannel, refreshToken } from "./oauth";
import { getTokens, updateTokens } from "./storage";
import type {
  YouTubeAnalyticsQuery,
  YouTubeAnalyticsReport,
  YouTubeApiErrorBody,
  YouTubeOAuthTokens,
  YouTubeUpdateInput,
  YouTubeUploadInput,
  YouTubeVideo,
  YouTubeVideoSource,
} from "./types";
import { YouTubeError, YouTubeNotConnectedError } from "./types";

const YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";
const YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";
const YOUTUBE_ANALYTICS_URL = "https://youtubeanalytics.googleapis.com/v2/reports";

const ACCESS_TOKEN_SKEW_MS = 60_000;
const DEFAULT_CATEGORY_ID = "22";
const DEFAULT_ANALYTICS_METRICS = [
  "views",
  "estimatedMinutesWatched",
  "averageViewDuration",
  "likes",
  "comments",
  "shares",
  "subscribersGained",
] as const;
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024;
const UPLOAD_CHUNK_BYTES = 8 * 1024 * 1024;

type YouTubeVideoResource = {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    tags?: string[];
    categoryId?: string;
    publishedAt?: string;
    channelId?: string;
  };
  status?: {
    privacyStatus?: YouTubeVideo["privacyStatus"];
  };
  statistics?: {
    viewCount?: string;
  };
};

function isExpired(expiresAt: Date, skewMs = ACCESS_TOKEN_SKEW_MS): boolean {
  return expiresAt.getTime() - skewMs <= Date.now();
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function throwYouTubeHttp(res: Response, body: unknown, fallback: string): never {
  const parsed = (body && typeof body === "object" ? body : {}) as YouTubeApiErrorBody;
  const message = parsed.error?.message || fallback;
  throw new YouTubeError(message, {
    code: parsed.error?.status ?? "YOUTUBE_API",
    status: res.status,
    details: body,
  });
}

function asFetchBody(bytes: Uint8Array): BodyInit {
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength) as unknown as BodyInit;
}

async function youtubeFetch<T>(url: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");

  const res = await fetch(url, { ...init, headers, cache: "no-store" });
  const body = await readJson(res);
  if (!res.ok) throwYouTubeHttp(res, body, "YouTube API request failed.");
  return body as T;
}

export async function refreshAccessToken(userId: string): Promise<YouTubeOAuthTokens> {
  const stored = await getTokens(userId);
  if (!stored) throw new YouTubeNotConnectedError(userId);
  if (!stored.refreshToken) {
    throw new YouTubeError("No YouTube refresh token is stored. Reconnect the channel.", {
      code: "YOUTUBE_RECONNECT_REQUIRED",
      status: 401,
    });
  }

  const next = await refreshToken(stored.refreshToken);
  const updated = await updateTokens(userId, {
    accessToken: next.accessToken,
    refreshToken: next.refreshToken ?? stored.refreshToken,
    expiresAt: next.expiresAt,
    scope: next.scope,
    tokenType: next.tokenType,
  });

  if (!updated) throw new YouTubeNotConnectedError(userId);
  return updated;
}

async function getValidAccessToken(userId: string): Promise<string> {
  const stored = await getTokens(userId);
  if (!stored) throw new YouTubeNotConnectedError(userId);
  if (!isExpired(stored.expiresAt)) return stored.accessToken;

  const refreshed = await refreshAccessToken(userId);
  return refreshed.accessToken;
}

function mapVideo(resource: YouTubeVideoResource): YouTubeVideo {
  if (!resource.id) {
    throw new YouTubeError("YouTube video response is missing an id.", { code: "YOUTUBE_VIDEO", status: 502 });
  }
  return {
    id: resource.id,
    title: resource.snippet?.title ?? "",
    description: resource.snippet?.description ?? "",
    tags: resource.snippet?.tags ?? [],
    categoryId: resource.snippet?.categoryId ?? DEFAULT_CATEGORY_ID,
    privacyStatus: resource.status?.privacyStatus ?? null,
    publishedAt: resource.snippet?.publishedAt ?? null,
    channelId: resource.snippet?.channelId ?? null,
  };
}

async function resolveSourceBytes(source: YouTubeVideoSource): Promise<{ bytes: Uint8Array; mimeType: string }> {
  if (source.type === "bytes") {
    const bytes = source.data instanceof Uint8Array ? source.data : new Uint8Array(source.data);
    if (bytes.byteLength > MAX_UPLOAD_BYTES) {
      throw new YouTubeError(`Video exceeds the ${MAX_UPLOAD_BYTES} byte upload limit.`, {
        code: "YOUTUBE_UPLOAD_TOO_LARGE",
        status: 413,
      });
    }
    return { bytes, mimeType: source.mimeType };
  }

  const res = await fetch(source.url, { cache: "no-store" });
  if (!res.ok) {
    throw new YouTubeError("Failed to download the video source URL.", {
      code: "YOUTUBE_SOURCE_URL",
      status: 400,
      details: { status: res.status },
    });
  }

  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.byteLength > MAX_UPLOAD_BYTES) {
    throw new YouTubeError(`Video exceeds the ${MAX_UPLOAD_BYTES} byte upload limit.`, {
      code: "YOUTUBE_UPLOAD_TOO_LARGE",
      status: 413,
    });
  }

  const mimeType = source.mimeType || res.headers.get("content-type")?.split(";")[0]?.trim() || "video/mp4";
  return { bytes: buf, mimeType };
}

async function startResumableSession(
  accessToken: string,
  input: YouTubeUploadInput,
  sizeBytes: number,
  mimeType: string,
): Promise<string> {
  const url = new URL(YOUTUBE_UPLOAD_URL);
  url.searchParams.set("uploadType", "resumable");
  url.searchParams.set("part", "snippet,status");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Length": String(sizeBytes),
      "X-Upload-Content-Type": mimeType,
    },
    body: JSON.stringify({
      snippet: {
        title: input.snippet.title,
        description: input.snippet.description ?? "",
        tags: input.snippet.tags ?? [],
        categoryId: input.snippet.categoryId ?? DEFAULT_CATEGORY_ID,
        defaultLanguage: input.snippet.defaultLanguage,
      },
      status: {
        privacyStatus: input.status?.privacyStatus ?? "private",
        embeddable: input.status?.embeddable,
        selfDeclaredMadeForKids: input.status?.selfDeclaredMadeForKids ?? false,
        publishAt: input.status?.publishAt,
      },
    }),
    cache: "no-store",
  });

  const location = res.headers.get("location");
  if (!res.ok || !location) {
    const body = await readJson(res);
    throwYouTubeHttp(res, body, "Failed to start a YouTube resumable upload.");
  }

  return location;
}

async function uploadResumableBytes(
  sessionUrl: string,
  accessToken: string,
  bytes: Uint8Array,
  mimeType: string,
): Promise<YouTubeVideoResource> {
  const total = bytes.byteLength;

  if (total <= UPLOAD_CHUNK_BYTES) {
    const res = await fetch(sessionUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType,
        "Content-Length": String(total),
      },
        body: asFetchBody(bytes),
      cache: "no-store",
    });
    const body = await readJson(res);
    if (!res.ok) throwYouTubeHttp(res, body, "YouTube video upload failed.");
    return body as YouTubeVideoResource;
  }

  let offset = 0;
  let lastBody: unknown = null;
  while (offset < total) {
    const end = Math.min(offset + UPLOAD_CHUNK_BYTES, total);
    const chunk = bytes.subarray(offset, end);
    const res = await fetch(sessionUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": mimeType,
        "Content-Length": String(chunk.byteLength),
        "Content-Range": `bytes ${offset}-${end - 1}/${total}`,
      },
      body: asFetchBody(chunk),
      cache: "no-store",
    });

    lastBody = await readJson(res);
    if (res.status === 308) {
      offset = end;
      continue;
    }
    if (!res.ok) throwYouTubeHttp(res, lastBody, "YouTube chunked upload failed.");
    return lastBody as YouTubeVideoResource;
  }

  throw new YouTubeError("YouTube upload ended without a completed video resource.", {
    code: "YOUTUBE_UPLOAD",
    status: 502,
    details: lastBody,
  });
}

export async function uploadVideo(userId: string, input: YouTubeUploadInput): Promise<YouTubeVideo> {
  if (!input.snippet.title.trim()) {
    throw new YouTubeError("Video title is required.", { code: "YOUTUBE_VALIDATION", status: 400 });
  }

  const accessToken = await getValidAccessToken(userId);
  const { bytes, mimeType } = await resolveSourceBytes(input.source);
  const sessionUrl = await startResumableSession(accessToken, input, bytes.byteLength, mimeType);
  const resource = await uploadResumableBytes(sessionUrl, accessToken, bytes, mimeType);
  return mapVideo(resource);
}

export async function getYouTubeVideoSnapshot(
  userId: string,
  videoId: string,
): Promise<{
  views: number | null;
  permalink: string | null;
  live: boolean | null;
  publishedAt: string | null;
}> {
  const id = videoId.trim();
  const fallbackPermalink = id ? `https://www.youtube.com/watch?v=${id}` : null;
  const empty = {
    views: null,
    permalink: fallbackPermalink,
    live: null as boolean | null,
    publishedAt: null,
  };
  if (!id) return { views: null, permalink: null, live: null, publishedAt: null };

  try {
    const accessToken = await getValidAccessToken(userId);
    const url = new URL(YOUTUBE_VIDEOS_URL);
    url.searchParams.set("part", "snippet,statistics,status");
    url.searchParams.set("id", id);
    const body = await youtubeFetch<{ items?: YouTubeVideoResource[] }>(url.toString(), accessToken);
    const item = body.items?.[0];
    if (!item?.id) {
      return { views: null, permalink: fallbackPermalink, live: false, publishedAt: null };
    }

    const rawViews = item.statistics?.viewCount;
    const views =
      typeof rawViews === "string" && rawViews.trim()
        ? Number.parseInt(rawViews, 10)
        : typeof rawViews === "number" && Number.isFinite(rawViews)
          ? rawViews
          : null;

    return {
      views: views != null && Number.isFinite(views) ? views : null,
      permalink: fallbackPermalink,
      live: true,
      publishedAt: item.snippet?.publishedAt ?? null,
    };
  } catch {
    return empty;
  }
}

async function getVideo(userId: string, videoId: string): Promise<YouTubeVideoResource> {
  const accessToken = await getValidAccessToken(userId);
  const url = new URL(YOUTUBE_VIDEOS_URL);
  url.searchParams.set("part", "snippet,status");
  url.searchParams.set("id", videoId);
  const body = await youtubeFetch<{ items?: YouTubeVideoResource[] }>(url.toString(), accessToken);
  const item = body.items?.[0];
  if (!item) {
    throw new YouTubeError("YouTube video was not found.", { code: "YOUTUBE_NOT_FOUND", status: 404 });
  }
  return item;
}

export async function updateVideo(userId: string, input: YouTubeUpdateInput): Promise<YouTubeVideo> {
  if (!input.videoId.trim()) {
    throw new YouTubeError("videoId is required.", { code: "YOUTUBE_VALIDATION", status: 400 });
  }

  const current = await getVideo(userId, input.videoId);
  const accessToken = await getValidAccessToken(userId);
  const url = new URL(YOUTUBE_VIDEOS_URL);
  url.searchParams.set("part", "snippet,status");

  const resource = await youtubeFetch<YouTubeVideoResource>(url.toString(), accessToken, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: input.videoId,
      snippet: {
        title: input.snippet?.title ?? current.snippet?.title ?? "",
        description: input.snippet?.description ?? current.snippet?.description ?? "",
        tags: input.snippet?.tags ?? current.snippet?.tags ?? [],
        categoryId: input.snippet?.categoryId ?? current.snippet?.categoryId ?? DEFAULT_CATEGORY_ID,
        defaultLanguage: input.snippet?.defaultLanguage,
      },
      status: {
        privacyStatus: input.status?.privacyStatus ?? current.status?.privacyStatus ?? "private",
        embeddable: input.status?.embeddable,
        selfDeclaredMadeForKids: input.status?.selfDeclaredMadeForKids,
        publishAt: input.status?.publishAt,
      },
    }),
  });

  return mapVideo(resource);
}

export async function deleteVideo(userId: string, videoId: string): Promise<{ deleted: true; videoId: string }> {
  const id = videoId.trim();
  if (!id) {
    throw new YouTubeError("videoId is required.", { code: "YOUTUBE_VALIDATION", status: 400 });
  }

  const accessToken = await getValidAccessToken(userId);
  const url = new URL(YOUTUBE_VIDEOS_URL);
  url.searchParams.set("id", id);

  const res = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok && res.status !== 204) {
    throwYouTubeHttp(res, await readJson(res), "Failed to delete the YouTube video.");
  }

  return { deleted: true, videoId: id };
}

export async function getAnalytics(userId: string, query: YouTubeAnalyticsQuery): Promise<YouTubeAnalyticsReport> {
  const stored = await getTokens(userId);
  if (!stored) throw new YouTubeNotConnectedError(userId);

  const accessToken = await getValidAccessToken(userId);
  const metrics = query.metrics ?? [...DEFAULT_ANALYTICS_METRICS];

  const url = new URL(YOUTUBE_ANALYTICS_URL);
  url.searchParams.set("ids", stored.channel?.channelId ? `channel==${stored.channel.channelId}` : "channel==MINE");
  url.searchParams.set("startDate", query.startDate);
  url.searchParams.set("endDate", query.endDate);
  url.searchParams.set("metrics", metrics.join(","));
  if (query.dimensions?.length) url.searchParams.set("dimensions", query.dimensions.join(","));
  if (query.sort) url.searchParams.set("sort", query.sort);
  if (query.filters) url.searchParams.set("filters", query.filters);
  if (query.maxResults) url.searchParams.set("maxResults", String(query.maxResults));

  return youtubeFetch<YouTubeAnalyticsReport>(url.toString(), accessToken);
}

export async function getMyChannel(userId: string) {
  const accessToken = await getValidAccessToken(userId);
  return fetchMineChannel(accessToken);
}

export { exchangeCodeForTokens, fetchMineChannel };

export class YouTubeClient {
  constructor(private readonly userId: string) {}

  uploadVideo(input: YouTubeUploadInput) {
    return uploadVideo(this.userId, input);
  }

  updateVideo(input: YouTubeUpdateInput) {
    return updateVideo(this.userId, input);
  }

  deleteVideo(videoId: string) {
    return deleteVideo(this.userId, videoId);
  }

  getAnalytics(query: YouTubeAnalyticsQuery) {
    return getAnalytics(this.userId, query);
  }

  refreshAccessToken() {
    return refreshAccessToken(this.userId);
  }

  getMyChannel() {
    return getMyChannel(this.userId);
  }
}

export function createYouTubeClient(userId: string): YouTubeClient {
  return new YouTubeClient(userId);
}

export async function getStoredYouTubeConnection(userId: string) {
  const stored = await getTokens(userId);
  if (!stored) return null;
  return {
    channel: stored.channel,
    expiresAt: stored.expiresAt,
    scope: stored.scope,
    hasRefreshToken: Boolean(stored.refreshToken),
  };
}
