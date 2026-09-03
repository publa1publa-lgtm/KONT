import "server-only";

import { graphGet, graphPost } from "./graph";
import { getMetaAccount } from "./storage";
import { MetaError, type MetaConnectIntent } from "./types";

export type MetaInboxPlatform = "instagram" | "messenger";

export type MetaInboxParticipant = {
  id: string;
  name: string | null;
  username: string | null;
};

export type MetaInboxMessage = {
  id: string;
  body: string;
  createdAt: string | null;
  from: MetaInboxParticipant;
  direction: "inbound" | "outbound";
};

export type MetaInboxThread = {
  id: string;
  platform: MetaInboxPlatform;
  updatedAt: string | null;
  snippet: string | null;
  participants: MetaInboxParticipant[];
  peer: MetaInboxParticipant | null;
  messages: MetaInboxMessage[];
};

type ConversationsResponse = {
  data?: Array<{
    id?: string;
    updated_time?: string;
    snippet?: string;
    participants?: {
      data?: Array<{ id?: string; name?: string; username?: string; email?: string }>;
    };
  }>;
};

type ConversationMessagesResponse = {
  id?: string;
  messages?: {
    data?: Array<{
      id?: string;
      message?: string;
      created_time?: string;
      from?: { id?: string; name?: string; username?: string; email?: string };
    }>;
  };
};

function intentForPlatform(platform: MetaInboxPlatform): MetaConnectIntent {
  return platform === "instagram" ? "instagram" : "facebook";
}

function graphPlatform(platform: MetaInboxPlatform): string {
  return platform === "instagram" ? "instagram" : "messenger";
}

export function hasMetaInboxScopes(platform: MetaInboxPlatform, scopes: readonly string[]): boolean {
  const set = new Set(scopes);
  if (!set.has("pages_manage_metadata")) return false;
  if (platform === "instagram") {
    return set.has("instagram_manage_messages") && set.has("instagram_basic");
  }
  return set.has("pages_messaging") && set.has("pages_read_engagement");
}

function asParticipant(
  row: { id?: string; name?: string; username?: string; email?: string } | undefined,
): MetaInboxParticipant | null {
  if (!row?.id) return null;
  return {
    id: row.id,
    name: typeof row.name === "string" ? row.name : null,
    username: typeof row.username === "string" ? row.username : null,
  };
}

/**
 * Load Page/IG conversations + recent messages into memory only.
 * Nothing is written to Postgres — caller must not persist the payload.
 */
export async function fetchMetaInboxThreads(
  userId: string,
  platform: MetaInboxPlatform,
  options?: { threadLimit?: number; messageLimit?: number },
): Promise<{
  pageId: string;
  pageName: string;
  threads: MetaInboxThread[];
}> {
  const intent = intentForPlatform(platform);
  const account = await getMetaAccount(userId, intent);
  if (!account) {
    throw new MetaError(
      platform === "instagram"
        ? "Connect Instagram with messaging access first."
        : "Connect Facebook with messaging access first.",
      { code: "META_NOT_CONNECTED", status: 400 },
    );
  }

  if (!hasMetaInboxScopes(platform, account.scope.split(/[,\s]+/).filter(Boolean))) {
    throw new MetaError(
      "Reconnect and grant Inbox / messaging permissions to load conversations.",
      { code: "META_INBOX_SCOPE", status: 403 },
    );
  }

  if (platform === "instagram" && !account.selectedPage.igUserId) {
    throw new MetaError("No Instagram professional account is linked to the connected Page.", {
      code: "NO_INSTAGRAM_ACCOUNT",
      status: 400,
    });
  }

  const page = account.selectedPage;
  const threadLimit = Math.min(Math.max(options?.threadLimit ?? 20, 1), 40);
  const messageLimit = Math.min(Math.max(options?.messageLimit ?? 25, 1), 50);

  const list = await graphGet<ConversationsResponse>(`/${page.pageId}/conversations`, page.accessToken, {
    platform: graphPlatform(platform),
    fields: "id,updated_time,snippet,participants{id,name,username,email}",
    limit: String(threadLimit),
  });

  const pageParticipantIds = new Set<string>([page.pageId, page.igUserId].filter(Boolean) as string[]);

  const threads: MetaInboxThread[] = [];
  for (const row of list.data ?? []) {
    if (!row.id) continue;
    const participants = (row.participants?.data ?? [])
      .map((p) => asParticipant(p))
      .filter((p): p is MetaInboxParticipant => Boolean(p));
    const peer = participants.find((p) => !pageParticipantIds.has(p.id)) ?? participants[0] ?? null;

    let messages: MetaInboxMessage[] = [];
    try {
      const detail = await graphGet<ConversationMessagesResponse>(`/${row.id}`, page.accessToken, {
        fields: `messages.limit(${messageLimit}){id,created_time,from,message}`,
      });
      messages = (detail.messages?.data ?? [])
        .map((m) => {
          const from = asParticipant(m.from);
          if (!m.id || !from) return null;
          const direction: "inbound" | "outbound" = pageParticipantIds.has(from.id) ? "outbound" : "inbound";
          return {
            id: m.id,
            body: typeof m.message === "string" ? m.message : "",
            createdAt: typeof m.created_time === "string" ? m.created_time : null,
            from,
            direction,
          } satisfies MetaInboxMessage;
        })
        .filter((m): m is MetaInboxMessage => Boolean(m))
        .reverse();
    } catch (err) {
      console.warn("[meta.inbox] messages fetch failed", row.id, err);
    }

    threads.push({
      id: row.id,
      platform,
      updatedAt: typeof row.updated_time === "string" ? row.updated_time : null,
      snippet: typeof row.snippet === "string" ? row.snippet : null,
      participants,
      peer,
      messages,
    });
  }

  return {
    pageId: page.pageId,
    pageName: page.name,
    threads,
  };
}

/** Send a human agent reply. Still ephemeral — we do not store the outbound message in KONT. */
export async function sendMetaInboxReply(args: {
  userId: string;
  platform: MetaInboxPlatform;
  recipientId: string;
  text: string;
}): Promise<{ messageId: string | null }> {
  const text = args.text.trim();
  if (!text) throw new MetaError("Message text is required.", { code: "EMPTY_MESSAGE", status: 400 });
  if (text.length > 2000) throw new MetaError("Message is too long.", { code: "MESSAGE_TOO_LONG", status: 400 });

  const intent = intentForPlatform(args.platform);
  const account = await getMetaAccount(args.userId, intent);
  if (!account) {
    throw new MetaError("Reconnect the platform before sending a reply.", { code: "META_NOT_CONNECTED", status: 400 });
  }
  if (!hasMetaInboxScopes(args.platform, account.scope.split(/[,\s]+/).filter(Boolean))) {
    throw new MetaError("Messaging permission missing. Reconnect with Inbox access.", {
      code: "META_INBOX_SCOPE",
      status: 403,
    });
  }

  const page = account.selectedPage;
  const body = await graphPost<{ message_id?: string }>(`/${page.pageId}/messages`, page.accessToken, {
    recipient: JSON.stringify({ id: args.recipientId }),
    messaging_type: "MESSAGE_TAG",
    tag: "HUMAN_AGENT",
    message: JSON.stringify({ text }),
  });

  return { messageId: typeof body.message_id === "string" ? body.message_id : null };
}
