import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const publicSelect = { handle: true, title: true, bio: true, links: true } as const;

export async function findLinkPageByUserId(userId: string) {
  return prisma.linkPage.findUnique({
    where: { userId },
    select: publicSelect,
  });
}

export async function findLinkPageByHandleForOtherUser(handle: string, excludeUserId: string) {
  return prisma.linkPage.findFirst({
    where: { handle, NOT: { userId: excludeUserId } },
    select: { id: true },
  });
}

export async function upsertLinkPage(
  userId: string,
  data: { handle: string; title: string; bio: string; links: Prisma.InputJsonValue },
) {
  return prisma.linkPage.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    select: publicSelect,
  });
}
