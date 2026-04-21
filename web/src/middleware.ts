import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { resolvePublicAppOrigin } from "@/lib/public_origin";
import { SessionRole } from "@/lib/auth_types";
import { isExplicitTestAuthEnabled } from "@/lib/dev-auth-flags";
import { resolveLandingRoute } from "@/lib/landing-route";
import { decodeSessionCookie } from "@/lib/session_cookie";

const PUBLIC_ROUTES = new Set(["/login", "/login/oidc-complete", "/admin-login", "/admin/login", "/signup", "/verify-email/resend", "/"]);

function isTestAuthEnabled(): boolean {
  return isExplicitTestAuthEnabled();
}

function isAdminRoute(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isTenantRoute(pathname: string): boolean {
  return !isAdminRoute(pathname);
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.has(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get("grove_session");
  if (!session?.value) {
    const loginUrl = new URL("/login", resolvePublicAppOrigin(request));
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const decoded = await decodeSessionCookie(session.value, { allowUnsignedTestSession: isTestAuthEnabled() });
  if (!decoded) {
    const loginUrl = new URL("/login", resolvePublicAppOrigin(request));
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminRoute(pathname) && decoded.role !== SessionRole.SuperAdmin) {
    return NextResponse.redirect(new URL("/", resolvePublicAppOrigin(request)));
  }

  if (isTenantRoute(pathname) && decoded.role === SessionRole.SuperAdmin) {
    return NextResponse.redirect(new URL(resolveLandingRoute(decoded.role), resolvePublicAppOrigin(request)));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
