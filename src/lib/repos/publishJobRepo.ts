import { PublishJobStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function upsertPublishJob(contentId: string, userId: string, runAt: Date) {
  return prisma.publishJob.upsert({
    where: { contentId },
    create: {
      contentId,
      userId,
      runAt,
      status: PublishJobStatus.PENDING,
      attemptNo: 0,
      lockedAt: null,
      lastError: null,
    },
    update: {
      userId,
      runAt,
      status: PublishJobStatus.PENDING,
      attemptNo: 0,
      lockedAt: null,
      lastError: null,
    },
  });
}

export async function cancelPublishJob(contentId: string) {
  await prisma.publishJob.updateMany({
    where: {
      contentId,
      status: { in: [PublishJobStatus.PENDING, PublishJobStatus.RUNNING] },
    },
    data: {
      status: PublishJobStatus.CANCELLED,
      lockedAt: null,
    },
  });
}

export async function claimDuePublishJobs(limit: number) {
  const due = await prisma.publishJob.findMany({
    where: {
      status: PublishJobStatus.PENDING,
      runAt: { lte: new Date() },
    },
    orderBy: { runAt: "asc" },
    take: limit,
  });

  const claimed: typeof due = [];
  for (const job of due) {
    const updated = await prisma.publishJob.updateMany({
      where: { id: job.id, status: PublishJobStatus.PENDING },
      data: { status: PublishJobStatus.RUNNING, lockedAt: new Date() },
    });
    if (updated.count === 1) claimed.push(job);
  }
  return claimed;
}

export async function completePublishJob(id: string) {
  return prisma.publishJob.update({
    where: { id },
    data: {
      status: PublishJobStatus.DONE,
      lockedAt: null,
      lastError: null,
    },
  });
}

export async function failPublishJob(id: string, error: string, maxAttempts: number, retryAt: Date | null) {
  const job = await prisma.publishJob.findUnique({ where: { id } });
  if (!job) return null;

  const nextAttempt = job.attemptNo + 1;
  if (nextAttempt >= maxAttempts || !retryAt) {
    return prisma.publishJob.update({
      where: { id },
      data: {
        status: PublishJobStatus.FAILED,
        attemptNo: nextAttempt,
        lastError: error.slice(0, 1000),
        lockedAt: null,
      },
    });
  }

  return prisma.publishJob.update({
    where: { id },
    data: {
      status: PublishJobStatus.PENDING,
      attemptNo: nextAttempt,
      lastError: error.slice(0, 1000),
      runAt: retryAt,
      lockedAt: null,
    },
  });
}
