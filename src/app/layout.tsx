import type { Viewport } from "next";
import { Inter, Syne } from "next/font/google";
import localFont from "next/font/local";
import { headers } from "next/headers";

import { DEFAULT_LOCALE, isRtlLocale, isValidLocale, type AppLocale } from "@/i18n/config";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const hebrewFont = localFont({
  src: "../../public/fonts/gladiaclm_he.ttf",
  variable: "--font-hebrew",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#08080c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerLocale = (await headers()).get("x-kont-locale");
  const locale: AppLocale = isValidLocale(headerLocale) ? headerLocale : DEFAULT_LOCALE;
  const dir = isRtlLocale(locale) ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${syne.variable} ${hebrewFont.variable} h-full scroll-smooth antialiased`}
    >
      <body className="font-body flex min-h-full flex-col bg-[var(--bg)] text-[var(--fg)]">{children}</body>
    </html>
  );
}
