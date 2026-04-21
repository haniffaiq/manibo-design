import {
  expectActionsAnchoredToTableEdge,
  test,
  expect,
  expectDataTableFillsContainer,
  expectDataTableFitsViewport,
  expectRowActionsUseCellWidth,
  selectRadixOption,
} from "./harness";
import { primeSessionCookie } from "./session-helpers";

type TenantSummary = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "offboarded";
  created_at: string;
  updated_at: string;
};

type TeamUser = {
  user_id: string;
  tenant_id: string;
  email: string;
  display_name: string | null;
  role: "client_admin" | "client_operator";
  user_created_at: string;
  membership_created_at: string;
};



test.describe("admin users", () => {
  test("super admin can invite, update, deactivate, and remove tenant users", async ({ page }) => {
    await page.setViewportSize({ width: 1600, height: 1100 });
    const tenantQueryLog: string[] = [];
    const inviteLog: Array<Record<string, unknown>> = [];
    const roleUpdateLog: Array<{ userId: string; role: string }> = [];
    const deactivateLog: string[] = [];
    const removeLog: string[] = [];

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

    const users: TeamUser[] = [
      {
        user_id: "user-1",
        tenant_id: tenantId,
        email: "admin@hoptrans.test",
        display_name: "Hoptrans Admin",
        role: "client_admin",
        user_created_at: now,
        membership_created_at: now,
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

    await page.route("**/api/platform/admin/tenants/*/users/invite", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const payload = JSON.parse(request.postData() || "{}") as {
        email?: string;
        display_name?: string;
        role?: "client_admin" | "client_operator";
        subject?: string;
      };
      inviteLog.push(payload as Record<string, unknown>);

      const invitedUser: TeamUser = {
        user_id: "user-2",
        tenant_id: tenantId,
        email: payload.email ?? "",
        display_name: payload.display_name ?? null,
        role: payload.role ?? "client_operator",
        user_created_at: new Date().toISOString(),
        membership_created_at: new Date().toISOString(),
      };
      users.push(invitedUser);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(invitedUser),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/users/*/role", async (route) => {
      const request = route.request();
      if (request.method() !== "PATCH") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/users\/([^/]+)\/role$/);
      const userId = match ? decodeURIComponent(match[1]) : "";
      const payload = JSON.parse(request.postData() || "{}") as { role?: "client_admin" | "client_operator" };
      const user = users.find((candidate) => candidate.user_id === userId);
      if (!user || !payload.role) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "team user not found" }),
        });
        return;
      }
      user.role = payload.role;
      roleUpdateLog.push({ userId, role: payload.role });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(user),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/users/*/deactivate", async (route) => {
      const request = route.request();
      if (request.method() !== "POST") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }
      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/users\/([^/]+)\/deactivate$/);
      const userId = match ? decodeURIComponent(match[1]) : "";
      const index = users.findIndex((candidate) => candidate.user_id === userId);
      if (index < 0) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "team user not found" }),
        });
        return;
      }
      users.splice(index, 1);
      deactivateLog.push(userId);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user_id: userId, tenant_id: tenantId, removed: true }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/users/*", async (route) => {
      const request = route.request();
      if (request.method() !== "DELETE") {
        await route.fallback();
        return;
      }
      const url = new URL(request.url());
      const match = url.pathname.match(/\/admin\/tenants\/[^/]+\/users\/([^/]+)$/);
      const userId = match ? decodeURIComponent(match[1]) : "";
      const index = users.findIndex((candidate) => candidate.user_id === userId);
      if (index < 0) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "team user not found" }),
        });
        return;
      }
      users.splice(index, 1);
      removeLog.push(userId);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ user_id: userId, tenant_id: tenantId, removed: true }),
      });
    });

    await page.route("**/api/platform/admin/tenants/*/users", async (route) => {
      const request = route.request();
      if (request.method() !== "GET") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ users }),
      });
    });

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.goto("/admin/users");
    await expect(page.getByRole("heading", { name: "User management", level: 1 })).toBeVisible();
    await expect(page.getByTestId("admin-users-name-user-1")).toContainText("Hoptrans Admin");
    await expectRowActionsUseCellWidth(page.locator('[data-ui="row-actions"]'));
    await expectActionsAnchoredToTableEdge(page.locator('[data-testid^="admin-users-actions-"]'));
    await expectDataTableFitsViewport(page.locator('[data-ui="data-table"]'));
    await expectDataTableFillsContainer(page.locator('[data-ui="data-table-table"]'));

    await page.getByTestId("admin-users-invite-open").click();
    await page.getByTestId("admin-users-invite-email").fill("ops@hoptrans.test");
    await page.getByTestId("admin-users-invite-display-name").fill("Ops User");
    await selectRadixOption(page, "admin-users-invite-role", { value: "client_operator" });
    await page.getByTestId("admin-users-invite-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });

    await expect(page.getByTestId("admin-users-name-user-2")).toContainText("Ops User");
    await expect(page.getByTestId("admin-users-action-notice")).toContainText("User invited");
    await expectRowActionsUseCellWidth(page.locator('[data-ui="row-actions"]'));
    await expectActionsAnchoredToTableEdge(page.locator('[data-testid^="admin-users-actions-"]'));
    await expectDataTableFitsViewport(page.locator('[data-ui="data-table"]'));
    await expectDataTableFillsContainer(page.locator('[data-ui="data-table-table"]'));

    await selectRadixOption(page, "admin-users-role-user-2", { value: "client_admin" });
    await expect(page.getByTestId("admin-users-action-notice")).toContainText("Role updated");

    await page.getByTestId("admin-users-actions-user-2").click();
    await expect(page.getByTestId("admin-users-remove-user-2")).toBeEnabled();
    await page.getByTestId("admin-users-remove-user-2").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByTestId("admin-users-confirm-action").click();
    await expect(page.getByTestId("admin-users-name-user-2")).toHaveCount(0);
    await expect(page.getByTestId("admin-users-action-notice")).toContainText("User removed");

    await page.getByTestId("admin-users-actions-user-1").click();
    await page.getByTestId("admin-users-deactivate-user-1").click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByTestId("admin-users-confirm-action").click();
    await expect(page.getByTestId("admin-users-name-user-1")).toHaveCount(0);
    await expect(page.getByTestId("admin-users-action-notice")).toContainText("User deactivated");

    expect(tenantQueryLog).toContain("limit=500&offset=0&include_non_production=true");
    expect(inviteLog).toEqual([
      {
        email: "ops@hoptrans.test",
        display_name: "Ops User",
        role: "client_operator",
      },
    ]);
    expect(roleUpdateLog).toEqual([{ userId: "user-2", role: "client_admin" }]);
    expect(removeLog).toEqual(["user-2"]);
    expect(deactivateLog).toEqual(["user-1"]);
  });
});
