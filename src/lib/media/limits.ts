import { MediaKind } from "@prisma/client";

/** Hard size caps per media kind. Tune freely as we iterate. */
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
export const MAX_AUDIO_BYTES = 50 * 1024 * 1024;

export const ALLOWED_IMAGE_MIME = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const ALLOWED_VIDEO_MIME = new Set<string>([
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export const ALLOWED_AUDIO_MIME = new Set<string>([
  "audio/mpeg",
  "audio/mp4",
  "audio/aac",
  "audio/wav",
  "audio/ogg",
]);

export function classifyMime(mime: string): MediaKind | null {
  const m = mime.toLowerCase();
  if (ALLOWED_IMAGE_MIME.has(m)) return MediaKind.IMAGE;
  if (ALLOWED_VIDEO_MIME.has(m)) return MediaKind.VIDEO;
  if (ALLOWED_AUDIO_MIME.has(m)) return MediaKind.AUDIO;
  return null;
}

export function maxBytesFor(kind: MediaKind): number {
  if (kind === MediaKind.IMAGE) return MAX_IMAGE_BYTES;
  if (kind === MediaKind.VIDEO) return MAX_VIDEO_BYTES;
  return MAX_AUDIO_BYTES;
}

export function extensionFor(mime: string): string {
  const m = mime.toLowerCase();
  switch (m) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    case "video/webm":
      return "webm";
    case "audio/mpeg":
      return "mp3";
    case "audio/mp4":
      return "m4a";
    case "audio/aac":
      return "aac";
    case "audio/wav":
      return "wav";
    case "audio/ogg":
      return "ogg";
    default:
      return "bin";
  }
}

/** Reverse-lookup so the serve route can return a proper Content-Type. */
export function mimeForExtension(ext: string): string {
  const e = ext.toLowerCase().replace(/^\./, "");
  switch (e) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "webm":
      return "video/webm";
    case "mp3":
      return "audio/mpeg";
    case "m4a":
      return "audio/mp4";
    case "aac":
      return "audio/aac";
    case "wav":
      return "audio/wav";
    case "ogg":
      return "audio/ogg";
    default:
      return "application/octet-stream";
  }
}
