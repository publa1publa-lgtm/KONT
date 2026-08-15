/**
 * YouTube Data API + Analytics types for the Studio connection flow.
 * Tokens are stored encrypted in Postgres (`storage.ts` → `tokenVault`).
 */

export const YOUTUBE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
] as const;

/** Minimum scope to identify the channel after OAuth. Upload/manage are optional. */
export const YOUTUBE_REQUIRED_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
] as const;

export type YouTubeOAuthScope = (typeof YOUTUBE_OAUTH_SCOPES)[number];

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

export type YouTubeOAuthTokens = {
  accessToken: string;
  /** Present after first consent (`access_type=offline` + `prompt=consent`). */
  refreshToken: string | null;
  expiresAt: Date;
  scope: string;
  tokenType: string;
};

export type YouTubeChannelProfile = {
  channelId: string;
  title: string;
  customUrl: string | null;
  thumbnailUrl: string | null;
};

export type YouTubeStoredTokens = YouTubeOAuthTokens & {
  channel: YouTubeChannelProfile | null;
  createdAt: Date;
  updatedAt: Date;
};

export type YouTubeTokenPatch = Partial<
  Pick<YouTubeStoredTokens, "accessToken" | "refreshToken" | "expiresAt" | "scope" | "tokenType" | "channel">
>;

export type YouTubePrivacyStatus = "public" | "unlisted" | "private";

export type YouTubeVideoSnippetInput = {
  title: string;
  description?: string;
  tags?: string[];
  categoryId?: string;
  defaultLanguage?: string;
};

export type YouTubeVideoStatusInput = {
  privacyStatus?: YouTubePrivacyStatus;
  embeddable?: boolean;
  selfDeclaredMadeForKids?: boolean;
  publishAt?: string;
};

export type YouTubeVideoSource =
  | {
      type: "bytes";
      data: Uint8Array | ArrayBuffer;
      mimeType: string;
      filename?: string;
    }
  | {
      type: "url";
      url: string;
      mimeType?: string;
    };

export type YouTubeUploadInput = {
  source: YouTubeVideoSource;
  snippet: YouTubeVideoSnippetInput;
  status?: YouTubeVideoStatusInput;
};

export type YouTubeUpdateInput = {
  videoId: string;
  snippet?: Partial<YouTubeVideoSnippetInput>;
  status?: YouTubeVideoStatusInput;
};

export type YouTubeVideo = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  categoryId: string;
  privacyStatus: YouTubePrivacyStatus | null;
  publishedAt: string | null;
  channelId: string | null;
};

export type YouTubeAnalyticsQuery = {
  startDate: string;
  endDate: string;
  metrics?: string[];
  dimensions?: string[];
  sort?: string;
  filters?: string;
  maxResults?: number;
};

export type YouTubeAnalyticsColumn = {
  name: string;
  dataType: string;
};

export type YouTubeAnalyticsReport = {
  kind: string;
  columnHeaders: YouTubeAnalyticsColumn[];
  rows: Array<Array<string | number>>;
};

export type YouTubeApiErrorBody = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    errors?: Array<{ message?: string; domain?: string; reason?: string }>;
  };
};

export class YouTubeError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, options?: { code?: string; status?: number; details?: unknown }) {
    super(message);
    this.name = "YouTubeError";
    this.code = options?.code ?? "YOUTUBE_ERROR";
    this.status = options?.status ?? 500;
    this.details = options?.details ?? null;
  }
}

export class YouTubeNotConnectedError extends YouTubeError {
  constructor(userId: string) {
    super("YouTube is not connected for this user.", {
      code: "YOUTUBE_NOT_CONNECTED",
      status: 404,
      details: { userId },
    });
    this.name = "YouTubeNotConnectedError";
  }
}

export class YouTubeConfigError extends YouTubeError {
  constructor(message: string) {
    super(message, { code: "YOUTUBE_CONFIG", status: 500 });
    this.name = "YouTubeConfigError";
  }
}
