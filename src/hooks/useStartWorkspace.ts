"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import { useAuthModal } from "@/contexts/auth-modal-context";
import { useI18n } from "@/contexts/i18n-context";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { withLocale } from "@/i18n/config";

export function useStartWorkspace() {
  const router = useRouter();
  const { locale } = useI18n();
  const { isAuthenticated, loading } = useCurrentUser();
  const { openRegister } = useAuthModal();
  const studioHref = withLocale(locale, "/studio");

  const start = useCallback(() => {
    if (isAuthenticated) router.push(studioHref);
    else openRegister();
  }, [isAuthenticated, openRegister, router, studioHref]);

  return { start, isAuthenticated, loading, studioHref };
}
