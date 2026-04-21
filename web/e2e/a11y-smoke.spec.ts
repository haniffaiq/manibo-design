import AxeBuilder from "@axe-core/playwright";
import { type TestInfo } from "@playwright/test";

import { expect, test, type Page } from "./harness";
import { primeSessionCookie } from "./session-helpers";

async function assertNoSeriousA11yViolations({
  page,
  testInfo,
  label,
}: {
  page: Page;
  testInfo: TestInfo;
  label: string;
}) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  await testInfo.attach(`axe-${label}.json`, {
    body: Buffer.from(JSON.stringify(results, null, 2), "utf-8"),
    contentType: "application/json",
  });

  const serious = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  expect(serious, `Serious accessibility violations detected on ${label}.`).toEqual([]);
}

test.describe("a11y smoke", () => {
  test("key pages have no serious a11y violations", async ({ page }, testInfo) => {
    await page.route("**/api/platform/admin/tenants?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/platform/admin/oidc-providers", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([]),
      });
    });

    await page.route("**/api/platform/admin/reports/platform-health**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          checked_at: "2026-03-05T09:00:00Z",
          call_error_rate: 0,
          average_call_duration_seconds: 0,
          active_calls: {
            voice_call: 0,
            inbound_call: 0,
            total: 0,
          },
          worker_status: {
            platform_api: "healthy",
            temporal: "healthy",
            temporal_error: null,
          },
        }),
      });
    });

    await page.route("**/api/platform/calls/active", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ calls: [] }),
      });
    });

    await page.goto("/login");
    await assertNoSeriousA11yViolations({ page, testInfo, label: "login" });

    await primeSessionCookie(page, "super_admin");
    await page.goto("/admin");
    await page.waitForURL("**/admin");
    await assertNoSeriousA11yViolations({ page, testInfo, label: "admin" });

    await primeSessionCookie(page, "client_admin");
    await page.goto("/call-ops");
    await page.waitForURL("**/call-ops");
    await assertNoSeriousA11yViolations({ page, testInfo, label: "call-ops" });

    await page.goto("/driver-verification/drivers");
    await page.waitForURL("**/driver-verification/drivers");
    await assertNoSeriousA11yViolations({ page, testInfo, label: "driver-verification-drivers" });
  });
});
