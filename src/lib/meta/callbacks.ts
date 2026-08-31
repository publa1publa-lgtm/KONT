import "server-only";

import { randomBytes } from "node:crypto";

import { PlatformKind } from "@prisma/client";

import { wipePlatformTokens } from "@/lib/oauth/tokenVault";
import { prisma } from "@/lib/prisma";

const META_PLATFORMS = [PlatformKind.FACEBOOK, PlatformKind.INSTAGRAM] as const;

function publicAppUrl(): string {
  const raw = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.kontme.com").trim();
  return raw.replace(/\/+$/, "");
}

export function metaDataDeletionStatusUrl(confirmationCode: string): string {
  return `${publicAppUrl()}/en/meta/data-deletion?code=${encodeURIComponent(confirmationCode)}`;
}

export async function findKontUserIdsForMetaUser(metaUserId: string): Promise<string[]> {
  const rows = await prisma.platformAccount.findMany({
    where: {
      platform: { in: [...META_PLATFORMS] },
      deletedAt: null,
      OR: [
        { providerMetadata: { path: ["facebookUserId"], equals: metaUserId } },
        { providerMetadata: { path: ["profile", "userId"], equals: metaUserId } },
      ],
    },
    select: { userId: true },
  });
  return [...new Set(rows.map((row) => row.userId))];
}

export async function revokeMetaConnectionsForMetaUser(metaUserId: string, reason: string): Promise<number> {
  const userIds = await findKontUserIdsForMetaUser(metaUserId);
  for (const userId of userIds) {
    for (const platform of META_PLATFORMS) {
      await wipePlatformTokens(userId, platform, reason);
    }
  }
  return userIds.length;
}

export async function recordMetaDataDeletion(metaUserId: string): Promise<{
  confirmationCode: string;
  url: string;
}> {
  await revokeMetaConnectionsForMetaUser(metaUserId, "meta_data_deletion");
  const confirmationCode = randomBytes(10).toString("hex");
  await prisma.metaDataDeletionRequest.create({
    data: {
      confirmationCode,
      metaUserId,
      status: "completed",
      completedAt: new Date(),
    },
  });
  return { confirmationCode, url: metaDataDeletionStatusUrl(confirmationCode) };
}

export async function getMetaDataDeletionRequest(confirmationCode: string) {
  const code = confirmationCode.trim();
  if (!code) return null;
  return prisma.metaDataDeletionRequest.findUnique({ where: { confirmationCode: code } });
}
