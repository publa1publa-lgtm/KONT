import en from "@/messages/en.json";

export type AppMessages = typeof en;

export function loadMessages(): AppMessages {
  return en;
}
