import { AuditAction } from "@prisma/client";
import { NextResponse } from "next/server";

import { persistMediaBuffer } from "@/lib/media/persist";
import { toMediaAssetDto } from "@/lib/media/dto";
import { auditContextFromRequest, writeAudit } from "@/lib/audit";
import { badRequest, json } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";

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
  const buf = Buffer.from(await file.arrayBuffer());
  const filename = (file.name || "upload").slice(0, 255);

  const saved = await persistMediaBuffer({
    userId,
    data: buf,
    mimeType: mime,
    filename,
    originProvider: "local",
    width: intField(form, "width"),
    height: intField(form, "height"),
    durationMs: intField(form, "durationMs"),
    posterUrl: strField(form, "posterUrl"),
  });

  if (!saved.ok) {
    return json({ error: saved.error }, saved.status);
  }

  if (!saved.deduped) {
    void writeAudit({
      userId,
      ...auditContextFromRequest(req),
      action: AuditAction.MEDIA_UPLOADED,
      entityType: "MediaAsset",
      entityId: saved.asset.id,
      metadata: { kind: saved.asset.kind, mimeType: mime, sizeBytes: buf.length, origin: "local" },
    });
  }

  return json({ media: toMediaAssetDto(saved.asset), deduped: saved.deduped }, saved.deduped ? 200 : 201);
}
