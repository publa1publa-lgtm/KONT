import type { AuditAction, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type AuditMetadata = Prisma.InputJsonValue | undefined;

export type AuditContext = {
  userId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export type AuditEntry = AuditContext & {
  action: AuditAction;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: AuditMetadata;
};

export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId ?? null,
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        ip: entry.ip ?? null,
        userAgent: entry.userAgent ?? null,
        ...(entry.metadata !== undefined ? { metadata: entry.metadata } : {}),
      },
    });
  } catch (e) {
    console.error("[audit] failed to write entry", { action: entry.action, error: e });
  }
}

function auditContextFromHeaderValues(
  xff: string | null,
  realIp: string | null,
  userAgent: string | null,
): { ip: string | null; userAgent: string | null } {
  const ip = xff ? (xff.split(",")[0]?.trim() ?? null) : realIp;
  return {
    ip: ip && ip.length > 0 ? ip.slice(0, 64) : null,
    userAgent: userAgent && userAgent.length > 0 ? userAgent.slice(0, 512) : null,
  };
}

export function auditContextFromRequest(req: Request): { ip: string | null; userAgent: string | null } {
  return auditContextFromHeaderValues(
    req.headers.get("x-forwarded-for"),
    req.headers.get("x-real-ip"),
    req.headers.get("user-agent"),
  );
}

export async function auditContextFromServerHeaders(): Promise<{
  ip: string | null;
  userAgent: string | null;
}> {
  const { headers } = await import("next/headers");
  const h = await headers();
  return auditContextFromHeaderValues(
    h.get("x-forwarded-for"),
    h.get("x-real-ip"),
    h.get("user-agent"),
  );
}
