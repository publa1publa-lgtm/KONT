export type LinkItem = {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
};

export type LinkPagePayload = {
  handle: string;
  title: string;
  bio: string;
  links: LinkItem[];
};

const RESERVED_HANDLES = new Set([
  "api",
  "admin",
  "login",
  "register",
  "studio",
  "cabinet",
  "dashboard",
  "u",
  "www",
  "app",
  "oauth",
  "link",
  "links",
  "settings",
  "billing",
  "support",
  "help",
  "static",
  "assets",
  "_next",
]);

const MAX_LINKS = 35;
const MAX_LABEL = 100;
const MAX_URL = 2048;
const MAX_TITLE = 120;
const MAX_BIO = 500;

export function isValidHandle(handle: string): boolean {
  const h = handle.trim().toLowerCase();
  if (h.length < 3 || h.length > 32) return false;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(h)) return false;
  if (RESERVED_HANDLES.has(h)) return false;
  return true;
}

function normalizeUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  try {
    const u = new URL(t.includes("://") ? t : `https://${t}`);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString().slice(0, MAX_URL);
  } catch {
    return null;
  }
}

export function parseLinkItems(raw: unknown): LinkItem[] {
  if (!Array.isArray(raw)) return [];
  const out: LinkItem[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const id = typeof o.id === "string" && o.id.length > 0 ? o.id : crypto.randomUUID();
    const label = typeof o.label === "string" ? o.label.trim().slice(0, MAX_LABEL) : "";
    const urlRaw = typeof o.url === "string" ? o.url.trim() : "";
    const url = normalizeUrl(urlRaw) ?? "";
    const enabled = o.enabled === false ? false : true;
    if (!label || !url) continue;
    out.push({ id, label, url, enabled });
    if (out.length >= MAX_LINKS) break;
  }
  return out;
}

export function linkItemsToJson(links: LinkItem[]) {
  return links.map(({ id, label, url, enabled }) => ({ id, label, url, enabled }));
}

export type ValidatePutResult =
  | { ok: true; value: LinkPagePayload }
  | { ok: false; error: string; status?: number };

export function validateLinkPagePut(body: unknown): ValidatePutResult {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Invalid JSON body", status: 400 };
  }
  const b = body as Record<string, unknown>;
  const handle = typeof b.handle === "string" ? b.handle.trim().toLowerCase() : "";
  const title = typeof b.title === "string" ? b.title.trim().slice(0, MAX_TITLE) : "";
  const bio = typeof b.bio === "string" ? b.bio.trim().slice(0, MAX_BIO) : "";
  if (!isValidHandle(handle)) {
    return { ok: false, error: "Invalid handle (3–32 chars, lowercase letters, digits, single hyphens).", status: 400 };
  }
  const links = parseLinkItems(b.links);
  return { ok: true, value: { handle, title, bio, links } };
}

export function publicLinkItems(links: LinkItem[]): LinkItem[] {
  return links.filter((l) => l.enabled && l.url);
}
