import "server-only";

/** Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` when CRON_SECRET is set. */
export function verifyCronSecret(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
