import { PlatformAccountStatus, type PlatformKind } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const tokenSelect = {
  id: true,
  accessTokenEnc: true,
  refreshTokenEnc: true,
  tokenExpiresAt: true,
  connectionExpiresAt: true,
  tokenEncVersion: true,
} as const;

export async function listConnectedPlatformAccounts(userId: string) {
  return prisma.platformAccount.findMany({
    where: {
      userId,
      status: PlatformAccountStatus.CONNECTED,
      revokedAt: null,
      deletedAt: null,
    },
    select: { id: true, platform: true, handle: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function findConnectedPlatformAccountWithTokens(userId: string, platform: PlatformKind) {
  return prisma.platformAccount.findFirst({
    where: {
      userId,
      platform,
      status: PlatformAccountStatus.CONNECTED,
      revokedAt: null,
      deletedAt: null,
    },
    select: tokenSelect,
  });
}

function demoPlatformUserId(userId: string, platform: PlatformKind): string {
  return `demo:${userId}:${platform}`;
}

/** Persists demo OAuth connections from the Platforms UI (until real OAuth ships). */
export async function upsertDemoPlatformAccount(
  userId: string,
  platform: PlatformKind,
  handle: string | null,
) {
  const platformUserId = demoPlatformUserId(userId, platform);
  return prisma.platformAccount.upsert({
    where: {
      platform_platformUserId: { platform, platformUserId },
    },
    create: {
      userId,
      platform,
      platformUserId,
      handle,
      status: PlatformAccountStatus.CONNECTED,
      scopes: [],
    },
    update: {
      userId,
      handle,
      status: PlatformAccountStatus.CONNECTED,
      revokedAt: null,
      revokedReason: null,
      deletedAt: null,
    },
  });
}

export async function revokeDemoPlatformAccount(userId: string, platform: PlatformKind) {
  const platformUserId = demoPlatformUserId(userId, platform);
  await prisma.platformAccount.updateMany({
    where: { userId, platform, platformUserId },
    data: {
      status: PlatformAccountStatus.REVOKED,
      revokedAt: new Date(),
      revokedReason: "demo_disconnect",
    },
  });
}
