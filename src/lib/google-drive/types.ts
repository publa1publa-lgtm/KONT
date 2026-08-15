/**
 * Google Drive OAuth types for the Studio connection flow.
 * Tokens are stored encrypted in Postgres (`storage.ts` → `tokenVault`).
 */

export const DRIVE_OAUTH_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/drive.readonly",
] as const;

/** Minimum scopes to identify the Google account after OAuth. */
export const DRIVE_REQUIRED_OAUTH_SCOPES = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
] as const;

export type DriveOAuthScope = (typeof DRIVE_OAUTH_SCOPES)[number];

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
  id_token?: string;
};

export type DriveOAuthTokens = {
  accessToken: string;
  refreshToken: string | null;
  expiresAt: Date;
  scope: string;
  tokenType: string;
};

export type DriveUserProfile = {
  googleUserId: string;
  email: string | null;
  name: string | null;
  pictureUrl: string | null;
};

export type DriveStoredTokens = DriveOAuthTokens & {
  profile: DriveUserProfile | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DriveTokenPatch = Partial<
  Pick<DriveStoredTokens, "accessToken" | "refreshToken" | "expiresAt" | "scope" | "tokenType" | "profile">
>;

export class GoogleDriveError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, options?: { code?: string; status?: number; details?: unknown }) {
    super(message);
    this.name = "GoogleDriveError";
    this.code = options?.code ?? "DRIVE_ERROR";
    this.status = options?.status ?? 500;
    this.details = options?.details ?? null;
  }
}

export class GoogleDriveNotConnectedError extends GoogleDriveError {
  constructor(userId: string) {
    super("Google Drive is not connected for this user.", {
      code: "DRIVE_NOT_CONNECTED",
      status: 404,
      details: { userId },
    });
    this.name = "GoogleDriveNotConnectedError";
  }
}

export class GoogleDriveConfigError extends GoogleDriveError {
  constructor(message: string) {
    super(message, { code: "DRIVE_CONFIG", status: 500 });
    this.name = "GoogleDriveConfigError";
  }
}
