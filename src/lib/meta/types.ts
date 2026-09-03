export const META_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_messaging",
  "read_insights",
  "business_management",
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_comments",
  "instagram_manage_insights",
  "instagram_manage_messages",
] as const;

export type MetaOAuthScope = (typeof META_OAUTH_SCOPES)[number];
export type MetaConnectIntent = "facebook" | "instagram";

export type MetaOAuthConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
};

export type MetaTokenResponse = {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: { message?: string; type?: string; code?: number; error_subcode?: number; fbtrace_id?: string };
};

export type MetaOAuthTokens = {
  userAccessToken: string;
  userTokenExpiresAt: Date;
  tokenType: string;
  scope: string;
};

export type MetaPageProfile = {
  pageId: string;
  name: string;
  accessToken: string;
  igUserId: string | null;
  igUsername: string | null;
  igName: string | null;
};

export type MetaUserProfile = {
  userId: string;
  name: string;
};

export type MetaStoredAccount = MetaOAuthTokens & {
  accountId?: string;
  profile: MetaUserProfile;
  pages: MetaPageProfile[];
  selectedPage: MetaPageProfile;
};

export class MetaError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, options?: { code?: string; status?: number; details?: unknown }) {
    super(message);
    this.name = "MetaError";
    this.code = options?.code ?? "META_ERROR";
    this.status = options?.status ?? 500;
    this.details = options?.details ?? null;
  }
}

export class MetaConfigError extends MetaError {
  constructor(message: string) {
    super(message, { code: "META_CONFIG", status: 500 });
    this.name = "MetaConfigError";
  }
}

export function metaAccountHandle(intent: MetaConnectIntent, page: MetaPageProfile): string {
  if (intent !== "instagram") return page.name;
  if (page.igUsername) return `@${page.igUsername.replace(/^@/, "")}`;
  return page.igName || page.name;
}
