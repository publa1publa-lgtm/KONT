import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { AuditAction, MediaStatus } from "@prisma/client";

import { getStorage } from "@/lib/storage";
import { sha256Hex } from "@/lib/media/checksum";
import { classifyMime, extensionFor, maxBytesFor } from "@/lib/media/limits";
import { toMediaAssetDto } from "@/lib/media/dto";
import { auditContextFromRequest, writeAudit } from "@/lib/audit";
import { internalError } from "@/lib/api/errors";
import { badRequest, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import * as mediaRepo from "@/lib/repos/mediaRepo";

function intField(form: FormData, name: string): number | null {
  const v = form.get(name);
  if (typeof v !== "string") return null;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function strField(form: FormData, name: string): string | null {
  const v = form.get(name);
  return typeof v === "string" && v.length > 0 ? v : null;
}

export async function uploadMedia(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Invalid multipart body");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return badRequest("file is required");
  }

  const mime = (file.type || "").toLowerCase();
  const kind = classifyMime(mime);
  if (!kind) {
    return json({ error: `Unsupported media type: ${mime || "unknown"}` }, 415);
  }

  const cap = maxBytesFor(kind);
  if (file.size > cap) {
    return json({ error: `File too large (${file.size} > ${cap} bytes)` }, 413);
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) {
    return badRequest("Empty file");
  }

  const checksum = sha256Hex(buf);

  const existing = await mediaRepo.findReadyMediaByUserChecksum(userId, checksum);
  if (existing) {
    return json({ media: toMediaAssetDto(existing), deduped: true }, 200);
  }

  const ext = extensionFor(mime);
  const objectId = randomUUID();
  const storageKey = `users/${userId}/${objectId}.${ext}`;

  const storage = getStorage();
  let stored;
  try {
    stored = await storage.put(storageKey, buf, mime);
  } catch (e) {
    console.error("[POST /api/upload] storage.put failed", e);
    return json({ error: "Storage failure" }, 500);
  }

  const filename = (file.name || `upload.${ext}`).slice(0, 255);
  const width = intField(form, "width");
  const height = intField(form, "height");
  const durationMs = intField(form, "durationMs");
  const posterUrl = strField(form, "posterUrl");

  try {
    const created = await mediaRepo.createMediaAsset({
      userId,
      kind,
      status: MediaStatus.READY,
      storageProvider: stored.provider,
      storageKey: stored.key,
      url: stored.url,
      filename,
      mimeType: mime,
      sizeBytes: BigInt(buf.length),
      width,
      height,
      durationMs,
      posterUrl,
      checksumSha256: checksum,
    });

    void writeAudit({
      userId,
      ...auditContextFromRequest(req),
      action: AuditAction.MEDIA_UPLOADED,
      entityType: "MediaAsset",
      entityId: created.id,
      metadata: { kind, mimeType: mime, sizeBytes: buf.length },
    });

    return json({ media: toMediaAssetDto(created), deduped: false }, 201);
  } catch (e) {
    await storage.delete(stored.key).catch(() => {});
    return internalError("[POST /api/upload]", e, "Could not save upload");
  }
}
