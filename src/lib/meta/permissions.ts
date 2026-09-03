import { META_OAUTH_SCOPES, type MetaConnectIntent, type MetaOAuthScope } from "./types";

const FACEBOOK_SCOPE_BY_PERMISSION_ID = {
  pages_show_list: "pages_show_list",
  pages_manage_posts: "pages_manage_posts",
  pages_read_engagement: "pages_read_engagement",
  pages_messaging: "pages_messaging",
  read_insights: "read_insights",
} as const;

const INSTAGRAM_SCOPE_BY_PERMISSION_ID = {
  "instagram.content_publish": "instagram_content_publish",
  "instagram.manage_comments": "instagram_manage_comments",
  "instagram.insights.read": "instagram_manage_insights",
  "instagram.manage_messages": "instagram_manage_messages",
} as const;

export type FacebookScopePermissionId = keyof typeof FACEBOOK_SCOPE_BY_PERMISSION_ID;
export type InstagramScopePermissionId = keyof typeof INSTAGRAM_SCOPE_BY_PERMISSION_ID;

const ALLOWED = new Set<string>(META_OAUTH_SCOPES);

const REQUIRED: Record<MetaConnectIntent, readonly MetaOAuthScope[]> = {
  // App Review: publish loop. Insights is optional (`instagram.insights.read`) for Studio Analytics.
  // business_management is required so Pages owned via Meta Business Suite appear in /me/accounts
  // (otherwise Graph often returns [] and Instagram connect looks "broken").
  facebook: ["pages_show_list", "pages_manage_posts", "business_management"],
  instagram: [
    "pages_show_list",
    "pages_manage_posts",
    "pages_read_engagement",
    "business_management",
    "instagram_basic",
    "instagram_content_publish",
  ],
};

function scopeMap(intent: MetaConnectIntent) {
  return intent === "facebook" ? FACEBOOK_SCOPE_BY_PERMISSION_ID : INSTAGRAM_SCOPE_BY_PERMISSION_ID;
}

export function metaScopesForPermissionIds(intent: MetaConnectIntent, permissionIds: readonly string[]): string[] {
  const map = scopeMap(intent);
  const scopes = [...REQUIRED[intent]];
  for (const id of permissionIds) {
    const scope = map[id as keyof typeof map];
    if (scope) scopes.push(scope);
  }
  const wantsInbox =
    permissionIds.includes("pages_messaging") || permissionIds.includes("instagram.manage_messages");
  if (wantsInbox) {
    scopes.push("pages_manage_metadata");
    if (intent === "facebook") scopes.push("pages_read_engagement");
  }
  return [...new Set(scopes.filter((scope) => ALLOWED.has(scope)))];
}

export function sanitizeMetaScopes(intent: MetaConnectIntent, input: readonly string[] | undefined): string[] {
  const requested = (input ?? []).map((raw) => raw.trim()).filter((scope) => ALLOWED.has(scope));
  return [...new Set([...REQUIRED[intent], ...requested])];
}

function parseGranted(scope: string | null | undefined): string[] {
  if (!scope?.trim()) return [];
  return scope.split(/[,\s]+/).map((part) => part.trim()).filter((part) => ALLOWED.has(part));
}

function permissionIdsForScopes(
  intent: MetaConnectIntent,
  grantedScopes: readonly string[],
): string[] {
  const granted = new Set(grantedScopes);
  return Object.entries(scopeMap(intent))
    .filter(([, scope]) => granted.has(scope))
    .map(([id]) => id);
}

export function facebookPermissionIdsForScopes(grantedScopes: readonly string[]): FacebookScopePermissionId[] {
  return permissionIdsForScopes("facebook", grantedScopes) as FacebookScopePermissionId[];
}

export function instagramPermissionIdsForScopes(grantedScopes: readonly string[]): InstagramScopePermissionId[] {
  return permissionIdsForScopes("instagram", grantedScopes) as InstagramScopePermissionId[];
}

export function diffMetaPermissions(
  intent: MetaConnectIntent,
  requestedPermissionIds: readonly string[],
  grantedScopeString: string | null | undefined,
) {
  const map = scopeMap(intent);
  const grantedIds = permissionIdsForScopes(intent, parseGranted(grantedScopeString));
  const grantedSet = new Set(grantedIds);
  const requestedApiIds = requestedPermissionIds.filter((id) => id in map);
  return {
    grantedIds,
    missingIds: requestedApiIds.filter((id) => !grantedSet.has(id)),
    extraIds: grantedIds.filter((id) => !requestedApiIds.includes(id)),
  };
}

export function hasFacebookPublishScope(scopes: readonly string[]): boolean {
  return scopes.includes("pages_manage_posts");
}

export function hasInstagramPublishScope(scopes: readonly string[]): boolean {
  return scopes.includes("instagram_content_publish");
}

export function hasInstagramInsightsScope(scopes: readonly string[]): boolean {
  return scopes.includes("instagram_manage_insights");
}

export function hasMetaMessagingScopes(intent: MetaConnectIntent, scopes: readonly string[]): boolean {
  if (intent === "instagram") {
    return scopes.includes("instagram_manage_messages") && scopes.includes("pages_manage_metadata");
  }
  return scopes.includes("pages_messaging") && scopes.includes("pages_manage_metadata");
}
