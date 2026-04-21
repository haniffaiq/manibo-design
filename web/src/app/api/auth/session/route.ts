import { NextRequest, NextResponse } from "next/server";

import { isSessionRole, SessionRole } from "@/lib/auth_types";
import { resolveLandingRoute } from "@/lib/landing-route";
import { resolveServerLandingRoute } from "@/lib/landing-route-server";
import { describeUpstreamLoginFailure } from "@/lib/login-error-copy";
import { PLATFORM_API_TOKEN_COOKIE, SESSION_COOKIE, resolveCookieMaxAgeSeconds, resolveServerApiBaseUrl } from "@/lib/platform_auth";
import { assertSafeDevAuthFlags, isSkipAuthEnabled } from "@/lib/dev-auth-flags";
import { resolveDevSession } from "@/lib/mock/dev-session";
import { shouldUseSecureCookies } from "@/lib/public_origin";
import { decodeJwtExpiry, encodeSignedSession, sanitizeSessionLandingPath } from "@/lib/session_cookie";

type AuthMeResponse = {
  user_id: string;
  tenant_id: string;
  role: SessionRole;
  email?: string | null;
  tenant_name?: string | null;
  landing_path: string;
};

const SERVER_API_BASE_URL = resolveServerApiBaseUrl();

function safeToken(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  return trimmed || null;
}

function isManualTokenLoginEnabled(): boolean {
  assertSafeDevAuthFlags();
  if (process.env.NODE_ENV !== "production") {
    return true;
  }
  if (process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === "true") {
    return true;
  }
  return process.env.GROVE_ENABLE_TOKEN_PASTE_LOGIN === "true";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isManualTokenLoginEnabled()) {
    return NextResponse.json(
      { error: "Token-based sign-in is not available for this deployment." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "The sign-in request was incomplete. Refresh the page and try again." }, { status: 400 });
  }

  const parsed = body as { bearerToken?: unknown; idToken?: unknown; accessToken?: unknown };
  const bearerToken = safeToken(parsed.bearerToken) ?? safeToken(parsed.idToken) ?? safeToken(parsed.accessToken);
  if (!bearerToken) {
    return NextResponse.json({ error: "Paste a sign-in token to continue." }, { status: 400 });
  }

  // Mock-only short-circuit: when SKIP_AUTH=1 is on (design pack mode),
  // accept `dev:<user_uuid>` tokens locally without calling a real backend.
  // See src/lib/mock/dev-session.ts for the recognised dev identities.
  let authPayload: unknown;
  const devSession = isSkipAuthEnabled() ? resolveDevSession(bearerToken) : null;
  if (devSession) {
    authPayload = devSession;
  } else {
    const endpoint = `${SERVER_API_BASE_URL.replace(/\/$/, "")}/auth/session`;
    let authResponse: Response;
    try {
      authResponse = await fetch(endpoint, {
        method: "GET",
        headers: { Authorization: `Bearer ${bearerToken}` },
        cache: "no-store",
      });
    } catch {
      return NextResponse.json(
        { error: "Sign-in is temporarily unavailable. Check your connection and try again." },
        { status: 502 },
      );
    }

    if (!authResponse.ok) {
      const detail = await authResponse.text();
      return NextResponse.json(
        { error: describeUpstreamLoginFailure(authResponse.status, authResponse.statusText, detail) },
        { status: authResponse.status },
      );
    }

    try {
      authPayload = (await authResponse.json()) as unknown;
    } catch {
      return NextResponse.json(
        { error: "Sign-in is temporarily unavailable. Try again in a moment." },
        { status: 502 },
      );
    }
  }

  const userId = (authPayload as { user_id?: unknown }).user_id;
  const tenantId = (authPayload as { tenant_id?: unknown }).tenant_id;
  const role = (authPayload as { role?: unknown }).role;
  const email = (authPayload as { email?: unknown }).email;
  const tenantName = (authPayload as { tenant_name?: unknown }).tenant_name;
  if (
    typeof userId !== "string" ||
    typeof tenantId !== "string" ||
    !isSessionRole(role) ||
    (email !== undefined && email !== null && typeof email !== "string") ||
    (tenantName !== undefined && tenantName !== null && typeof tenantName !== "string")
  ) {
    return NextResponse.json(
      { error: "Your account is missing required platform access. Ask your administrator to review your role setup." },
      { status: 502 },
    );
  }

  const exp = decodeJwtExpiry(bearerToken) ?? Math.floor(Date.now() / 1000) + 900;
  const cookieMaxAge = resolveCookieMaxAgeSeconds(exp);
  const useSecureCookies = shouldUseSecureCookies(request);
  const landingPath = await resolveServerLandingRoute(role, { bearerToken });
  const sessionLandingPath = sanitizeSessionLandingPath(landingPath) ?? resolveLandingRoute(role);
  const sessionValue = await encodeSignedSession({
    userId,
    tenantId,
    role,
    exp,
    ...(sessionLandingPath ? { landingPath: sessionLandingPath } : {}),
    ...(typeof email === "string" ? { email } : {}),
    ...(typeof tenantName === "string" ? { tenantName } : {}),
  });
  if (!sessionValue) {
    return NextResponse.json(
      { error: "Browser sign-in is not configured for this deployment yet. Contact your platform administrator." },
      { status: 500 },
    );
  }

  const response = NextResponse.json({
    user_id: userId,
    tenant_id: tenantId,
    role,
    email: email ?? null,
    tenant_name: typeof tenantName === "string" ? tenantName : null,
    landing_path: sessionLandingPath,
  } satisfies AuthMeResponse);
  response.cookies.set({
    name: SESSION_COOKIE,
    value: sessionValue,
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAge,
  });
  response.cookies.set({
    name: PLATFORM_API_TOKEN_COOKIE,
    value: encodeURIComponent(bearerToken),
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAge,
  });
  return response;
}
