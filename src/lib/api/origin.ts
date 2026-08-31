import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const META_CALLBACK_PATHS = new Set(["/api/meta/deauthorize", "/api/meta/data-deletion"]);

function forbidden(): NextResponse {
  return NextResponse.json(
    { error: "Forbidden" },
    { status: 403, headers: { "Cache-Control": "private, no-store, must-revalidate" } },
  );
}

export function rejectCrossOriginApiMutation(req: NextRequest): NextResponse | null {
  if (process.env.NODE_ENV !== "production") return null;

  const method = req.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return null;
  if (!req.nextUrl.pathname.startsWith("/api/")) return null;
  if (META_CALLBACK_PATHS.has(req.nextUrl.pathname)) return null;

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (!host) return null;

  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== host) return forbidden();
    } catch {
      return forbidden();
    }
    return null;
  }

  const referer = req.headers.get("referer");
  if (referer) {
    try {
      if (new URL(referer).host !== host) return forbidden();
    } catch {
      return forbidden();
    }
  }

  return null;
}
