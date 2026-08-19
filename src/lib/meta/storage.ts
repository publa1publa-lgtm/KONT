import "server-only";

import { PlatformKind } from "@prisma/client";

import {
  findAccountForUserPlatform,
  readPlatformTokens,
  savePlatformTokens,
  wipePlatformTokens,
} from "@/lib/oauth/tokenVault";
import { revokeMetaGrant } from "./oauth";
import { metaAccountHandle, type MetaConnectIntent, type MetaPageProfile, type MetaStoredAccount } from "./types";

function platformForIntent(intent: MetaConnectIntent): PlatformKind {
  return intent === "instagram" ? PlatformKind.INSTAGRAM : PlatformKind.FACEBOOK;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function selectedPageFromMetadata(metadata: unknown, pageToken: string): MetaPageProfile | null {
  if (!metadata || typeof metadata !== "object") return null;
  const rec = metadata as { selectedPageId?: unknown; pages?: unknown; igUserId?: unknown; igUsername?: unknown };
  const pages = Array.isArray(rec.pages) ? rec.pages : [];
  const selectedId = asString(rec.selectedPageId);
  const match = pages.find((row) => row && typeof row === "object" && (row as { pageId?: unknown }).pageId === selectedId);
  const row = (match ?? pages[0]) as
    | { pageId?: unknown; name?: unknown; igUserId?: unknown; igUsername?: unknown; igName?: unknown }
    | undefined;
  if (!row || typeof row.pageId !== "string") return null;
  return {
    pageId: row.pageId,
    name: asString(row.name) || row.pageId,
    accessToken: pageToken,
    igUserId: asString(row.igUserId) ?? asString(rec.igUserId),
    igUsername: asString(row.igUsername) ?? asString(rec.igUsername),
    igName: asString(row.igName),
  };
}

export async function saveMetaAccount(
  userId: string,
  intent: MetaConnectIntent,
  account: MetaStoredAccount,
): Promise<void> {
  const page = account.selectedPage;
  await savePlatformTokens({
    userId,
    platform: platformForIntent(intent),
    platformUserId: intent === "instagram" ? page.igUserId || page.pageId : page.pageId,
    handle: metaAccountHandle(intent, page),
    scopes: account.scope.split(/[,\s]+/).map((part) => part.trim()).filter(Boolean),
    accessToken: page.accessToken,
    refreshToken: account.userAccessToken,
    tokenExpiresAt: account.userTokenExpiresAt,
    providerMetadata: {
      profile: account.profile,
      pages: account.pages.map((p) => ({
        pageId: p.pageId,
        name: p.name,
        igUserId: p.igUserId,
        igUsername: p.igUsername,
        igName: p.igName,
      })),
      selectedPageId: page.pageId,
      igUserId: page.igUserId,
      igUsername: page.igUsername,
      longLived: true,
    },
  });
}

export async function getMetaAccount(userId: string, intent: MetaConnectIntent): Promise<MetaStoredAccount | null> {
  const row = await readPlatformTokens(userId, platformForIntent(intent));
  if (!row?.refreshToken) return null;
  const selectedPage = selectedPageFromMetadata(row.providerMetadata, row.accessToken);
  const profile =
    row.providerMetadata && typeof row.providerMetadata === "object"
      ? (row.providerMetadata as { profile?: { userId?: unknown; name?: unknown } }).profile
      : null;
  if (!selectedPage || typeof profile?.userId !== "string") return null;
  return {
    accountId: row.accountId,
    userAccessToken: row.refreshToken,
    userTokenExpiresAt: row.tokenExpiresAt ?? new Date(0),
    tokenType: "bearer",
    scope: row.scopes.join(","),
    profile: { userId: profile.userId, name: asString(profile.name) || profile.userId },
    pages: [selectedPage],
    selectedPage,
  };
}

export async function deleteMetaAccount(userId: string, intent: MetaConnectIntent): Promise<void> {
  const stored = await readPlatformTokens(userId, platformForIntent(intent));
  const other = intent === "facebook" ? PlatformKind.INSTAGRAM : PlatformKind.FACEBOOK;
  const sibling = await findAccountForUserPlatform(userId, other);
  const revokeAtMeta = !sibling || sibling.status !== "CONNECTED" || Boolean(sibling.revokedAt) || Boolean(sibling.deletedAt);
  await wipePlatformTokens(userId, platformForIntent(intent), "user_disconnect");
  if (revokeAtMeta && stored?.refreshToken) await revokeMetaGrant(stored.refreshToken);
}
