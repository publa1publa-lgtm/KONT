/** Allow only in-app studio URLs after login/register (open redirect safe). */
export function safeStudioRedirect(next: string | null | undefined): string | null {
  if (!next || typeof next !== "string") return null;
  const trimmed = next.trim();
  const normalized = trimmed.startsWith("/cabinet")
    ? trimmed.replace(/^\/cabinet/, "/studio")
    : trimmed.startsWith("/dashboard")
      ? trimmed.replace(/^\/dashboard/, "/studio")
      : trimmed;
  if (!normalized.startsWith("/studio") || normalized.startsWith("//")) return null;
  try {
    const url = new URL(normalized, "http://localhost");
    if (url.pathname !== "/studio" && !url.pathname.startsWith("/studio/")) return null;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

/** @deprecated Use `safeStudioRedirect` */
export const safeDashboardRedirect = safeStudioRedirect;

/** @deprecated Use `safeStudioRedirect` */
export const safeCabinetRedirect = safeStudioRedirect;
