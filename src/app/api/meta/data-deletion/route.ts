import { NextResponse } from "next/server";

import { recordMetaDataDeletion } from "@/lib/meta/callbacks";
import { parseMetaSignedRequest, readSignedRequestFromMetaPost } from "@/lib/meta/signedRequest";
import { MetaConfigError } from "@/lib/meta/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function appSecret(): string {
  const value = process.env.META_APP_SECRET?.trim();
  if (!value) throw new MetaConfigError("META_APP_SECRET is not set.");
  return value;
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    ok: true,
    service: "kont-meta-data-deletion",
  });
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const signed = await readSignedRequestFromMetaPost(req);
    const parsed = parseMetaSignedRequest(signed, appSecret());
    if (!parsed?.userId) {
      return NextResponse.json({ error: "Invalid signed_request." }, { status: 400 });
    }
    const result = await recordMetaDataDeletion(parsed.userId);
    return NextResponse.json({
      url: result.url,
      confirmation_code: result.confirmationCode,
    });
  } catch (err) {
    console.error("[meta.data-deletion]", err);
    return NextResponse.json({ error: "Data deletion failed." }, { status: 500 });
  }
}
