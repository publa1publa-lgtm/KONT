import { NextResponse } from "next/server";
import { AuditAction, ContentStatus, Prisma } from "@prisma/client";

import { internalError } from "@/lib/api/errors";
import { asMediaIds, setContentMainMedia } from "@/lib/media/link";
import { publishContentTargets } from "@/lib/publish/run";
import { toMediaAssetDto } from "@/lib/media/dto";
import { auditContextFromRequest, writeAudit } from "@/lib/audit";
import { asRecord, asString, asStringArray } from "@/lib/api/parse";
import { badRequest, json, notFound } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import { parseContentListPageSize, parseContentStatus } from "@/lib/api/contentParse";
import * as contentRepo from "@/lib/repos/contentRepo";

function parseScheduledAt(raw: string | null | undefined): Date | null {
  if (!raw || !raw.trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function listContent(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const url = new URL(req.url);
  const limit = parseContentListPageSize(url.searchParams.get("limit"));
  const cursor = url.searchParams.get("cursor");

  const rows = await contentRepo.listContentWithMedia({
    userId,
    take: limit + 1,
    cursor,
  });

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

  const items = page.map((c) => {
    const { media, ...rest } = c;
    return {
      ...rest,
      media: media.map((cm) => ({
        id: cm.id,
        role: cm.role,
        position: cm.position,
        media: toMediaAssetDto(cm.media),
      })),
    };
  });

  return json({ items, nextCursor });
}

export async function createContent(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const body = asRecord(await req.json().catch(() => null));
  if (!body) return badRequest("Invalid JSON body");

  const typeRaw = body.type ?? body.kind;
  const type = typeRaw === "REEL" ? "REEL" : typeRaw === "POST" ? "POST" : null;
  if (!type) return badRequest("type must be POST or REEL");

  const title = (asString(body.title) ?? "").trim();
  if (!title) return badRequest("title is required");

  const hashtags = asStringArray(body.hashtags);
  const tags = asStringArray(body.tags);

  const scheduledAt = parseScheduledAt(asString(body.scheduledAt));

  const metaRaw = body.metadata;
  const metadata =
    metaRaw !== undefined && metaRaw !== null && typeof metaRaw === "object" && !Array.isArray(metaRaw)
      ? metaRaw
      : undefined;

  const status = parseContentStatus(body.status) ?? ContentStatus.DRAFT;

  const mediaIds = asMediaIds(body.mediaIds);
  if (body.mediaIds !== undefined && mediaIds === null) {
    return badRequest("mediaIds must be string[]");
  }

  try {
    const created = await contentRepo.createContentRecord({
      userId,
      type,
      status,
      title,
      text: asString(body.text) ?? null,
      description: asString(body.description) ?? null,
      imageUrl: asString(body.imageUrl) ?? null,
      videoUrl: asString(body.videoUrl) ?? null,
      hashtags,
      tags,
      scheduledAt,
      ...(metadata !== undefined ? { metadata } : {}),
    });

    if (mediaIds && mediaIds.length > 0) {
      const linkResult = await setContentMainMedia({ contentId: created.id, userId, mediaIds });
      if (!linkResult.ok) {
        await contentRepo.hardDeleteContent(created.id).catch(() => {});
        return json({ error: linkResult.error }, linkResult.status);
      }
    }

    void publishContentTargets(userId, created.id).catch((err) =>
      console.error("[content.create] background publish failed", err),
    );

    void writeAudit({
      userId,
      ...auditContextFromRequest(req),
      action: AuditAction.CONTENT_CREATED,
      entityType: "Content",
      entityId: created.id,
      metadata: { type: created.type, status: created.status },
    });

    const fresh = await contentRepo.findContentById(created.id);
    return json({ ...(fresh ?? created), publishing: true }, 201);
  } catch (e) {
    return internalError("[POST /api/content]", e, "Could not create content");
  }
}

export async function patchContent(req: Request, params: Promise<{ id: string }>): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  if (!id) return badRequest("Missing id");

  const existing = await contentRepo.findOwnedContent(id, userId);
  if (!existing) return notFound();

  const body = asRecord(await req.json().catch(() => null));
  if (!body) return badRequest("Invalid JSON body");

  const data: Prisma.ContentUpdateInput = {};

  if ("title" in body) {
    const title = (asString(body.title) ?? "").trim();
    if (!title) return badRequest("title cannot be empty");
    data.title = title;
  }

  if ("text" in body) data.text = asString(body.text) ?? null;
  if ("description" in body) data.description = asString(body.description) ?? null;
  if ("imageUrl" in body) data.imageUrl = asString(body.imageUrl) ?? null;
  if ("videoUrl" in body) data.videoUrl = asString(body.videoUrl) ?? null;

  if ("hashtags" in body) data.hashtags = asStringArray(body.hashtags);

  if ("tags" in body) data.tags = asStringArray(body.tags);

  if ("scheduledAt" in body) {
    data.scheduledAt = parseScheduledAt(asString(body.scheduledAt));
  }

  if ("metadata" in body) {
    const metaRaw = body.metadata;
    const metadata =
      metaRaw !== undefined && metaRaw !== null && typeof metaRaw === "object" && !Array.isArray(metaRaw)
        ? metaRaw
        : metaRaw === null
          ? Prisma.JsonNull
          : undefined;
    if (metadata !== undefined) data.metadata = metadata;
  }

  if ("status" in body) {
    const st = parseContentStatus(body.status);
    if (st === undefined) return badRequest("Invalid status");
    data.status = st;
  }

  let mediaIds: string[] | null = null;
  if ("mediaIds" in body) {
    mediaIds = asMediaIds(body.mediaIds);
    if (mediaIds === null) return badRequest("mediaIds must be string[]");
  }

  if (Object.keys(data).length === 0 && mediaIds === null) {
    return badRequest("No fields to update");
  }

  try {
    if (Object.keys(data).length > 0) {
      await contentRepo.updateContentRecord(id, data);
    }

    if (mediaIds !== null) {
      const linkResult = await setContentMainMedia({ contentId: id, userId, mediaIds });
      if (!linkResult.ok) {
        return json({ error: linkResult.error }, linkResult.status);
      }
    }

    void publishContentTargets(userId, id).catch((err) =>
      console.error("[content.patch] background publish failed", err),
    );

    void writeAudit({
      userId,
      ...auditContextFromRequest(req),
      action: AuditAction.CONTENT_UPDATED,
      entityType: "Content",
      entityId: id,
      metadata: { fields: Object.keys(data) },
    });

    const fresh = await contentRepo.findContentById(id);
    return json({ ...fresh, publishing: true });
  } catch (e) {
    return internalError("[PATCH /api/content/:id]", e, "Could not update content");
  }
}

export async function deleteContent(req: Request, params: Promise<{ id: string }>): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  if (!id) return badRequest("Missing id");

  const existing = await contentRepo.findOwnedContent(id, userId);
  if (!existing) return notFound();

  await contentRepo.softDeleteContent(id);

  void writeAudit({
    userId,
    ...auditContextFromRequest(req),
    action: AuditAction.CONTENT_DELETED,
    entityType: "Content",
    entityId: id,
  });

  return new NextResponse(null, { status: 204 });
}
