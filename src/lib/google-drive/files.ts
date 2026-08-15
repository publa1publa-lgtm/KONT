import "server-only";

import { classifyMime, mimeForExtension } from "@/lib/media/limits";
import { getValidAccessToken } from "./client";
import { GoogleDriveError } from "./types";
import type { CloudFile, CloudFileKind, CloudImportBytes, CloudListResult } from "@/lib/cloud/types";

const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";

type DriveFileResource = {
  id?: string;
  name?: string;
  mimeType?: string;
  size?: string;
  modifiedTime?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  iconLink?: string;
};

type DriveListResponse = {
  files?: DriveFileResource[];
  nextPageToken?: string;
};

function guessMime(name: string, mimeType: string | undefined): string {
  const given = (mimeType || "").toLowerCase();
  if (given && !given.startsWith("application/vnd.google-apps")) return given;
  const ext = name.split(".").pop() || "";
  if (ext && ext !== name) return mimeForExtension(ext);
  return given;
}

function toCloudFile(item: DriveFileResource): CloudFile | null {
  const id = item.id?.trim();
  const name = item.name?.trim();
  if (!id || !name) return null;
  const mimeType = guessMime(name, item.mimeType);
  if (!classifyMime(mimeType)) return null;
  const sizeRaw = item.size ? Number.parseInt(item.size, 10) : NaN;
  return {
    id,
    provider: "googleDrive",
    name,
    mimeType,
    sizeBytes: Number.isFinite(sizeRaw) ? sizeRaw : null,
    modifiedAt: item.modifiedTime ?? null,
    thumbnailUrl: item.thumbnailLink ?? item.iconLink ?? null,
    webViewUrl: item.webViewLink ?? null,
  };
}

function kindQuery(kind: CloudFileKind): string {
  if (kind === "video") {
    return "(mimeType contains 'video/' or mimeType = 'video/mp4' or mimeType = 'video/quicktime' or mimeType = 'video/webm')";
  }
  return "(mimeType contains 'image/' or mimeType = 'image/jpeg' or mimeType = 'image/png' or mimeType = 'image/webp' or mimeType = 'image/gif')";
}

export function parseDriveFileId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) && !trimmed.includes("/") && !trimmed.includes(" ")) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    const fromPath = url.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fromPath?.[1]) return fromPath[1];
    const id = url.searchParams.get("id");
    if (id && /^[a-zA-Z0-9_-]{10,}$/.test(id)) return id;
  } catch {
    // not a URL
  }
  return null;
}

export async function listDriveMediaFiles(
  userId: string,
  options: { kind: CloudFileKind; query?: string; pageToken?: string },
): Promise<CloudListResult> {
  const accessToken = await getValidAccessToken(userId);
  const qParts = ["trashed = false", kindQuery(options.kind)];
  const search = options.query?.trim();
  if (search) {
    const escaped = search.replaceAll("\\", "\\\\").replaceAll("'", "\\'");
    qParts.push(`name contains '${escaped}'`);
  }

  const url = new URL(DRIVE_FILES_URL);
  url.searchParams.set("q", qParts.join(" and "));
  url.searchParams.set("pageSize", "40");
  url.searchParams.set("orderBy", "modifiedTime desc");
  url.searchParams.set(
    "fields",
    "nextPageToken,files(id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink,iconLink)",
  );
  url.searchParams.set("supportsAllDrives", "true");
  url.searchParams.set("includeItemsFromAllDrives", "true");
  if (options.pageToken) url.searchParams.set("pageToken", options.pageToken);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as DriveListResponse | { error?: { message?: string } } | null;

  if (!res.ok) {
    throw new GoogleDriveError(
      (body && "error" in body && body.error?.message) || "Failed to list Google Drive files.",
      { code: "DRIVE_LIST", status: res.status, details: body },
    );
  }

  const listed = (body as DriveListResponse).files ?? [];
  const files = listed.map(toCloudFile).filter((item): item is CloudFile => item !== null);
  return {
    files,
    nextPageToken: (body as DriveListResponse).nextPageToken ?? null,
  };
}

export async function importDriveFile(userId: string, fileId: string): Promise<CloudImportBytes> {
  const accessToken = await getValidAccessToken(userId);
  const metaUrl = new URL(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}`);
  metaUrl.searchParams.set("fields", "id,name,mimeType,size,webViewLink");
  metaUrl.searchParams.set("supportsAllDrives", "true");

  const metaRes = await fetch(metaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const meta = (await metaRes.json().catch(() => null)) as DriveFileResource | { error?: { message?: string } } | null;
  if (!metaRes.ok) {
    throw new GoogleDriveError(
      (meta && "error" in meta && meta.error?.message) || "Could not read that Drive file.",
      { code: "DRIVE_FILE", status: metaRes.status, details: meta },
    );
  }

  const resource = meta as DriveFileResource;
  const name = resource.name?.trim() || "drive-file";
  const mimeType = guessMime(name, resource.mimeType);
  if (!classifyMime(mimeType)) {
    throw new GoogleDriveError("That Drive file is not a supported image or video.", {
      code: "DRIVE_UNSUPPORTED",
      status: 415,
    });
  }

  const mediaUrl = new URL(`${DRIVE_FILES_URL}/${encodeURIComponent(fileId)}`);
  mediaUrl.searchParams.set("alt", "media");
  mediaUrl.searchParams.set("supportsAllDrives", "true");

  const mediaRes = await fetch(mediaUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!mediaRes.ok) {
    const errBody = await mediaRes.text().catch(() => "");
    throw new GoogleDriveError("Could not download that Drive file.", {
      code: "DRIVE_DOWNLOAD",
      status: mediaRes.status,
      details: errBody.slice(0, 500),
    });
  }

  const data = Buffer.from(await mediaRes.arrayBuffer());
  return {
    data,
    mimeType,
    filename: name,
    origin: {
      provider: "googleDrive",
      fileId,
      label: name,
      webViewUrl: resource.webViewLink ?? `https://drive.google.com/file/d/${fileId}/view`,
    },
  };
}
