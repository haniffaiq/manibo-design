import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET as oidcCallback } from "@/app/api/auth/oidc/callback/route";
import { GET as oidcStart } from "@/app/api/auth/oidc/start/route";
import { decodeSignedSession } from "@/lib/session_cookie";

function makeCallbackRequest(params: {
  code: string;
  state: string;
  expectedState?: string;
  verifier?: string;
  from?: string;
  baseUrl?: string;
  forwardedHost?: string;
  forwardedProto?: string;
  forwardedPort?: string;
}): NextRequest {
  const request = new NextRequest(
    `${params.baseUrl ?? "http://localhost:3000"}/api/auth/oidc/callback?code=${params.code}&state=${params.state}`,
    {
      headers: {
        ...(params.forwardedHost ? { "x-forwarded-host": params.forwardedHost } : {}),
        ...(params.forwardedProto ? { "x-forwarded-proto": params.forwardedProto } : {}),
        ...(params.forwardedPort ? { "x-forwarded-port": params.forwardedPort } : {}),
      },
    }
  );
  if (params.expectedState !== undefined) {
    request.cookies.set("grove_oidc_state", params.expectedState);
  }
  if (params.verifier !== undefined) {
    request.cookies.set("grove_oidc_verifier", params.verifier);
  }
  if (params.from !== undefined) {
    request.cookies.set("grove_oidc_from", encodeURIComponent(params.from));
  }
  return request;
}

describe("OIDC route handlers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("redirects start route to login when OIDC env config is missing", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");

    const request = new NextRequest("http://localhost:3000/api/auth/oidc/start?provider=google&from=/call-ops");
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    const redirect = new URL(location!);
    expect(redirect.pathname).toBe("/login");
    expect(redirect.searchParams.get("from")).toBe("/call-ops");
    expect(redirect.searchParams.get("error")).toBe("OIDC is not configured for provider 'google'");
  });

  it("uses forwarded public origin for start-route errors", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const request = new NextRequest("http://0.0.0.0:3000/api/auth/oidc/start?provider=google", {
      headers: {
        "x-forwarded-host": "platform.jakitlabs.com",
        "x-forwarded-proto": "https",
        "x-forwarded-port": "443",
      },
    });
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://platform.jakitlabs.com/login?error=OIDC+is+not+configured+for+provider+%27google%27"
    );
  });

  it("uses NEXT_PUBLIC_APP_URL for start-route errors when trusted proxy headers are unavailable", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://platform.jakitlabs.com");

    const request = new NextRequest("http://0.0.0.0:3000/api/auth/oidc/start?provider=google");
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://platform.jakitlabs.com/login?error=OIDC+is+not+configured+for+provider+%27google%27"
    );
  });

  it("prefers the served request origin over a stale NEXT_PUBLIC_APP_URL for start-route errors", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://app.grove.localtest.me");

    const request = new NextRequest("http://app.grove.localtest.me:24567/api/auth/oidc/start?provider=google");
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://app.grove.localtest.me:24567/login?error=OIDC+is+not+configured+for+provider+%27google%27"
    );
  });

  it("falls back to NEXT_PUBLIC_APP_URL when the start-route request origin is an internal cluster host", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://platform.jakitlabs.com");

    const request = new NextRequest(
      "http://platform-web.platform.svc.cluster.local:3000/api/auth/oidc/start?provider=google"
    );
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://platform.jakitlabs.com/login?error=OIDC+is+not+configured+for+provider+%27google%27"
    );
  });

  it("uses the first forwarded origin entry for start-route errors", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const request = new NextRequest("http://0.0.0.0:3000/api/auth/oidc/start?provider=google", {
      headers: {
        "x-forwarded-host": "platform.jakitlabs.com, ingress.internal",
        "x-forwarded-proto": "https, http",
      },
    });
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://platform.jakitlabs.com/login?error=OIDC+is+not+configured+for+provider+%27google%27"
    );
  });

  it("accepts trusted forwarded hosts that include the default https port", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const request = new NextRequest("http://0.0.0.0:3000/api/auth/oidc/start?provider=google", {
      headers: {
        "x-forwarded-host": "platform.jakitlabs.com:443",
        "x-forwarded-proto": "https",
      },
    });
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://platform.jakitlabs.com/login?error=OIDC+is+not+configured+for+provider+%27google%27"
    );
  });

  it("accepts trusted forwarded hosts regardless of hostname casing", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const request = new NextRequest("http://0.0.0.0:3000/api/auth/oidc/start?provider=google", {
      headers: {
        "x-forwarded-host": "Platform.JakitLabs.com",
        "x-forwarded-proto": "https",
      },
    });
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://platform.jakitlabs.com/login?error=OIDC+is+not+configured+for+provider+%27google%27"
    );
  });

  it("normalizes the default https port out of the start-route redirect_uri", async () => {
    vi.stubEnv("GROVE_OIDC_GOOGLE_ISSUER", "https://accounts.google.com");
    vi.stubEnv("GROVE_OIDC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GROVE_OIDC_GOOGLE_AUTHORIZATION_ENDPOINT", "https://accounts.google.com/o/oauth2/v2/auth");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const request = new NextRequest("http://0.0.0.0:3000/api/auth/oidc/start?provider=google", {
      headers: {
        "x-forwarded-host": "platform.jakitlabs.com:443",
        "x-forwarded-proto": "https",
      },
    });
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "https://accounts.google.com/o/oauth2/v2/auth");
    expect(location.searchParams.get("redirect_uri")).toBe("https://platform.jakitlabs.com/api/auth/oidc/callback");
  });

  it("normalizes mixed-case forwarded hosts before building the start-route redirect_uri", async () => {
    vi.stubEnv("GROVE_OIDC_GOOGLE_ISSUER", "https://accounts.google.com");
    vi.stubEnv("GROVE_OIDC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GROVE_OIDC_GOOGLE_AUTHORIZATION_ENDPOINT", "https://accounts.google.com/o/oauth2/v2/auth");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const request = new NextRequest("http://0.0.0.0:3000/api/auth/oidc/start?provider=google", {
      headers: {
        "x-forwarded-host": "Platform.JakitLabs.com:443",
        "x-forwarded-proto": "https",
      },
    });
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "https://accounts.google.com/o/oauth2/v2/auth");
    expect(location.searchParams.get("redirect_uri")).toBe("https://platform.jakitlabs.com/api/auth/oidc/callback");
  });

  it("does not mark OIDC state cookies secure for local http origins", async () => {
    vi.stubEnv("GROVE_OIDC_GOOGLE_ISSUER", "https://accounts.google.com");
    vi.stubEnv("GROVE_OIDC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GROVE_OIDC_GOOGLE_AUTHORIZATION_ENDPOINT", "https://accounts.google.com/o/oauth2/v2/auth");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");

    const request = new NextRequest("http://app.grove.localtest.me/api/auth/oidc/start?provider=google");
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("set-cookie") ?? "").not.toContain("Secure");
  });

  it("preserves non-default forwarded ports in the start-route redirect_uri", async () => {
    vi.stubEnv("GROVE_OIDC_GOOGLE_ISSUER", "https://accounts.google.com");
    vi.stubEnv("GROVE_OIDC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GROVE_OIDC_GOOGLE_AUTHORIZATION_ENDPOINT", "https://accounts.google.com/o/oauth2/v2/auth");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const request = new NextRequest("http://0.0.0.0:3000/api/auth/oidc/start?provider=google", {
      headers: {
        "x-forwarded-host": "platform.jakitlabs.com",
        "x-forwarded-proto": "https",
        "x-forwarded-port": "8443",
      },
    });
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "https://accounts.google.com/o/oauth2/v2/auth");
    expect(location.searchParams.get("redirect_uri")).toBe("https://platform.jakitlabs.com:8443/api/auth/oidc/callback");
  });

  it("redirects callback to login when OIDC config is missing", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");

    const request = new NextRequest("http://localhost:3000/api/auth/oidc/callback?code=abc&state=xyz");
    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    const redirect = new URL(location!);
    expect(redirect.pathname).toBe("/login");
    expect(redirect.searchParams.get("error")).toBe("OIDC is not configured for provider 'default'");
  });

  it("uses forwarded public origin for callback errors", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const request = makeCallbackRequest({
      code: "abc",
      state: "xyz",
      baseUrl: "http://0.0.0.0:3000",
      forwardedHost: "platform.jakitlabs.com",
      forwardedProto: "https",
      forwardedPort: "443",
    });
    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://platform.jakitlabs.com/login?error=OIDC+is+not+configured+for+provider+%27default%27"
    );
  });

  it("uses NEXT_PUBLIC_APP_URL for callback errors when trusted proxy headers are unavailable", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://platform.jakitlabs.com");

    const request = makeCallbackRequest({
      code: "abc",
      state: "xyz",
      baseUrl: "http://0.0.0.0:3000",
    });
    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://platform.jakitlabs.com/login?error=OIDC+is+not+configured+for+provider+%27default%27"
    );
  });

  it("prefers the served request origin over a stale NEXT_PUBLIC_APP_URL for callback errors", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://app.grove.localtest.me");

    const request = makeCallbackRequest({
      code: "abc",
      state: "xyz",
      baseUrl: "http://app.grove.localtest.me:24567",
    });
    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://app.grove.localtest.me:24567/login?error=OIDC+is+not+configured+for+provider+%27default%27"
    );
  });

  it("falls back to NEXT_PUBLIC_APP_URL when the callback request origin is an internal cluster host", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://platform.jakitlabs.com");

    const request = makeCallbackRequest({
      code: "abc",
      state: "xyz",
      baseUrl: "http://platform-web.platform.svc.cluster.local:3000",
    });
    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://platform.jakitlabs.com/login?error=OIDC+is+not+configured+for+provider+%27default%27"
    );
  });

  it("uses the first forwarded origin entry for callback errors", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const request = makeCallbackRequest({
      code: "abc",
      state: "xyz",
      baseUrl: "http://0.0.0.0:3000",
      forwardedHost: "platform.jakitlabs.com, ingress.internal",
      forwardedProto: "https, http",
    });
    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://platform.jakitlabs.com/login?error=OIDC+is+not+configured+for+provider+%27default%27"
    );
  });

  it("preserves non-default forwarded ports in callback error redirects", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const request = makeCallbackRequest({
      code: "abc",
      state: "xyz",
      baseUrl: "http://0.0.0.0:3000",
      forwardedHost: "platform.jakitlabs.com",
      forwardedProto: "https",
      forwardedPort: "8443",
    });
    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://platform.jakitlabs.com:8443/login?error=OIDC+is+not+configured+for+provider+%27default%27"
    );
  });

  it("redirects callback to login on state verification failure", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "https://issuer.example.test");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "client-123");

    const request = new NextRequest("http://localhost:3000/api/auth/oidc/callback?code=abc&state=xyz");
    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBeTruthy();
    const redirect = new URL(location!);
    expect(redirect.pathname).toBe("/login");
    expect(redirect.searchParams.get("error")).toBe("OIDC state verification failed");
  });

  it("uses id_token for platform auth when available (Google-compatible)", async () => {
    vi.stubEnv("GROVE_OIDC_GOOGLE_ISSUER", "https://accounts.google.com");
    vi.stubEnv("GROVE_OIDC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GROVE_OIDC_GOOGLE_TOKEN_ENDPOINT", "https://oauth2.googleapis.com/token");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id_token: "id-token-jwt",
            access_token: "access-token-opaque",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
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

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
    });
    request.cookies.set("grove_oidc_provider", "google");

    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "http://localhost:3000/login");
    expect(location.pathname).toBe("/dashboard");
    expect(response.cookies.get("grove_api_token")?.value).toBe(encodeURIComponent("id-token-jwt"));
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/auth/session",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer id-token-jwt",
        }),
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/solutions",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer id-token-jwt",
        }),
      }),
    );
  });

  it("uses forwarded public origin for callback redirect_uri during token exchange", async () => {
    vi.stubEnv("GROVE_OIDC_GOOGLE_ISSUER", "https://accounts.google.com");
    vi.stubEnv("GROVE_OIDC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GROVE_OIDC_GOOGLE_TOKEN_ENDPOINT", "https://oauth2.googleapis.com/token");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id_token: "id-token-jwt",
            access_token: "access-token-opaque",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "",
            role: "super_admin",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
      baseUrl: "http://0.0.0.0:3000",
      forwardedHost: "platform.jakitlabs.com",
      forwardedProto: "https",
    });
    request.cookies.set("grove_oidc_provider", "google");

    await oidcCallback(request);

    const tokenExchange = fetchMock.mock.calls[0];
    expect(tokenExchange?.[0]).toBe("https://oauth2.googleapis.com/token");
    const tokenBody = tokenExchange?.[1]?.body;
    expect(tokenBody).toBeInstanceOf(URLSearchParams);
    expect((tokenBody as URLSearchParams).get("redirect_uri")).toBe(
      "https://platform.jakitlabs.com/api/auth/oidc/callback"
    );
  });

  it("prefers the served callback origin over a stale NEXT_PUBLIC_APP_URL during token exchange", async () => {
    vi.stubEnv("GROVE_OIDC_GOOGLE_ISSUER", "https://accounts.google.com");
    vi.stubEnv("GROVE_OIDC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GROVE_OIDC_GOOGLE_TOKEN_ENDPOINT", "https://oauth2.googleapis.com/token");
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://app.grove.localtest.me");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id_token: "id-token-jwt",
            access_token: "access-token-opaque",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "",
            role: "super_admin",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
      baseUrl: "http://app.grove.localtest.me:24567",
    });
    request.cookies.set("grove_oidc_provider", "google");

    await oidcCallback(request);

    const tokenExchange = fetchMock.mock.calls[0];
    const tokenBody = tokenExchange?.[1]?.body;
    expect(tokenBody).toBeInstanceOf(URLSearchParams);
    expect((tokenBody as URLSearchParams).get("redirect_uri")).toBe(
      "http://app.grove.localtest.me:24567/api/auth/oidc/callback"
    );
  });

  it("uses the first forwarded origin entry for callback redirect_uri during token exchange", async () => {
    vi.stubEnv("GROVE_OIDC_GOOGLE_ISSUER", "https://accounts.google.com");
    vi.stubEnv("GROVE_OIDC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GROVE_OIDC_GOOGLE_TOKEN_ENDPOINT", "https://oauth2.googleapis.com/token");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id_token: "id-token-jwt",
            access_token: "access-token-opaque",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "",
            role: "super_admin",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
      baseUrl: "http://0.0.0.0:3000",
      forwardedHost: "platform.jakitlabs.com, ingress.internal",
      forwardedProto: "https, http",
    });
    request.cookies.set("grove_oidc_provider", "google");

    await oidcCallback(request);

    const tokenExchange = fetchMock.mock.calls[0];
    expect(tokenExchange?.[0]).toBe("https://oauth2.googleapis.com/token");
    const tokenBody = tokenExchange?.[1]?.body;
    expect(tokenBody).toBeInstanceOf(URLSearchParams);
    expect((tokenBody as URLSearchParams).get("redirect_uri")).toBe(
      "https://platform.jakitlabs.com/api/auth/oidc/callback"
    );
  });

  it("normalizes the default https port out of callback redirect_uri during token exchange", async () => {
    vi.stubEnv("GROVE_OIDC_GOOGLE_ISSUER", "https://accounts.google.com");
    vi.stubEnv("GROVE_OIDC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GROVE_OIDC_GOOGLE_TOKEN_ENDPOINT", "https://oauth2.googleapis.com/token");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id_token: "id-token-jwt",
            access_token: "access-token-opaque",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "",
            role: "super_admin",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
      baseUrl: "http://0.0.0.0:3000",
      forwardedHost: "platform.jakitlabs.com:443",
      forwardedProto: "https",
    });
    request.cookies.set("grove_oidc_provider", "google");

    await oidcCallback(request);

    const tokenExchange = fetchMock.mock.calls[0];
    expect(tokenExchange?.[0]).toBe("https://oauth2.googleapis.com/token");
    const tokenBody = tokenExchange?.[1]?.body;
    expect(tokenBody).toBeInstanceOf(URLSearchParams);
    expect((tokenBody as URLSearchParams).get("redirect_uri")).toBe(
      "https://platform.jakitlabs.com/api/auth/oidc/callback"
    );
  });

  it("normalizes mixed-case forwarded hosts during callback token exchange", async () => {
    vi.stubEnv("GROVE_OIDC_GOOGLE_ISSUER", "https://accounts.google.com");
    vi.stubEnv("GROVE_OIDC_GOOGLE_CLIENT_ID", "google-client-id");
    vi.stubEnv("GROVE_OIDC_GOOGLE_TOKEN_ENDPOINT", "https://oauth2.googleapis.com/token");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id_token: "id-token-jwt",
            access_token: "access-token-opaque",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "",
            role: "super_admin",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
      baseUrl: "http://0.0.0.0:3000",
      forwardedHost: "Platform.JakitLabs.com:443",
      forwardedProto: "https",
    });
    request.cookies.set("grove_oidc_provider", "google");

    await oidcCallback(request);

    const tokenExchange = fetchMock.mock.calls[0];
    expect(tokenExchange?.[0]).toBe("https://oauth2.googleapis.com/token");
    const tokenBody = tokenExchange?.[1]?.body;
    expect(tokenBody).toBeInstanceOf(URLSearchParams);
    expect((tokenBody as URLSearchParams).get("redirect_uri")).toBe(
      "https://platform.jakitlabs.com/api/auth/oidc/callback"
    );
  });

  it("ignores forwarded origin headers unless proxy trust is explicitly enabled", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");

    const request = new NextRequest("http://0.0.0.0:3000/api/auth/oidc/start?provider=google", {
      headers: {
        "x-forwarded-host": "platform.jakitlabs.com",
        "x-forwarded-proto": "https",
      },
    });
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://0.0.0.0:3000/login?error=OIDC+is+not+configured+for+provider+%27google%27"
    );
  });

  it("ignores invalid forwarded hosts even when proxy trust is enabled", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "");
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");

    const request = new NextRequest("http://0.0.0.0:3000/api/auth/oidc/start?provider=google", {
      headers: {
        "x-forwarded-host": "example.com:abc",
        "x-forwarded-proto": "https",
      },
    });
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://0.0.0.0:3000/login?error=OIDC+is+not+configured+for+provider+%27google%27"
    );
  });

  it("falls back to role-based default redirect when /login had no from param", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "https://issuer.example.test");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "client-123");
    vi.stubEnv("GROVE_OIDC_TOKEN_ENDPOINT", "https://issuer.example.test/token");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "jwt-access-token",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "22222222-2222-2222-2222-222222222222",
            role: "super_admin",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
    });

    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "http://localhost:3000/login");
    expect(location.pathname).toBe("/admin");
  });

  it("uses the single enabled solution default route when /login had no from param", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "https://issuer.example.test");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "client-123");
    vi.stubEnv("GROVE_OIDC_TOKEN_ENDPOINT", "https://issuer.example.test/token");

    const fetchMock = vi
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

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
    });

    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "http://localhost:3000/login");
    expect(location.pathname).toBe("/bookings");
    const sessionPayload = await decodeSignedSession(response.cookies.get("grove_session")?.value ?? "");
    expect(sessionPayload?.landingPath).toBe("/bookings");
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:8000/solutions",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-access-token",
        }),
      }),
    );
  });

  it("falls back to the role-safe redirect when the solutions payload shape is invalid", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "https://issuer.example.test");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "client-123");
    vi.stubEnv("GROVE_OIDC_TOKEN_ENDPOINT", "https://issuer.example.test/token");

    const fetchMock = vi
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
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ unexpected: true }), { status: 200, headers: { "Content-Type": "application/json" } }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
    });

    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "http://localhost:3000/login");
    expect(location.pathname).toBe("/dashboard");
    const sessionPayload = await decodeSignedSession(response.cookies.get("grove_session")?.value ?? "");
    expect(sessionPayload?.landingPath).toBe("/dashboard");
  });

  it("falls back to access_token when id_token is missing", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "https://issuer.example.test");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "client-123");
    vi.stubEnv("GROVE_OIDC_TOKEN_ENDPOINT", "https://issuer.example.test/token");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "jwt-access-token",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "22222222-2222-2222-2222-222222222222",
            role: "client_operator",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
    });

    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:8000/auth/session",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-access-token",
        }),
      })
    );
  });

  it("preserves explicit from redirect from /login", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "https://issuer.example.test");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "client-123");
    vi.stubEnv("GROVE_OIDC_TOKEN_ENDPOINT", "https://issuer.example.test/token");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "jwt-access-token",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "22222222-2222-2222-2222-222222222222",
            role: "super_admin",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
      from: "/settings/recordings",
    });

    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "http://localhost:3000/login");
    expect(location.pathname).toBe("/settings/recordings");
  });

  it("does not mark callback session cookies secure for local http origins", async () => {
    vi.stubEnv("GROVE_OIDC_ISSUER", "https://issuer.example.test");
    vi.stubEnv("GROVE_OIDC_CLIENT_ID", "client-123");
    vi.stubEnv("GROVE_OIDC_TOKEN_ENDPOINT", "https://issuer.example.test/token");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: "jwt-access-token",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: "11111111-1111-1111-1111-111111111111",
            tenant_id: "22222222-2222-2222-2222-222222222222",
            role: "client_operator",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );
    vi.stubGlobal("fetch", fetchMock);

    const request = makeCallbackRequest({
      code: "auth-code",
      state: "state-ok",
      expectedState: "state-ok",
      verifier: "pkce-verifier",
      baseUrl: "http://app.grove.localtest.me",
    });

    const response = await oidcCallback(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("set-cookie") ?? "").not.toContain("Secure");
  });

  it("start route supports provider-specific configuration for Microsoft", async () => {
    vi.stubEnv("GROVE_OIDC_MICROSOFT_ISSUER", "https://login.microsoftonline.com/tenant/v2.0");
    vi.stubEnv("GROVE_OIDC_MICROSOFT_CLIENT_ID", "microsoft-client-id");
    vi.stubEnv("GROVE_OIDC_MICROSOFT_AUTHORIZATION_ENDPOINT", "https://login.microsoftonline.com/tenant/oauth2/v2.0/authorize");

    const request = new NextRequest("http://localhost:3000/api/auth/oidc/start?provider=microsoft");
    const response = await oidcStart(request);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toContain("login.microsoftonline.com");
  });
});
