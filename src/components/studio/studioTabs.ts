export type StudioTabId =
  | "calendar"
  | "content"
  | "platforms"
  | "linktree"
  | "linktree2"
  | "inbox"
  | "automations"
  | "bots";

export const STUDIO_TAB_IDS: readonly StudioTabId[] = [
  "calendar",
  "content",
  "platforms",
  "linktree",
  "linktree2",
  "inbox",
  "automations",
  "bots",
] as const;

export function isStudioTabId(value: string): value is StudioTabId {
  return (STUDIO_TAB_IDS as readonly string[]).includes(value);
}

export function parseStudioTab(value: string | null | undefined): StudioTabId | null {
  if (!value) return null;
  if (value === "links") return "linktree";
  return isStudioTabId(value) ? value : null;
}

export function studioTabHref(tab: StudioTabId): string {
  return `/studio?tab=${encodeURIComponent(tab)}`;
}

const PRODUCT_SLUG_TO_STUDIO_TAB: Record<string, StudioTabId> = {
  calendar: "calendar",
  content: "content",
  platforms: "platforms",
  links: "linktree",
  linktree: "linktree",
  inbox: "inbox",
  automations: "automations",
  bots: "bots",
  publish: "content",
  analytics: "calendar",
};

/** Map marketing product slugs to studio tabs (publish/analytics have no 1:1 tab). */
export function productSlugToStudioTab(slug: string): StudioTabId | null {
  return PRODUCT_SLUG_TO_STUDIO_TAB[slug] ?? null;
}

export function studioHrefForProduct(slug: string): string {
  const tab = productSlugToStudioTab(slug);
  return tab ? studioTabHref(tab) : "/studio";
}
