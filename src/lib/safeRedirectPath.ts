import { stripLocalePrefix } from "@/i18n/config";

/** Allow only in-app studio URLs after login/register (open redirect safe). */
export function safeStudioRedirect(next: string | null | undefined): string | null {
  if (!next || typeof next !== "string") return null;
  const trimmed = next.trim();
  // Accept `/studio`, `/en/studio`, legacy `/cabinet` aliases.
  let normalized = stripLocalePrefix(trimmed);
  if (normalized.startsWith("/cabinet")) {
    normalized = normalized.replace(/^\/cabinet/, "/studio");
  } else if (normalized.startsWith("/dashboard")) {
    normalized = normalized.replace(/^\/dashboard/, "/studio");
  }
  if (!normalized.startsWith("/studio") || normalized.startsWith("//")) return null;
  try {
    const url = new URL(normalized, "http://localhost");
    if (url.pathname !== "/studio" && !url.pathname.startsWith("/studio/")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
