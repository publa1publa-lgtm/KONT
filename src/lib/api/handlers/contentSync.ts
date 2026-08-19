import "server-only";

import { NextResponse } from "next/server";
import { ContentTargetStatus, PlatformKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { json, notFound } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import { graphGet } from "@/lib/meta/graph";
import { getMetaAccount } from "@/lib/meta/storage";
import type { MetaConnectIntent } from "@/lib/meta/types";

function intentForPlatform(kind: PlatformKind): MetaConnectIntent | null {
  if (kind === PlatformKind.FACEBOOK) return "facebook";
  if (kind === PlatformKind.INSTAGRAM) return "instagram";
  return null;
}

async function remotePostExists(
  intent: MetaConnectIntent,
  pageToken: string,
  remoteId: string,
): Promise<boolean> {
  try {
    const res = await graphGet<{ id?: string }>(`/${remoteId}`, pageToken, { fields: "id" });
    return Boolean(res.id);
  } catch {
    return false;
  }
}

/**
 * POST /api/content/[id]/sync
 * Check all published targets for this content against their remote platforms.
 * If a remote post was deleted, mark the target as FAILED with REMOTE_DELETED code.
 */
export async function syncContentTargets(req: Request, params: Promise<{ id: string }>): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  if (!id) return notFound();

  const content = await prisma.content.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!content) return notFound();

  const targets = await prisma.contentTarget.findMany({
    where: {
      contentId: id,
      status: { in: [ContentTargetStatus.PUBLISHED, ContentTargetStatus.SCHEDULED] },
      platformAccount: { userId },
    },
    include: { platformAccount: { select: { platform: true } } },
  });

  const [fbAccount, igAccount] = await Promise.all([
    getMetaAccount(userId, "facebook"),
    getMetaAccount(userId, "instagram"),
  ]);
  const accountByIntent = { facebook: fbAccount, instagram: igAccount } as const;

  type SyncResult = { targetId: string; platform: string; status: string; remoteId: string | null };

  const checks = targets.map(async (target): Promise<SyncResult> => {
    if (!target.remoteId) {
      return { targetId: target.id, platform: target.platformAccount.platform, status: "no_remote_id", remoteId: null };
    }

    const intent = intentForPlatform(target.platformAccount.platform);
    if (!intent) {
      return { targetId: target.id, platform: target.platformAccount.platform, status: "skipped", remoteId: target.remoteId };
    }

    const account = accountByIntent[intent];
    if (!account?.selectedPage?.accessToken) {
      return { targetId: target.id, platform: intent, status: "no_account", remoteId: target.remoteId };
    }

    const exists = await remotePostExists(intent, account.selectedPage.accessToken, target.remoteId);

    if (!exists) {
      await prisma.contentTarget.update({
        where: { id: target.id },
        data: {
          status: ContentTargetStatus.FAILED,
          lastErrorCode: "REMOTE_DELETED",
          lastErrorMessage: "The post was deleted on the platform.",
        },
      });
      return { targetId: target.id, platform: intent, status: "deleted", remoteId: target.remoteId };
    }
    return { targetId: target.id, platform: intent, status: "live", remoteId: target.remoteId };
  });

  const results = await Promise.all(checks);
  return json({ synced: results });
}
