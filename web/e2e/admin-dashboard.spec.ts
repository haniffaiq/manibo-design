import { test, expect } from "./harness";
import { primeSessionCookie } from "./session-helpers";

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "offboarded";
  environment: "production" | "demo" | "test" | "e2e";
  ui_locale: "en" | "lt";
  created_at: string;
  updated_at: string;
};

type OidcProviderSummary = {
  id: string;
  issuer: string;
  jwks_uri: string;
  audience: string;
  tenant_id: string | null;
  created_at: string;
};

test.describe("admin dashboard", () => {
  test("super admin sees deployment snapshot with auto-refreshing metrics", async ({ page }) => {
    const now = new Date().toISOString();
    const tenantQueryLog: string[] = [];

    const tenants: TenantSummary[] = [
      {
        id: "tenant-1",
        name: "Hoptrans",
        slug: "hoptrans",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: now,
        updated_at: now,
      },
      {
        id: "tenant-2",
        name: "Northfleet",
        slug: "northfleet",
        status: "suspended",
        environment: "production",
        ui_locale: "en",
        created_at: now,
        updated_at: now,
      },
      {
        id: "tenant-3",
        name: "Acme",
        slug: "acme",
        status: "offboarded",
        environment: "production",
        ui_locale: "en",
        created_at: now,
        updated_at: now,
      },
    ];

    const providers: OidcProviderSummary[] = [
      {
        id: "provider-1",
        issuer: "https://issuer.one.test",
        jwks_uri: "https://issuer.one.test/jwks",
        audience: "grove-api",
        tenant_id: null,
        created_at: now,
      },
      {
        id: "provider-2",
        issuer: "https://issuer.two.test",
        jwks_uri: "https://issuer.two.test/jwks",
        audience: "grove-api",
        tenant_id: "tenant-1",
        created_at: now,
      },
    ];

    let healthRequestCount = 0;

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      tenantQueryLog.push(new URL(route.request().url()).searchParams.toString());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/oidc-providers", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(providers),
      });
    });

    await page.route("**/api/platform/admin/reports/platform-health**", async (route) => {
      healthRequestCount += 1;
      if (healthRequestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            checked_at: "2026-03-05T09:00:00Z",
            call_error_rate: 0.25,
            average_call_duration_seconds: 60,
            active_calls: {
              voice_call: 3,
              inbound_call: 1,
              total: 4,
            },
            worker_status: {
              platform_api: "healthy",
              temporal: "degraded",
              temporal_error: "temporal unavailable",
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          checked_at: "2026-03-05T09:01:00Z",
          call_error_rate: 0.1,
          average_call_duration_seconds: 52,
          active_calls: {
            voice_call: 1,
            inbound_call: 1,
            total: 2,
          },
          worker_status: {
            platform_api: "healthy",
            temporal: "healthy",
            temporal_error: null,
          },
        }),
      });
    });

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "Deployment Console", level: 1 })).toBeVisible();
    await expect(page.getByTestId("admin-dashboard-active-calls")).toContainText("4");
    await expect(page.getByTestId("admin-dashboard-error-rate")).toContainText("25.0%");
    await expect(page.getByTestId("admin-dashboard-worker-temporal")).toContainText("degraded");
    await expect(page.getByTestId("admin-dashboard-attention")).toContainText("Temporal worker degraded.");

    expect(tenantQueryLog).toContain("limit=500&offset=0");
    expect(healthRequestCount).toBeGreaterThanOrEqual(1);
  });
});
