import { SECTION_ORDER, SECTIONS, type SectionId } from "./sections";
import { DEFAULT_LOCALE, localeFromPathname, stripLocalePrefix, withLocale, type AppLocale } from "@/i18n/config";

const SECTION_SET = new Set<string>(SECTION_ORDER);

export function isSectionId(value: string): value is SectionId {
  return SECTION_SET.has(value);
}

export function getSectionForItem(itemId: string): SectionId | null {
  for (const sectionId of SECTION_ORDER) {
    if (SECTIONS[sectionId].items.some((item) => item.id === itemId)) {
      return sectionId;
    }
  }
  return null;
}

/** Legacy tile ids → current Manage tiles. */
const STUDIO_ITEM_ALIASES: Record<string, string> = {
  drafts: "media",
  archive: "events",
};

export function resolveStudioItemId(itemId: string): string {
  return STUDIO_ITEM_ALIASES[itemId] ?? itemId;
}

export function isStudioItemId(itemId: string): boolean {
  return getSectionForItem(resolveStudioItemId(itemId)) !== null;
}

function studioSegments(pathname: string): string[] {
  const bare = stripLocalePrefix(pathname);
  return bare.replace(/\/+$/, "").split("/").filter(Boolean);
}

/** Parse `/[locale]/studio` or `/[locale]/studio/calendar`. */
export function parseStudioItemFromPathname(pathname: string): string | null {
  const segments = studioSegments(pathname);

  if (segments[0] !== "studio") {
    return null;
  }

  const rest = segments.slice(1);
  if (rest.length === 0) {
    return null;
  }

  const last = rest[rest.length - 1]!;
  if (isStudioItemId(last)) {
    return resolveStudioItemId(last);
  }

  return null;
}

/** Grid section from studio path (locale-aware). */
export function parseStudioSectionFromPathname(pathname: string): SectionId {
  const segments = studioSegments(pathname);

  if (segments[0] !== "studio") {
    return "create";
  }

  const rest = segments.slice(1);
  if (rest.length === 0) {
    return "create";
  }

  const last = rest[rest.length - 1]!;
  if (isStudioItemId(last)) {
    return getSectionForItem(resolveStudioItemId(last)) ?? "create";
  }

  if (isSectionId(last)) {
    return last;
  }

  return "create";
}

type StudioHrefOptions = {
  item?: string | null;
  section?: SectionId;
  locale?: AppLocale;
  /** Current pathname — used to keep the active locale in links. */
  pathname?: string;
};

function resolveLocale(opts: StudioHrefOptions): AppLocale {
  if (opts.locale) return opts.locale;
  if (opts.pathname) return localeFromPathname(opts.pathname) ?? DEFAULT_LOCALE;
  return DEFAULT_LOCALE;
}

/** `/en/studio` or `/en/studio/calendar` when inside a card. */
export function buildStudioHref(options?: string | null | StudioHrefOptions): string {
  const opts: StudioHrefOptions =
    typeof options === "string" || options === null || options === undefined ? { item: options } : options;

  const locale = resolveLocale(opts);
  let path = "/studio";

  if (opts.item && isStudioItemId(opts.item)) {
    path = `/studio/${resolveStudioItemId(opts.item)}`;
  } else {
    const section = opts.section ?? "create";
    if (section !== "create") {
      path = `/studio/${section}`;
    }
  }

  return withLocale(locale, path);
}
