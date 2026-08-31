import { YOUTUBE_OAUTH_SCOPES } from "./types";

export const YOUTUBE_SCOPE_BY_PERMISSION_ID = {
  "youtube.upload": "https://www.googleapis.com/auth/youtube.upload",
  youtube: "https://www.googleapis.com/auth/youtube",
  "youtube.readonly": "https://www.googleapis.com/auth/youtube.readonly",
  "yt-analytics.readonly": "https://www.googleapis.com/auth/yt-analytics.readonly",
} as const;

export type YouTubeScopePermissionId = keyof typeof YOUTUBE_SCOPE_BY_PERMISSION_ID;

const YOUTUBE_UPLOAD_SCOPE = YOUTUBE_SCOPE_BY_PERMISSION_ID["youtube.upload"];
const YOUTUBE_READ_SCOPE = YOUTUBE_SCOPE_BY_PERMISSION_ID["youtube.readonly"];

export function hasYouTubeUploadScope(scopes: readonly string[]): boolean {
  return expandGrantedScopes(scopes).has(YOUTUBE_UPLOAD_SCOPE);
}

export function hasYouTubeReadScope(scopes: readonly string[]): boolean {
  const expanded = expandGrantedScopes(scopes);
  return (
    expanded.has(YOUTUBE_READ_SCOPE) ||
    expanded.has(YOUTUBE_SCOPE_BY_PERMISSION_ID.youtube)
  );
}

/** Broader Google scopes that already include a narrower one. */
const SCOPE_COVERS: Record<string, readonly string[]> = {
  "https://www.googleapis.com/auth/youtube": [
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube.readonly",
  ],
};

const PERMISSION_ID_BY_SCOPE = new Map<string, YouTubeScopePermissionId>(
  Object.entries(YOUTUBE_SCOPE_BY_PERMISSION_ID).map(([id, scope]) => [scope, id as YouTubeScopePermissionId]),
);

export function parseGoogleScopeString(scope: string | null | undefined): string[] {
  if (!scope?.trim()) return [];
  return scope
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter((part) => (YOUTUBE_OAUTH_SCOPES as readonly string[]).includes(part));
}

export function expandGrantedScopes(grantedScopes: readonly string[]): Set<string> {
  const expanded = new Set<string>();
  for (const scope of grantedScopes) {
    const covers = SCOPE_COVERS[scope] ?? [scope];
    for (const item of covers) expanded.add(item);
  }
  return expanded;
}

export function youtubeScopesForPermissionIds(permissionIds: readonly string[]): string[] {
  const scopes: string[] = [];
  for (const id of permissionIds) {
    const scope = YOUTUBE_SCOPE_BY_PERMISSION_ID[id as YouTubeScopePermissionId];
    if (scope) scopes.push(scope);
  }
  return scopes;
}

export function youtubePermissionIdsForScopes(grantedScopes: readonly string[]): YouTubeScopePermissionId[] {
  const expanded = expandGrantedScopes(grantedScopes);
  const ids: YouTubeScopePermissionId[] = [];
  for (const [id, scope] of Object.entries(YOUTUBE_SCOPE_BY_PERMISSION_ID) as Array<
    [YouTubeScopePermissionId, string]
  >) {
    if (expanded.has(scope)) ids.push(id);
  }
  return ids;
}

export type YouTubePermissionDiff = {
  grantedIds: string[];
  missingIds: string[];
  extraIds: string[];
};

/**
 * Compare KONT-approved YouTube API permissions with scopes Google actually returned.
 * `account.identity` / inbox are KONT-only and are not part of this diff.
 */
export function diffYouTubePermissions(
  requestedPermissionIds: readonly string[],
  grantedScopeString: string | null | undefined,
): YouTubePermissionDiff {
  const requestedApiIds = requestedPermissionIds.filter(
    (id): id is YouTubeScopePermissionId => id in YOUTUBE_SCOPE_BY_PERMISSION_ID,
  );
  const grantedScopes = parseGoogleScopeString(grantedScopeString);
  const grantedApiIds = youtubePermissionIdsForScopes(grantedScopes);
  const grantedSet = new Set<string>(grantedApiIds);
  const requestedSet = new Set<string>(requestedApiIds);

  return {
    grantedIds: grantedApiIds,
    missingIds: requestedApiIds.filter((id) => !grantedSet.has(id)),
    extraIds: grantedApiIds.filter((id) => !requestedSet.has(id)),
  };
}

export { PERMISSION_ID_BY_SCOPE };
