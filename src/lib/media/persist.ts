import "server-only";

import { randomUUID } from "node:crypto";
import { MediaStatus, type MediaAsset } from "@prisma/client";

import { sha256Hex } from "@/lib/media/checksum";
import { classifyMime, extensionFor, maxBytesFor } from "@/lib/media/limits";
import * as mediaRepo from "@/lib/repos/mediaRepo";
import { getStorage } from "@/lib/storage";
import type { CloudMediaOrigin, MediaOriginProvider } from "@/lib/cloud/types";

export type PersistMediaInput = {
  userId: string;
  data: Buffer;
  mimeType: string;
  filename: string;
  originProvider?: MediaOriginProvider;
  origin?: CloudMediaOrigin | null;
  width?: number | null;
  height?: number | null;
  durationMs?: number | null;
  posterUrl?: string | null;
};

export type PersistMediaResult =
  | { ok: true; asset: MediaAsset; deduped: boolean }
  | { ok: false; error: string; status: number };

export async function persistMediaBuffer(input: PersistMediaInput): Promise<PersistMediaResult> {
  const mime = (input.mimeType || "").toLowerCase();
  const kind = classifyMime(mime);
  if (!kind) {
    return { ok: false, error: `Unsupported media type: ${mime || "unknown"}`, status: 415 };
  }

  if (input.data.length === 0) {
    return { ok: false, error: "Empty file", status: 400 };
  }

  const cap = maxBytesFor(kind);
  if (input.data.length > cap) {
    return { ok: false, error: `File too large (${input.data.length} > ${cap} bytes)`, status: 413 };
  }

  const checksum = sha256Hex(input.data);
  const originProvider = input.origin?.provider ?? input.originProvider ?? "local";
  const existing = await mediaRepo.findReadyMediaByUserChecksum(input.userId, checksum);
  if (existing) {
    if (existing.originProvider === "local" && originProvider !== "local" && input.origin) {
      const stamped = await mediaRepo.updateMediaOrigin(existing.id, {
        originProvider,
        originFileId: input.origin.fileId,
        originLabel: input.origin.label,
        originUrl: input.origin.webViewUrl,
      });
      return { ok: true, asset: stamped ?? existing, deduped: true };
    }
    return { ok: true, asset: existing, deduped: true };
  }

  const ext = extensionFor(mime);
  const objectId = randomUUID();
  const storageKey = `users/${input.userId}/${objectId}.${ext}`;
  const storage = getStorage();

  let stored;
  try {
    stored = await storage.put(storageKey, input.data, mime);
  } catch (e) {
    console.error("[persistMediaBuffer] storage.put failed", e);
    return { ok: false, error: "Storage failure", status: 500 };
  }

  const filename = (input.filename || `upload.${ext}`).slice(0, 255);

  try {
    const created = await mediaRepo.createMediaAsset({
      userId: input.userId,
      kind,
      status: MediaStatus.READY,
      storageProvider: stored.provider,
      storageKey: stored.key,
      url: stored.url,
      filename,
      mimeType: mime,
      sizeBytes: BigInt(input.data.length),
      width: input.width ?? null,
      height: input.height ?? null,
      durationMs: input.durationMs ?? null,
      posterUrl: input.posterUrl ?? null,
      checksumSha256: checksum,
      originProvider,
      originFileId: input.origin?.fileId ?? null,
      originLabel: input.origin?.label ?? (originProvider === "local" ? null : filename),
      originUrl: input.origin?.webViewUrl ?? null,
    });
    return { ok: true, asset: created, deduped: false };
  } catch (e) {
    await storage.delete(stored.key).catch(() => undefined);
    console.error("[persistMediaBuffer] create failed", e);
    return { ok: false, error: "Could not save media", status: 500 };
  }
}
