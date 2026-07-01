import type { Metadata } from "next";

import { StudioShell } from "@/components/studio/StudioShell";
import { loadMessages } from "@/i18n/messages";

const messages = loadMessages();

export const metadata: Metadata = {
  title: messages.studio.metaTitle,
  description: messages.studio.metaDescription,
};

export default function StudioPage() {
  return <StudioShell />;
}
