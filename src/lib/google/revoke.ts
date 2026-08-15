import "server-only";

const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

/** Best-effort revoke at Google. Failures are ignored so local wipe still proceeds. */
export async function revokeGoogleGrant(token: string): Promise<void> {
  const trimmed = token.trim();
  if (!trimmed) return;
  await fetch(GOOGLE_REVOKE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token: trimmed }),
    cache: "no-store",
  });
}
