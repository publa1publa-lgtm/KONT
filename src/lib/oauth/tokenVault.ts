import "server-only";

import { PlatformAccountStatus, type PlatformKind, type Prisma } from "@prisma/client";

import {
  decryptOptionalSecret,
  decryptSecret,
  encryptOptionalSecret,
  encryptSecret,
  TOKEN_ENC_VERSION,
  tokenAad,
} from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export type VaultTokenInput = {
  userId: string;
  platform: PlatformKind;
  platformUserId: string;
  handle: string | null;
  scopes: string[];
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date;
  providerMetadata?: Prisma.InputJsonValue;
};

export type VaultTokenPatch = {
  accessToken?: string;
  refreshToken?: string | null;
  tokenExpiresAt?: Date;
  scopes?: string[];
  handle?: string | null;
  providerMetadata?: Prisma.InputJsonValue;
};

/** Decrypted in process memory only. Never serialize this to a Response. */
export type VaultDecryptedTokens = {
  accountId: string;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
  scopes: string[];
  handle: string | null;
  platformUserId: string;
  providerMetadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

const PUBLIC_SELECT = {
  id: true,
  platform: true,
  handle: true,
  platformUserId: true,
  status: true,
  scopes: true,
} as const;

export async function findAccountForUserPlatform(userId: string, platform: PlatformKind) {
  return prisma.platformAccount.findFirst({
    where: { userId, platform, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });
}

async function revokeSiblingAccounts(userId: string, platform: PlatformKind, keepId: string) {
  await prisma.platformAccount.updateMany({
    where: { userId, platform, deletedAt: null, id: { not: keepId } },
    data: {
      status: PlatformAccountStatus.REVOKED,
      revokedAt: new Date(),
      revokedReason: "replaced_by_reconnect",
      accessTokenEnc: null,
      refreshTokenEnc: null,
      tokenExpiresAt: null,
    },
  });
}

export async function savePlatformTokens(input: VaultTokenInput) {
  if (!input.platform) {
    throw new Error("Cannot store tokens without a platform.");
  }
  if (!input.accessToken.trim()) {
    throw new Error("Cannot store an empty access token.");
  }

  const accessTokenEnc = encryptSecret(
    input.accessToken,
    tokenAad({ userId: input.userId, platform: input.platform, field: "access" }),
  );
  const refreshTokenEnc = encryptOptionalSecret(
    input.refreshToken,
    tokenAad({ userId: input.userId, platform: input.platform, field: "refresh" }),
  );

  const existing = await findAccountForUserPlatform(input.userId, input.platform);
  const occupied = await prisma.platformAccount.findUnique({
    where: {
      platform_platformUserId: { platform: input.platform, platformUserId: input.platformUserId },
    },
    select: { id: true, userId: true, refreshTokenEnc: true, status: true, revokedAt: true },
  });

  if (
    occupied &&
    occupied.userId !== input.userId &&
    occupied.status === PlatformAccountStatus.CONNECTED &&
    !occupied.revokedAt
  ) {
    throw new Error("This platform account is already connected to another KONT user.");
  }

  const keepFrom =
    existing?.refreshTokenEnc && existing.userId === input.userId
      ? existing
      : occupied?.userId === input.userId
        ? occupied
        : null;
  const keepRefresh = Boolean(keepFrom?.refreshTokenEnc) && !input.refreshToken;

  const data = {
    userId: input.userId,
    platform: input.platform,
    platformUserId: input.platformUserId,
    handle: input.handle,
    status: PlatformAccountStatus.CONNECTED,
    scopes: input.scopes,
    accessTokenEnc,
    refreshTokenEnc: keepRefresh ? keepFrom!.refreshTokenEnc : refreshTokenEnc,
    tokenEncVersion: TOKEN_ENC_VERSION,
    tokenExpiresAt: input.tokenExpiresAt,
    providerMetadata: input.providerMetadata ?? undefined,
    revokedAt: null,
    revokedReason: null,
    deletedAt: null,
    lastSyncAt: new Date(),
  };

  const targetId =
    occupied?.id ??
    existing?.id ??
    null;

  const saved = targetId
    ? await prisma.platformAccount.update({
        where: { id: targetId },
        data,
        select: PUBLIC_SELECT,
      })
    : await prisma.platformAccount.create({
        data,
        select: PUBLIC_SELECT,
      });

  await revokeSiblingAccounts(input.userId, input.platform, saved.id);
  return saved;
}

export async function updatePlatformTokens(userId: string, platform: PlatformKind, patch: VaultTokenPatch) {
  const existing = await findAccountForUserPlatform(userId, platform);
  if (!existing || existing.status !== PlatformAccountStatus.CONNECTED || existing.revokedAt) {
    return null;
  }

  const data: Prisma.PlatformAccountUpdateInput = {
    lastSyncAt: new Date(),
    tokenEncVersion: TOKEN_ENC_VERSION,
  };

  if (patch.accessToken) {
    data.accessTokenEnc = encryptSecret(patch.accessToken, tokenAad({ userId, platform, field: "access" }));
  }
  if (patch.refreshToken !== undefined) {
    data.refreshTokenEnc = encryptOptionalSecret(
      patch.refreshToken,
      tokenAad({ userId, platform, field: "refresh" }),
    );
  }
  if (patch.tokenExpiresAt) data.tokenExpiresAt = patch.tokenExpiresAt;
  if (patch.scopes) data.scopes = patch.scopes;
  if (patch.handle !== undefined) data.handle = patch.handle;
  if (patch.providerMetadata !== undefined) data.providerMetadata = patch.providerMetadata;

  return prisma.platformAccount.update({
    where: { id: existing.id },
    data,
    select: PUBLIC_SELECT,
  });
}

export async function readPlatformTokens(
  userId: string,
  platform: PlatformKind,
): Promise<VaultDecryptedTokens | null> {
  const row = await prisma.platformAccount.findFirst({
    where: {
      userId,
      platform,
      status: PlatformAccountStatus.CONNECTED,
      revokedAt: null,
      deletedAt: null,
    },
    orderBy: { updatedAt: "desc" },
  });
  if (!row?.accessTokenEnc) return null;

  try {
    return {
      accountId: row.id,
      accessToken: decryptSecret(row.accessTokenEnc, tokenAad({ userId, platform, field: "access" })),
      refreshToken: decryptOptionalSecret(row.refreshTokenEnc, tokenAad({ userId, platform, field: "refresh" })),
      tokenExpiresAt: row.tokenExpiresAt,
      scopes: row.scopes,
      handle: row.handle,
      platformUserId: row.platformUserId,
      providerMetadata: row.providerMetadata,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  } catch {
    await prisma.platformAccount.update({
      where: { id: row.id },
      data: { status: PlatformAccountStatus.ERROR },
    });
    return null;
  }
}

/** Soft-revoke and destroy ciphertext so a DB dump cannot recover the token. */
export async function wipePlatformTokens(userId: string, platform: PlatformKind, reason = "user_disconnect") {
  await prisma.platformAccount.updateMany({
    where: { userId, platform, deletedAt: null },
    data: {
      status: PlatformAccountStatus.REVOKED,
      revokedAt: new Date(),
      revokedReason: reason,
      accessTokenEnc: null,
      refreshTokenEnc: null,
      tokenExpiresAt: null,
    },
  });
}
