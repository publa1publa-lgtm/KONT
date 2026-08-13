import { LocalDiskStorage } from "./local";
import type { StorageAdapter } from "./types";

let cached: StorageAdapter | null = null;

/**
 * Returns the singleton storage adapter for the current process.
 *
 * Provider is selected from `STORAGE_PROVIDER` (default: "local").
 * Other providers (S3 / R2 / Cloudinary) plug in here without touching call sites.
 */
export function getStorage(): StorageAdapter {
  if (cached) return cached;
  const provider = (process.env.STORAGE_PROVIDER ?? "local").toLowerCase();
  switch (provider) {
    case "local":
      cached = new LocalDiskStorage();
      break;
    default:
      throw new Error(`Unsupported STORAGE_PROVIDER: ${provider}`);
  }
  return cached;
}

export type { StorageAdapter, StorageProvider, StoredObject } from "./types";
