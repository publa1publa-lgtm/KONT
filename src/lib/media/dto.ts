import type { CloudMediaOrigin, MediaOriginProvider } from "@/lib/cloud/types";
import { isCloudProviderId } from "@/lib/cloud/types";
import type { MediaAsset, MediaKind, MediaStatus } from "@prisma/client";

/** API-level shape of a MediaAsset (BigInt → number, dates → ISO). */
export type MediaAssetDto = {
  id: string;
  kind: MediaKind;
  status: MediaStatus;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  posterUrl: string | null;
  origin: CloudMediaOrigin | null;
  createdAt: string;
};

export function originFromAsset(m: Pick<MediaAsset, "originProvider" | "originFileId" | "originLabel" | "originUrl" | "filename">): CloudMediaOrigin | null {
  const provider = m.originProvider as MediaOriginProvider;
  if (!isCloudProviderId(provider) || !m.originFileId) return null;
  return {
    provider,
    fileId: m.originFileId,
    label: m.originLabel || m.filename,
    webViewUrl: m.originUrl,
  };
}

export function toMediaAssetDto(m: MediaAsset): MediaAssetDto {
  return {
    id: m.id,
    kind: m.kind,
    status: m.status,
    url: m.url,
    filename: m.filename,
    mimeType: m.mimeType,
    sizeBytes: Number(m.sizeBytes),
    width: m.width,
    height: m.height,
    durationMs: m.durationMs,
    posterUrl: m.posterUrl,
    origin: originFromAsset(m),
    createdAt: m.createdAt.toISOString(),
  };
}
