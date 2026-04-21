import { test, expect } from "./harness";
import { isBuildEnabledSolution } from "./build-solutions";
import { primeSessionCookie } from "./session-helpers";

test.describe("solution gating", () => {
  test.skip(!isBuildEnabledSolution("driver_verification"), "Driver verification route is excluded from this build.");

  test("driver workspace appears only when the tenant has driver verification enabled", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "driver_verification",
              enabled: true,
              version: "1.0.0",
              description: "Driver checks.",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: "latest",
              active_revision: "2026-03-01",
            },
          ],
        }),
      });
    });

    await page.goto("/driver-verification/drivers");
    await expect(page.getByRole("heading", { name: "Driver checks" })).toBeVisible();
  });

  test("driver workspace shows a blocked state when the tenant should not see it", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Clinic bookings.",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: "latest",
              active_revision: "2026-03-01",
            },
          ],
        }),
      });
    });

    await page.goto("/driver-verification/drivers");
    await expect(page.getByRole("heading", { name: "Driver checks" })).toBeVisible();
    await expect(page.getByText("This workspace is not turned on for your organization.")).toBeVisible();
  });
});
