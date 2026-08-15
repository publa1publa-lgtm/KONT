import type { CloudMediaOrigin } from "@/lib/cloud/types";

export const CONTENT_LIST_CHANGED_EVENT = "contentfabric-content-changed";

export type MediaKindApi = "IMAGE" | "VIDEO" | "AUDIO";
export type MediaStatusApi = "UPLOADING" | "READY" | "FAILED" | "DELETED";
export type ContentMediaRoleApi = "MAIN" | "COVER" | "CAROUSEL" | "ATTACHMENT";

export type MediaAssetApi = {
  id: string;
  kind: MediaKindApi;
  status: MediaStatusApi;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  posterUrl: string | null;
  origin?: CloudMediaOrigin | null;
  createdAt: string;
};

export type ContentMediaApi = {
  id: string;
  role: ContentMediaRoleApi;
  position: number;
  media: MediaAssetApi;
};

export type ContentApiItem = {
  id: string;
  userId: string;
  type: "POST" | "REEL";
  status: string;
  title: string;
  text: string | null;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  hashtags: string[];
  tags: string[];
  metadata: unknown | null;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Linked media (MAIN role first; carousel ordering follows `position`). */
  media?: ContentMediaApi[];
};

export type FetchContentsResult = {
  items: ContentApiItem[];
  nextCursor: string | null;
  unauthorized: boolean;
};

export type FetchContentsOptions = {
  limit?: number;
  cursor?: string | null;
};

export async function fetchContents(options: FetchContentsOptions = {}): Promise<FetchContentsResult> {
  const params = new URLSearchParams();
  if (options.limit) params.set("limit", String(options.limit));
  if (options.cursor) params.set("cursor", options.cursor);
  const qs = params.toString();

  try {
    const r = await fetch(`/api/content${qs ? `?${qs}` : ""}`);
    if (r.ok) {
      const d = (await r.json()) as { items?: ContentApiItem[]; nextCursor?: string | null };
      const items = Array.isArray(d.items) ? d.items : [];
      return { items, nextCursor: d.nextCursor ?? null, unauthorized: false };
    }
    if (r.status === 401) {
      const { readDemoContent, shouldUseDemoContent } = await import("@/lib/studioDemo/contentStore");
      if (shouldUseDemoContent()) {
        return { items: readDemoContent(), nextCursor: null, unauthorized: false };
      }
      return { items: [], nextCursor: null, unauthorized: true };
    }
  } catch {
    const { readDemoContent, shouldUseDemoContent } = await import("@/lib/studioDemo/contentStore");
    if (shouldUseDemoContent()) {
      return { items: readDemoContent(), nextCursor: null, unauthorized: false };
    }
  }

  return { items: [], nextCursor: null, unauthorized: false };
}

/** Body sent to POST /api/content (matches server expectations). */
export type CreateContentBody = {
  type: "POST" | "REEL";
  title: string;
  text?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  hashtags?: string[];
  tags?: string[];
  scheduledAt?: string | null;
  metadata?: Record<string, unknown>;
  status?: "DRAFT" | "READY" | "SCHEDULED" | "ARCHIVED";
  /** IDs of MediaAssets to attach as MAIN media (in order). */
  mediaIds?: string[];
};

export async function createContent(body: CreateContentBody): Promise<ContentApiItem> {
  const r = await fetch("/api/content", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 401) {
    throw new Error("Unauthorized");
  }
  if (!r.ok) {
    const err = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? "Failed to save");
  }
  return (await r.json()) as ContentApiItem;
}

export type UpdateContentBody = Partial<
  Pick<
    CreateContentBody,
    | "title"
    | "text"
    | "description"
    | "imageUrl"
    | "videoUrl"
    | "hashtags"
    | "tags"
    | "scheduledAt"
    | "metadata"
    | "status"
    | "mediaIds"
  >
>;

export async function updateContent(id: string, body: UpdateContentBody): Promise<ContentApiItem> {
  const r = await fetch(`/api/content/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 401) {
    throw new Error("Unauthorized");
  }
  if (r.status === 404) {
    throw new Error("Not found");
  }
  if (!r.ok) {
    const err = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? "Failed to update");
  }
  return (await r.json()) as ContentApiItem;
}

export async function deleteContent(id: string): Promise<void> {
  const r = await fetch(`/api/content/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (r.status === 401) {
    throw new Error("Unauthorized");
  }
  if (r.status === 404) {
    throw new Error("Not found");
  }
  if (!r.ok) {
    const err = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? "Failed to delete");
  }
}

export function notifyContentListChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CONTENT_LIST_CHANGED_EVENT));
}

function mainMediaIds(item: ContentApiItem): string[] | undefined {
  const ids = item.media?.map((m) => m.media.id).filter(Boolean) ?? [];
  return ids.length > 0 ? ids : undefined;
}

/** Creates a draft copy without schedule (safe default for library duplicate). */
export async function duplicateContentAsDraft(source: ContentApiItem, title: string): Promise<ContentApiItem> {
  const mediaIds = mainMediaIds(source);
  const base = {
    title,
    hashtags: source.hashtags,
    status: "DRAFT" as const,
    scheduledAt: null,
    mediaIds,
  };

  if (source.type === "POST") {
    return createContent({
      ...base,
      type: "POST",
      text: source.text,
      imageUrl: source.imageUrl,
    });
  }

  return createContent({
    ...base,
    type: "REEL",
    description: source.description,
    videoUrl: source.videoUrl,
    tags: source.tags,
    metadata:
      source.metadata && typeof source.metadata === "object" && !Array.isArray(source.metadata)
        ? (source.metadata as Record<string, unknown>)
        : undefined,
  });
}

export type UploadMediaOptions = {
  width?: number;
  height?: number;
  durationMs?: number;
  posterUrl?: string;
  signal?: AbortSignal;
};

export type UploadMediaResult = {
  media: MediaAssetApi;
  /** True when an existing asset with the same SHA-256 was reused. */
  deduped: boolean;
};

/**
 * Uploads a single file to /api/upload. Optional client-probed metadata
 * (width / height / duration) is forwarded so we can store it without ffprobe.
 */
export async function uploadMedia(
  file: File,
  options: UploadMediaOptions = {},
): Promise<UploadMediaResult> {
  const form = new FormData();
  form.append("file", file);
  if (options.width !== undefined) form.append("width", String(options.width));
  if (options.height !== undefined) form.append("height", String(options.height));
  if (options.durationMs !== undefined) form.append("durationMs", String(options.durationMs));
  if (options.posterUrl) form.append("posterUrl", options.posterUrl);

  const r = await fetch("/api/upload", {
    method: "POST",
    body: form,
    signal: options.signal,
  });

  if (r.status === 401) throw new Error("Unauthorized");
  if (!r.ok) {
    const err = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? `Upload failed (${r.status})`);
  }

  const data = (await r.json()) as { media: MediaAssetApi; deduped?: boolean };
  return { media: data.media, deduped: Boolean(data.deduped) };
}

export async function importCloudMedia(input: {
  provider: "googleDrive" | "dropbox";
  fileId?: string;
  url?: string;
}): Promise<UploadMediaResult> {
  const r = await fetch("/api/cloud/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (r.status === 401) throw new Error("Unauthorized");
  if (!r.ok) {
    const err = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? `Cloud import failed (${r.status})`);
  }
  const data = (await r.json()) as { media: MediaAssetApi; deduped?: boolean };
  return { media: data.media, deduped: Boolean(data.deduped) };
}
