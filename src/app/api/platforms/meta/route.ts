import { NextResponse } from "next/server";

import { json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import { facebookPermissionIdsForScopes, instagramPermissionIdsForScopes } from "@/lib/meta/permissions";
import { deleteMetaAccount, getMetaAccount } from "@/lib/meta/storage";
import { metaAccountHandle, type MetaConnectIntent } from "@/lib/meta/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function parseIntent(raw: string | null): MetaConnectIntent | null {
  return raw === "facebook" || raw === "instagram" ? raw : null;
}

export async function GET(): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const [facebook, instagram] = await Promise.all([
    getMetaAccount(userId, "facebook").catch(() => null),
    getMetaAccount(userId, "instagram").catch(() => null),
  ]);

  return json({
    facebook: facebook
      ? {
          connected: true,
          handle: metaAccountHandle("facebook", facebook.selectedPage),
          granted: facebookPermissionIdsForScopes(facebook.scope.split(/[,\s]+/)),
        }
      : { connected: false },
    instagram: instagram
      ? {
          connected: true,
          handle: metaAccountHandle("instagram", instagram.selectedPage),
          granted: instagramPermissionIdsForScopes(instagram.scope.split(/[,\s]+/)),
        }
      : { connected: false },
  });
}

export async function DELETE(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;
  const intent = parseIntent(new URL(req.url).searchParams.get("intent"));
  if (!intent) return json({ error: "intent must be facebook or instagram." }, 400);
  await deleteMetaAccount(userId, intent);
  return json({ ok: true });
}
