import { createHash, randomBytes } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { readOidcConfig, resolveOidcProvider } from "@/lib/oidc_provider";
import { resolvePublicAppOrigin, shouldUseSecureCookies } from "@/lib/public_origin";

const OIDC_STATE_COOKIE = "grove_oidc_state";
const OIDC_VERIFIER_COOKIE = "grove_oidc_verifier";
const OIDC_FROM_COOKIE = "grove_oidc_from";
const OIDC_PROVIDER_COOKIE = "grove_oidc_provider";
const OIDC_COOKIE_MAX_AGE_SECONDS = 10 * 60;

function base64UrlEncode(raw: Buffer): string {
  return raw
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function safeRedirectTarget(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://") || raw.includes("\\")) {
    return null;
  }
  return raw;
}

async function resolveAuthorizationEndpoint(config: {
  issuer: string;
  authorizationEndpointOverride: string | null;
}): Promise<string> {
  if (config.authorizationEndpointOverride) {
    return config.authorizationEndpointOverride;
  }
  const discoveryUrl = `${config.issuer}/.well-known/openid-configuration`;
  const response = await fetch(discoveryUrl, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("OIDC discovery failed");
  }
  const payload = (await response.json()) as { authorization_endpoint?: unknown };
  if (typeof payload.authorization_endpoint !== "string" || !payload.authorization_endpoint) {
    throw new Error("OIDC discovery missing authorization endpoint");
  }
  return payload.authorization_endpoint;
}

function buildCookieSecurityOptions(request: NextRequest) {
  return {
    httpOnly: true,
    secure: shouldUseSecureCookies(request),
    sameSite: "lax" as const,
    path: "/",
    maxAge: OIDC_COOKIE_MAX_AGE_SECONDS,
  };
}

function buildErrorRedirect(request: NextRequest, message: string, from: string | null): NextResponse {
  const url = new URL("/login", resolvePublicAppOrigin(request));
  if (from) {
    url.searchParams.set("from", from);
  }
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const provider = resolveOidcProvider(request.nextUrl.searchParams.get("provider"));
  const config = readOidcConfig(provider);
  const from = safeRedirectTarget(request.nextUrl.searchParams.get("from"));
  if (!config) {
    return buildErrorRedirect(request, `OIDC is not configured for provider '${provider}'`, from);
  }

  const state = base64UrlEncode(randomBytes(32));
  const codeVerifier = base64UrlEncode(randomBytes(64));
  const codeChallenge = base64UrlEncode(createHash("sha256").update(codeVerifier).digest());

  let authorizationEndpoint: string;
  try {
    authorizationEndpoint = await resolveAuthorizationEndpoint(config);
  } catch {
    return buildErrorRedirect(request, "OIDC discovery failed", from);
  }

  const redirectUri = config.redirectUriOverride || `${resolvePublicAppOrigin(request)}/api/auth/oidc/callback`;
  const authorizeUrl = new URL(authorizationEndpoint);
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("scope", config.scopes);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set({
    name: OIDC_STATE_COOKIE,
    value: state,
    ...buildCookieSecurityOptions(request),
  });
  response.cookies.set({
    name: OIDC_VERIFIER_COOKIE,
    value: codeVerifier,
    ...buildCookieSecurityOptions(request),
  });
  if (from) {
    response.cookies.set({
      name: OIDC_FROM_COOKIE,
      value: encodeURIComponent(from),
      ...buildCookieSecurityOptions(request),
    });
  } else {
    response.cookies.delete(OIDC_FROM_COOKIE);
  }
  response.cookies.set({
    name: OIDC_PROVIDER_COOKIE,
    value: provider,
    ...buildCookieSecurityOptions(request),
  });

  return response;
}
