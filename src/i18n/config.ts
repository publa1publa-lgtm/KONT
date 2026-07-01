export const LOCALES = ["en", "he", "ru"] as const;
export type AppLocale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const LOCALE_COOKIE = "CF_LOCALE";

export function isValidLocale(v: unknown): v is AppLocale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function isRtlLocale(locale: AppLocale): boolean {
  return locale === "he";
}

export function intlLocale(locale: AppLocale): string {
  if (locale === "ru") return "ru-RU";
  if (locale === "he") return "he-IL";
  return "en-US";
}
