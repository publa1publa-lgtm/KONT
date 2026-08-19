import { PlatformKind } from "@prisma/client";

import { json, badRequest, readJsonRecord, tooManyRequests } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import { clientKeyFromRequest, rateLimit } from "@/lib/api/rateLimit";
import { findAccountForUserPlatform, savePlatformTokens, wipePlatformTokens } from "@/lib/oauth/tokenVault";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TelegramGetMeResponse = {
  ok: boolean;
  result?: {
    id: number;
    username?: string;
    first_name?: string;
  };
  description?: string;
};

type TelegramGetChatResponse = {
  ok: boolean;
  result?: {
    id: number | string;
    title?: string;
    username?: string;
    first_name?: string;
  };
  description?: string;
};

function telegramApiUrl(botToken: string, method: string): string {
  return `https://api.telegram.org/bot${botToken}/${method}`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function GET() {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const row = await findAccountForUserPlatform(userId, PlatformKind.TELEGRAM);
  if (!row || row.status !== "CONNECTED" || row.revokedAt || row.deletedAt) {
    return json({ connected: false });
  }

  const meta = row.providerMetadata && typeof row.providerMetadata === "object" ? row.providerMetadata : {};
  const chatId = typeof (meta as { chatId?: unknown }).chatId === "string" ? (meta as { chatId: string }).chatId : null;

  return json({
    connected: true,
    handle: row.handle || "Telegram Bot",
    chatId,
    granted: row.scopes,
  });
}

export async function POST(req: Request) {
  const rl = await rateLimit(clientKeyFromRequest(req, "telegram:connect"), { limit: 10, windowMs: 15 * 60_000 });
  if (!rl.ok) return tooManyRequests(rl.retryAfterSec);

  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  const body = await readJsonRecord(req);
  if (!body) return badRequest("Invalid request body.");

  const botToken = isNonEmptyString(body.botToken) ? body.botToken.trim() : "";
  const chatId = isNonEmptyString(body.chatId) ? body.chatId.trim() : "";
  const grantedPermissionIds = Array.isArray(body.grantedPermissionIds)
    ? body.grantedPermissionIds.filter((value): value is string => typeof value === "string")
    : [];

  if (!botToken) return badRequest("Telegram bot token is required.");

  const meRes = await fetch(telegramApiUrl(botToken, "getMe"), { cache: "no-store" });
  const me = (await meRes.json().catch(() => null)) as TelegramGetMeResponse | null;
  if (!meRes.ok || !me?.ok || !me.result) {
    return badRequest(me?.description || "Telegram bot token is invalid.");
  }

  let chatMeta: { id: string; label: string | null } | null = null;
  if (chatId) {
    const chatRes = await fetch(telegramApiUrl(botToken, `getChat?chat_id=${encodeURIComponent(chatId)}`), {
      cache: "no-store",
    });
    const chat = (await chatRes.json().catch(() => null)) as TelegramGetChatResponse | null;
    if (!chatRes.ok || !chat?.ok || !chat.result) {
      return badRequest(chat?.description || "Telegram chat could not be verified.");
    }
    chatMeta = {
      id: String(chat.result.id),
      label: chat.result.title || chat.result.username || chat.result.first_name || null,
    };
  }

  const handle = me.result.username ? `@${me.result.username}` : me.result.first_name || "Telegram Bot";

  await savePlatformTokens({
    userId,
    platform: PlatformKind.TELEGRAM,
    platformUserId: `bot:${me.result.id}`,
    handle,
    scopes: grantedPermissionIds,
    accessToken: botToken,
    refreshToken: null,
    tokenExpiresAt: new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000),
    providerMetadata: {
      botId: String(me.result.id),
      username: me.result.username ?? null,
      firstName: me.result.first_name ?? null,
      chatId: chatMeta?.id ?? null,
      chatLabel: chatMeta?.label ?? null,
    },
  });

  return json({
    ok: true,
    account: {
      handle,
      chatId: chatMeta?.id ?? null,
      chatLabel: chatMeta?.label ?? null,
    },
  });
}

export async function DELETE() {
  const userId = await requireUser();
  if (typeof userId !== "string") return userId;

  await wipePlatformTokens(userId, PlatformKind.TELEGRAM, "user_disconnect");
  return json({ ok: true });
}
