-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PlatformKind" ADD VALUE 'FACEBOOK';
ALTER TYPE "PlatformKind" ADD VALUE 'YOUTUBE';
ALTER TYPE "PlatformKind" ADD VALUE 'TELEGRAM';
ALTER TYPE "PlatformKind" ADD VALUE 'DISCORD';
ALTER TYPE "PlatformKind" ADD VALUE 'X';
ALTER TYPE "PlatformKind" ADD VALUE 'LINKEDIN';

-- AlterTable
ALTER TABLE "Content" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PlatformAccount" ADD COLUMN     "connectionExpiresAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "providerMetadata" JSONB,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedReason" TEXT,
ADD COLUMN     "tokenEncVersion" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "OAuthState" (
    "id" TEXT NOT NULL,
    "stateHash" VARCHAR(64) NOT NULL,
    "codeVerifier" TEXT,
    "provider" "PlatformKind" NOT NULL,
    "userId" TEXT,
    "returnTo" TEXT,
    "requestedScopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OAuthState_stateHash_key" ON "OAuthState"("stateHash");

-- CreateIndex
CREATE INDEX "OAuthState_userId_createdAt_idx" ON "OAuthState"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");

-- CreateIndex
CREATE INDEX "OAuthState_provider_consumedAt_idx" ON "OAuthState"("provider", "consumedAt");

-- CreateIndex
CREATE INDEX "Content_deletedAt_idx" ON "Content"("deletedAt");

-- CreateIndex
CREATE INDEX "Content_status_scheduledAt_idx" ON "Content"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "PlatformAccount_deletedAt_idx" ON "PlatformAccount"("deletedAt");

-- AddForeignKey
ALTER TABLE "OAuthState" ADD CONSTRAINT "OAuthState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
