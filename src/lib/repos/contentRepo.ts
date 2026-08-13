import type { ContentStatus, Prisma } from "@prisma/client";
import { ContentType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listContentWithMedia(args: {
  userId: string;
  take: number;
  cursor: string | null;
}) {
  const { userId, take, cursor } = args;
  return prisma.content.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      media: {
        orderBy: { position: "asc" },
        include: { media: true },
      },
    },
  });
}

export async function createContentRecord(data: {
  userId: string;
  type: "POST" | "REEL";
  status: ContentStatus;
  title: string;
  text: string | null;
  description: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  hashtags: string[];
  tags: string[];
  scheduledAt: Date | null;
  metadata?: Prisma.InputJsonValue;
}) {
  const type = data.type === "REEL" ? ContentType.REEL : ContentType.POST;

  return prisma.content.create({
    data: {
      ...data,
      type,
    },
  });
}

export async function hardDeleteContent(id: string) {
  return prisma.content.delete({ where: { id } });
}

export async function findOwnedContent(id: string, userId: string) {
  return prisma.content.findFirst({ where: { id, userId, deletedAt: null } });
}

export async function updateContentRecord(id: string, data: Prisma.ContentUpdateInput) {
  return prisma.content.update({ where: { id }, data });
}

export async function findContentById(id: string) {
  return prisma.content.findUnique({ where: { id } });
}

export async function softDeleteContent(id: string) {
  return prisma.content.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
