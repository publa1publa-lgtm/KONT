import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isValidLocale, withLocale, type AppLocale } from "@/i18n/config";
import { legalPath, parseLegalSlug } from "@/lib/legal/catalog";
import { LegalRoutePage, legalMetadata } from "@/lib/legal/LegalRoutePage";

type PageProps = {
  params: Promise<{ locale: string; slug?: string[] }>;
};

async function resolve(params: PageProps["params"]) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();
  const parsed = parseLegalSlug(slug);
  if (!parsed) notFound();
  return { locale: locale as AppLocale, slug, ...parsed };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, doc } = await resolve(params);
  return legalMetadata(locale, doc);
}

export default async function TermsPage({ params }: PageProps) {
  const { locale, slug, doc } = await resolve(params);
  const canonical = legalPath(doc);
  const current = slug?.length ? `/terms/${slug.join("/")}` : "/terms";
  if (canonical !== current) {
    redirect(withLocale(locale, canonical));
  }
  return <LegalRoutePage doc={doc} />;
}
