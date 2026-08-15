import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { isValidLocale, withLocale } from "@/i18n/config";
import {
  LEGAL_SERVICE_IDS,
  isLegalDocKind,
  isLegalServiceId,
  legalPath,
} from "@/lib/legal/catalog";
import { LegalRoutePage, legalMetadata } from "@/lib/legal/LegalRoutePage";

type PageProps = {
  params: Promise<{ locale: string; service: string; doc: string }>;
};

export function generateStaticParams() {
  return LEGAL_SERVICE_IDS.flatMap((service) =>
    (["terms", "privacy"] as const).map((doc) => ({ service, doc })),
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, service, doc } = await params;
  if (!isLegalServiceId(service) || !isLegalDocKind(doc)) notFound();
  return legalMetadata(locale, service, doc);
}

export default async function ServiceLegalPage({ params }: PageProps) {
  const { locale, service, doc } = await params;
  if (!isValidLocale(locale)) notFound();
  if (!isLegalServiceId(service) || !isLegalDocKind(doc)) notFound();

  const canonical = legalPath(service, doc);
  const current = `/${service}/${doc}`;
  if (canonical !== current) {
    redirect(withLocale(locale, canonical));
  }

  return <LegalRoutePage service={service} doc={doc} />;
}
