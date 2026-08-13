import type { AppLocale } from "./config";

import en from "@/messages/en.json";
import he from "@/messages/he.json";
import ru from "@/messages/ru.json";

export type AppMessages = typeof en;

const catalogs: Record<AppLocale, AppMessages> = {
  en,
  ru: ru as AppMessages,
  he: he as AppMessages,
};

export function loadMessages(locale: AppLocale = "en"): AppMessages {
  return catalogs[locale] ?? en;
}
