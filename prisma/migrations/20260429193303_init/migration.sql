-- CreateEnum
CREATE TYPE "PlatformKind" AS ENUM ('INSTAGRAM', 'TIKTOK');

-- CreateEnum
CREATE TYPE "PlatformAccountStatus" AS ENUM ('CONNECTED', 'EXPIRED', 'REVOKED', 'ERROR');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('POST', 'REEL');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'READY', 'SCHEDULED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ContentTargetStatus" AS ENUM ('PENDING', 'SCHEDULED', 'PUBLISHING', 'PUBLISHED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PublishAttemptStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_REGISTERED', 'USER_LOGIN', 'USER_LOGOUT', 'PLATFORM_CONNECTED', 'PLATFORM_REFRESH_TOKEN', 'PLATFORM_REVOKED', 'CONTENT_CREATED', 'CONTENT_UPDATED', 'CONTENT_DELETED', 'PUBLISH_REQUESTED', 'PUBLISH_SUCCEEDED', 'PUBLISH_FAILED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "PlatformKind" NOT NULL,
    "status" "PlatformAccountStatus" NOT NULL DEFAULT 'CONNECTED',
    "platformUserId" TEXT NOT NULL,
    "handle" TEXT,
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accessTokenEnc" TEXT,
    "refreshTokenEnc" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Content" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ContentType" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "text" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "hashtags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentTarget" (
    "id" TEXT NOT NULL,
    "contentId" TEXT NOT NULL,
    "platformAccountId" TEXT NOT NULL,
    "status" "ContentTargetStatus" NOT NULL DEFAULT 'PENDING',
    "publishedAt" TIMESTAMP(3),
    "remoteId" TEXT,
    "lastErrorCode" TEXT,
    "lastErrorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublishAttempt" (
    "id" TEXT NOT NULL,
    "contentTargetId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL,
    "status" "PublishAttemptStatus" NOT NULL DEFAULT 'STARTED',
    "errorCode" TEXT,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "PublishAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "PlatformAccount_userId_platform_idx" ON "PlatformAccount"("userId", "platform");

-- CreateIndex
CREATE INDEX "PlatformAccount_status_idx" ON "PlatformAccount"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAccount_platform_platformUserId_key" ON "PlatformAccount"("platform", "platformUserId");

-- CreateIndex
CREATE INDEX "Content_userId_createdAt_idx" ON "Content"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Content_status_idx" ON "Content"("status");

-- CreateIndex
CREATE INDEX "Content_type_createdAt_idx" ON "Content"("type", "createdAt");

-- CreateIndex
CREATE INDEX "Content_scheduledAt_idx" ON "Content"("scheduledAt");

-- CreateIndex
CREATE INDEX "ContentTarget_platformAccountId_status_idx" ON "ContentTarget"("platformAccountId", "status");

-- CreateIndex
CREATE INDEX "ContentTarget_status_idx" ON "ContentTarget"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContentTarget_contentId_platformAccountId_key" ON "ContentTarget"("contentId", "platformAccountId");

-- CreateIndex
CREATE INDEX "PublishAttempt_contentTargetId_startedAt_idx" ON "PublishAttempt"("contentTargetId", "startedAt");

-- CreateIndex
CREATE INDEX "PublishAttempt_status_idx" ON "PublishAttempt"("status");

-- CreateIndex
CREATE UNIQUE INDEX "PublishAttempt_contentTargetId_attemptNo_key" ON "PublishAttempt"("contentTargetId", "attemptNo");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "PlatformAccount" ADD CONSTRAINT "PlatformAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTarget" ADD CONSTRAINT "ContentTarget_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "Content"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentTarget" ADD CONSTRAINT "ContentTarget_platformAccountId_fkey" FOREIGN KEY ("platformAccountId") REFERENCES "PlatformAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublishAttempt" ADD CONSTRAINT "PublishAttempt_contentTargetId_fkey" FOREIGN KEY ("contentTargetId") REFERENCES "ContentTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
