import "server-only";

import { NextResponse } from "next/server";

import { badRequest, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import { fetchMetaInboxThreads, sendMetaInboxReply, type MetaInboxPlatform } from "@/lib/meta/inbox";
import { MetaError } from "@/lib/meta/types";

function parsePlatform(raw: string | null): MetaInboxPlatform | null {
  if (raw === "instagram" || raw === "messenger") return raw;
  return null;
}

function metaErrorResponse(err: unknown): NextResponse {
  if (err instanceof MetaError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
    );
  }
  console.error("[meta.inbox]", err);
  return NextResponse.json({ error: "Failed to load inbox." }, { status: 500 });
}

/** GET /api/meta/inbox?platform=instagram|messenger — ephemeral conversations (not stored). */
export async function getMetaInbox(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const platform = parsePlatform(new URL(req.url).searchParams.get("platform"));
  if (!platform) return badRequest("platform must be instagram or messenger");

  try {
    const payload = await fetchMetaInboxThreads(userId, platform);
    return json({
      ...payload,
      ephemeral: true,
      note: "Conversations are loaded for this request only and are not stored in KONT.",
    });
  } catch (err) {
    return metaErrorResponse(err);
  }
}

/** POST /api/meta/inbox/reply — human_agent tagged reply; not persisted in KONT. */
export async function postMetaInboxReply(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }
  if (!body || typeof body !== "object") return badRequest("Invalid body");

  const platform = parsePlatform(typeof (body as { platform?: unknown }).platform === "string" ? (body as { platform: string }).platform : null);
  const recipientId = (body as { recipientId?: unknown }).recipientId;
  const text = (body as { text?: unknown }).text;
  if (!platform) return badRequest("platform must be instagram or messenger");
  if (typeof recipientId !== "string" || !recipientId.trim()) return badRequest("recipientId is required");
  if (typeof text !== "string") return badRequest("text is required");

  try {
    const result = await sendMetaInboxReply({
      userId,
      platform,
      recipientId: recipientId.trim(),
      text,
    });
    return json({ ok: true, ephemeral: true, ...result });
  } catch (err) {
    return metaErrorResponse(err);
  }
}
