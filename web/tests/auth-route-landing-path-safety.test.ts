import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { resolveServerLandingRouteMock } = vi.hoisted(() => ({
  resolveServerLandingRouteMock: vi.fn(),
}));

vi.mock("@/lib/landing-route-server", () => ({
  resolveServerLandingRoute: resolveServerLandingRouteMock,
}));

import { GET as oidcCallback } from "@/app/api/auth/oidc/callback/route";
import { POST as createSession } from "@/app/api/auth/session/route";
import { decodeSignedSession } from "@/lib/session_cookie";

function makeSessionRequest(payload: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function makeCallbackRequest(): NextRequest {
  const request = new NextRequest("http://localhost:3000/api/auth/oidc/callback?code=auth-code&state=state-ok");
  request.cookies.set("grove_oidc_state", "state-ok");
  request.cookies.set("grove_oidc_verifier", "pkce-verifier");
  return request;
}

describe("auth route landing path safety", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("session creation falls back to the role-safe landing path when route resolution is unsafe", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROVE_ENABLE_TOKEN_PASTE_LOGIN", "true");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");
    resolveServerLandingRouteMock.mockResolvedValue("//evil.example");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "22222222-2222-2222-2222-222222222222",
            role: "client_admin",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    );

    const response = await createSession(
      makeSessionRequest({
        bearerToken: "header.eyJleHAiOjQ3NDQ4NDAwMDB9.sig",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ landing_path: "/dashboard" });
    const sessionPayload = await decodeSignedSession(response.cookies.get("grove_session")?.value ?? "");
    expect(sessionPayload?.landingPath).toBe("/dashboard");
  });

  it("oidc callback falls back to the role-safe redirect when route resolution is unsafe", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "https://issuer.example.test");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "client-123");
    vi.stubEnv("GROVE_OIDC_TOKEN_ENDPOINT", "https://issuer.example.test/token");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");
    resolveServerLandingRouteMock.mockResolvedValue("//evil.example");

    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              access_token: "jwt-access-token",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              user_id: "11111111-1111-1111-1111-111111111111",
              tenant_id: "22222222-2222-2222-2222-222222222222",
              role: "client_admin",
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          ),
        ),
    );

    const response = await oidcCallback(makeCallbackRequest());

    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location") ?? "http://localhost:3000/login").pathname).toBe("/dashboard");
    const sessionPayload = await decodeSignedSession(response.cookies.get("grove_session")?.value ?? "");
    expect(sessionPayload?.landingPath).toBe("/dashboard");
  });
});
