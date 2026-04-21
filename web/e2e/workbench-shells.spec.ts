import { test, expect } from "./harness";
import { primeSessionCookie } from "./session-helpers";

async function stubClientAdminDashboardData(page: import("@playwright/test").Page) {
  await page.route("**/api/platform/billing/usage**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tenant_id: "test-tenant",
        period_start: "2026-03-01T00:00:00Z",
        period_end: "2026-03-31T23:59:59Z",
        currency: "EUR",
        voice_seconds: 0,
        voice_minutes: 0,
        production_voice_seconds: 0,
        production_voice_minutes: 0,
        test_voice_seconds: 0,
        test_voice_minutes: 0,
        llm_tokens: 0,
        stt_characters: 0,
        tts_characters: 0,
        platform_fee_cents: 0,
        telephony_fee_cents: 0,
        llm_fee_cents: 0,
        stt_fee_cents: 0,
        tts_fee_cents: 0,
        discount_cents: 0,
        subtotal_cents: 0,
        total_cents: 0,
        budget_mode: "none",
        monthly_budget_cents: null,
        over_budget: false,
        utilization_percent: null,
      }),
    });
  });
  await page.route("**/api/platform/reports/calls**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ buckets: [] }),
    });
  });
}

test.describe("workbench shell composition", () => {
  test("deployment shell renders all platform nav sections", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await page.goto("/admin");
    await page.waitForURL("**/admin");

    const nav = page.locator("aside").first();
    await expect(nav.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Tenants" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Solutions" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Users" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Agents" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Observability" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Health" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Security" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Settings" })).toBeVisible();
  });

  test("client_operator shell hides admin-only nav items", async ({ page }) => {
    await primeSessionCookie(page, "client_operator");
    await page.goto("/call-ops");
    await page.waitForURL("**/call-ops");

    // Tenant shell uses localized copy — en: dashboard="Overview", callOps="Live calls"
    const nav = page.locator("aside").first();
    await expect(nav.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Live calls" })).toBeVisible();

    // Operator does NOT see manage section
    await expect(nav.getByRole("link", { name: "Team" })).not.toBeVisible();
    await expect(nav.getByRole("link", { name: "Activity" })).not.toBeVisible();
    await expect(nav.getByRole("link", { name: "Integrations" })).not.toBeVisible();
    // Operator does NOT see automations
    await expect(nav.getByRole("link", { name: "Automations" })).not.toBeVisible();
  });

  test("client_admin shell includes manage section", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await stubClientAdminDashboardData(page);
    await page.goto("/dashboard");
    await page.waitForURL("**/dashboard");

    const nav = page.locator("aside").first();
    await expect(nav.getByRole("link", { name: "Overview" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Team" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Activity" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Integrations" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Automations" })).toBeVisible();
  });

  test("middleware redirects client_admin away from admin routes to dashboard", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await stubClientAdminDashboardData(page);
    await page.goto("/admin");
    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("middleware redirects client_operator away from admin routes to call-ops", async ({ page }) => {
    await primeSessionCookie(page, "client_operator");
    await page.goto("/admin");
    await page.waitForURL("**/call-ops");
    await expect(page).toHaveURL(/\/call-ops$/);
  });

  test("middleware redirects super_admin away from tenant routes to admin", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await page.goto("/call-ops");
    await page.waitForURL("**/admin");
    await expect(page).toHaveURL(/\/admin$/);
  });
});
