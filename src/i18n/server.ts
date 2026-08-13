import { cookies } from "next/headers";

import { DEFAULT_LOCALE, LOCALE_COOKIE, isValidLocale, type AppLocale } from "./config";

export async function getServerLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isValidLocale(value)) return value;
  return DEFAULT_LOCALE;
}
