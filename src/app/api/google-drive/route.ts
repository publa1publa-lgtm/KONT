import { NextResponse } from "next/server";

import { json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import { drivePermissionIdsForScopes } from "@/lib/google-drive/permissions";
import { deleteTokens, getTokens } from "@/lib/google-drive/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const stored = await getTokens(userId);
  if (!stored) return json({ connected: false });

  const handle = stored.profile?.email || stored.profile?.name || "Google Drive";
  return json({
    connected: true,
    handle,
    granted: drivePermissionIdsForScopes(stored.scope.split(/[,\s]+/)),
  });
}

export async function DELETE(): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  await deleteTokens(userId);
  return json({ ok: true });
}
