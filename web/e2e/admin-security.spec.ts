import { test, expect, expectDataTableFillsContainer, expectDataTableFitsViewport } from "./harness";
import { primeSessionCookie } from "./session-helpers";

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "offboarded";
  created_at: string;
  updated_at: string;
};

type AuditEvent = {
  id: string;
  tenant_id: string;
  actor_user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  outcome: string | null;
  created_at: string;
};

test.describe("admin security", () => {
  test("super admin can filter tenant audit events", async ({ page }) => {
    const tenantQueryLog: string[] = [];
    const auditQueryLog: string[] = [];

    const tenantId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const now = new Date().toISOString();
    const tenants: TenantSummary[] = [
      {
        id: tenantId,
        name: "Hoptrans",
        slug: "hoptrans",
        status: "active",
        created_at: now,
        updated_at: now,
      },
    ];

    const events: AuditEvent[] = [
      {
        id: "evt_1",
        tenant_id: tenantId,
        actor_user_id: "user_admin",
        action: "tenant.plan.updated",
        resource_type: "tenant",
        resource_id: tenantId,
        metadata: { outcome: "success", source: "test" },
        outcome: "success",
        created_at: now,
      },
      {
        id: "evt_2",
        tenant_id: tenantId,
        actor_user_id: "user_admin",
        action: "team_user.invited",
        resource_type: "membership",
        resource_id: "user_2",
        metadata: { outcome: "success", source: "test" },
        outcome: "success",
        created_at: now,
      },
    ];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      tenantQueryLog.push(new URL(route.request().url()).searchParams.toString());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/audit-events**", async (route) => {
      const request = route.request();
      if (request.method() !== "GET") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const url = new URL(request.url());
      auditQueryLog.push(url.searchParams.toString());
      const action = url.searchParams.get("action");
      const resourceType = url.searchParams.get("resource_type");
      const resourceId = url.searchParams.get("resource_id");
      const limit = Number(url.searchParams.get("limit") || "100");

      const filtered = events.filter((event) => {
        if (action && event.action !== action) {
          return false;
        }
        if (resourceType && event.resource_type !== resourceType) {
          return false;
        }
        if (resourceId && event.resource_id !== resourceId) {
          return false;
        }
        return true;
      });

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ events: filtered.slice(0, limit) }),
      });
    });

    await page.goto("/admin/security");
    await expect(page.getByRole("heading", { name: "Security", level: 1 })).toBeVisible();
    await expect(page.getByTestId("admin-security-event-action-evt_1")).toContainText("tenant.plan.updated");
    await expect(page.getByTestId("admin-security-event-action-evt_2")).toContainText("team_user.invited");
    await expectDataTableFitsViewport(page.locator('[data-ui="data-table-table"]'));
    await expectDataTableFillsContainer(page.locator('[data-ui="data-table-table"]'));

    await page.getByTestId("admin-security-filter-action").fill("tenant.plan.updated");
    await page.getByTestId("admin-security-filter-resource-type").fill("tenant");
    await page.getByTestId("admin-security-filter-limit").fill("20");
    await page.getByTestId("admin-security-apply-filters").click();

    await expect(page.getByTestId("admin-security-event-action-evt_1")).toContainText("tenant.plan.updated");
    await expect(page.getByTestId("admin-security-event-action-evt_2")).toHaveCount(0);
    await expect(page.getByTestId("admin-security-action-notice")).toContainText("Audit filters applied");

    await page.getByTestId("admin-security-clear-filters").click();
    await expect(page.getByTestId("admin-security-event-action-evt_2")).toContainText("team_user.invited");
    await expectDataTableFitsViewport(page.locator('[data-ui="data-table-table"]'));
    await expectDataTableFillsContainer(page.locator('[data-ui="data-table-table"]'));

    expect(tenantQueryLog).toContain("limit=500&offset=0&include_non_production=true");
    expect(auditQueryLog).toContain("limit=100");
    expect(auditQueryLog).toContain("action=tenant.plan.updated&resource_type=tenant&limit=20");
  });
});
