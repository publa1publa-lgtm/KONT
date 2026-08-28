import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LegalHub } from "@/components/legal/LegalHub";
import { isValidLocale } from "@/i18n/config";
import { loadMessages } from "@/i18n/messages";
import type { LegalDocKind } from "@/lib/legal/catalog";
import { getLegalDocument } from "@/lib/legal/content";

export async function legalMetadata(locale: string, doc: LegalDocKind): Promise<Metadata> {
  if (!isValidLocale(locale)) notFound();
  const messages = loadMessages(locale);
  const document = getLegalDocument(doc);

  return {
    title: `${document.title} — KONT`,
    description: document.summary || messages.legal.metaDescription,
  };
}

export function LegalRoutePage({ doc }: { doc: LegalDocKind }) {
  return <LegalHub doc={doc} />;
}
