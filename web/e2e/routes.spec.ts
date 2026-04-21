import { test, expect } from "./harness";
import { primeSessionCookie } from "./session-helpers";

async function stubClientAdminDashboardRequests(page: import("@playwright/test").Page) {
  await page.route("**/api/platform/solutions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ solutions: [] }),
    });
  });

  await page.route("**/api/platform/calls/active", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ calls: [] }),
    });
  });

  await page.route("**/api/platform/billing/usage**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        tenant_id: "tenant-1",
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

  await page.route("**/api/platform/calls/observability-summary**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        sampled_calls: 0,
        window_start: "2026-03-01T00:00:00Z",
        window_end: "2026-03-31T23:59:59Z",
        stack_comparisons: [],
        route_hotspots: [],
      }),
    });
  });
}

test.describe("route groups", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Welcome back");
    await expect(page.getByText("Access is by invitation. Contact your administrator if you need an account.")).toBeVisible();
    await expect(page.getByText("No sign-in providers are configured")).toBeVisible();
    await expect(page.getByText("Don't have an account?")).toHaveCount(0);
  });

  test("signup route redirects back to login", async ({ page }) => {
    await page.goto("/signup");
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("verify-email resend route redirects back to login", async ({ page }) => {
    await page.goto("/verify-email/resend");
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("unauthenticated user is redirected to /login from /admin", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/login?from=%2Fadmin");
    expect(page.url()).toContain("/login");
    expect(page.url()).toContain("from=%2Fadmin");
  });

  test("unauthenticated user is redirected to /login from /call-ops", async ({ page }) => {
    await page.goto("/call-ops");
    await page.waitForURL("**/login?from=%2Fcall-ops");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user is redirected to /login from /dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL("**/login?from=%2Fdashboard");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user is redirected to /login from /settings/recordings", async ({ page }) => {
    await page.goto("/settings/recordings");
    await page.waitForURL("**/login?from=%2Fsettings%2Frecordings");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user is redirected to /login from /bookings", async ({ page }) => {
    await page.goto("/bookings");
    await page.waitForURL("**/login?from=%2Fbookings");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user is redirected to /login from /driver-verification/drivers", async ({ page }) => {
    await page.goto("/driver-verification/drivers");
    await page.waitForURL("**/login?from=%2Fdriver-verification%2Fdrivers");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user is redirected to /login from /automations", async ({ page }) => {
    await page.goto("/automations");
    await page.waitForURL("**/login?from=%2Fautomations");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user is redirected to /login from /activity", async ({ page }) => {
    await page.goto("/activity");
    await page.waitForURL("**/login?from=%2Factivity");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user is redirected to /login from /integrations", async ({ page }) => {
    await page.goto("/integrations");
    await page.waitForURL("**/login?from=%2Fintegrations");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user is redirected to /login from /admin/solutions", async ({ page }) => {
    await page.goto("/admin/solutions");
    await page.waitForURL("**/login?from=%2Fadmin%2Fsolutions");
    expect(page.url()).toContain("/login");
  });

  test("unauthenticated user is redirected to /login from /admin/channels", async ({ page }) => {
    await page.goto("/admin/channels");
    await page.waitForURL("**/login?from=%2Fadmin%2Fchannels");
    expect(page.url()).toContain("/login");
  });

  test("home page redirects to login without auth", async ({ page }) => {
    await page.goto("/");
    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("home page sends super admin to deployment console", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await page.goto("/");
    await page.waitForURL("**/admin");
    await expect(page.getByRole("heading", { name: "Deployment Console" })).toBeVisible();
  });

  test("home page sends client_admin to dashboard", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await stubClientAdminDashboardRequests(page);
    await page.goto("/");
    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("home page sends client_operator to call ops", async ({ page }) => {
    await primeSessionCookie(page, "client_operator");
    await page.goto("/");
    await page.waitForURL("**/call-ops");
    await expect(page.getByRole("heading", { name: "Call Operations" })).toBeVisible();
  });
});
