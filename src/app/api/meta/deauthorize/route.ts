import { NextResponse } from "next/server";

import { revokeMetaConnectionsForMetaUser } from "@/lib/meta/callbacks";
import { parseMetaSignedRequest, readSignedRequestFromMetaPost } from "@/lib/meta/signedRequest";
import { MetaConfigError } from "@/lib/meta/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function appSecret(): string {
  const value = process.env.META_APP_SECRET?.trim();
  if (!value) throw new MetaConfigError("META_APP_SECRET is not set.");
  return value;
}

async function parseMetaUserId(req: Request): Promise<string | null> {
  const signed = await readSignedRequestFromMetaPost(req);
  const parsed = parseMetaSignedRequest(signed, appSecret());
  return parsed?.userId ?? null;
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ ok: true, service: "kont-meta-deauthorize" });
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const metaUserId = await parseMetaUserId(req);
    if (!metaUserId) {
      return NextResponse.json({ error: "Invalid signed_request." }, { status: 400 });
    }
    await revokeMetaConnectionsForMetaUser(metaUserId, "meta_deauthorize");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[meta.deauthorize]", err);
    return NextResponse.json({ error: "Deauthorize failed." }, { status: 500 });
  }
}
