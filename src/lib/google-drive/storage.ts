import "server-only";

import { PlatformKind } from "@prisma/client";

import { shouldRevokeGoogleGrant } from "@/lib/google/sharedGrant";
import { revokeGoogleGrant } from "@/lib/google/revoke";
import {
  readPlatformTokens,
  savePlatformTokens,
  updatePlatformTokens,
  wipePlatformTokens,
} from "@/lib/oauth/tokenVault";
import type { DriveStoredTokens, DriveTokenPatch, DriveUserProfile } from "./types";

const DRIVE_PLATFORM: PlatformKind = "GOOGLE_DRIVE";

export interface DriveTokenStore {
  saveTokens(userId: string, tokens: DriveStoredTokens): Promise<DriveStoredTokens>;
  getTokens(userId: string): Promise<DriveStoredTokens | null>;
  updateTokens(userId: string, tokens: DriveTokenPatch): Promise<DriveStoredTokens | null>;
  deleteTokens(userId: string): Promise<void>;
}

function scopesFrom(scope: string): string[] {
  return scope.split(/[,\s]+/).map((part) => part.trim()).filter(Boolean);
}

function driveHandle(profile: DriveUserProfile | null): string | null {
  if (!profile) return null;
  return profile.email || profile.name || null;
}

function asProfile(metadata: unknown): DriveUserProfile | null {
  if (!metadata || typeof metadata !== "object") return null;
  const profile = (metadata as { profile?: DriveUserProfile }).profile;
  return profile ?? null;
}

export class PostgresDriveTokenStore implements DriveTokenStore {
  async saveTokens(userId: string, tokens: DriveStoredTokens): Promise<DriveStoredTokens> {
    const platformUserId = tokens.profile?.googleUserId || `google-drive:${userId}`;
    await savePlatformTokens({
      userId,
      platform: DRIVE_PLATFORM,
      platformUserId,
      handle: driveHandle(tokens.profile),
      scopes: scopesFrom(tokens.scope),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
      providerMetadata: {
        tokenType: tokens.tokenType,
        profile: tokens.profile,
      },
    });
    return tokens;
  }

  async getTokens(userId: string): Promise<DriveStoredTokens | null> {
    const row = await readPlatformTokens(userId, DRIVE_PLATFORM);
    if (!row) return null;
    const meta = row.providerMetadata && typeof row.providerMetadata === "object" ? row.providerMetadata : {};
    const tokenType =
      meta && typeof meta === "object" && "tokenType" in meta && typeof meta.tokenType === "string"
        ? meta.tokenType
        : "Bearer";
    const profile = asProfile(meta);
    return {
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      expiresAt: row.tokenExpiresAt ?? new Date(0),
      scope: row.scopes.join(" "),
      tokenType,
      profile,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async updateTokens(userId: string, tokens: DriveTokenPatch): Promise<DriveStoredTokens | null> {
    const updated = await updatePlatformTokens(userId, DRIVE_PLATFORM, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
      scopes: tokens.scope ? scopesFrom(tokens.scope) : undefined,
      handle: tokens.profile ? driveHandle(tokens.profile) : undefined,
      providerMetadata: tokens.profile
        ? { tokenType: tokens.tokenType ?? "Bearer", profile: tokens.profile }
        : undefined,
    });
    if (!updated) return null;
    return this.getTokens(userId);
  }

  async deleteTokens(userId: string): Promise<void> {
    const stored = await readPlatformTokens(userId, DRIVE_PLATFORM);
    const revokeAtGoogle = await shouldRevokeGoogleGrant(userId, DRIVE_PLATFORM);
    await wipePlatformTokens(userId, DRIVE_PLATFORM, "user_disconnect");
    const googleToken = stored?.refreshToken || stored?.accessToken;
    if (revokeAtGoogle && googleToken) {
      await revokeGoogleGrant(googleToken).catch(() => undefined);
    }
  }
}

export const driveTokenStore: DriveTokenStore = new PostgresDriveTokenStore();

export async function saveTokens(userId: string, tokens: DriveStoredTokens): Promise<DriveStoredTokens> {
  return driveTokenStore.saveTokens(userId, tokens);
}

export async function getTokens(userId: string): Promise<DriveStoredTokens | null> {
  return driveTokenStore.getTokens(userId);
}

export async function updateTokens(userId: string, tokens: DriveTokenPatch): Promise<DriveStoredTokens | null> {
  return driveTokenStore.updateTokens(userId, tokens);
}

export async function deleteTokens(userId: string): Promise<void> {
  return driveTokenStore.deleteTokens(userId);
}
