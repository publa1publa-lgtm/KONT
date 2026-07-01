import { SECTION_ORDER, SECTIONS, type SectionId } from "./sections";

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

export function isStudioItemId(itemId: string): boolean {
  return getSectionForItem(itemId) !== null;
}

/** Parse `/studio` or `/studio/calendar` (legacy `/studio/manage/calendar` still works). */
export function parseStudioItemFromPathname(pathname: string): string | null {
  const segments = pathname
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean);

  if (segments[0] !== "studio") {
    return null;
  }

  const rest = segments.slice(1);
  if (rest.length === 0) {
    return null;
  }

  const last = rest[rest.length - 1]!;
  if (isStudioItemId(last)) {
    return last;
  }

  return null;
}

/** Grid section from `/studio`, `/studio/manage`, or the item's section while in detail. */
export function parseStudioSectionFromPathname(pathname: string): SectionId {
  const segments = pathname
    .replace(/\/+$/, "")
    .split("/")
    .filter(Boolean);

  if (segments[0] !== "studio") {
    return "create";
  }

  const rest = segments.slice(1);
  if (rest.length === 0) {
    return "create";
  }

  const last = rest[rest.length - 1]!;
  if (isStudioItemId(last)) {
    return getSectionForItem(last) ?? "create";
  }

  if (isSectionId(last)) {
    return last;
  }

  return "create";
}

type StudioHrefOptions = {
  item?: string | null;
  section?: SectionId;
};

/** `/studio` or `/studio/manage` on the grid; `/studio/calendar` when inside a card. */
export function buildStudioHref(options?: string | null | StudioHrefOptions): string {
  const opts: StudioHrefOptions =
    typeof options === "string" || options === null || options === undefined ? { item: options } : options;

  if (opts.item && isStudioItemId(opts.item)) {
    return `/studio/${opts.item}`;
  }

  const section = opts.section ?? "create";
  if (section === "create") {
    return "/studio";
  }

  return `/studio/${section}`;
}
