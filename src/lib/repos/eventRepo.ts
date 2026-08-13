import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function listPlanEvents(args: {
  userId: string;
  take: number;
  cursor: string | null;
}) {
  const { userId, take, cursor } = args;
  return prisma.planEvent.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ scheduledAt: "asc" }, { createdAt: "asc" }],
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });
}

export async function createPlanEvent(data: {
  userId: string;
  title: string;
  description: string | null;
  showDescription: boolean;
  color: string;
  scheduledAt: Date;
}) {
  return prisma.planEvent.create({ data });
}

export async function findOwnedPlanEvent(id: string, userId: string) {
  return prisma.planEvent.findFirst({ where: { id, userId, deletedAt: null } });
}

export async function updatePlanEvent(id: string, data: Prisma.PlanEventUpdateInput) {
  return prisma.planEvent.update({ where: { id }, data });
}

export async function softDeletePlanEvent(id: string) {
  return prisma.planEvent.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
