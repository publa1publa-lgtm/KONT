import { NextResponse } from "next/server";
import { clientKeyFromRequest, rateLimit, type RateLimitOptions } from "./rateLimit";
import { tooManyRequests } from "./http";

type RouteHandler = (req: Request, ...args: unknown[]) => Promise<NextResponse>;

export function withRateLimit(
  prefix: string,
  opts: RateLimitOptions,
  handler: RouteHandler,
): RouteHandler {
  return async (req: Request, ...args: unknown[]) => {
    const rl = await rateLimit(clientKeyFromRequest(req, prefix), opts);
    if (!rl.ok) return tooManyRequests(rl.retryAfterSec);
    return handler(req, ...args);
  };
}
