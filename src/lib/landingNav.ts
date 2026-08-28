import type { SectionId } from "@/components/studio/sections";
import { buildStudioHref } from "@/components/studio/studioRouting";
import type { AppLocale } from "@/i18n/config";

const NAV_SHELL = ".new-home-nav__shell";

export const LANDING_SECTIONS: SectionId[] = ["create", "manage", "grow"];

export const LANDING_SECTION_FEATURES: Record<SectionId, string[]> = {
  create: ["content", "automations", "bot"],
  manage: ["calendar", "inbox", "platforms"],
  grow: ["analytics", "insights", "audience"],
};

const ITEM_LANDING_HASH: Record<string, string> = {
  content: "#product",
  automations: "#product-automation",
  bot: "#product",
  calendar: "#product-calendar",
  inbox: "#product-inbox",
  platforms: "#product-platforms",
  analytics: "#product-dashboard",
  insights: "#product-insights",
  audience: "#product-audience",
};

export function landingHashForSection(section: SectionId) {
  return `#pillar-${section}`;
}

export function landingHashForItem(itemId: string) {
  return ITEM_LANDING_HASH[itemId] ?? "#product";
}

export function sectionFromLandingHash(hash: string): SectionId | "benefits" | null {
  if (hash === "#benefits") return "benefits";
  if (hash === "#pillar-create" || hash === "#pillars") return "create";
  if (hash === "#pillar-manage") return "manage";
  if (hash === "#pillar-grow") return "grow";
  if (hash === "#product-calendar" || hash === "#product-inbox" || hash === "#product-platforms") return "manage";
  if (hash === "#product-automation") return "create";
  if (hash === "#product-dashboard" || hash === "#product-insights" || hash === "#product-audience") {
    return "grow";
  }
  return null;
}

export function hrefForLandingItem(itemId: string, locale: AppLocale, toStudio: boolean) {
  if (toStudio) return buildStudioHref({ item: itemId, locale });
  return landingHashForItem(itemId);
}

export function landingNavOffset() {
  if (typeof document === "undefined") return 88;
  const shell = document.querySelector<HTMLElement>(NAV_SHELL);
  const extra = 18;
  return (shell?.getBoundingClientRect().height ?? 54) + extra;
}

export function scrollToLandingHash(hash: string, behavior: ScrollBehavior = "smooth") {
  if (typeof window === "undefined") return false;
  const id = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!id) return false;
  const el = document.getElementById(id);
  if (!el) return false;

  const top = el.getBoundingClientRect().top + window.scrollY - landingNavOffset();
  window.scrollTo({ top: Math.max(0, top), behavior });
  if (window.location.hash !== `#${id}`) {
    history.replaceState(null, "", `#${id}`);
  }
  return true;
}
