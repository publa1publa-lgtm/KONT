import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { sessionCookieOptions } from "@/lib/auth";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isValidLocale, withLocale } from "@/i18n/config";
import { safeStudioRedirect } from "@/lib/safeRedirectPath";

export async function establishSessionAndRedirect(
  sessionToken: string,
  formData: FormData,
): Promise<never> {
  const { name, options } = sessionCookieOptions();
  (await cookies()).set(name, sessionToken, options);

  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isValidLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const nextRaw = safeStudioRedirect(String(formData.get("next") ?? ""));
  const next = nextRaw ? withLocale(locale, nextRaw) : withLocale(locale, "/studio");
  redirect(next);
  throw new Error("Unreachable");
}
