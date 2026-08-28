import "server-only";

export type OpsTopic = "users" | "demos" | "platforms" | "general";

const TELEGRAM_API = "https://api.telegram.org";

function envValue(raw: string | undefined): string {
  return (raw ?? "").split("#")[0].trim();
}

function botToken(): string {
  return envValue(process.env.KONTME_BOT_TG);
}

function chatId(): string {
  return envValue(process.env.KONTME_TG_CHAT_ID);
}

function topicId(topic: OpsTopic): number | undefined {
  const keys: Record<OpsTopic, string | undefined> = {
    users: process.env.KONTME_TG_TOPIC_USERS,
    demos: process.env.KONTME_TG_TOPIC_DEMOS,
    platforms: process.env.KONTME_TG_TOPIC_PLATFORMS,
    general: process.env.KONTME_TG_TOPIC_GENERAL,
  };
  const n = Number(envValue(keys[topic]));
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function isOpsTelegramConfigured(): boolean {
  return Boolean(botToken() && chatId());
}

export function escapeTelegramHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

export async function sendOpsTelegram(input: {
  text: string;
  topic?: OpsTopic;
  parseMode?: "HTML";
}): Promise<void> {
  const token = botToken();
  const chat = chatId();
  if (!token || !chat) return;

  const body: Record<string, string | number | boolean> = {
    chat_id: chat,
    text: input.text,
    disable_web_page_preview: true,
  };
  if (input.parseMode) body.parse_mode = input.parseMode;

  const thread = topicId(input.topic ?? "general");
  if (thread) body.message_thread_id = thread;

  let res: Response;
  try {
    res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    throw new Error(`Cannot reach api.telegram.org (${cause}). Use a VPN/proxy if Telegram is blocked.`);
  }

  const data = (await res.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!res.ok || !data?.ok) {
    throw new Error(data?.description || `Telegram sendMessage failed (${res.status})`);
  }
}
