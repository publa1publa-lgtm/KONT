import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isValidLocale,
  localeFromPathname,
  withLocale,
  type AppLocale,
} from "@/i18n/config";
import { rejectCrossOriginApiMutation } from "@/lib/api/origin";

const SESSION_COOKIE = "cf_session";

function pickLocale(req: NextRequest): AppLocale {
  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  if (isValidLocale(cookie)) return cookie;

  const accept = req.headers.get("accept-language") ?? "";
  const lowered = accept.toLowerCase();
  if (lowered.includes("he")) return "he";
  if (lowered.includes("ru")) return "ru";
  return DEFAULT_LOCALE;
}

function isStaticOrApi(pathname: string): boolean {
  if (pathname.startsWith("/api")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/brand")) return true;
  if (pathname.startsWith("/fonts")) return true;
  if (pathname.startsWith("/icons")) return true;
  if (/\.[a-zA-Z0-9]+$/.test(pathname)) return true;
  return false;
}

export function middleware(req: NextRequest) {
  const csrfBlock = rejectCrossOriginApiMutation(req);
  if (csrfBlock) return csrfBlock;

  const { pathname } = req.nextUrl;

  if (isStaticOrApi(pathname)) {
    return NextResponse.next();
  }

  const pathLocale = localeFromPathname(pathname);

  // `/` or `/studio` → `/{locale}/...`
  if (!pathLocale) {
    const locale = pickLocale(req);
    const url = req.nextUrl.clone();
    url.pathname = withLocale(locale, pathname === "/" ? "/" : pathname);
    const res = NextResponse.redirect(url);
    res.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    return res;
  }

  // Protect studio behind auth
  const withoutLocale = pathname.replace(new RegExp(`^/${pathLocale}`), "") || "/";
  if (withoutLocale === "/studio" || withoutLocale.startsWith("/studio/")) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    if (!token) {
      const url = req.nextUrl.clone();
      url.pathname = withLocale(pathLocale, "/login");
      url.search = "";
      url.searchParams.set("next", `${withoutLocale}${req.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-kont-locale", pathLocale);

  const res = NextResponse.next({
    request: { headers: requestHeaders },
  });
  res.cookies.set(LOCALE_COOKIE, pathLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
