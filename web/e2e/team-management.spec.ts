import { test, expect, selectRadixOption } from "./harness";
import { primeSessionCookie } from "./session-helpers";

type MockTeamUser = {
  user_id: string;
  tenant_id: string;
  email: string;
  display_name: string | null;
  role: "client_admin" | "client_operator";
  user_created_at: string;
  membership_created_at: string;
};

test.describe("team management", () => {
  test("client admin can invite a new team user", async ({ page }) => {
    const now = new Date().toISOString();
    let nextUserNumber = 3;
    const inviteLog: Array<Record<string, unknown>> = [];
    const roleUpdateLog: Array<{ userId: string; role: "client_admin" | "client_operator" }> = [];
    const deactivateLog: string[] = [];
    const removeLog: string[] = [];
    const tenantId = "22222222-2222-2222-2222-222222222222";
    const users: MockTeamUser[] = [
      {
        user_id: "11111111-1111-1111-1111-111111111111",
        tenant_id: tenantId,
        email: "admin@example.com",
        display_name: "Tenant Admin",
        role: "client_admin",
        user_created_at: now,
        membership_created_at: now,
      },
      {
        user_id: "11111111-1111-1111-1111-111111111112",
        tenant_id: tenantId,
        email: "ops@example.com",
        display_name: "Ops One",
        role: "client_operator",
        user_created_at: now,
        membership_created_at: now,
      },
    ];

    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/team/users**", async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname;
      const basePrefix = "/api/platform/team/users";
      if (request.method() === "GET" && (path === basePrefix || path === `${basePrefix}/`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ users }),
        });
        return;
      }

      if (!path.startsWith(`${basePrefix}/`)) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Not found" }),
        });
        return;
      }

      const suffix = path.slice(basePrefix.length + 1);
      const [encodedUserId, action] = suffix.split("/");
      const userId = decodeURIComponent(encodedUserId || "");

      if (request.method() === "POST" && encodedUserId === "invite") {
        const body = JSON.parse(request.postData() || "{}") as {
          email?: string;
          display_name?: string;
          role?: "client_admin" | "client_operator";
        };
        inviteLog.push(body as Record<string, unknown>);
        const nextUserId = `11111111-1111-1111-1111-${String(nextUserNumber).padStart(12, "0")}`;
        nextUserNumber += 1;
        const created: MockTeamUser = {
          user_id: nextUserId,
          tenant_id: tenantId,
          email: body.email ?? "unknown@example.com",
          display_name: body.display_name ?? null,
          role: body.role ?? "client_operator",
          user_created_at: now,
          membership_created_at: now,
        };
        users.push(created);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(created),
        });
        return;
      }

      const userIndex = users.findIndex((candidate) => candidate.user_id === userId);

      if (userIndex < 0) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "team user not found" }),
        });
        return;
      }

      if (request.method() === "PATCH" && action === "role") {
        const body = JSON.parse(request.postData() || "{}") as { role?: "client_admin" | "client_operator" };
        users[userIndex].role = body.role ?? users[userIndex].role;
        roleUpdateLog.push({ userId, role: users[userIndex].role });
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(users[userIndex]),
        });
        return;
      }

      if (request.method() === "POST" && action === "deactivate") {
        users.splice(userIndex, 1);
        deactivateLog.push(userId);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ user_id: userId, tenant_id: tenantId, removed: true }),
        });
        return;
      }

      if (request.method() === "DELETE") {
        users.splice(userIndex, 1);
        removeLog.push(userId);
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ user_id: userId, tenant_id: tenantId, removed: true }),
        });
        return;
      }

      await route.fulfill({
        status: 405,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Method not allowed" }),
      });
    });

    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });

    await page.goto("/team");
    await expect.poll(() => new URL(page.url()).pathname).toBe("/team");

    await expect(page.getByRole("heading", { name: "Team Management" })).toBeVisible();
    await expect(page.getByText("ops@example.com")).toBeVisible();

    await page.getByTestId("team-invite-open").click();
    await page.getByTestId("team-invite-email").fill("new.operator@example.com");
    await selectRadixOption(page, "team-invite-role", { value: "client_operator" });
    await page.getByTestId("team-invite-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });
    await expect(page.getByText("new.operator@example.com")).toBeVisible();

    const invitedUserId = users.find((candidate) => candidate.email === "new.operator@example.com")?.user_id;
    expect(invitedUserId).toBeTruthy();

    const invitedRoleSelect = page.getByTestId(`team-role-${invitedUserId}`);
    await expect(invitedRoleSelect).toBeEnabled();
    await expect(invitedRoleSelect).toContainText("Client Operator");
    await selectRadixOption(page, `team-role-${invitedUserId}`, { value: "client_admin" });
    await expect.poll(() => roleUpdateLog).toEqual([{ userId: invitedUserId!, role: "client_admin" }]);
    await expect(invitedRoleSelect).toContainText("Client Admin");

    await page.getByTestId(`team-remove-${invitedUserId}`).click();
    await page.getByRole("dialog").getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText("new.operator@example.com")).not.toBeVisible();

    await page.getByTestId("team-invite-open").click();
    await page.getByTestId("team-invite-email").fill("deactivate.user@example.com");
    await selectRadixOption(page, "team-invite-role", { value: "client_operator" });
    await page.getByTestId("team-invite-submit").evaluate((element: HTMLButtonElement) => {
      element.click();
    });
    await expect(page.getByText("deactivate.user@example.com")).toBeVisible();

    const deactivatedUserId = users.find((candidate) => candidate.email === "deactivate.user@example.com")?.user_id;
    expect(deactivatedUserId).toBeTruthy();

    await page.getByTestId(`team-deactivate-${deactivatedUserId}`).click();
    await page.getByRole("dialog").getByRole("button", { name: "Deactivate" }).click();
    await expect(page.getByText("deactivate.user@example.com")).not.toBeVisible();

    expect(inviteLog).toEqual([
      {
        email: "new.operator@example.com",
        role: "client_operator",
      },
      {
        email: "deactivate.user@example.com",
        role: "client_operator",
      },
    ]);
    expect(roleUpdateLog).toEqual([{ userId: invitedUserId!, role: "client_admin" }]);
    expect(removeLog).toEqual([invitedUserId!]);
    expect(deactivateLog).toEqual([deactivatedUserId!]);
  });
});
