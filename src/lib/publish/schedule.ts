import "server-only";

import { AuditAction, ContentStatus } from "@prisma/client";

import { writeAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import * as publishJobRepo from "@/lib/repos/publishJobRepo";
import { contentWantsPublish, firstPublishError, publishContentTargets } from "./run";

/** Defer publish when scheduled more than ~1 minute ahead (cron runs every minute). */
export const PUBLISH_DEFER_MS = 60_000;
export const MAX_PUBLISH_JOB_ATTEMPTS = 5;
const RETRY_BACKOFF_MS = [60_000, 5 * 60_000, 15 * 60_000, 60 * 60_000, 4 * 60 * 60_000];

export type ContentPublishPlanResult = {
  publishing: boolean;
  deferred: boolean;
};

export function shouldDeferPublish(scheduledAt: Date | null, now = Date.now()): boolean {
  if (!scheduledAt) return false;
  return scheduledAt.getTime() - now > PUBLISH_DEFER_MS;
}

function retryAtForAttempt(attemptNo: number): Date | null {
  const backoff = RETRY_BACKOFF_MS[attemptNo - 1];
  if (backoff === undefined) return null;
  return new Date(Date.now() + backoff);
}

/** Sync publish job after content create/update — defer future schedules, publish now otherwise. */
export async function syncContentPublishPlan(args: {
  contentId: string;
  userId: string;
  status: ContentStatus;
  scheduledAt: Date | null;
  metadata: unknown;
}): Promise<ContentPublishPlanResult> {
  if (!contentWantsPublish(args.status, args.metadata)) {
    await publishJobRepo.cancelPublishJob(args.contentId);
    return { publishing: false, deferred: false };
  }

  if (shouldDeferPublish(args.scheduledAt)) {
    await publishJobRepo.upsertPublishJob(args.contentId, args.userId, args.scheduledAt!);
    return { publishing: false, deferred: true };
  }

  await publishJobRepo.cancelPublishJob(args.contentId);
  void publishContentTargets(args.userId, args.contentId).catch((err) =>
    console.error("[publish.schedule] immediate publish failed", { contentId: args.contentId, err }),
  );
  return { publishing: true, deferred: false };
}

async function runPublishJob(job: { id: string; contentId: string; userId: string; attemptNo: number }) {
  const content = await prisma.content.findFirst({
    where: { id: job.contentId, userId: job.userId, deletedAt: null },
    select: { id: true, status: true, metadata: true },
  });

  if (!content || !contentWantsPublish(content.status, content.metadata)) {
    await publishJobRepo.cancelPublishJob(job.contentId);
    return { ok: true as const, skipped: true as const };
  }

  void writeAudit({
    userId: job.userId,
    action: AuditAction.PUBLISH_REQUESTED,
    entityType: "Content",
    entityId: job.contentId,
    metadata: { source: "cron", attemptNo: job.attemptNo + 1 },
  });

  const result = await publishContentTargets(job.userId, job.contentId);
  const err = firstPublishError(result);
  if (err) {
    const nextAttempt = job.attemptNo + 1;
    const retryAt = retryAtForAttempt(nextAttempt);
    await publishJobRepo.failPublishJob(job.id, err.error, MAX_PUBLISH_JOB_ATTEMPTS, retryAt);

    if (!retryAt || nextAttempt >= MAX_PUBLISH_JOB_ATTEMPTS) {
      void writeAudit({
        userId: job.userId,
        action: AuditAction.PUBLISH_FAILED,
        entityType: "Content",
        entityId: job.contentId,
        metadata: { code: err.code, error: err.error, attemptNo: nextAttempt },
      });
    }
    return { ok: false as const, error: err.error, code: err.code };
  }

  await publishJobRepo.completePublishJob(job.id);
  void writeAudit({
    userId: job.userId,
    action: AuditAction.PUBLISH_SUCCEEDED,
    entityType: "Content",
    entityId: job.contentId,
    metadata: { source: "cron" },
  });
  return { ok: true as const, skipped: false as const };
}

export async function processDuePublishJobs(limit = 20) {
  const jobs = await publishJobRepo.claimDuePublishJobs(limit);
  let processed = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of jobs) {
    try {
      const outcome = await runPublishJob(job);
      if ("skipped" in outcome && outcome.skipped) {
        skipped += 1;
      } else if (outcome.ok) {
        processed += 1;
      } else {
        failed += 1;
      }
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : "Publish job failed";
      const retryAt = retryAtForAttempt(job.attemptNo + 1);
      await publishJobRepo.failPublishJob(job.id, message, MAX_PUBLISH_JOB_ATTEMPTS, retryAt).catch(() => {});
      console.error("[publish.cron] job threw", { jobId: job.id, contentId: job.contentId, err });
    }
  }

  return { claimed: jobs.length, processed, failed, skipped };
}
