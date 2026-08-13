"use client";

import { useEffect } from "react";

import { useI18n } from "@/contexts/i18n-context";
import { applyDocumentLocale, writeStudioLocale } from "@/lib/studio/preferences";

/** Keeps document lang/dir in sync after client-side locale switches. */
export function LocaleDocument() {
  const { locale } = useI18n();

  useEffect(() => {
    applyDocumentLocale(locale);
    writeStudioLocale(locale);
  }, [locale]);

  return null;
}
