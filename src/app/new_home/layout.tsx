import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0066ff",
};

export const metadata: Metadata = {
  icons: {
    icon: [{ url: "/brand/kont-logo.svg", type: "image/svg+xml" }],
    apple: "/brand/kont-logo.svg",
  },
};

export default function NewHomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="relative w-full max-w-none flex-1 bg-transparent">{children}</div>;
}
