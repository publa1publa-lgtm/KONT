import { AuditAction } from "@prisma/client";
import { NextResponse } from "next/server";

import { auditContextFromRequest, writeAudit } from "@/lib/audit";
import { json, readJsonRecord } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import { CloudProviderError, isCloudProviderId } from "@/lib/cloud/types";
import { importCloudFile } from "@/lib/cloud/providers";
import { persistMediaBuffer } from "@/lib/media/persist";
import { toMediaAssetDto } from "@/lib/media/dto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const body = await readJsonRecord(req);
  if (!body) return json({ error: "Invalid JSON body" }, 400);

  const providerRaw = typeof body.provider === "string" ? body.provider : "googleDrive";
  if (!isCloudProviderId(providerRaw)) {
    return json({ error: "Unknown cloud provider." }, 400);
  }

  const fileId = typeof body.fileId === "string" ? body.fileId : undefined;
  const url = typeof body.url === "string" ? body.url : undefined;

  try {
    const imported = await importCloudFile(userId, providerRaw, { fileId, url });
    const saved = await persistMediaBuffer({
      userId,
      data: imported.data,
      mimeType: imported.mimeType,
      filename: imported.filename,
      origin: imported.origin,
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
        metadata: {
          kind: saved.asset.kind,
          origin: imported.origin.provider,
          originFileId: imported.origin.fileId,
          sizeBytes: imported.data.length,
        },
      });
    }

    return json(
      { media: toMediaAssetDto(saved.asset), origin: imported.origin, deduped: saved.deduped },
      saved.deduped ? 200 : 201,
    );
  } catch (err) {
    if (err instanceof CloudProviderError) {
      return json({ error: err.message, code: err.code }, err.status);
    }
    console.error("[cloud.import]", err);
    return json({ error: "Could not import from cloud." }, 500);
  }
}
