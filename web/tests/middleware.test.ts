import { afterEach, describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";
import { encodeSignedSession } from "@/lib/session_cookie";
import { SessionRole } from "@/lib/auth_types";

function makeTestSessionCookie(
  overrides?: Partial<{ exp: number; role: SessionRole; tenantId: string; userId: string; landingPath: string }>
): string {
  const payload = {
    userId: "user_test",
    tenantId: "tenant_test",
    role: SessionRole.SuperAdmin,
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");
}

async function makeSignedSessionCookie(
  overrides?: Partial<{ exp: number; role: SessionRole; tenantId: string; userId: string; landingPath: string }>
): Promise<string> {
  const cookie = await encodeSignedSession({
    userId: "11111111-1111-1111-1111-111111111111",
    tenantId: "22222222-2222-2222-2222-222222222222",
    role: SessionRole.ClientAdmin,
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  });
  if (!cookie) {
    throw new Error("expected session cookie");
  }
  return cookie;
}

function makeRequest(
  pathname: string,
  options?: {
    cookie?: string;
    apiTokenCookie?: string;
    baseUrl?: string;
    forwardedHost?: string;
    forwardedProto?: string;
    forwardedPort?: string;
  }
): NextRequest {
  const url = new URL(pathname, options?.baseUrl ?? "http://localhost:3000");
  const req = new NextRequest(url, {
    headers: {
      ...(options?.forwardedHost ? { "x-forwarded-host": options.forwardedHost } : {}),
      ...(options?.forwardedProto ? { "x-forwarded-proto": options.forwardedProto } : {}),
      ...(options?.forwardedPort ? { "x-forwarded-port": options.forwardedPort } : {}),
    },
  });
  if (options?.cookie) {
    req.cookies.set("grove_session", options.cookie);
  }
  if (options?.apiTokenCookie) {
    req.cookies.set("grove_api_token", encodeURIComponent(options.apiTokenCookie));
  }
  return req;
}

describe("middleware", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows public route / without session", async () => {
    const res = await middleware(makeRequest("/"));
    expect(res.status).toBe(200);
  });

  it("allows public route /login without session", async () => {
    const res = await middleware(makeRequest("/login"));
    expect(res.status).toBe(200);
  });

  it("allows public route /signup without session", async () => {
    const res = await middleware(makeRequest("/signup"));
    expect(res.status).toBe(200);
  });

  it("allows public route /verify-email/resend without session", async () => {
    const res = await middleware(makeRequest("/verify-email/resend"));
    expect(res.status).toBe(200);
  });

  it("allows static assets without session", async () => {
    const res = await middleware(makeRequest("/_next/static/chunk.js"));
    expect(res.status).toBe(200);
  });

  it("allows API routes without session", async () => {
    const res = await middleware(makeRequest("/api/health"));
    expect(res.status).toBe(200);
  });

  it("allows file paths (with dot) without session", async () => {
    const res = await middleware(makeRequest("/favicon.ico"));
    expect(res.status).toBe(200);
  });

  it("redirects protected route to /login when no session", async () => {
    const res = await middleware(makeRequest("/call-ops"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("from")).toBe("/call-ops");
  });

  it("uses forwarded public origin when redirecting to login", async () => {
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");
    const res = await middleware(
      makeRequest("/call-ops", {
        baseUrl: "http://0.0.0.0:3000",
        forwardedHost: "platform.jakitlabs.com",
        forwardedProto: "https",
        forwardedPort: "443",
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://platform.jakitlabs.com/login?from=%2Fcall-ops");
  });

  it("uses NEXT_PUBLIC_APP_URL when redirecting to login without trusted proxy headers", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://platform.jakitlabs.com");
    const res = await middleware(
      makeRequest("/call-ops", {
        baseUrl: "http://0.0.0.0:3000",
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://platform.jakitlabs.com/login?from=%2Fcall-ops");
  });

  it("prefers the served request origin over a stale NEXT_PUBLIC_APP_URL when redirecting to login", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://app.grove.localtest.me");
    const res = await middleware(
      makeRequest("/call-ops", {
        baseUrl: "http://app.grove.localtest.me:24567",
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://app.grove.localtest.me:24567/login?from=%2Fcall-ops");
  });

  it("falls back to NEXT_PUBLIC_APP_URL when the request origin is an internal cluster host", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://platform.jakitlabs.com");
    const res = await middleware(
      makeRequest("/call-ops", {
        baseUrl: "http://platform-web.platform.svc.cluster.local:3000",
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://platform.jakitlabs.com/login?from=%2Fcall-ops");
  });

  it("uses the first forwarded origin entry when redirecting to login", async () => {
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");
    const res = await middleware(
      makeRequest("/call-ops", {
        baseUrl: "http://0.0.0.0:3000",
        forwardedHost: "platform.jakitlabs.com, ingress.internal",
        forwardedProto: "https, http",
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://platform.jakitlabs.com/login?from=%2Fcall-ops");
  });

  it("accepts trusted forwarded hosts that include the default https port", async () => {
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");
    const res = await middleware(
      makeRequest("/call-ops", {
        baseUrl: "http://0.0.0.0:3000",
        forwardedHost: "platform.jakitlabs.com:443",
        forwardedProto: "https",
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://platform.jakitlabs.com/login?from=%2Fcall-ops");
  });

  it("accepts trusted forwarded hosts regardless of hostname casing", async () => {
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");
    const res = await middleware(
      makeRequest("/call-ops", {
        baseUrl: "http://0.0.0.0:3000",
        forwardedHost: "Platform.JakitLabs.com:443",
        forwardedProto: "https",
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://platform.jakitlabs.com/login?from=%2Fcall-ops");
  });

  it("preserves trusted non-default forwarded ports in login redirects", async () => {
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");
    const res = await middleware(
      makeRequest("/call-ops", {
        baseUrl: "http://0.0.0.0:3000",
        forwardedHost: "platform.jakitlabs.com",
        forwardedProto: "https",
        forwardedPort: "8443",
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("https://platform.jakitlabs.com:8443/login?from=%2Fcall-ops");
  });

  it("ignores forwarded origin headers unless proxy trust is explicitly enabled", async () => {
    const res = await middleware(
      makeRequest("/call-ops", {
        baseUrl: "http://0.0.0.0:3000",
        forwardedHost: "platform.jakitlabs.com",
        forwardedProto: "https",
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://0.0.0.0:3000/login?from=%2Fcall-ops");
  });

  it("ignores invalid forwarded hosts even when proxy trust is enabled", async () => {
    vi.stubEnv("GROVE_TRUST_PROXY_HEADERS", "true");
    const res = await middleware(
      makeRequest("/call-ops", {
        baseUrl: "http://0.0.0.0:3000",
        forwardedHost: "exa%mple.com",
        forwardedProto: "https",
      })
    );
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://0.0.0.0:3000/login?from=%2Fcall-ops");
  });

  it("redirects nested protected route to /login with from param", async () => {
    const res = await middleware(makeRequest("/settings/recordings"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("from")).toBe("/settings/recordings");
  });

  it("allows protected route when session cookie is present", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");
    const res = await middleware(
      makeRequest("/call-ops", { cookie: makeTestSessionCookie({ role: SessionRole.ClientAdmin }) })
    );
    expect(res.status).toBe(200);
  });

  it("redirects client admin away from admin routes to dashboard", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");
    const cookie = makeTestSessionCookie({ role: SessionRole.ClientAdmin });
    const res = await middleware(makeRequest("/admin/tenants", { cookie }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects tenant users to home so the server route can revalidate current solution access", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");
    const cookie = makeTestSessionCookie({ role: SessionRole.ClientAdmin, landingPath: "/bookings" });
    const res = await middleware(makeRequest("/admin/tenants", { cookie }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects client operator away from admin routes to call-ops", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");
    const cookie = makeTestSessionCookie({ role: SessionRole.ClientOperator });
    const res = await middleware(makeRequest("/admin", { cookie }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects super admin away from tenant routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");
    const res = await middleware(makeRequest("/call-ops", { cookie: makeTestSessionCookie() }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/admin");
  });

  it("allows super admin to stay on admin routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");
    const res = await middleware(makeRequest("/admin/tenants", { cookie: makeTestSessionCookie() }));
    expect(res.status).toBe(200);
  });

  it("allows signed session cookie in development", async () => {
    const cookie = await makeSignedSessionCookie();
    const res = await middleware(makeRequest("/call-ops", { cookie }));
    expect(res.status).toBe(200);
  });

  it("redirects signed client admin cookie away from admin routes to dashboard", async () => {
    const cookie = await makeSignedSessionCookie({ role: SessionRole.ClientAdmin });
    const res = await middleware(makeRequest("/admin/health", { cookie }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects signed tenant cookies to home so the server route can revalidate current solution access", async () => {
    const cookie = await makeSignedSessionCookie({ role: SessionRole.ClientAdmin, landingPath: "/bookings" });
    const res = await middleware(makeRequest("/admin/health", { cookie }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/");
  });

  it("redirects protected route when session cookie is invalid", async () => {
    const res = await middleware(makeRequest("/call-ops", { cookie: "abc123" }));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/login");
  });

  it("redirects valid test cookie in production when test auth is disabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");
    try {
      const res = await middleware(
        makeRequest("/call-ops", { cookie: makeTestSessionCookie({ role: SessionRole.ClientAdmin }) })
      );
      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/login");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("rejects production requests when test auth is explicitly enabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");
    await expect(
      middleware(makeRequest("/call-ops", { cookie: makeTestSessionCookie({ role: SessionRole.ClientAdmin }) }))
    ).rejects.toThrow(/Dev auth flags are not allowed when NODE_ENV=production/);
  });

  it("rejects production requests when signed cookies are paired with test auth", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");

    const cookie = await makeSignedSessionCookie();
    await expect(middleware(makeRequest("/call-ops", { cookie }))).rejects.toThrow(
      /Dev auth flags are not allowed when NODE_ENV=production/
    );
  });

  it("allows valid signed session cookie in production when test auth is disabled", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");
    try {
      const cookie = await makeSignedSessionCookie();
      const res = await middleware(makeRequest("/call-ops", { cookie }));
      expect(res.status).toBe(200);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("redirects malformed signed session cookie in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("GROVE_WEB_SESSION_SECRET", "test-session-secret");
    try {
      const res = await middleware(makeRequest("/call-ops", { cookie: "payload.invalidsig" }));
      expect(res.status).toBe(307);
      const location = new URL(res.headers.get("location")!);
      expect(location.pathname).toBe("/login");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
