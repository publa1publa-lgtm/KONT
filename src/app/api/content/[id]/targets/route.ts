import { NextResponse } from "next/server";
import { PlatformKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { json, notFound } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import { getInstagramMediaSnapshot } from "@/lib/meta/insights";
import { hasInstagramInsightsScope } from "@/lib/meta/permissions";
import { getYouTubeVideoSnapshot } from "@/lib/youtube/client";
import { hasYouTubeReadScope } from "@/lib/youtube/permissions";
import { getTokens } from "@/lib/youtube/storage";
import { readPlatformTokens } from "@/lib/oauth/tokenVault";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

type MappedTarget = {
  id: string;
  platform: string;
  handle: string | null;
  status: string;
  remoteId: string | null;
  publishedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  /** true = found on platform, false = checked and missing, null = not verified */
  live: boolean | null;
  views: number | null;
  permalink: string | null;
};

function toIsoDate(value: Date | string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

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

  // Prefer page access token directly — getMetaAccount also requires profile metadata
  // and can return null even when a usable page token exists.
  const igTokens = needsInstagram ? await readPlatformTokens(userId, PlatformKind.INSTAGRAM).catch(() => null) : null;
  const igToken = igTokens?.accessToken ?? null;
  const hasIgInsights = igTokens ? hasInstagramInsightsScope(igTokens.scopes) : false;

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
        publishedAt: toIsoDate(t.publishedAt),
        errorCode: t.lastErrorCode,
        errorMessage: t.lastErrorMessage,
        live: null,
        views: null,
        permalink: null,
      };

      if (t.platformAccount.platform === PlatformKind.INSTAGRAM && t.remoteId && igToken) {
        const snap = await getInstagramMediaSnapshot(t.remoteId, igToken, hasIgInsights);
        return {
          ...base,
          live: snap.live,
          views: snap.views,
          permalink: snap.permalink,
          publishedAt: toIsoDate(snap.publishedAt) ?? base.publishedAt,
        };
      }

      if (t.platformAccount.platform === PlatformKind.YOUTUBE && t.remoteId) {
        if (ytCanRead) {
          const snap = await getYouTubeVideoSnapshot(userId, t.remoteId);
          return {
            ...base,
            live: snap.live,
            views: snap.views,
            permalink: snap.permalink,
            publishedAt: toIsoDate(snap.publishedAt) ?? base.publishedAt,
          };
        }
        return {
          ...base,
          live: null,
          permalink: youtubePermalink(t.remoteId),
        };
      }

      return base;
    }),
  );

  return json({ targets: mapped });
}
