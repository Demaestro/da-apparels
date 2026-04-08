/**
 * Next.js Edge Middleware — Route protection
 *
 * Guards:
 *  /admin/*   — requires da_refresh cookie AND da_role cookie == ADMIN | SUPER_ADMIN
 *  /account/* — requires da_refresh cookie (any authenticated user)
 *
 * Note: da_refresh is an HttpOnly cookie set by the API on login; middleware
 * can read it but JS in the browser cannot (XSS-safe).
 * da_role is a plain (non-HttpOnly) cookie set by the frontend auth layer so
 * that this Edge middleware can see the user's role without decoding a JWT.
 * It is NOT trusted for actual data access — the API enforces roles via JWT.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const refreshCookie = request.cookies.get("da_refresh");
  const roleCookie = request.cookies.get("da_role");
  const isAuthenticated = Boolean(refreshCookie?.value);
  const role = roleCookie?.value ?? "";

  // ── /admin/* ─────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated || !ADMIN_ROLES.has(role)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── /account/* ───────────────────────────────────────────────────────────
  if (pathname.startsWith("/account")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on admin and account paths; skip static assets and API routes
  matcher: ["/admin/:path*", "/account/:path*"],
};
