import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { json, notFound } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
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

  return json({
    targets: targets.map((t) => ({
      id: t.id,
      platform: t.platformAccount.platform,
      handle: t.platformAccount.handle,
      status: t.status,
      remoteId: t.remoteId,
      publishedAt: t.publishedAt,
      errorCode: t.lastErrorCode,
      errorMessage: t.lastErrorMessage,
    })),
  });
}
