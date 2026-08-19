import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

const limiters = new Map<string, Ratelimit>();

function getOrCreateLimiter(prefix: string, limit: number, windowSec: number): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  const key = `${prefix}:${limit}:${windowSec}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: `rl:${prefix}`,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

// In-memory fallback for dev (when no Redis configured)
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function inMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }
  return { ok: true };
}

export type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

export async function rateLimit(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
  const windowSec = Math.max(1, Math.round(opts.windowMs / 1000));
  const prefix = key.split(":").slice(0, -1).join(":") || key;
  const limiter = getOrCreateLimiter(prefix, opts.limit, windowSec);

  if (!limiter) {
    return inMemoryRateLimit(key, opts.limit, opts.windowMs);
  }

  const result = await limiter.limit(key);
  if (result.success) return { ok: true };
  const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  return { ok: false, retryAfterSec };
}

export function clientKeyFromRequest(req: Request, prefix: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown";
  return `${prefix}:${ip}`;
}
