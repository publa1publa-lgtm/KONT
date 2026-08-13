"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import type { AppLocale } from "@/i18n/config";
import { replaceLocaleInPath } from "@/i18n/config";
import type { AppMessages } from "@/i18n/messages";
import { applyDocumentLocale, writeStudioLocale } from "@/lib/studio/preferences";

type I18nContextValue = {
  locale: AppLocale;
  messages: AppMessages;
  setLocale: (locale: AppLocale) => Promise<void>;
  t: (path: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function readPath(messages: AppMessages, path: string): string | undefined {
  const parts = path.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function I18nProvider({
  locale,
  messages,
  children,
}: {
  locale: AppLocale;
  messages: AppMessages;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const t = useMemo(
    () =>
      function t(path: string): string {
        return readPath(messages, path) ?? path;
      },
    [messages],
  );

  const setLocale = useCallback(
    async (next: AppLocale) => {
      applyDocumentLocale(next);
      writeStudioLocale(next);
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale: next }),
      });
      const nextPath = replaceLocaleInPath(pathname || "/", next);
      router.push(nextPath);
      router.refresh();
    },
    [pathname, router],
  );

  const value = useMemo(() => ({ locale, messages, setLocale, t }), [locale, messages, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

/** Shorthand for components that only need the message tree. */
export function useMessages(): AppMessages {
  return useI18n().messages;
}
