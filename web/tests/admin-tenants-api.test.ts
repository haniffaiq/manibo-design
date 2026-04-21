import { afterEach, describe, expect, it, vi } from "vitest";

import { exportAdminTenant, listAdminTenants, offboardAdminTenant, onboardAdminTenant, updateAdminTenantStatus } from "@/lib/api/tenants";

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

describe("admin tenants api client", () => {
  it("lists tenants", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse([
        {
          id: "t1",
          name: "Hoptrans",
          slug: "hoptrans",
          status: "active",
          environment: "production",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ]),
    ) as typeof fetch;

    const tenants = await listAdminTenants(25, 0);
    expect(tenants).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants?limit=25&offset=0",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("can explicitly include non-production tenants", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse([
        {
          id: "t-demo",
          name: "Demo Tenant",
          slug: "demo",
          status: "active",
          environment: "demo",
          created_at: "2026-01-01T00:00:00Z",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ]),
    ) as typeof fetch;

    const tenants = await listAdminTenants(25, 0, { include_non_production: true });
    expect(tenants[0]?.environment).toBe("demo");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants?limit=25&offset=0&include_non_production=true",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("updates tenant status", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        tenant_id: "t1",
        status: "suspended",
        updated_at: "2026-01-02T00:00:00Z",
      }),
    ) as typeof fetch;

    const response = await updateAdminTenantStatus("t1", "suspended");
    expect(response.status).toBe("suspended");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/t1/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "suspended" }),
      }),
    );
  });

  it("onboards tenant with solution and oidc bootstrap payload", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        tenant_id: "new-tenant-id",
        tenant_schema: "tenant_new",
        admin_user_id: "admin-id",
        provisioning_started: true,
        provision_workflow_id: "platform.provision-tenant/new-tenant-id",
      }),
    ) as typeof fetch;

    const response = await onboardAdminTenant({
      tenant_slug: "new",
      tenant_name: "New Tenant",
      admin_email: "admin@new.test",
      admin_subject: "auth0|new-admin",
      enable_solutions: ["appointment_booking", "driver_verification"],
      oidc_provider: {
        issuer: "https://idp.new.test",
        jwks_uri: "https://idp.new.test/.well-known/jwks.json",
        audience: "grove-platform",
      },
      wait_for_provisioning: false,
    });

    expect(response.tenant_id).toBe("new-tenant-id");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/onboard",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          tenant_slug: "new",
          tenant_name: "New Tenant",
          admin_email: "admin@new.test",
          admin_subject: "auth0|new-admin",
          enable_solutions: ["appointment_booking", "driver_verification"],
          oidc_provider: {
            issuer: "https://idp.new.test",
            jwks_uri: "https://idp.new.test/.well-known/jwks.json",
            audience: "grove-platform",
          },
          wait_for_provisioning: false,
        }),
      }),
    );
  });

  it("offboards tenant with grace period", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        tenant_id: "t1",
        status: "suspended",
        offboard_workflow_id: "platform.offboard-tenant/t1",
        started: true,
      }),
    ) as typeof fetch;

    const response = await offboardAdminTenant("t1", {
      grace_period_days: 5,
      wait_for_completion: false,
    });

    expect(response.status).toBe("suspended");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/t1/offboard",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          grace_period_days: 5,
          wait_for_completion: false,
        }),
      }),
    );
  });

  it("exports tenant payload with row limit", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        tenant_id: "t1",
        tenant_slug: "hoptrans",
        exported_at: "2026-03-05T00:00:00Z",
        format: "json",
        row_limit: 25,
        public_data: {},
        grove_data: {},
        tenant_data: {},
      }),
    ) as typeof fetch;

    const response = await exportAdminTenant("t1", 25);
    expect(response.row_limit).toBe(25);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/t1/export?row_limit=25",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
