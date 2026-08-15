import { notFound, redirect } from "next/navigation";

import { isValidLocale, withLocale } from "@/i18n/config";
import { isLegalServiceId, legalPath } from "@/lib/legal/catalog";

type PageProps = {
  params: Promise<{ locale: string; service: string }>;
};

export default async function ServiceLegalIndexPage({ params }: PageProps) {
  const { locale, service } = await params;
  if (!isValidLocale(locale) || !isLegalServiceId(service)) notFound();
  redirect(withLocale(locale, legalPath(service, "terms")));
}
