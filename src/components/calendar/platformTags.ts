import type { Platform } from "./types";

export const PLATFORM_TAGS: Record<Platform, string[]> = {
  Instagram: ["Reels", "Feed", "Story"],
  TikTok: ["Category", "Sound"],
  YouTube: ["Title", "Thumbnail", "Visibility"],
  Pinterest: ["Pin", "Board", "Image"],
  LinkedIn: ["Headline", "Article", "Visibility"],
};

export function autoTagsForPlatforms(platforms: Platform[]): string[] {
  const out: string[] = [];
  for (const p of platforms) {
    for (const t of PLATFORM_TAGS[p] ?? []) out.push(t);
  }
  return Array.from(new Set(out));
}

