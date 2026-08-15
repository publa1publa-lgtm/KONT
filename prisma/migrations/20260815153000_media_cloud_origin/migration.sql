-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN "originProvider" TEXT NOT NULL DEFAULT 'local';
ALTER TABLE "MediaAsset" ADD COLUMN "originFileId" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "originLabel" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN "originUrl" TEXT;

-- CreateIndex
CREATE INDEX "MediaAsset_userId_originProvider_idx" ON "MediaAsset"("userId", "originProvider");
