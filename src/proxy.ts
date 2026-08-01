import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { GATE_COOKIE, isSiteGateEnabled, isValidGateToken } from "@/lib/site-gate";

const intlMiddleware = createMiddleware(routing);

const PUBLIC_PREFIXES = ["/admin", "/api/clover", "/api/cron", "/images"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || /\.[a-zA-Z0-9]+$/.test(pathname)) {
    return NextResponse.next();
  }

  if (pathname === "/coming-soon" || pathname.startsWith("/api/site-gate")) {
    if (!isSiteGateEnabled()) {
      if (pathname === "/coming-soon") {
        return NextResponse.redirect(new URL("/fr", request.url));
      }
      return NextResponse.next();
    }
    const token = request.cookies.get(GATE_COOKIE)?.value;
    const hasAccess = await isValidGateToken(token);
    if (hasAccess && pathname === "/coming-soon") {
      return NextResponse.redirect(new URL("/fr", request.url));
    }
    return NextResponse.next();
  }

  if (!isSiteGateEnabled()) {
    return intlMiddleware(request);
  }

  const token = request.cookies.get(GATE_COOKIE)?.value;
  const hasAccess = await isValidGateToken(token);

  if (!hasAccess && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/coming-soon";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|admin|.*\\..*).*)", "/coming-soon", "/api/site-gate"],
};
