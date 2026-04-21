import {
  test,
  expect,
  expectDataTableFillsContainer,
  expectDataTableFitsViewport,
  expectRowActionsUseCellWidth,
} from "./harness";
import { primeSessionCookie } from "./session-helpers";

type MockTenant = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "offboarded";
  environment: "production" | "demo" | "test" | "e2e";
  ui_locale: "en" | "lt";
  created_at: string;
  updated_at: string;
};

test.describe("admin solutions", () => {
  test("super admin can toggle tenant solution access", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    const now = new Date().toISOString();
    const tenants: MockTenant[] = [
      {
        id: "tenant-1",
        name: "North Clinic",
        slug: "north_clinic",
        status: "active",
        environment: "production",
        ui_locale: "en",
        created_at: now,
        updated_at: now,
      },
    ];
    const actionLog: Array<{ solution_name: string; enabled: boolean }> = [];
    const solutions = [
      {
        solution_name: "appointment_booking",
        enabled: true,
        version: "1.0.0",
        description: "Clinic appointment booking solution.",
        requires_enabled: [],
        optional_enabled: [],
        desired_revision: "latest",
        active_revision: "2026-03-01",
      },
      {
        solution_name: "driver_verification",
        enabled: false,
        version: "1.0.0",
        description: "Driver verification solution.",
        requires_enabled: [],
        optional_enabled: [],
        desired_revision: null,
        active_revision: null,
      },
    ];

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tenants),
      });
    });

    await page.route("**/api/platform/admin/tenants/tenant-1/solutions**", async (route) => {
      const request = route.request();
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ solutions }),
        });
        return;
      }

      if (request.method() === "PUT") {
        const payload = JSON.parse(request.postData() || "{}") as { enabled?: boolean };
        const match = request.url().match(/solutions\/([^/?]+)$/);
        const solutionName = match ? decodeURIComponent(match[1]) : "";
        const solution = solutions.find((candidate) => candidate.solution_name === solutionName);
        if (!solution || typeof payload.enabled !== "boolean") {
          await route.fulfill({
            status: 400,
            contentType: "application/json",
            body: JSON.stringify({ detail: "Invalid request" }),
          });
          return;
        }
        solution.enabled = payload.enabled;
        actionLog.push({ solution_name: solutionName, enabled: payload.enabled });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(solution),
        });
        return;
      }

      await route.fulfill({
        status: 405,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Method not allowed" }),
      });
    });

    await page.goto("/admin/solutions");
    await expect(page.getByRole("heading", { name: "Solutions", level: 1 })).toBeVisible();
    await expect(page.getByTestId("admin-tenant-picker")).toContainText("North Clinic");
    await expect(page.getByText("Clinic appointment booking solution.")).toBeVisible();
    await expect(page.getByText("Enabled", { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId("admin-solutions-toggle-driver_verification")).not.toBeChecked();

    await expectRowActionsUseCellWidth(page.locator('[data-ui="row-actions"]'));
    await expectDataTableFitsViewport(page.locator('[data-ui="data-table-table"]'));
    await expectDataTableFillsContainer(page.locator('[data-ui="data-table-table"]'));

    await page.getByTestId("admin-solutions-toggle-driver_verification").click();
    await expect.poll(() => actionLog).toEqual([{ solution_name: "driver_verification", enabled: true }]);
    await expect(page.getByTestId("admin-solutions-toggle-driver_verification")).toBeChecked();
    await expect(page.getByText("Enabled", { exact: true }).first()).toBeVisible();

    await expectRowActionsUseCellWidth(page.locator('[data-ui="row-actions"]'));
    await expectDataTableFitsViewport(page.locator('[data-ui="data-table-table"]'));
    await expectDataTableFillsContainer(page.locator('[data-ui="data-table-table"]'));
  });
});
