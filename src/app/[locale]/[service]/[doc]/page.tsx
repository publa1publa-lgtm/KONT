import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isValidLocale, withLocale } from "@/i18n/config";
import {
  LEGAL_LEGACY_SLUGS,
  isLegalDocKind,
  isLegalLegacySlug,
  legalPath,
} from "@/lib/legal/catalog";
import { legalMetadata } from "@/lib/legal/LegalRoutePage";

type PageProps = {
  params: Promise<{ locale: string; service: string; doc: string }>;
};

export function generateStaticParams() {
  return LEGAL_LEGACY_SLUGS.flatMap((service) =>
    (["terms", "privacy"] as const).map((doc) => ({ service, doc })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, service, doc } = await params;
  if (!isLegalLegacySlug(service) || !isLegalDocKind(doc)) notFound();
  return legalMetadata(locale, doc);
}

export default async function ServiceLegalPage({ params }: PageProps) {
  const { locale, service, doc } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!isLegalLegacySlug(service) || !isLegalDocKind(doc)) notFound();
  redirect(withLocale(locale, legalPath(doc)));
}
