import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#05070f",
};

export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <div className="relative w-full max-w-none flex-1 bg-transparent">{children}</div>;
}
