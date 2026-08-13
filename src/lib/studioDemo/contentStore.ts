import type { ContentApiItem } from "@/lib/contentApi";

const STORAGE_KEY = "kont-studio-demo-content";

function nowIso() {
  return new Date().toISOString();
}

function seedItems(): ContentApiItem[] {
  const t = nowIso();
  const inTwoDays = new Date(Date.now() + 2 * 86400000).toISOString();
  return [
    {
      id: "demo-post-1",
      userId: "demo",
      type: "POST",
      status: "SCHEDULED",
      title: "Thread draft — calm launch notes",
      text: "Three things we learned shipping quietly.",
      description: null,
      imageUrl: null,
      videoUrl: null,
      hashtags: ["#kont", "#creator"],
      tags: [],
      metadata: null,
      scheduledAt: inTwoDays,
      createdAt: t,
      updatedAt: t,
    },
    {
      id: "demo-reel-1",
      userId: "demo",
      type: "REEL",
      status: "DRAFT",
      title: "Behind the scenes — studio glass UI",
      text: null,
      description: "Short walkthrough of the new workspace.",
      imageUrl: null,
      videoUrl: null,
      hashtags: ["#studio"],
      tags: [],
      metadata: null,
      scheduledAt: null,
      createdAt: t,
      updatedAt: t,
    },
  ];
}

export function readDemoContent(): ContentApiItem[] {
  if (typeof window === "undefined") return seedItems();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedItems();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as ContentApiItem[];
    return Array.isArray(parsed) ? parsed : seedItems();
  } catch {
    return seedItems();
  }
}

export function writeDemoContent(items: ContentApiItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/** Demo localStorage content — only when explicitly enabled for UI review without DB. */
export function shouldUseDemoContent(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("kont-studio-demo-content-enabled") === "1";
}
