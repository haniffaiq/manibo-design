import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { POST as createSession } from "@/app/api/auth/session/route";
import { decodeSignedSession } from "@/lib/session_cookie";

function makeSessionRequest(
  payload: Record<string, unknown>,
  options?: { baseUrl?: string; headers?: Record<string, string> }
): NextRequest {
  return new NextRequest(`${options?.baseUrl ?? "http://localhost:3000"}/api/auth/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(options?.headers ?? {}) },
    body: JSON.stringify(payload),
  });
}

describe("/api/auth/session", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejects manual token login in production by default", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const response = await createSession(makeSessionRequest({ bearerToken: "token" }));
    expect(response.status).toBe(403);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toContain("not available");
  });

  it("allows manual token login in production when explicitly enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROVE_ENABLE_TOKEN_PASTE_LOGIN", "true");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user_id: "11111111-1111-1111-1111-111111111111",
          tenant_id: "22222222-2222-2222-2222-222222222222",
          role: "client_admin",
          email: "admin@example.com",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await createSession(
      makeSessionRequest({
        bearerToken: "header.eyJleHAiOjQ3NDQ4NDAwMDB9.sig",
        apiBaseUrl: "http://localhost:8000",
      })
    );

    expect(response.status).toBe(200);
    expect(response.cookies.get("grove_session")?.value).toBeTruthy();
    expect(response.cookies.get("grove_api_token")?.value).toBe(encodeURIComponent("header.eyJleHAiOjQ3NDQ4NDAwMDB9.sig"));
  });

  it("returns a manifest-owned landing path when exactly one tenant solution is enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROVE_ENABLE_TOKEN_PASTE_LOGIN", "true");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "22222222-2222-2222-2222-222222222222",
            role: "client_admin",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            solutions: [
              {
                solution_name: "appointment_booking",
                enabled: true,
                version: "1",
                description: "Bookings",
                requires_enabled: [],
                optional_enabled: [],
                desired_revision: null,
                active_revision: null,
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await createSession(
      makeSessionRequest({
        bearerToken: "header.eyJleHAiOjQ3NDQ4NDAwMDB9.sig",
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { landing_path?: string };
    expect(payload.landing_path).toBe("/bookings");
    const sessionPayload = await decodeSignedSession(response.cookies.get("grove_session")?.value ?? "");
    expect(sessionPayload?.landingPath).toBe("/bookings");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/solutions",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer header.eyJleHAiOjQ3NDQ4NDAwMDB9.sig",
        }),
      }),
    );
  });

  it("falls back safely when the solutions payload shape is invalid", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROVE_ENABLE_TOKEN_PASTE_LOGIN", "true");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "22222222-2222-2222-2222-222222222222",
            role: "client_admin",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ unexpected: true }), { status: 200, headers: { "Content-Type": "application/json" } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await createSession(
      makeSessionRequest({
        bearerToken: "header.eyJleHAiOjQ3NDQ4NDAwMDB9.sig",
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { landing_path?: string };
    expect(payload.landing_path).toBe("/dashboard");
    const sessionPayload = await decodeSignedSession(response.cookies.get("grove_session")?.value ?? "");
    expect(sessionPayload?.landingPath).toBe("/dashboard");
  });

  it("ignores untrusted apiBaseUrl and uses server-configured auth endpoint", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROVE_ENABLE_TOKEN_PASTE_LOGIN", "true");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");
    vi.stubEnv("GROVE_API_BASE_URL", "http://localhost:8000");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user_id: "11111111-1111-1111-1111-111111111111",
          tenant_id: "22222222-2222-2222-2222-222222222222",
          role: "client_admin",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await createSession(
      makeSessionRequest({
        bearerToken: "header.eyJleHAiOjQ3NDQ4NDAwMDB9.sig",
        apiBaseUrl: "http://169.254.169.254/latest/meta-data",
      })
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/auth/session",
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("does not mark browser auth cookies secure for local http origins", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user_id: "11111111-1111-1111-1111-111111111111",
          tenant_id: "22222222-2222-2222-2222-222222222222",
          role: "client_admin",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await createSession(
      makeSessionRequest(
        { bearerToken: "dev:11111111-1111-1111-1111-111111111111" },
        { baseUrl: "http://app.grove.localtest.me" }
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie") ?? "").not.toContain("Secure");
  });

  it("marks browser auth cookies secure when the public origin resolves to https", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROVE_ENABLE_TOKEN_PASTE_LOGIN", "true");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user_id: "11111111-1111-1111-1111-111111111111",
          tenant_id: "22222222-2222-2222-2222-222222222222",
          role: "client_admin",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await createSession(
      makeSessionRequest(
        { bearerToken: "header.eyJleHAiOjQ3NDQ4NDAwMDB9.sig" },
        {
          baseUrl: "http://0.0.0.0:3000",
          headers: {
            "x-forwarded-host": "platform.jakitlabs.com",
            "x-forwarded-proto": "https",
          },
        }
      )
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie") ?? "").toContain("Secure");
  });

  it("translates suspended-tenant auth failures into operator-friendly copy", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROVE_ENABLE_TOKEN_PASTE_LOGIN", "true");

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "tenant suspended" }), {
        status: 403,
        statusText: "Forbidden",
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const response = await createSession(
      makeSessionRequest({ bearerToken: "header.eyJleHAiOjQ3NDQ4NDAwMDB9.sig" }),
    );

    expect(response.status).toBe(403);
    const payload = (await response.json()) as { error?: string };
    expect(payload.error).toBe("This workspace is currently suspended. Contact your platform administrator to restore access.");
  });
});
