import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createOidcProvider,
  createPlatformDefaults,
  deleteOidcProvider,
  getPlatformDefaultsVersion,
  listOidcProviders,
  listPlatformDefaults,
  updateOidcProvider,
} from "@/lib/api/admin-settings";

const originalFetch = global.fetch;

function mockJsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("admin settings api client", () => {
  it("lists oidc providers", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse([
        {
          id: "p1",
          issuer: "https://issuer.example.test",
          jwks_uri: "https://issuer.example.test/.well-known/jwks.json",
          audience: "grove-api",
          tenant_id: null,
          created_at: "2026-03-01T00:00:00Z",
        },
      ]),
    ) as typeof fetch;

    const providers = await listOidcProviders();
    expect(providers).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/oidc-providers",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("creates oidc provider", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        id: "p1",
        issuer: "https://issuer.example.test",
        jwks_uri: "https://issuer.example.test/.well-known/jwks.json",
        audience: "grove-api",
        tenant_id: "tenant-a",
        created_at: "2026-03-01T00:00:00Z",
      }),
    ) as typeof fetch;

    const provider = await createOidcProvider({
      issuer: "https://issuer.example.test",
      jwks_uri: "https://issuer.example.test/.well-known/jwks.json",
      audience: "grove-api",
      tenant_id: "tenant-a",
    });

    expect(provider.id).toBe("p1");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/oidc-providers",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          issuer: "https://issuer.example.test",
          jwks_uri: "https://issuer.example.test/.well-known/jwks.json",
          audience: "grove-api",
          tenant_id: "tenant-a",
        }),
      }),
    );
  });

  it("updates oidc provider", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        id: "p1",
        issuer: "https://issuer-updated.example.test",
        jwks_uri: "https://issuer-updated.example.test/.well-known/jwks.json",
        audience: "grove-api-updated",
        tenant_id: "tenant-a",
        created_at: "2026-03-01T00:00:00Z",
      }),
    ) as typeof fetch;

    const provider = await updateOidcProvider("p1", {
      issuer: "https://issuer-updated.example.test",
      jwks_uri: "https://issuer-updated.example.test/.well-known/jwks.json",
      audience: "grove-api-updated",
      tenant_id: "tenant-a",
    });

    expect(provider.issuer).toBe("https://issuer-updated.example.test");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/oidc-providers/p1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          issuer: "https://issuer-updated.example.test",
          jwks_uri: "https://issuer-updated.example.test/.well-known/jwks.json",
          audience: "grove-api-updated",
          tenant_id: "tenant-a",
        }),
      }),
    );
  });

  it("deletes oidc provider", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 204,
      }),
    ) as typeof fetch;

    await expect(deleteOidcProvider("p1")).resolves.toBeUndefined();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/oidc-providers/p1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("lists platform defaults", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse([
        {
          version: "pd_provider_control",
          config_yaml_hash: "abc123",
          created_by: "11111111-1111-1111-1111-111111111111",
          created_at: "2026-03-01T00:00:00Z",
        },
      ]),
    ) as typeof fetch;

    const defaults = await listPlatformDefaults();
    expect(defaults).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/platform-defaults",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("creates platform defaults version", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        version: "pd_provider_control",
        config_yaml_hash: "abc123",
      }),
    ) as typeof fetch;

    const created = await createPlatformDefaults({
      version: "pd_provider_control",
      config_yaml: "model:\n  provider: openai\n",
    });

    expect(created.version).toBe("pd_provider_control");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/platform-defaults",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          version: "pd_provider_control",
          config_yaml: "model:\n  provider: openai\n",
        }),
      }),
    );
  });

  it("loads one platform defaults version", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        version: "pd_provider_control",
        config_yaml: "model:\n  provider: openai\n",
        config_yaml_hash: "abc123",
      }),
    ) as typeof fetch;

    const loaded = await getPlatformDefaultsVersion("pd_provider_control");

    expect(loaded.config_yaml_hash).toBe("abc123");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/platform-defaults/pd_provider_control",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
