export const LEGAL_UPDATED_AT = "August 15, 2026";

export const LEGAL_SERVICE_IDS = [
  "kont",
  "tiktok",
  "instagram",
  "youtube",
  "facebook",
  "pinterest",
  "linkedin",
  "telegram",
  "discord",
] as const;

export type LegalServiceId = (typeof LEGAL_SERVICE_IDS)[number];
export type LegalDocKind = "terms" | "privacy";

export type LegalService = {
  id: LegalServiceId;
  name: string;
  short: string;
  icon: LegalServiceId;
};

export const LEGAL_SERVICES: readonly LegalService[] = [
  { id: "kont", name: "KONT", short: "Platform", icon: "kont" },
  { id: "tiktok", name: "TikTok", short: "Publish & analytics", icon: "tiktok" },
  { id: "instagram", name: "Instagram", short: "Reels & comments", icon: "instagram" },
  { id: "youtube", name: "YouTube", short: "Upload & manage", icon: "youtube" },
  { id: "facebook", name: "Facebook", short: "Pages & insights", icon: "facebook" },
  { id: "pinterest", name: "Pinterest", short: "Pins & boards", icon: "pinterest" },
  { id: "linkedin", name: "LinkedIn", short: "Member & pages", icon: "linkedin" },
  { id: "telegram", name: "Telegram", short: "Bots & inbox", icon: "telegram" },
  { id: "discord", name: "Discord", short: "Channel posts", icon: "discord" },
];

export function isLegalServiceId(value: string | undefined): value is LegalServiceId {
  return Boolean(value && (LEGAL_SERVICE_IDS as readonly string[]).includes(value));
}

export function isLegalDocKind(value: string | undefined): value is LegalDocKind {
  return value === "terms" || value === "privacy";
}

export function legalServiceById(id: LegalServiceId): LegalService {
  return LEGAL_SERVICES.find((service) => service.id === id) ?? LEGAL_SERVICES[0];
}

export function legalPath(service: LegalServiceId, doc: LegalDocKind = "terms"): string {
  if (service === "kont" && doc === "privacy") return "/privacy-policy";
  if (service === "kont" && doc === "terms") return "/terms";
  return `/${service}/${doc}`;
}

export function parseLegalSlug(
  slug?: string[],
): { service: LegalServiceId; doc: LegalDocKind } | null {
  const [first, second] = slug ?? [];
  if (!first) return { service: "kont", doc: "terms" };
  if (first === "privacy" && !second) return { service: "kont", doc: "privacy" };
  if (!isLegalServiceId(first)) return null;
  if (!second) return { service: first, doc: "terms" };
  if (isLegalDocKind(second)) return { service: first, doc: second };
  return null;
}

export function parseLegalPathname(
  pathname: string,
): { service: LegalServiceId; doc: LegalDocKind } | null {
  const parts = pathname.split("/").filter(Boolean);
  const segs = parts[0] === "en" || parts[0] === "he" || parts[0] === "ru" ? parts.slice(1) : parts;
  if (segs[0] === "privacy-policy") return { service: "kont", doc: "privacy" };
  if (segs[0] === "terms") return parseLegalSlug(segs.slice(1));
  if (isLegalServiceId(segs[0]) && isLegalDocKind(segs[1])) {
    return { service: segs[0], doc: segs[1] };
  }
  if (isLegalServiceId(segs[0]) && !segs[1]) return { service: segs[0], doc: "terms" };
  return null;
}
