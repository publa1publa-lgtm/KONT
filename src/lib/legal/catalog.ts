export const LEGAL_UPDATED_AT = "August 27, 2026";

export type LegalDocKind = "terms" | "privacy";

/** Old per-platform URLs redirect to the single KONT legal pages. */
export const LEGAL_LEGACY_SLUGS = [
  "kont",
  "meta",
  "google",
  "tiktok",
  "youtube",
  "facebook",
  "instagram",
  "pinterest",
  "linkedin",
  "telegram",
  "discord",
  "drive",
  "google-drive",
] as const;

export function isLegalDocKind(value: string | undefined): value is LegalDocKind {
  return value === "terms" || value === "privacy";
}

export function isLegalLegacySlug(value: string | undefined): boolean {
  return Boolean(value && (LEGAL_LEGACY_SLUGS as readonly string[]).includes(value));
}

export function legalPath(doc: LegalDocKind = "terms"): string {
  return doc === "privacy" ? "/privacy-policy" : "/terms";
}

export function parseLegalSlug(slug?: string[]): { doc: LegalDocKind } | null {
  const [first, second] = slug ?? [];
  if (!first) return { doc: "terms" };
  if (first === "privacy" && !second) return { doc: "privacy" };
  if (isLegalDocKind(first) && !second) return { doc: first };
  if (isLegalLegacySlug(first) && isLegalDocKind(second)) return { doc: second };
  if (isLegalLegacySlug(first) && !second) return { doc: "terms" };
  return null;
}

export function parseLegalPathname(pathname: string): { doc: LegalDocKind } | null {
  const parts = pathname.split("/").filter(Boolean);
  const segs = parts[0] === "en" || parts[0] === "he" || parts[0] === "ru" ? parts.slice(1) : parts;
  if (segs[0] === "privacy-policy") return { doc: "privacy" };
  if (segs[0] === "terms") return parseLegalSlug(segs.slice(1));
  if (isLegalLegacySlug(segs[0]) && isLegalDocKind(segs[1])) return { doc: segs[1] };
  if (isLegalLegacySlug(segs[0]) && !segs[1]) return { doc: "terms" };
  return null;
}
