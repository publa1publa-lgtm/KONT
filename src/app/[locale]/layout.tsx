import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LocaleDocument } from "@/components/i18n/LocaleDocument";
import { AuthModal } from "@/components/auth/AuthModal";
import { RequestDemoModal } from "@/components/layout/RequestDemoModal";
import { AuthModalProvider } from "@/contexts/auth-modal-context";
import { DemoModalProvider } from "@/contexts/demo-modal-context";
import { MessagesProvider } from "@/contexts/messages-context";
import { LOCALES, isValidLocale, type AppLocale } from "@/i18n/config";
import { loadMessages } from "@/i18n/messages";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

async function resolveLocale(params: Promise<{ locale: string }>): Promise<AppLocale> {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  return locale;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const messages = loadMessages(locale);

  return {
    title: messages.meta.title,
    description: messages.meta.description,
    icons: {
      icon: [{ url: "/brand/kont-logo.svg", type: "image/svg+xml" }],
      apple: "/brand/kont-logo.svg",
    },
    openGraph: {
      title: messages.meta.title,
      description: messages.meta.description,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const locale = await resolveLocale(params);
  const messages = loadMessages(locale);

  return (
    <MessagesProvider locale={locale} messages={messages}>
      <LocaleDocument />
      <DemoModalProvider>
        <AuthModalProvider>
          <div className="grain" aria-hidden />
          <div className="relative z-10 flex min-h-full flex-col">{children}</div>
          <RequestDemoModal />
          <AuthModal />
        </AuthModalProvider>
      </DemoModalProvider>
    </MessagesProvider>
  );
}
