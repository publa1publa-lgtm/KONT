import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalHub } from "@/components/legal/LegalHub";
import { isValidLocale, type AppLocale } from "@/i18n/config";
import { loadMessages } from "@/i18n/messages";
import { parseLegalSlug } from "@/lib/legal/catalog";
import { getLegalDocument } from "@/lib/legal/content";

type PageProps = {
  params: Promise<{ locale: string; slug?: string[] }>;
};

async function resolve(params: PageProps["params"]) {
  const { locale, slug } = await params;
  if (!isValidLocale(locale)) notFound();
  const parsed = parseLegalSlug(slug);
  if (!parsed) notFound();
  return { locale: locale as AppLocale, ...parsed };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, service, doc } = await resolve(params);
  const messages = loadMessages(locale);
  const document = getLegalDocument(service, doc);

  return {
    title: `${document.title} — KONT`,
    description: document.summary || messages.legal.metaDescription,
  };
}

export default async function TermsPage({ params }: PageProps) {
  const { service, doc } = await resolve(params);
  return <LegalHub service={service} doc={doc} />;
}
