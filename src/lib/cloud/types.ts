export const CLOUD_PROVIDER_IDS = ["googleDrive", "dropbox"] as const;

export type CloudProviderId = (typeof CLOUD_PROVIDER_IDS)[number];

export type MediaOriginProvider = "local" | CloudProviderId;

export type CloudFileKind = "image" | "video";

export type CloudFile = {
  id: string;
  provider: CloudProviderId;
  name: string;
  mimeType: string;
  sizeBytes: number | null;
  modifiedAt: string | null;
  thumbnailUrl: string | null;
  webViewUrl: string | null;
};

export type CloudMediaOrigin = {
  provider: CloudProviderId;
  fileId: string;
  label: string;
  webViewUrl: string | null;
};

export type CloudListResult = {
  files: CloudFile[];
  nextPageToken: string | null;
  /** Empty-state hint: browse limited by OAuth scopes, etc. */
  hint?: "reconnect_readonly" | "not_connected" | "not_implemented";
};

export type CloudImportBytes = {
  data: Buffer;
  mimeType: string;
  filename: string;
  origin: CloudMediaOrigin;
};

export function isCloudProviderId(value: string): value is CloudProviderId {
  return (CLOUD_PROVIDER_IDS as readonly string[]).includes(value);
}

export function cloudProviderLabel(provider: CloudProviderId): string {
  switch (provider) {
    case "googleDrive":
      return "Google Drive";
    case "dropbox":
      return "Dropbox";
  }
}

export class CloudProviderError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = "CloudProviderError";
    this.code = options?.code ?? "CLOUD_ERROR";
    this.status = options?.status ?? 500;
  }
}
