import { test, expect } from "./harness";
import { primeSessionCookie } from "./session-helpers";

async function openDeveloperAccess(page: import("@playwright/test").Page) {
  const tokenField = page.locator('textarea[name="access_token"]');
  if (await tokenField.isVisible()) {
    return;
  }
  const developerSummary = page.locator("summary").getByText("Developer access", { exact: true });
  if (await developerSummary.count()) {
    await developerSummary.click();
    await expect(tokenField).toBeVisible();
    return;
  }
  await page.locator("summary").getByText("Sign in with a different token", { exact: true }).click();
  await expect(tokenField).toBeVisible();
}

test.describe("auth flow", () => {
  test("can log in with OIDC access token and access protected route", async ({ page }) => {
    const jwtPayload = Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 900 }),
      "utf-8",
    ).toString("base64");
    const token = `header.${jwtPayload}.sig`;

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user_id: "11111111-1111-1111-1111-111111111111",
          tenant_id: "22222222-2222-2222-2222-222222222222",
          role: "client_admin",
          email: "admin@example.com",
        }),
      });
    });

    await primeSessionCookie(page, "client_admin");
    await page.goto("/login?from=/call-ops");
    await openDeveloperAccess(page);
    await page.fill('textarea[name="access_token"]', token);
    await page.click('button[type="submit"]');
    await expect.poll(() => new URL(page.url()).pathname).toBe("/call-ops");
    await expect(page.getByRole("heading", { name: "Call Operations" })).toBeVisible();
  });

  test("OIDC token login preserves ?from redirect target", async ({ page }) => {
    const jwtPayload = Buffer.from(
      JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 900 }),
      "utf-8",
    ).toString("base64");
    const token = `header.${jwtPayload}.sig`;

    await page.route("**/api/auth/session", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          user_id: "11111111-1111-1111-1111-111111111111",
          tenant_id: "22222222-2222-2222-2222-222222222222",
          role: "client_admin",
          email: "admin@example.com",
        }),
      });
    });

    await page.route("**/api/platform/team/users**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          users: [
            {
              user_id: "11111111-1111-1111-1111-111111111111",
              tenant_id: "22222222-2222-2222-2222-222222222222",
              email: "admin@example.com",
              display_name: "Tenant Admin",
              role: "client_admin",
              user_created_at: "2026-03-05T09:00:00Z",
              membership_created_at: "2026-03-05T09:00:00Z",
            },
          ],
        }),
      });
    });

    await primeSessionCookie(page, "client_admin");
    await page.goto("/login?from=/team");
    await openDeveloperAccess(page);
    await page.fill('textarea[name="access_token"]', token);
    await page.click('button[type="submit"]');
    await expect.poll(() => new URL(page.url()).pathname).toBe("/team");
    await expect(page.getByRole("heading", { name: "Team Management" })).toBeVisible();
  });

  test.describe("oidc error handling", () => {
    test.use({
      allowConsoleErrors: [
        /Failed to load resource: (?:net::ERR_FAILED|the server responded with a status of 401 \(Unauthorized\))/,
        /Failed to load resource: the server responded with a status of 403 \(Forbidden\)/,
      ],
      allowRequestFailures: [/\/api\/auth\/session$/],
    });

    test("shows a user-facing error when OIDC profile fetch fails", async ({ page }) => {
      const jwtPayload = Buffer.from(
        JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 900 }),
        "utf-8",
      ).toString("base64");
      const token = `header.${jwtPayload}.sig`;

      await page.route("**/api/auth/session", async (route) => {
        await route.abort();
      });

      await page.goto("/login");
      await openDeveloperAccess(page);
      await page.fill('textarea[name="access_token"]', token);
      await page.click('button[type="submit"]');
      await expect(page.getByText("Unable to reach the auth endpoint. Check your network connection.")).toBeVisible();
      expect(page.url()).toContain("/login");
    });

    test("redirects provider bootstrap failures back to login with operator-readable guidance", async ({ page }) => {
      await page.goto("/api/auth/oidc/start?provider=google&from=/call-ops");
      await page.waitForURL("**/login?from=%2Fcall-ops&error=*");
      await expect(
        page.getByText("Google sign-in is not configured for this deployment. Ask your platform administrator to enable it."),
      ).toBeVisible();
      expect(page.url()).toContain("from=%2Fcall-ops");
    });

    test("explains the dev token format when local test auth rejects an OIDC token", async ({ page }) => {
      await page.route("**/api/auth/session", async (route) => {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Login failed: 401 Unauthorized — {\"detail\":\"Dev auth expects token format 'dev:<subject>'\"}",
          }),
        });
      });

      await page.goto("/login");
      await openDeveloperAccess(page);
      await page.fill('textarea[name="access_token"]', "header.payload.sig");
      await page.click('button[type="submit"]');
      const errorBanner = page.locator('div[role="alert"]').filter({ hasText: "Local test auth is enabled here." });
      await expect(errorBanner).toContainText("Local test auth is enabled here.");
      await expect(errorBanner).toContainText("dev:<user_uuid_or_subject>");
      expect(page.url()).toContain("/login");
    });

    test("explains suspended tenant access without raw HTTP jargon", async ({ page }) => {
      await page.route("**/api/auth/session", async (route) => {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          body: JSON.stringify({
            error: "Login failed: 403 Forbidden — {\"detail\":\"tenant suspended\"}",
          }),
        });
      });

      await page.goto("/login");
      await openDeveloperAccess(page);
      await page.fill('textarea[name="access_token"]', "dev:00000000-0000-4000-a000-000000000002");
      await page.click('button[type="submit"]');
      const errorBanner = page.locator('div[role="alert"]').filter({ hasText: "This workspace is currently suspended." });
      await expect(errorBanner).toContainText("This workspace is currently suspended.");
      await expect(errorBanner).not.toContainText("403");
      await expect(errorBanner).not.toContainText("tenant suspended");
    });
  });

});
