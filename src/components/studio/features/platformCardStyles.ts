import type { CSSProperties } from "react";

/** Shared cool-blue gradient shell (see globals.css `.platform-card-surface`). */
export const PLATFORM_CARD_SURFACE_CLASS = "platform-card-surface";

/** Nested panels / group shells — wrapper-color wash. */
export const PLATFORM_PANEL_SURFACE_CLASS = "platform-panel-surface";

/** Fallback accent when a platform brand color is unavailable. */
export const PLATFORM_CARD_ACCENT = "var(--ice)";

/** Multiplier for accent wash layer (0–1). Exported so chips/cards stay in sync. */
export const PLATFORM_CARD_ACCENT_OVERLAY_OPACITY = 0.34;
export const PLATFORM_CHIP_ACCENT_OVERLAY_OPACITY = 0.5;

/** Soft brand tints for icon tiles / selection (not full rainbow cards). */
export const PLATFORM_BRAND_ACCENT: Record<string, string> = {
  youtube: "#FF0033",
  tiktok: "#111111",
  instagram: "#E4405F",
  facebook: "#1877F2",
  pinterest: "#E60023",
  linkedin: "#0A66C2",
  telegram: "#2AABEE",
  discord: "#5865F2",
  email: "#64748B",
  notion: "#37352F",
  googleDrive: "#4285F4",
  googleSheets: "#0F9D58",
  googleCalendar: "#4285F4",
  dropbox: "#0061FF",
};

export function platformBrandAccent(platformId: string): string {
  return PLATFORM_BRAND_ACCENT[platformId] ?? PLATFORM_CARD_ACCENT;
}

/** Accent color per integration group — used for catalog tile borders. */
export const PLATFORM_GROUP_ACCENT: Record<string, string> = {
  social: "#00E5FF",
  messengers: "#1DA1F2",
  productivity: "#8B5CF6",
  storage: "#2563EB",
  notifications: "#F59E0B",
};

export function platformGroupAccent(groupId: string): string {
  return PLATFORM_GROUP_ACCENT[groupId] ?? PLATFORM_CARD_ACCENT;
}

/** Accent wash — primary hotspot ~top-right quarter of card; soft counter-glow bottom-left. */
export function platformAccentOverlay(accentVar: string = PLATFORM_CARD_ACCENT): CSSProperties {
  return {
    backgroundImage: [
      `radial-gradient(ellipse 74% 58% at 92% 1%, color-mix(in srgb, ${accentVar} 10%, transparent) 0%, transparent 62%)`,
      `radial-gradient(ellipse 68% 52% at -14% 106%, color-mix(in srgb, ${accentVar} 5%, transparent) 0%, transparent 50%)`,
    ].join(", "),
  };
}

export function platformIconTileStyle(accentVar: string = PLATFORM_CARD_ACCENT): CSSProperties {
  return {
    backgroundColor: `color-mix(in srgb, ${accentVar} 14%, #ffffff)`,
    borderColor: `color-mix(in srgb, ${accentVar} 28%, rgba(147, 197, 253, 0.32))`,
    color: accentVar,
  };
}
