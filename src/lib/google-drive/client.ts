import "server-only";

import { refreshToken } from "./oauth";
import { getTokens, updateTokens } from "./storage";
import { GoogleDriveError, GoogleDriveNotConnectedError, type DriveOAuthTokens } from "./types";

const ACCESS_TOKEN_SKEW_MS = 60_000;

function isExpired(expiresAt: Date, skewMs = ACCESS_TOKEN_SKEW_MS): boolean {
  return expiresAt.getTime() - skewMs <= Date.now();
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const stored = await getTokens(userId);
  if (!stored) throw new GoogleDriveNotConnectedError(userId);

  if (!isExpired(stored.expiresAt)) return stored.accessToken;
  if (!stored.refreshToken) {
    throw new GoogleDriveError("Google Drive access token expired and no refresh token is stored.", {
      code: "DRIVE_TOKEN_EXPIRED",
      status: 401,
    });
  }

  const next: DriveOAuthTokens = await refreshToken(stored.refreshToken);
  await updateTokens(userId, next);
  return next.accessToken;
}
