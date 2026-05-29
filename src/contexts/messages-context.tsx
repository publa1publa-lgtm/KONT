"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { AppMessages } from "@/i18n/messages";

const MessagesContext = createContext<AppMessages | null>(null);

export function MessagesProvider({
  messages,
  children,
}: {
  messages: AppMessages;
  children: ReactNode;
}) {
  return (
    <MessagesContext.Provider value={messages}>{children}</MessagesContext.Provider>
  );
}

export function useMessages(): AppMessages {
  const ctx = useContext(MessagesContext);
  if (!ctx) {
    throw new Error("useMessages must be used within MessagesProvider");
  }
  return ctx;
}
