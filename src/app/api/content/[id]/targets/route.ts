import { NextResponse } from "next/server";
import { ContentTargetStatus, PlatformKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { json, notFound } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import { getInstagramMediaSnapshot } from "@/lib/meta/insights";
import { hasInstagramInsightsScope } from "@/lib/meta/permissions";
import { getMetaAccount } from "@/lib/meta/storage";
import { getYouTubeVideoSnapshot } from "@/lib/youtube/client";
import { hasYouTubeReadScope } from "@/lib/youtube/permissions";
import { getTokens } from "@/lib/youtube/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

type MappedTarget = {
  id: string;
  platform: string;
  handle: string | null;
  status: string;
  remoteId: string | null;
  publishedAt: Date | null;
  errorCode: string | null;
  errorMessage: string | null;
  live: boolean;
  views: number | null;
  permalink: string | null;
};

function youtubePermalink(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const { id } = await ctx.params;
  const content = await prisma.content.findFirst({
    where: { id, userId, deletedAt: null },
    select: { id: true },
  });
  if (!content) return notFound();

  const targets = await prisma.contentTarget.findMany({
    where: { contentId: id },
    include: { platformAccount: { select: { platform: true, handle: true } } },
    orderBy: { createdAt: "asc" },
  });

  const needsInstagram = targets.some((t) => t.platformAccount.platform === PlatformKind.INSTAGRAM);
  const needsYouTube = targets.some((t) => t.platformAccount.platform === PlatformKind.YOUTUBE);

  const igAccount = needsInstagram ? await getMetaAccount(userId, "instagram").catch(() => null) : null;
  const igToken = igAccount?.selectedPage.accessToken ?? null;
  const hasIgInsights = igAccount ? hasInstagramInsightsScope(igAccount.scope.split(/[,\s]+/)) : false;

  const ytTokens = needsYouTube ? await getTokens(userId).catch(() => null) : null;
  const ytCanRead = ytTokens ? hasYouTubeReadScope(ytTokens.scope.split(/[,\s]+/)) : false;

  const mapped = await Promise.all(
    targets.map(async (t): Promise<MappedTarget> => {
      const base: MappedTarget = {
        id: t.id,
        platform: t.platformAccount.platform,
        handle: t.platformAccount.handle,
        status: t.status,
        remoteId: t.remoteId,
        publishedAt: t.publishedAt,
        errorCode: t.lastErrorCode,
        errorMessage: t.lastErrorMessage,
        live: false,
        views: null,
        permalink: null,
      };

      if (t.platformAccount.platform === PlatformKind.INSTAGRAM && t.remoteId && igToken) {
        const snap = await getInstagramMediaSnapshot(t.remoteId, igToken, hasIgInsights);
        return { ...base, live: snap.live, views: snap.views, permalink: snap.permalink };
      }

      if (t.platformAccount.platform === PlatformKind.YOUTUBE && t.remoteId) {
        if (ytCanRead) {
          const snap = await getYouTubeVideoSnapshot(userId, t.remoteId);
          return { ...base, live: snap.live, views: snap.views, permalink: snap.permalink };
        }
        return {
          ...base,
          live:
            t.status === ContentTargetStatus.PUBLISHED ||
            t.status === ContentTargetStatus.SCHEDULED,
          permalink: youtubePermalink(t.remoteId),
        };
      }

      return {
        ...base,
        live: t.status === ContentTargetStatus.PUBLISHED && Boolean(t.remoteId),
      };
    }),
  );

  return json({ targets: mapped });
}
