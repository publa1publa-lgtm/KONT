/** Preset swatches + free hex for plan events. Stored value is always `#rrggbb`. */

export const DEFAULT_EVENT_COLOR = "#f59e0b";

/** Quick picks shown in the composer. */
export const EVENT_COLOR_PRESETS = [
  "#f59e0b",
  "#0ea5e9",
  "#10b981",
  "#f43f5e",
  "#14b8a6",
  "#ea580c",
  "#64748b",
  "#fb7185",
  "#eab308",
  "#6366f1",
  "#06b6d4",
  "#84cc16",
] as const;

/** Legacy named ids from the first color rollout → hex. */
const LEGACY_EVENT_COLORS: Record<string, string> = {
  amber: "#f59e0b",
  sky: "#0ea5e9",
  emerald: "#10b981",
  rose: "#f43f5e",
  teal: "#14b8a6",
  orange: "#ea580c",
  slate: "#64748b",
  coral: "#fb7185",
};

function expandShortHex(hex: string): string {
  // #abc → #aabbcc
  const h = hex.slice(1);
  if (h.length === 3) {
    return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
  }
  return hex;
}

export function isHexColor(value: unknown): value is `#${string}` {
  return typeof value === "string" && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

/** Normalize any stored/input color to `#rrggbb` (lowercase). */
export function normalizeEventColor(value: unknown): string {
  if (typeof value !== "string") return DEFAULT_EVENT_COLOR;
  const raw = value.trim();
  if (!raw) return DEFAULT_EVENT_COLOR;

  const legacy = LEGACY_EVENT_COLORS[raw.toLowerCase()];
  if (legacy) return legacy;

  if (isHexColor(raw)) {
    return expandShortHex(raw).toLowerCase();
  }

  // Accept rrggbb without #
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(raw)) return expandShortHex(`#${raw}`).toLowerCase();

  return DEFAULT_EVENT_COLOR;
}

export function hexToRgbChannels(hex: string): `${number}, ${number}, ${number}` {
  const h = normalizeEventColor(hex).slice(1);
  const r = Number.parseInt(h.slice(0, 2), 16);
  const g = Number.parseInt(h.slice(2, 4), 16);
  const b = Number.parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

export function eventColorStyle(color: string | null | undefined): {
  ["--event-accent"]: string;
  ["--event-accent-rgb"]: string;
} {
  const hex = normalizeEventColor(color);
  return {
    "--event-accent": hex,
    "--event-accent-rgb": hexToRgbChannels(hex),
  };
}

export function colorsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  return normalizeEventColor(a) === normalizeEventColor(b);
}
