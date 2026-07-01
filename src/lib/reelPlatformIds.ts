/** Local mirror of Prisma PlatformKind — no DB dependency in KONT studio shell. */
export enum PlatformKind {
  INSTAGRAM = "INSTAGRAM",
  FACEBOOK = "FACEBOOK",
  TIKTOK = "TIKTOK",
  YOUTUBE = "YOUTUBE",
  PINTEREST = "PINTEREST",
  LINKEDIN = "LINKEDIN",
}

/** Platforms that participate in reel publishing / `/api/platform-accounts`. */
export type ReelPlatformId =
  | "youtube"
  | "tiktok"
  | "instagram"
  | "facebook"
  | "pinterest"
  | "linkedin";

export const REEL_PLATFORM_IDS: readonly ReelPlatformId[] = [
  "youtube",
  "tiktok",
  "instagram",
  "facebook",
  "pinterest",
  "linkedin",
];

export function isReelPlatformId(v: string): v is ReelPlatformId {
  return (REEL_PLATFORM_IDS as readonly string[]).includes(v);
}

export function platformKindToReelPlatformId(platform: PlatformKind): ReelPlatformId | null {
  switch (platform) {
    case PlatformKind.INSTAGRAM:
      return "instagram";
    case PlatformKind.FACEBOOK:
      return "facebook";
    case PlatformKind.TIKTOK:
      return "tiktok";
    case PlatformKind.YOUTUBE:
      return "youtube";
    case PlatformKind.PINTEREST:
      return "pinterest";
    case PlatformKind.LINKEDIN:
      return "linkedin";
    default:
      return null;
  }
}

export function reelPlatformIdToPlatformKind(id: ReelPlatformId): PlatformKind {
  switch (id) {
    case "instagram":
      return PlatformKind.INSTAGRAM;
    case "facebook":
      return PlatformKind.FACEBOOK;
    case "tiktok":
      return PlatformKind.TIKTOK;
    case "youtube":
      return PlatformKind.YOUTUBE;
    case "pinterest":
      return PlatformKind.PINTEREST;
    case "linkedin":
      return PlatformKind.LINKEDIN;
  }
}
