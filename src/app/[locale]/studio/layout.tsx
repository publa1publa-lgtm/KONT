import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { DEFAULT_LOCALE, isValidLocale, withLocale } from "@/i18n/config";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StudioLayout({ children }: { children: ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) {
    const headerLocale = (await headers()).get("x-kont-locale");
    const locale = isValidLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
    redirect(withLocale(locale, "/login"));
  }

  return children;
}
