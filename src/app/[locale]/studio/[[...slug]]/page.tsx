import type { Metadata } from "next";

import { StudioShell } from "@/components/studio/StudioShell";
import { loadMessages } from "@/i18n/messages";
import { getServerLocale } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const messages = loadMessages(locale);

  return {
    title: messages.studio.metaTitle,
    description: messages.studio.metaDescription,
  };
}

export default function StudioPage() {
  return <StudioShell />;
}
