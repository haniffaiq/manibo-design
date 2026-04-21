import { NextRequest, NextResponse } from "next/server";

import { PLATFORM_API_TOKEN_COOKIE, SESSION_COOKIE, resolveServerApiBaseUrl, safeDecodeCookieValue } from "@/lib/platform_auth";
import { isExplicitTestAuthEnabled } from "@/lib/dev-auth-flags";
import { decodeSessionCookie } from "@/lib/session_cookie";
import { dispatchMockApi, isMockApiEnabled } from "@/lib/mock/dispatcher";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

const SERVER_API_BASE_URL = resolveServerApiBaseUrl();
const PROXY_HOP_HEADERS = new Set([
  "host",
  "cookie",
  "authorization",
  "content-length",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

async function resolvePathSegments(context: RouteContext): Promise<string[]> {
  const params = await context.params;
  const segments = Array.isArray(params.path) ? params.path : [];
  return segments.filter((segment) => segment && segment !== "." && segment !== "..");
}

function isTestAuthEnabled(): boolean {
  return isExplicitTestAuthEnabled();
}

async function resolveSession(request: NextRequest): Promise<{ userId: string; exp: number } | null> {
  const raw = request.cookies.get(SESSION_COOKIE)?.value;
  if (!raw) {
    return null;
  }

  const session = await decodeSessionCookie(raw, { allowUnsignedTestSession: isTestAuthEnabled() });
  if (!session) {
    return null;
  }
  return { userId: session.userId, exp: session.exp };
}

function resolveBearerToken(request: NextRequest, session: { userId: string }): string | null {
  const cookieToken = safeDecodeCookieValue(request.cookies.get(PLATFORM_API_TOKEN_COOKIE)?.value);
  if (cookieToken) {
    return cookieToken;
  }
  if (!isTestAuthEnabled()) {
    return null;
  }
  return `dev:${session.userId}`;
}

function buildUpstreamHeaders(request: NextRequest, bearerToken: string): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const normalized = key.toLowerCase();
    if (PROXY_HOP_HEADERS.has(normalized)) {
      return;
    }
    headers.set(key, value);
  });
  headers.set("Authorization", `Bearer ${bearerToken}`);
  return headers;
}

async function buildUpstreamBody(request: NextRequest): Promise<ArrayBuffer | undefined> {
  if (request.method === "GET" || request.method === "HEAD") {
    return undefined;
  }
  const payload = await request.arrayBuffer();
  if (payload.byteLength === 0) {
    return undefined;
  }
  return payload;
}

async function proxyRequest(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const session = await resolveSession(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bearerToken = resolveBearerToken(request, session);
  if (!bearerToken) {
    return NextResponse.json({ error: "Missing API token" }, { status: 401 });
  }

  const pathSegments = await resolvePathSegments(context);
  if (pathSegments.length === 0) {
    return NextResponse.json({ error: "Missing platform API path" }, { status: 400 });
  }

  // Mock-only short-circuit: when GROVE_USE_MOCK_API=true (design pack mode),
  // serve responses from src/lib/mock/fixtures.ts instead of forwarding to a
  // real backend that may not exist in this standalone design environment.
  if (isMockApiEnabled()) {
    const mockPath = "/" + pathSegments.join("/");
    const result = dispatchMockApi(request.method, mockPath, request.nextUrl.search);
    if (result.status === 204 || result.body === null) {
      return new NextResponse(result.body === null && result.status !== 204 ? "null" : null, {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.json(result.body, { status: result.status });
  }

  const encodedPath = pathSegments.map((segment) => encodeURIComponent(segment)).join("/");
  const upstreamUrl = new URL(`${SERVER_API_BASE_URL.replace(/\/$/, "")}/${encodedPath}`);
  upstreamUrl.search = request.nextUrl.search;

  const headers = buildUpstreamHeaders(request, bearerToken);
  const body = await buildUpstreamBody(request);

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers,
      body,
      cache: "no-store",
      redirect: "manual",
    });
  } catch {
    return NextResponse.json({ error: "Upstream API unreachable" }, { status: 502 });
  }

  const responseHeaders = new Headers(upstreamResponse.headers);
  responseHeaders.delete("set-cookie");
  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  return proxyRequest(request, context);
}
