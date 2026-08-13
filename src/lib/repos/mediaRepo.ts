import { MediaKind, MediaStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function findReadyMediaByUserChecksum(userId: string, checksumSha256: string) {
  return prisma.mediaAsset.findFirst({
    where: { userId, checksumSha256, deletedAt: null, status: MediaStatus.READY },
  });
}

export async function createMediaAsset(data: {
  userId: string;
  kind: MediaKind;
  status: MediaStatus;
  storageProvider: string;
  storageKey: string;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: bigint;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  posterUrl: string | null;
  checksumSha256: string;
}) {
  return prisma.mediaAsset.create({ data });
}

export async function findMediaAssetForProxy(storageKey: string) {
  return prisma.mediaAsset.findUnique({
    where: { storageKey },
    select: {
      id: true,
      userId: true,
      mimeType: true,
      deletedAt: true,
      status: true,
      sizeBytes: true,
    },
  });
}
