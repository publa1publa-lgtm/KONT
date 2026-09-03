import "server-only";

import { escapeTelegramHtml, isOpsTelegramConfigured, sendOpsTelegram } from "./telegram";

function line(value: string | undefined): string {
  const text = value?.trim() ?? "";
  return text ? escapeTelegramHtml(text) : "—";
}

function formatCreatedAt(value?: Date | string): string {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return line(undefined);
  return (
    new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
    }).format(date) + " UTC"
  );
}

export async function notifyUserRegistered(input: {
  id: string;
  email: string;
  login: string;
  firstName?: string;
  lastName?: string;
  createdAt?: Date | string;
}): Promise<void> {
  if (!isOpsTelegramConfigured()) return;

  const text = [
    `<b>${line(input.firstName)}</b>`,
    `<b>${line(input.lastName)}</b>`,
    "—",
    `<code>${line(input.login)}</code>`,
    line(input.email),
    "—",
    `<i>${formatCreatedAt(input.createdAt)}</i>`,
  ].join("\n");

  try {
    await sendOpsTelegram({ topic: "users", parseMode: "HTML", text });
  } catch (err) {
    console.error("[ops/telegram] user.registered", err);
  }
}

export async function notifyUserLogin(input: {
  id: string;
  email: string;
  login?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): Promise<void> {
  if (!isOpsTelegramConfigured()) return;

  const text = [
    `<b>Login</b>`,
    `<b>${line(input.firstName ?? undefined)}</b>`,
    `<b>${line(input.lastName ?? undefined)}</b>`,
    "—",
    `<code>${line(input.login ?? undefined)}</code>`,
    line(input.email),
    "—",
    `<i>${formatCreatedAt()}</i>`,
  ].join("\n");

  try {
    await sendOpsTelegram({ topic: "users", parseMode: "HTML", text });
  } catch (err) {
    console.error("[ops/telegram] user.login", err);
  }
}

export async function notifyDemoRequested(input: { email: string; locale: string }): Promise<void> {
  if (!isOpsTelegramConfigured()) return;

  const text = [
    `<b>Demo request</b>`,
    escapeTelegramHtml(input.email),
    `Locale: ${escapeTelegramHtml(input.locale)}`,
    `<i>${formatCreatedAt()}</i>`,
  ].join("\n");

  try {
    await sendOpsTelegram({ topic: "demos", parseMode: "HTML", text });
  } catch (err) {
    console.error("[ops/telegram] demo.requested", err);
  }
}
