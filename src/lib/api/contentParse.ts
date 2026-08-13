import { ContentStatus } from "@prisma/client";

import { asString } from "@/lib/api/parse";

export const CONTENT_LIST_DEFAULT_PAGE_SIZE = 50;
export const CONTENT_LIST_MAX_PAGE_SIZE = 100;

export function parseContentListPageSize(param: string | null): number {
  if (!param) return CONTENT_LIST_DEFAULT_PAGE_SIZE;
  const n = Number.parseInt(param, 10);
  if (!Number.isFinite(n) || n <= 0) return CONTENT_LIST_DEFAULT_PAGE_SIZE;
  return Math.min(n, CONTENT_LIST_MAX_PAGE_SIZE);
}

export function parseContentStatus(v: unknown): ContentStatus | undefined {
  const s = asString(v);
  if (s === "DRAFT") return ContentStatus.DRAFT;
  if (s === "READY") return ContentStatus.READY;
  if (s === "SCHEDULED") return ContentStatus.SCHEDULED;
  if (s === "ARCHIVED") return ContentStatus.ARCHIVED;
  return undefined;
}
