import { NextResponse } from "next/server";
import { AuditAction } from "@prisma/client";

import { internalError } from "@/lib/api/errors";
import { auditContextFromRequest, writeAudit } from "@/lib/audit";
import { asRecord, asString } from "@/lib/api/parse";
import { badRequest, json, notFound } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import { CONTENT_LIST_DEFAULT_PAGE_SIZE, CONTENT_LIST_MAX_PAGE_SIZE } from "@/lib/api/contentParse";
import { normalizeEventColor } from "@/lib/eventColors";
import * as eventRepo from "@/lib/repos/eventRepo";

function parsePageSize(param: string | null): number {
  if (!param) return CONTENT_LIST_DEFAULT_PAGE_SIZE;
  const n = Number.parseInt(param, 10);
  if (!Number.isFinite(n) || n <= 0) return CONTENT_LIST_DEFAULT_PAGE_SIZE;
  return Math.min(n, CONTENT_LIST_MAX_PAGE_SIZE);
}

function parseScheduledAt(raw: unknown): Date | null {
  const s = asString(raw);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function listEvents(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const url = new URL(req.url);
  const limit = parsePageSize(url.searchParams.get("limit"));
  const cursor = url.searchParams.get("cursor");

  try {
    const rows = await eventRepo.listPlanEvents({
      userId,
      take: limit + 1,
      cursor,
    });
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;
    return json({ items: page, nextCursor });
  } catch (e) {
    return internalError("[GET /api/events]", e, "Could not load events");
  }
}

export async function createEvent(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const body = asRecord(await req.json().catch(() => null));
  if (!body) return badRequest("Invalid JSON body");

  const title = (asString(body.title) ?? "").trim();
  if (!title) return badRequest("title is required");

  const scheduledAt = parseScheduledAt(body.scheduledAt);
  if (!scheduledAt) return badRequest("scheduledAt is required");

  const descriptionRaw = asString(body.description);
  const description = descriptionRaw?.trim() ? descriptionRaw.trim() : null;
  const color = normalizeEventColor(body.color);
  const showDescription = body.showDescription === true;

  try {
    const created = await eventRepo.createPlanEvent({
      userId,
      title,
      description,
      showDescription,
      color,
      scheduledAt,
    });

    void writeAudit({
      userId,
      ...auditContextFromRequest(req),
      action: AuditAction.EVENT_CREATED,
      entityType: "PlanEvent",
      entityId: created.id,
      metadata: { scheduledAt: created.scheduledAt.toISOString() },
    });

    return json(created, 201);
  } catch (e) {
    return internalError("[POST /api/events]", e, "Could not create event");
  }
}

export async function patchEvent(req: Request, params: Promise<{ id: string }>): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const existing = await eventRepo.findOwnedPlanEvent(id, userId);
  if (!existing) return notFound("Event not found");

  const body = asRecord(await req.json().catch(() => null));
  if (!body) return badRequest("Invalid JSON body");

  const data: {
    title?: string;
    description?: string | null;
    showDescription?: boolean;
    color?: string;
    scheduledAt?: Date;
    archivedAt?: Date | null;
  } = {};

  if (body.title !== undefined) {
    const title = (asString(body.title) ?? "").trim();
    if (!title) return badRequest("title is required");
    data.title = title;
  }

  if (body.description !== undefined) {
    const descriptionRaw = asString(body.description);
    data.description = descriptionRaw?.trim() ? descriptionRaw.trim() : null;
  }

  if (body.showDescription !== undefined) {
    data.showDescription = body.showDescription === true;
  }

  if (body.color !== undefined) {
    data.color = normalizeEventColor(body.color);
  }

  if (body.scheduledAt !== undefined) {
    const scheduledAt = parseScheduledAt(body.scheduledAt);
    if (!scheduledAt) return badRequest("scheduledAt is invalid");
    data.scheduledAt = scheduledAt;
  }

  if (body.archived === true) {
    data.archivedAt = new Date();
  } else if (body.archived === false) {
    data.archivedAt = null;
  }

  try {
    const updated = await eventRepo.updatePlanEvent(id, data);

    void writeAudit({
      userId,
      ...auditContextFromRequest(req),
      action: AuditAction.EVENT_UPDATED,
      entityType: "PlanEvent",
      entityId: updated.id,
    });

    return json(updated);
  } catch (e) {
    return internalError("[PATCH /api/events/:id]", e, "Could not update event");
  }
}

export async function deleteEvent(req: Request, params: Promise<{ id: string }>): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const existing = await eventRepo.findOwnedPlanEvent(id, userId);
  if (!existing) return notFound("Event not found");

  try {
    await eventRepo.softDeletePlanEvent(id);

    void writeAudit({
      userId,
      ...auditContextFromRequest(req),
      action: AuditAction.EVENT_DELETED,
      entityType: "PlanEvent",
      entityId: id,
    });

    return json({ ok: true });
  } catch (e) {
    return internalError("[DELETE /api/events/:id]", e, "Could not delete event");
  }
}
