import "server-only";

import {
  CloudProviderError,
  type CloudFileKind,
  type CloudImportBytes,
  type CloudListResult,
  type CloudProviderId,
} from "./types";
import { importDriveFile, listDriveMediaFiles, parseDriveFileId } from "@/lib/google-drive/files";
import { getTokens as getDriveTokens } from "@/lib/google-drive/storage";
import { GoogleDriveError, GoogleDriveNotConnectedError } from "@/lib/google-drive/types";
import { drivePermissionIdsForScopes } from "@/lib/google-drive/permissions";

export type CloudProviderStatus = {
  connected: boolean;
  handle: string | null;
  canBrowse: boolean;
};

function mapDriveError(err: unknown): never {
  if (err instanceof GoogleDriveNotConnectedError) {
    throw new CloudProviderError(err.message, { code: err.code, status: 409 });
  }
  if (err instanceof GoogleDriveError) {
    throw new CloudProviderError(err.message, { code: err.code, status: err.status });
  }
  throw err;
}

export async function getCloudProviderStatus(userId: string, provider: CloudProviderId): Promise<CloudProviderStatus> {
  if (provider === "dropbox") {
    return { connected: false, handle: null, canBrowse: false };
  }

  const stored = await getDriveTokens(userId);
  if (!stored) return { connected: false, handle: null, canBrowse: false };
  const granted = drivePermissionIdsForScopes(stored.scope.split(/[,\s]+/));
  return {
    connected: true,
    handle: stored.profile?.email || stored.profile?.name || "Google Drive",
    canBrowse: granted.includes("drive.readonly") || granted.includes("drive.file"),
  };
}

export async function listCloudFiles(
  userId: string,
  provider: CloudProviderId,
  options: { kind: CloudFileKind; query?: string; pageToken?: string },
): Promise<CloudListResult> {
  if (provider === "dropbox") {
    return { files: [], nextPageToken: null, hint: "not_implemented" };
  }

  const status = await getCloudProviderStatus(userId, provider);
  if (!status.connected) {
    return { files: [], nextPageToken: null, hint: "not_connected" };
  }

  try {
    const listed = await listDriveMediaFiles(userId, options);
    if (listed.files.length === 0) {
      return { ...listed, hint: "reconnect_readonly" };
    }
    return listed;
  } catch (err) {
    mapDriveError(err);
  }
}

export async function importCloudFile(
  userId: string,
  provider: CloudProviderId,
  ref: { fileId?: string; url?: string },
): Promise<CloudImportBytes> {
  if (provider === "dropbox") {
    throw new CloudProviderError("Dropbox import is not available yet.", {
      code: "NOT_IMPLEMENTED",
      status: 501,
    });
  }

  const fileId = ref.fileId?.trim() || (ref.url ? parseDriveFileId(ref.url) : null);
  if (!fileId) {
    throw new CloudProviderError("Provide a Drive file or paste a Drive link.", {
      code: "MISSING_FILE",
      status: 400,
    });
  }

  try {
    return await importDriveFile(userId, fileId);
  } catch (err) {
    mapDriveError(err);
  }
}
