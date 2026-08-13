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

/** Strip leading `/{locale}` from a pathname. */
export function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split("/");
  if (parts.length >= 2 && isValidLocale(parts[1])) {
    const rest = parts.slice(2).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname || "/";
}

/** Read locale from `/{locale}/...` path. */
export function localeFromPathname(pathname: string): AppLocale | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  return isValidLocale(seg) ? seg : null;
}

/** Prefix an in-app path with locale (`/studio` → `/en/studio`). */
export function withLocale(locale: AppLocale, path = "/"): string {
  const normalized = !path || path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${normalized}`;
}

/** Swap locale segment in the current pathname. */
export function replaceLocaleInPath(pathname: string, next: AppLocale): string {
  const bare = stripLocalePrefix(pathname);
  return withLocale(next, bare === "/" ? "/" : bare);
}
