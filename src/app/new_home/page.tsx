import type { Metadata } from "next";

import { NewHomeLanding } from "@/components/new_home/NewHomeLanding";
import { loadMessages } from "@/i18n/messages";

const messages = loadMessages();

export const metadata: Metadata = {
  title: `${messages.meta.title} — Preview`,
  description: messages.meta.description,
};

export default function NewHomePage() {
  return <NewHomeLanding />;
}
