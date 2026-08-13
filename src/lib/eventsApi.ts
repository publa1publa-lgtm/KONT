export const EVENTS_LIST_CHANGED_EVENT = "kont-plan-events-changed";

export type EventApiItem = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  showDescription: boolean;
  color: string;
  scheduledAt: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type FetchEventsResult = {
  items: EventApiItem[];
  nextCursor: string | null;
  unauthorized: boolean;
};

function normalizeEvent(raw: Record<string, unknown>): EventApiItem {
  return {
    id: String(raw.id),
    userId: String(raw.userId),
    title: String(raw.title ?? ""),
    description: raw.description == null ? null : String(raw.description),
    showDescription: raw.showDescription === true,
    color: String(raw.color ?? "amber"),
    scheduledAt:
      typeof raw.scheduledAt === "string"
        ? raw.scheduledAt
        : raw.scheduledAt instanceof Date
          ? raw.scheduledAt.toISOString()
          : String(raw.scheduledAt),
    archivedAt:
      raw.archivedAt == null
        ? null
        : typeof raw.archivedAt === "string"
          ? raw.archivedAt
          : raw.archivedAt instanceof Date
            ? raw.archivedAt.toISOString()
            : String(raw.archivedAt),
    createdAt:
      typeof raw.createdAt === "string"
        ? raw.createdAt
        : raw.createdAt instanceof Date
          ? raw.createdAt.toISOString()
          : String(raw.createdAt),
    updatedAt:
      typeof raw.updatedAt === "string"
        ? raw.updatedAt
        : raw.updatedAt instanceof Date
          ? raw.updatedAt.toISOString()
          : String(raw.updatedAt),
    deletedAt:
      raw.deletedAt == null
        ? null
        : typeof raw.deletedAt === "string"
          ? raw.deletedAt
          : String(raw.deletedAt),
  };
}

export async function fetchEvents(options: { limit?: number; cursor?: string | null } = {}): Promise<FetchEventsResult> {
  const params = new URLSearchParams();
  if (options.limit) params.set("limit", String(options.limit));
  if (options.cursor) params.set("cursor", options.cursor);
  const qs = params.toString();

  const r = await fetch(`/api/events${qs ? `?${qs}` : ""}`);
  if (r.ok) {
    const d = (await r.json()) as { items?: unknown[]; nextCursor?: string | null };
    const items = Array.isArray(d.items)
      ? d.items
          .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
          .map(normalizeEvent)
      : [];
    return { items, nextCursor: d.nextCursor ?? null, unauthorized: false };
  }
  if (r.status === 401) {
    return { items: [], nextCursor: null, unauthorized: true };
  }
  const err = (await r.json().catch(() => null)) as { error?: string } | null;
  throw new Error(err?.error ?? "Failed to load events");
}

export type CreateEventBody = {
  title: string;
  description?: string | null;
  showDescription?: boolean;
  color?: string;
  scheduledAt: string;
};

export async function createEvent(body: CreateEventBody): Promise<EventApiItem> {
  const r = await fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 401) throw new Error("Unauthorized");
  if (!r.ok) {
    const err = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? "Failed to save event");
  }
  return normalizeEvent((await r.json()) as Record<string, unknown>);
}

export type UpdateEventBody = Partial<{
  title: string;
  description: string | null;
  showDescription: boolean;
  color: string;
  scheduledAt: string;
  archived: boolean;
}>;

export async function updateEvent(id: string, body: UpdateEventBody): Promise<EventApiItem> {
  const r = await fetch(`/api/events/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (r.status === 401) throw new Error("Unauthorized");
  if (r.status === 404) throw new Error("Not found");
  if (!r.ok) {
    const err = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? "Failed to update event");
  }
  return normalizeEvent((await r.json()) as Record<string, unknown>);
}

export async function deleteEvent(id: string): Promise<void> {
  const r = await fetch(`/api/events/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (r.status === 401) throw new Error("Unauthorized");
  if (r.status === 404) throw new Error("Not found");
  if (!r.ok) {
    const err = (await r.json().catch(() => null)) as { error?: string } | null;
    throw new Error(err?.error ?? "Failed to delete event");
  }
}

export function notifyEventsListChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(EVENTS_LIST_CHANGED_EVENT));
}
