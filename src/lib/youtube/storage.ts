import "server-only";

import { PlatformKind } from "@prisma/client";

import {
  readPlatformTokens,
  savePlatformTokens,
  updatePlatformTokens,
  wipePlatformTokens,
} from "@/lib/oauth/tokenVault";
import { shouldRevokeGoogleGrant } from "@/lib/google/sharedGrant";
import { revokeGoogleGrant } from "./oauth";
import type { YouTubeStoredTokens, YouTubeTokenPatch } from "./types";

export interface YouTubeTokenStore {
  saveTokens(userId: string, tokens: YouTubeStoredTokens): Promise<YouTubeStoredTokens>;
  getTokens(userId: string): Promise<YouTubeStoredTokens | null>;
  updateTokens(userId: string, tokens: YouTubeTokenPatch): Promise<YouTubeStoredTokens | null>;
  deleteTokens(userId: string): Promise<void>;
}

function scopesFrom(scope: string): string[] {
  return scope.split(/[,\s]+/).map((part) => part.trim()).filter(Boolean);
}

function youtubeHandle(channel: YouTubeStoredTokens["channel"]): string | null {
  if (!channel) return null;
  if (!channel.customUrl) return channel.title || null;
  return channel.customUrl.startsWith("@") ? channel.customUrl : `@${channel.customUrl.replace(/^\/+/, "")}`;
}

function asChannel(metadata: unknown): YouTubeStoredTokens["channel"] {
  if (!metadata || typeof metadata !== "object") return null;
  const channel = (metadata as { channel?: YouTubeStoredTokens["channel"] }).channel;
  return channel ?? null;
}

export class PostgresYouTubeTokenStore implements YouTubeTokenStore {
  async saveTokens(userId: string, tokens: YouTubeStoredTokens): Promise<YouTubeStoredTokens> {
    const platformUserId = tokens.channel?.channelId || `youtube:${userId}`;
    const handle = youtubeHandle(tokens.channel);
    await savePlatformTokens({
      userId,
      platform: PlatformKind.YOUTUBE,
      platformUserId,
      handle,
      scopes: scopesFrom(tokens.scope),
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
      providerMetadata: {
        tokenType: tokens.tokenType,
        channel: tokens.channel,
      },
    });
    return tokens;
  }

  async getTokens(userId: string): Promise<YouTubeStoredTokens | null> {
    const row = await readPlatformTokens(userId, PlatformKind.YOUTUBE);
    if (!row) return null;
    const meta = row.providerMetadata && typeof row.providerMetadata === "object" ? row.providerMetadata : {};
    const tokenType =
      meta && typeof meta === "object" && "tokenType" in meta && typeof meta.tokenType === "string"
        ? meta.tokenType
        : "Bearer";
    const channel = asChannel(meta);
    return {
      accessToken: row.accessToken,
      refreshToken: row.refreshToken,
      expiresAt: row.tokenExpiresAt ?? new Date(0),
      scope: row.scopes.join(" "),
      tokenType,
      channel,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async updateTokens(userId: string, tokens: YouTubeTokenPatch): Promise<YouTubeStoredTokens | null> {
    const updated = await updatePlatformTokens(userId, PlatformKind.YOUTUBE, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
      scopes: tokens.scope ? scopesFrom(tokens.scope) : undefined,
      handle: tokens.channel ? youtubeHandle(tokens.channel) : undefined,
      providerMetadata: tokens.channel
        ? { tokenType: tokens.tokenType ?? "Bearer", channel: tokens.channel }
        : undefined,
    });
    if (!updated) return null;
    return this.getTokens(userId);
  }

  async deleteTokens(userId: string): Promise<void> {
    const stored = await readPlatformTokens(userId, PlatformKind.YOUTUBE);
    const revokeAtGoogle = await shouldRevokeGoogleGrant(userId, PlatformKind.YOUTUBE);
    await wipePlatformTokens(userId, PlatformKind.YOUTUBE, "user_disconnect");
    const googleToken = stored?.refreshToken || stored?.accessToken;
    if (revokeAtGoogle && googleToken) {
      await revokeGoogleGrant(googleToken).catch(() => undefined);
    }
  }
}

export const youtubeTokenStore: YouTubeTokenStore = new PostgresYouTubeTokenStore();

export async function saveTokens(userId: string, tokens: YouTubeStoredTokens): Promise<YouTubeStoredTokens> {
  return youtubeTokenStore.saveTokens(userId, tokens);
}

export async function getTokens(userId: string): Promise<YouTubeStoredTokens | null> {
  return youtubeTokenStore.getTokens(userId);
}

export async function updateTokens(userId: string, tokens: YouTubeTokenPatch): Promise<YouTubeStoredTokens | null> {
  return youtubeTokenStore.updateTokens(userId, tokens);
}

export async function deleteTokens(userId: string): Promise<void> {
  return youtubeTokenStore.deleteTokens(userId);
}
