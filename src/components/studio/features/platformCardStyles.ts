import type { CSSProperties } from "react";

/** Shared cool-blue gradient shell (see globals.css `.platform-card-surface`). */
export const PLATFORM_CARD_SURFACE_CLASS = "platform-card-surface";

/** Nested panels / group shells — wrapper-color wash. */
export const PLATFORM_PANEL_SURFACE_CLASS = "platform-panel-surface";

/** Single accent for all platform cards (no warm per-platform washes). */
export const PLATFORM_CARD_ACCENT = "var(--ice)";

/** Multiplier for accent wash layer (0–1). Exported so chips/cards stay in sync. */
export const PLATFORM_CARD_ACCENT_OVERLAY_OPACITY = 0.66;
export const PLATFORM_CHIP_ACCENT_OVERLAY_OPACITY = 0.62;

/** Accent wash — primary hotspot ~top-right quarter of card; soft counter-glow bottom-left. */
export function platformAccentOverlay(accentVar: string = PLATFORM_CARD_ACCENT): CSSProperties {
  return {
    backgroundImage: [
      `radial-gradient(ellipse 74% 58% at 92% 1%, color-mix(in srgb, ${accentVar} 18%, transparent) 0%, transparent 62%)`,
      `radial-gradient(ellipse 68% 52% at -14% 106%, color-mix(in srgb, ${accentVar} 9%, transparent) 0%, transparent 50%)`,
    ].join(", "),
  };
}

export function platformIconTileStyle(accentVar: string = PLATFORM_CARD_ACCENT): CSSProperties {
  return {
    backgroundColor: `color-mix(in srgb, ${accentVar} 11%, #ffffff)`,
    borderColor: `color-mix(in srgb, ${accentVar} 24%, rgba(147, 197, 253, 0.38))`,
  };
}
