import { test, expect } from "./harness";
import { primeSessionCookie } from "./session-helpers";

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

test.describe("tenant activity history", () => {
  test("client admin can review and filter activity history", async ({ page }) => {
    const queryLog: string[] = [];
    const tenantId = "22222222-2222-2222-2222-222222222222";
    const now = "2026-03-06T10:00:00Z";
    const events: AuditEvent[] = [
      {
        id: "evt_1",
        tenant_id: tenantId,
        actor_user_id: "user-admin",
        action: "team_user.invited",
        resource_type: "membership",
        resource_id: "user-2",
        metadata: { outcome: "success", invited_email: "ops@example.com" },
        outcome: "success",
        created_at: now,
      },
      {
        id: "evt_2",
        tenant_id: tenantId,
        actor_user_id: null,
        action: "phone_number.updated",
        resource_type: "phone_number",
        resource_id: "pn-1",
        metadata: { outcome: "warning", phone_number: "+37061234567" },
        outcome: "warning",
        created_at: "2026-03-06T09:30:00Z",
      },
    ];

    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/audit/events**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      queryLog.push(url.searchParams.toString());
      const action = url.searchParams.get("action");
      const resourceType = url.searchParams.get("resource_type");
      const limit = Number(url.searchParams.get("limit") || "100");

      const filtered = events.filter((event) => {
        if (action && event.action !== action) {
          return false;
        }
        if (resourceType && event.resource_type !== resourceType) {
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

    await page.goto("/activity");

    await expect(page.getByRole("heading", { name: "Activity History" })).toBeVisible();
    await expect(page.getByTestId("activity-summary-total")).toContainText("2");
    await expect(page.getByTestId("activity-summary-success")).toContainText("1");
    await expect(page.getByTestId("activity-summary-attention")).toContainText("1");
    await expect(page.getByTestId("activity-event-action-evt_1")).toContainText("Team member invited");
    await expect(page.getByTestId("activity-event-action-evt_2")).toContainText("Phone line updated");

    await page.getByTestId("activity-filter-action").fill("team_user.invited");
    await page.getByTestId("activity-filter-resource-type").fill("membership");
    await page.getByTestId("activity-filter-limit").fill("20");
    await page.getByTestId("activity-apply-filters").click();

    await expect(page.getByTestId("activity-action-notice")).toContainText("Filters applied.");
    await expect(page.getByTestId("activity-event-action-evt_1")).toContainText("Team member invited");
    await expect(page.getByTestId("activity-event-action-evt_2")).toHaveCount(0);

    await page.getByTestId("activity-clear-filters").click();
    await expect(page.getByTestId("activity-event-action-evt_2")).toContainText("Phone line updated");

    expect(queryLog).toContain("limit=100");
    expect(queryLog).toContain("action=team_user.invited&resource_type=membership&limit=20");
  });

  test("client operator sees admin-only message", async ({ page }) => {
    let auditRequestCount = 0;

    await primeSessionCookie(page, "client_operator");

    await page.route("**/api/platform/audit/events**", async (route) => {
      auditRequestCount += 1;
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Requires client_admin role" }),
      });
    });

    await page.goto("/activity");

    await expect(page.getByRole("heading", { name: "Activity History" })).toBeVisible();
    await expect(page.getByTestId("activity-forbidden")).toContainText("Only workspace admins can view activity history.");
    expect(auditRequestCount).toBe(0);
  });
});
