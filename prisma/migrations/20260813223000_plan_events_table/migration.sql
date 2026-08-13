-- CreateTable
CREATE TABLE "PlanEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "PlanEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PlanEvent_userId_scheduledAt_idx" ON "PlanEvent"("userId", "scheduledAt");
CREATE INDEX "PlanEvent_userId_createdAt_idx" ON "PlanEvent"("userId", "createdAt");
CREATE INDEX "PlanEvent_archivedAt_idx" ON "PlanEvent"("archivedAt");
CREATE INDEX "PlanEvent_deletedAt_idx" ON "PlanEvent"("deletedAt");

-- AddForeignKey
ALTER TABLE "PlanEvent" ADD CONSTRAINT "PlanEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate legacy Content rows typed as EVENT
INSERT INTO "PlanEvent" ("id", "userId", "title", "description", "scheduledAt", "archivedAt", "createdAt", "updatedAt", "deletedAt")
SELECT
  c."id",
  c."userId",
  c."title",
  COALESCE(c."description", c."text"),
  COALESCE(c."scheduledAt", c."createdAt"),
  CASE WHEN c."status" = 'ARCHIVED' THEN COALESCE(c."updatedAt", NOW()) ELSE NULL END,
  c."createdAt",
  c."updatedAt",
  c."deletedAt"
FROM "Content" c
WHERE c."type"::text = 'EVENT';

-- Remove migrated content (targets/media for events should be empty)
DELETE FROM "Content" WHERE "type"::text = 'EVENT';

-- Rebuild ContentType enum without EVENT
CREATE TYPE "ContentType_new" AS ENUM ('POST', 'REEL');
ALTER TABLE "Content" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Content" ALTER COLUMN "type" TYPE "ContentType_new" USING ("type"::text::"ContentType_new");
DROP TYPE "ContentType";
ALTER TYPE "ContentType_new" RENAME TO "ContentType";

-- Audit actions for PlanEvent
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EVENT_CREATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EVENT_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'EVENT_DELETED';
