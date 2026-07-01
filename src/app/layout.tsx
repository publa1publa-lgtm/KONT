import type { Metadata, Viewport } from "next";
import { Inter, Syne } from "next/font/google";

import { DemoModalProvider } from "@/contexts/demo-modal-context";
import { MessagesProvider } from "@/contexts/messages-context";
import { loadMessages } from "@/i18n/messages";
import { RequestDemoModal } from "@/components/layout/RequestDemoModal";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const messages = loadMessages();

export const viewport: Viewport = {
  themeColor: "#08080c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${syne.variable} h-full scroll-smooth antialiased`}
    >
      <body className="font-body flex min-h-full flex-col bg-[var(--bg)] text-[var(--fg)]">
        <MessagesProvider messages={messages}>
          <DemoModalProvider>
            <div className="grain" aria-hidden />
            <div className="relative z-10 flex min-h-full flex-col">{children}</div>
            <RequestDemoModal />
          </DemoModalProvider>
        </MessagesProvider>
      </body>
    </html>
  );
}
