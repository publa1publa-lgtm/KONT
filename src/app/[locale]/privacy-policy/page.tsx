import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalHub } from "@/components/legal/LegalHub";
import { isValidLocale } from "@/i18n/config";
import { loadMessages } from "@/i18n/messages";
import { getLegalDocument } from "@/lib/legal/content";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const messages = loadMessages(locale);
  const document = getLegalDocument("privacy");

  return {
    title: `${document.title} — KONT`,
    description: document.summary || messages.legal.metaDescription,
  };
}

export default function PrivacyPolicyPage() {
  return <LegalHub doc="privacy" />;
}
