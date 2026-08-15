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
  if (doc === "privacy") return `/terms/${service}/privacy`;
  return `/terms/${service}`;
}

export function parseLegalSlug(
  slug?: string[],
): { service: LegalServiceId; doc: LegalDocKind } | null {
  const [first, second] = slug ?? [];
  if (!first) return { service: "kont", doc: "terms" };
  if (first === "privacy" && !second) return { service: "kont", doc: "privacy" };
  if (!isLegalServiceId(first)) return null;
  if (!second) return { service: first, doc: "terms" };
  if (second === "privacy") return { service: first, doc: "privacy" };
  return null;
}
