import { timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { readOidcConfig, resolveOidcProvider } from "@/lib/oidc_provider";
import { PlatformTokenPreference } from "@/lib/oidc_types";
import { isSessionRole } from "@/lib/auth_types";
import { resolveLandingRoute } from "@/lib/landing-route";
import { resolveServerLandingRoute } from "@/lib/landing-route-server";
import {
  PLATFORM_API_TOKEN_COOKIE,
  SESSION_COOKIE,
  resolveCookieMaxAgeSeconds,
  resolveServerApiBaseUrl,
  safeDecodeCookieValue,
} from "@/lib/platform_auth";
import { resolvePublicAppOrigin, shouldUseSecureCookies } from "@/lib/public_origin";
import { decodeJwtExpiry, encodeSignedSession, sanitizeSessionLandingPath } from "@/lib/session_cookie";

const OIDC_STATE_COOKIE = "grove_oidc_state";
const OIDC_VERIFIER_COOKIE = "grove_oidc_verifier";
const OIDC_FROM_COOKIE = "grove_oidc_from";
const OIDC_API_BASE_COOKIE = "grove_oidc_api_base";
const OIDC_PROVIDER_COOKIE = "grove_oidc_provider";
const SERVER_API_BASE_URL = resolveServerApiBaseUrl();

function safeRedirectTarget(raw: string | null, fallback: string): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://") || raw.includes("\\")) {
    return fallback;
  }
  return raw;
}

async function resolveTokenEndpoint(config: {
  issuer: string;
  tokenEndpointOverride: string | null;
}): Promise<string> {
  if (config.tokenEndpointOverride) {
    return config.tokenEndpointOverride;
  }
  const discoveryUrl = `${config.issuer}/.well-known/openid-configuration`;
  const response = await fetch(discoveryUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("OIDC discovery failed");
  }
  const payload = (await response.json()) as { token_endpoint?: unknown };
  if (typeof payload.token_endpoint !== "string" || !payload.token_endpoint) {
    throw new Error("OIDC discovery missing token endpoint");
  }
  return payload.token_endpoint;
}

function pickPlatformToken(tokenPayload: unknown, preference: PlatformTokenPreference): string | null {
  const payload = tokenPayload as { id_token?: unknown; access_token?: unknown };
  if (preference === PlatformTokenPreference.IdToken) {
    if (typeof payload.id_token === "string" && payload.id_token.trim()) {
      return payload.id_token.trim();
    }
    return null;
  }
  if (preference === PlatformTokenPreference.AccessToken) {
    if (typeof payload.access_token === "string" && payload.access_token.trim()) {
      return payload.access_token.trim();
    }
    return null;
  }
  if (typeof payload.id_token === "string" && payload.id_token.trim()) {
    return payload.id_token.trim();
  }
  if (typeof payload.access_token === "string" && payload.access_token.trim()) {
    return payload.access_token.trim();
  }
  return null;
}

function buildErrorRedirect(request: NextRequest, message: string): NextResponse {
  const url = new URL("/login", resolvePublicAppOrigin(request));
  url.searchParams.set("error", message);
  const response = NextResponse.redirect(url);
  response.cookies.delete(OIDC_STATE_COOKIE);
  response.cookies.delete(OIDC_VERIFIER_COOKIE);
  response.cookies.delete(OIDC_FROM_COOKIE);
  response.cookies.delete(OIDC_API_BASE_COOKIE);
  response.cookies.delete(OIDC_PROVIDER_COOKIE);
  return response;
}

function readCookie(request: NextRequest, name: string): string | null {
  const value = request.cookies.get(name)?.value;
  if (!value) {
    return null;
  }
  return value;
}

function stateMatches(expected: string, actual: string): boolean {
  const expectedBytes = Buffer.from(expected);
  const actualBytes = Buffer.from(actual);
  if (expectedBytes.length !== actualBytes.length) {
    return false;
  }
  return timingSafeEqual(expectedBytes, actualBytes);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const provider = resolveOidcProvider(readCookie(request, OIDC_PROVIDER_COOKIE));
  const config = readOidcConfig(provider);
  if (!config) {
    return buildErrorRedirect(request, `OIDC is not configured for provider '${provider}'`);
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return buildErrorRedirect(request, "OIDC callback missing code/state");
  }

  const expectedState = readCookie(request, OIDC_STATE_COOKIE);
  const codeVerifier = readCookie(request, OIDC_VERIFIER_COOKIE);
  if (!expectedState || !codeVerifier || !stateMatches(expectedState, state)) {
    return buildErrorRedirect(request, "OIDC state verification failed");
  }

  let tokenEndpoint: string;
  try {
    tokenEndpoint = await resolveTokenEndpoint(config);
  } catch {
    return buildErrorRedirect(request, "OIDC discovery failed");
  }

  const redirectUri = config.redirectUriOverride || `${resolvePublicAppOrigin(request)}/api/auth/oidc/callback`;
  const tokenBody = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: config.clientId,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier,
  });
  if (config.clientSecret) {
    tokenBody.set("client_secret", config.clientSecret);
  }

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
      cache: "no-store",
    });
  } catch {
    return buildErrorRedirect(request, "OIDC token exchange failed");
  }
  if (!tokenResponse.ok) {
    return buildErrorRedirect(request, "OIDC token exchange failed");
  }

  let tokenPayload: unknown;
  try {
    tokenPayload = (await tokenResponse.json()) as unknown;
  } catch {
    return buildErrorRedirect(request, "OIDC token endpoint returned invalid payload");
  }

  const platformToken = pickPlatformToken(tokenPayload, config.platformTokenPreference);
  if (!platformToken) {
    return buildErrorRedirect(request, "OIDC token response missing required platform token");
  }

  const authEndpoint = `${SERVER_API_BASE_URL.replace(/\/$/, "")}/auth/session`;
  let authResponse: Response;
  try {
    authResponse = await fetch(authEndpoint, {
      method: "GET",
      headers: { Authorization: `Bearer ${platformToken}` },
      cache: "no-store",
    });
  } catch {
    return buildErrorRedirect(request, "Login failed: unable to reach auth endpoint");
  }
  if (!authResponse.ok) {
    return buildErrorRedirect(request, "Login failed: OIDC token rejected by platform API");
  }

  let authPayload: unknown;
  try {
    authPayload = (await authResponse.json()) as unknown;
  } catch {
    return buildErrorRedirect(request, "Login failed: auth response is not JSON");
  }

  const userId = (authPayload as { user_id?: unknown }).user_id;
  const tenantId = (authPayload as { tenant_id?: unknown }).tenant_id;
  const role = (authPayload as { role?: unknown }).role;
  if (typeof userId !== "string" || typeof tenantId !== "string" || !isSessionRole(role)) {
    return buildErrorRedirect(request, "Login failed: auth response missing user context");
  }

  const exp = decodeJwtExpiry(platformToken) ?? Math.floor(Date.now() / 1000) + 900;
  const cookieMaxAge = resolveCookieMaxAgeSeconds(exp);
  const useSecureCookies = shouldUseSecureCookies(request);
  const defaultPath = await resolveServerLandingRoute(role, { bearerToken: platformToken });
  const sessionLandingPath = sanitizeSessionLandingPath(defaultPath) ?? resolveLandingRoute(role);
  const sessionValue = await encodeSignedSession({
    userId,
    tenantId,
    role,
    exp,
    ...(sessionLandingPath ? { landingPath: sessionLandingPath } : {}),
  });
  if (!sessionValue) {
    return buildErrorRedirect(request, "Login failed: session signing secret not configured");
  }

  const fromPath = safeDecodeCookieValue(readCookie(request, OIDC_FROM_COOKIE));
  const targetPath = safeRedirectTarget(fromPath, sessionLandingPath);
  const response = NextResponse.redirect(new URL(targetPath, resolvePublicAppOrigin(request)));
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
    value: encodeURIComponent(platformToken),
    httpOnly: true,
    secure: useSecureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: cookieMaxAge,
  });
  response.cookies.delete(OIDC_STATE_COOKIE);
  response.cookies.delete(OIDC_VERIFIER_COOKIE);
  response.cookies.delete(OIDC_FROM_COOKIE);
  response.cookies.delete(OIDC_API_BASE_COOKIE);
  response.cookies.delete(OIDC_PROVIDER_COOKIE);
  return response;
}
