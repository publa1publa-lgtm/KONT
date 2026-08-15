import "server-only";

import { PlatformKind } from "@prisma/client";

import { readPlatformTokens } from "@/lib/oauth/tokenVault";

const GOOGLE_PLATFORMS = [PlatformKind.YOUTUBE, PlatformKind.GOOGLE_DRIVE] as const;

/**
 * YouTube and Drive share one Google OAuth client. Revoking the grant at Google
 * would kill every remaining Google connection for that user.
 */
export async function shouldRevokeGoogleGrant(
  userId: string,
  disconnecting: PlatformKind,
): Promise<boolean> {
  for (const platform of GOOGLE_PLATFORMS) {
    if (platform === disconnecting) continue;
    const tokens = await readPlatformTokens(userId, platform);
    if (tokens) return false;
  }
  return true;
}
