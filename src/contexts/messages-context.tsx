"use client";

import type { ReactNode } from "react";

import { I18nProvider } from "@/contexts/i18n-context";
import type { AppLocale } from "@/i18n/config";
import type { AppMessages } from "@/i18n/messages";

/** @deprecated Use I18nProvider directly. Kept for gradual migration. */
export function MessagesProvider({
  locale,
  messages,
  children,
}: {
  locale: AppLocale;
  messages: AppMessages;
  children: ReactNode;
}) {
  return (
    <I18nProvider locale={locale} messages={messages}>
      {children}
    </I18nProvider>
  );
}

export { useMessages } from "@/contexts/i18n-context";
