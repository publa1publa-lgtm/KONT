"use client";

import { useI18n } from "@/contexts/i18n-context";
import { withLocale } from "@/i18n/config";

export function authPathWithNext(base: "/login" | "/register", next?: string | null): string {
  // Prefer locale from provider when available — this helper is client-only via forms.
  return base;
}

export function useAuthPath() {
  const { locale } = useI18n();
  return {
    login: (next?: string | null) => {
      const path = withLocale(locale, "/login");
      return next ? `${path}?next=${encodeURIComponent(next)}` : path;
    },
    register: (next?: string | null) => {
      const path = withLocale(locale, "/register");
      return next ? `${path}?next=${encodeURIComponent(next)}` : path;
    },
  };
}
