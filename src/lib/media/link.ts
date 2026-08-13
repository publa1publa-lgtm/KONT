import { ContentMediaRole, MediaStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

/**
 * Replace the MAIN media list of a content item.
 *
 * - Verifies every passed mediaId belongs to `userId` and is in READY state
 *   (ignores soft-deleted assets).
 * - Drops previous MAIN ContentMedia rows for this content.
 * - Inserts new ones in the order given (`position = index`).
 *
 * COVER / CAROUSEL / ATTACHMENT roles are intentionally not touched here —
 * those will get their own helpers when the UI needs them.
 */
export async function setContentMainMedia(params: {
  contentId: string;
  userId: string;
  mediaIds: string[];
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { contentId, userId, mediaIds } = params;

  const unique = [...new Set(mediaIds.filter((s) => typeof s === "string" && s.length > 0))];

  if (unique.length === 0) {
    await prisma.contentMedia.deleteMany({
      where: { contentId, role: ContentMediaRole.MAIN },
    });
    return { ok: true };
  }

  const owned = await prisma.mediaAsset.findMany({
    where: {
      id: { in: unique },
      userId,
      status: MediaStatus.READY,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (owned.length !== unique.length) {
    return { ok: false, error: "Some mediaIds are invalid or not owned", status: 400 };
  }

  await prisma.$transaction([
    prisma.contentMedia.deleteMany({
      where: { contentId, role: ContentMediaRole.MAIN },
    }),
    ...unique.map((mediaId, position) =>
      prisma.contentMedia.create({
        data: {
          contentId,
          mediaId,
          role: ContentMediaRole.MAIN,
          position,
        },
      }),
    ),
  ]);

  return { ok: true };
}

export function asMediaIds(v: unknown): string[] | null {
  if (v === undefined) return null;
  if (!Array.isArray(v)) return null;
  const out: string[] = [];
  for (const x of v) {
    if (typeof x !== "string" || x.length === 0) return null;
    out.push(x);
  }
  return out;
}
