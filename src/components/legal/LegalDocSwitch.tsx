"use client";

import Link from "next/link";

import { useI18n } from "@/contexts/i18n-context";
import { withLocale } from "@/i18n/config";
import { legalPath, type LegalDocKind } from "@/lib/legal/catalog";

type LegalDocSwitchProps = {
  doc: LegalDocKind;
};

export function LegalDocSwitch({ doc }: LegalDocSwitchProps) {
  const { locale, messages } = useI18n();
  const copy = messages.legal;

  return (
    <nav className="legal-switch" aria-label={copy.documents}>
      <Link
        href={withLocale(locale, legalPath("terms"))}
        className={doc === "terms" ? "legal-switch__opt is-active" : "legal-switch__opt"}
        aria-current={doc === "terms" ? "page" : undefined}
      >
        {copy.termsTitle}
      </Link>
      <Link
        href={withLocale(locale, legalPath("privacy"))}
        className={doc === "privacy" ? "legal-switch__opt is-active" : "legal-switch__opt"}
        aria-current={doc === "privacy" ? "page" : undefined}
      >
        {copy.privacyTitle}
      </Link>
    </nav>
  );
}
