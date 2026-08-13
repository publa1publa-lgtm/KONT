"use client";

import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";
import { KontBrandLogo } from "@/components/brand/KontBrandLogo";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useI18n } from "@/contexts/i18n-context";
import { withLocale } from "@/i18n/config";

export default function LoginPage() {
  const { openRegister } = useAuthModal();
  const { locale } = useI18n();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <Link
        href={withLocale(locale, "/")}
        className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition hover:text-[var(--fg)]"
      >
        <KontBrandLogo decorative className="h-7 w-auto" />
      </Link>
      <div className="mx-auto flex w-full max-w-md flex-col">
        <LoginForm onRequestRegister={openRegister} />
      </div>
    </div>
  );
}
