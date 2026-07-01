import { readStudioPlatformStates, subscribeStudioPlatforms } from "@/lib/studioPlatformsStorage";

/** Stored on each platform row when user confirms permissions (Platforms view). */
export const INBOX_UNIFIED_PERMISSION_ID = "inbox.unified";

export const INBOX_CAPABLE_PLATFORM_IDS = ["youtube", "tiktok", "instagram", "facebook", "telegram"] as const;
export type InboxCapablePlatformId = (typeof INBOX_CAPABLE_PLATFORM_IDS)[number];

export { subscribeStudioPlatforms };

function isInboxCapable(id: string): id is InboxCapablePlatformId {
  return (INBOX_CAPABLE_PLATFORM_IDS as readonly string[]).includes(id);
}

/**
 * Platforms the user connected **and** granted unified Inbox permission.
 * Legacy rows: `connected` but no `grantedPermissionIds` → treat as inbox allowed (same as before).
 */
export function readInboxEnabledPlatformIds(): InboxCapablePlatformId[] {
  const out: InboxCapablePlatformId[] = [];
  for (const row of readStudioPlatformStates()) {
    if (!row.connected || !isInboxCapable(row.id)) continue;

    const perms = Array.isArray(row.grantedPermissionIds)
      ? row.grantedPermissionIds.filter((x): x is string => typeof x === "string")
      : [INBOX_UNIFIED_PERMISSION_ID];

    if (!perms.includes(INBOX_UNIFIED_PERMISSION_ID)) continue;
    out.push(row.id);
  }
  return out;
}
