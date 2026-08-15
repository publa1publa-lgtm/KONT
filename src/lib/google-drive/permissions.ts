export const DRIVE_SCOPE_BY_PERMISSION_ID = {
  openid: "openid",
  "drive.file": "https://www.googleapis.com/auth/drive.file",
  "drive.readonly": "https://www.googleapis.com/auth/drive.readonly",
} as const;

export type DriveScopePermissionId = keyof typeof DRIVE_SCOPE_BY_PERMISSION_ID;

/** Extra Google identity scopes bundled with the `openid` permission. */
const OPENID_BUNDLE = [
  "openid",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "email",
  "profile",
] as const;

/** Broader Google scopes that already include a narrower one. */
const SCOPE_COVERS: Record<string, readonly string[]> = {
  "https://www.googleapis.com/auth/drive": [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/drive.readonly",
  ],
};

const PERMISSION_ID_BY_SCOPE = new Map<string, DriveScopePermissionId>([
  ...Object.entries(DRIVE_SCOPE_BY_PERMISSION_ID).map(([id, scope]) => [scope, id as DriveScopePermissionId] as const),
  ["https://www.googleapis.com/auth/userinfo.email", "openid"],
  ["https://www.googleapis.com/auth/userinfo.profile", "openid"],
  ["email", "openid"],
  ["profile", "openid"],
]);

export function parseGoogleScopeString(scope: string | null | undefined): string[] {
  if (!scope?.trim()) return [];
  return scope
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function expandGrantedScopes(grantedScopes: readonly string[]): Set<string> {
  const expanded = new Set<string>();
  for (const scope of grantedScopes) {
    const covers = SCOPE_COVERS[scope] ?? [scope];
    for (const item of covers) expanded.add(item);
  }
  return expanded;
}

export function driveScopesForPermissionIds(permissionIds: readonly string[]): string[] {
  const scopes: string[] = [];
  for (const id of permissionIds) {
    if (id === "openid") {
      scopes.push(...OPENID_BUNDLE.slice(0, 3));
      continue;
    }
    const scope = DRIVE_SCOPE_BY_PERMISSION_ID[id as DriveScopePermissionId];
    if (scope) scopes.push(scope);
  }
  return scopes;
}

export function drivePermissionIdsForScopes(grantedScopes: readonly string[]): DriveScopePermissionId[] {
  const expanded = expandGrantedScopes(grantedScopes);
  const ids = new Set<DriveScopePermissionId>();
  for (const scope of expanded) {
    const id = PERMISSION_ID_BY_SCOPE.get(scope);
    if (id) ids.add(id);
  }
  return [...ids];
}

export type DrivePermissionDiff = {
  grantedIds: string[];
  missingIds: string[];
  extraIds: string[];
};

export function diffDrivePermissions(
  requestedPermissionIds: readonly string[],
  grantedScopeString: string | null | undefined,
): DrivePermissionDiff {
  const requestedApiIds = requestedPermissionIds.filter(
    (id): id is DriveScopePermissionId => id in DRIVE_SCOPE_BY_PERMISSION_ID,
  );
  const grantedScopes = parseGoogleScopeString(grantedScopeString);
  const grantedApiIds = drivePermissionIdsForScopes(grantedScopes);
  const grantedSet = new Set<string>(grantedApiIds);
  const requestedSet = new Set<string>(requestedApiIds);

  return {
    grantedIds: grantedApiIds,
    missingIds: requestedApiIds.filter((id) => !grantedSet.has(id)),
    extraIds: grantedApiIds.filter((id) => !requestedSet.has(id)),
  };
}

export { PERMISSION_ID_BY_SCOPE };
