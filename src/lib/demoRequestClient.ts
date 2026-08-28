import type { AppLocale } from "@/i18n/config";

export async function submitDemoRequest(email: string, locale: AppLocale): Promise<{ ok: true } | { ok: false; status: number }> {
  const res = await fetch("/api/demo-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, locale }),
  });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true };
}
