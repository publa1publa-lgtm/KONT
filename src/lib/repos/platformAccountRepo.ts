import { PlatformAccountStatus, type PlatformKind } from "@prisma/client";

import { wipePlatformTokens } from "@/lib/oauth/tokenVault";
import { prisma } from "@/lib/prisma";

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
  await wipePlatformTokens(userId, platform, "user_disconnect");
}
