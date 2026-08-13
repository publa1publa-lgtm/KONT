import type { AppLocale } from "@/i18n/config";
import { isRtlLocale } from "@/i18n/config";

export type StudioTheme = "light" | "dark";
export type StudioLocale = AppLocale;

const THEME_KEY = "kont-studio-theme";
const LOCALE_KEY = "kont-locale";

export function readStudioTheme(): StudioTheme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function writeStudioTheme(theme: StudioTheme) {
  window.localStorage.setItem(THEME_KEY, theme);
  applyStudioTheme(theme);
}

export function applyStudioTheme(theme: StudioTheme) {
  const root = document.documentElement;
  root.classList.toggle("theme-studio-light", theme === "light");
  root.dataset.studioTheme = theme;
}

export function readStudioLocale(): StudioLocale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LOCALE_KEY);
  if (stored === "ru" || stored === "he" || stored === "en") return stored;
  return "en";
}

export function applyDocumentLocale(locale: StudioLocale) {
  const root = document.documentElement;
  root.lang = locale;
  root.dir = isRtlLocale(locale) ? "rtl" : "ltr";
  // Gladiaclm only in Studio — never replace marketing typography.
  const onStudio = root.classList.contains("studio-route-active");
  root.classList.toggle("font-hebrew", locale === "he" && onStudio);
}

export function writeStudioLocale(locale: StudioLocale) {
  window.localStorage.setItem(LOCALE_KEY, locale);
  applyDocumentLocale(locale);
}
