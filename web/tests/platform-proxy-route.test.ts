import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET as proxyGet } from "@/app/api/platform/[...path]/route";
import { SessionRole } from "@/lib/auth_types";
import { encodeSignedSession } from "@/lib/session_cookie";

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function makeSignedSessionCookie(): Promise<string> {
  const cookie = await encodeSignedSession({
    userId: "11111111-1111-1111-1111-111111111111",
    tenantId: "22222222-2222-2222-2222-222222222222",
    role: SessionRole.ClientAdmin,
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  if (!cookie) {
    throw new Error("expected signed session cookie");
  }
  return cookie;
}

function makeUnsignedTestSessionCookie(userId: string): string {
  const payload = {
    userId,
    tenantId: "tenant_test",
    role: "super_admin",
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");
}

describe("/api/platform proxy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns 401 when session is missing", async () => {
    const request = new NextRequest("http://localhost:3000/api/platform/calls/active");
    const response = await proxyGet(
      request,
      { params: Promise.resolve({ path: ["calls", "active"] }) } satisfies RouteContext
    );
    expect(response.status).toBe(401);
  });

  it("returns 401 when API token cookie is missing", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");
    const request = new NextRequest("http://localhost:3000/api/platform/calls/active");
    request.cookies.set("grove_session", await makeSignedSessionCookie());

    const response = await proxyGet(
      request,
      { params: Promise.resolve({ path: ["calls", "active"] }) } satisfies RouteContext
    );
    expect(response.status).toBe(401);
  });

  it("forwards request to configured API base with bearer token", async () => {
    vi.stubEnv("GROVE_API_BASE_URL", "http://localhost:8000");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ calls: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost:3000/api/platform/calls/active?status=running");
    request.cookies.set("grove_session", await makeSignedSessionCookie());
    request.cookies.set("grove_api_token", encodeURIComponent("jwt-token-value"));

    const response = await proxyGet(
      request,
      { params: Promise.resolve({ path: ["calls", "active"] }) } satisfies RouteContext
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/calls/active?status=running",
      expect.any(Object)
    );
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    expect(init?.method).toBe("GET");
    const headers = init?.headers as Headers | undefined;
    expect(headers?.get("Authorization")).toBe("Bearer jwt-token-value");
  });

  it("uses dev bearer token from unsigned test-auth session when API token cookie is absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");
    vi.stubEnv("GROVE_API_BASE_URL", "http://localhost:8000");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ calls: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost:3000/api/platform/calls/active");
    request.cookies.set("grove_session", makeUnsignedTestSessionCookie("user_test"));

    const response = await proxyGet(
      request,
      { params: Promise.resolve({ path: ["calls", "active"] }) } satisfies RouteContext
    );

    expect(response.status).toBe(200);
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined;
    const headers = init?.headers as Headers | undefined;
    expect(headers?.get("Authorization")).toBe("Bearer dev:user_test");
  });
});
