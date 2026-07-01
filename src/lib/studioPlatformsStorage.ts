import type { ConnectedPlatformAccount } from "@/lib/composerPublish";
import { isReelPlatformId, type ReelPlatformId } from "@/lib/reelPlatformIds";

/** Single localStorage key for PlatformsView + composer + inbox. */
export const STUDIO_PLATFORMS_STORAGE_KEY = "contentfabric.cabinet.platforms.v2";

const LEGACY_STORAGE_KEY = "contentfabric.cabinet.platforms.v1";

export type StoredPlatformRow = {
  id: string;
  connected: boolean;
  account?: {
    displayName: string;
    connectedAt: number;
    lastSyncAt: number | null;
  } | null;
  grantedPermissionIds?: string[];
};

function parseRows(raw: string | null): StoredPlatformRow[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw) as unknown;
    if (!Array.isArray(v)) return [];
    return v.filter((item): item is StoredPlatformRow => {
      if (!item || typeof item !== "object") return false;
      const o = item as StoredPlatformRow;
      return typeof o.id === "string" && typeof o.connected === "boolean";
    });
  } catch {
    return [];
  }
}

/** Reads v2, migrates legacy v1 into v2 when needed. */
export function readStudioPlatformStates(): StoredPlatformRow[] {
  if (typeof window === "undefined") return [];

  let raw = localStorage.getItem(STUDIO_PLATFORMS_STORAGE_KEY);
  if (!raw) {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      try {
        localStorage.setItem(STUDIO_PLATFORMS_STORAGE_KEY, legacy);
        raw = legacy;
      } catch {
        raw = legacy;
      }
    }
  }

  return parseRows(raw);
}

/** Social platforms connected in Platforms (for composer publish targets). */
export function readConnectedReelPlatformAccounts(): ConnectedPlatformAccount[] {
  const out: ConnectedPlatformAccount[] = [];
  for (const row of readStudioPlatformStates()) {
    if (!row.connected || !isReelPlatformId(row.id)) continue;
    const platformId: ReelPlatformId = row.id;
    const handle =
      row.account && typeof row.account.displayName === "string" ? row.account.displayName : null;
    out.push({ id: `local-${platformId}`, platformId, handle });
  }
  return out;
}

/** Persist demo social connection to the server (best-effort). */
export async function syncReelPlatformConnectionToServer(
  platformId: ReelPlatformId,
  connected: boolean,
  handle: string | null,
): Promise<void> {
  try {
    const r = await fetch("/api/platform-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platformId, connected, handle }),
    });
    if (r.ok) {
      window.dispatchEvent(new CustomEvent("cf:studio-platforms"));
    }
  } catch {
    // localStorage remains source of truth for the demo UI
  }
}

export function subscribeStudioPlatforms(listener: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STUDIO_PLATFORMS_STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) listener();
  };
  const onCustom = () => listener();
  window.addEventListener("storage", onStorage);
  window.addEventListener("cf:studio-platforms", onCustom as EventListener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("cf:studio-platforms", onCustom as EventListener);
  };
}
