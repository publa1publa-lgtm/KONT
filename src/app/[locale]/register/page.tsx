"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { RegisterForm } from "@/components/auth/RegisterForm";
import { KontBrandLogo } from "@/components/brand/KontBrandLogo";
import { useAuthModal } from "@/contexts/auth-modal-context";
import { useI18n } from "@/contexts/i18n-context";
import { useMessages } from "@/contexts/messages-context";
import { withLocale } from "@/i18n/config";

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { locale } = useI18n();
  const { openLogin } = useAuthModal();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:py-16">
      <Link href={withLocale(locale, "/")} className="absolute top-6 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 text-sm text-[var(--muted)] transition hover:text-[var(--fg)]">
        <KontBrandLogo decorative className="h-7 w-auto" />
      </Link>
      <div className="relative mx-auto flex w-full max-w-lg flex-col">
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[min(100%,28rem)] -translate-x-1/2 rounded-full bg-[var(--ice)]/10 blur-[80px]"
          aria-hidden
        />
        <div className="relative rounded-[1.75rem] border border-[rgba(0,113,227,0.14)] bg-white/95 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.98),0_32px_96px_-48px_rgba(8,16,46,0.32)] backdrop-blur-2xl sm:p-8">
          <RegisterForm showHeader next={next} onRequestSignIn={openLogin} />
        </div>
      </div>
    </div>
  );
}

function RegisterLoading() {
  const { common } = useMessages();
  return (
    <div className="flex min-h-dvh items-center justify-center py-16 text-sm text-[var(--muted)]">
      {common.loading.register}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterLoading />}>
      <RegisterPageContent />
    </Suspense>
  );
}
