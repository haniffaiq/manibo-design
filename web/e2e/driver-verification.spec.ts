import { test, expect } from "./harness";
import { isBuildEnabledSolution } from "./build-solutions";
import { primeSessionCookie } from "./session-helpers";

type DriverRecord = {
  driver_id: string;
  name: string | null;
  phone: string | null;
  active: boolean;
};

type DriverJob = {
  job_id: string;
  driver_id: string;
  driver_name: string | null;
  status: string;
  scheduled_at: string | null;
  attempt_count: number;
  last_error: string | null;
  call_id: string | null;
  call_started_at: string | null;
  call_ended_at: string | null;
  outcome: string | null;
  discrepancy_flags: Record<string, unknown>;
};


test.describe("driver verification workspace", () => {
  test.skip(!isBuildEnabledSolution("driver_verification"), "Driver verification route is excluded from this build.");

  test.describe("solution availability lookup failures", () => {
    test.use({
      allowConsoleErrors: [/503 \(Service Unavailable\)/],
      allowRequestFailures: [/\/api\/platform\/solutions/],
    });

    test("shows a retryable load error when workspace visibility cannot be confirmed", async ({ page }) => {
      await primeSessionCookie(page, "client_operator");

      await page.route("**/api/platform/solutions", async (route) => {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Solution visibility is temporarily unavailable." }),
        });
      });

      await page.goto("/driver-verification/drivers");

      await expect(page.getByRole("heading", { name: "Driver checks" })).toBeVisible();
      await expect(page.getByText("We could not confirm whether driver verification is available for this workspace.")).toBeVisible();
      await expect(page.getByText("Solution visibility is temporarily unavailable.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    });
  });

  test("client operator can review checks and maintain the driver list", async ({ page }) => {
    const drivers: DriverRecord[] = [
      { driver_id: "drv-1", name: "Driver One", phone: "+37061234567", active: true },
      { driver_id: "drv-2", name: "Driver Two", phone: "+37069876543", active: false },
    ];
    const jobs: DriverJob[] = [
      {
        job_id: "job-1",
        driver_id: "drv-1",
        driver_name: "Driver One",
        status: "completed",
        scheduled_at: "2026-03-06T07:55:00Z",
        attempt_count: 1,
        last_error: null,
        call_id: "call-1",
        call_started_at: "2026-03-06T08:00:00Z",
        call_ended_at: "2026-03-06T08:04:00Z",
        outcome: "discrepancy",
        discrepancy_flags: {
          status_mismatch: true,
          missing_required_fields: ["expected_arrival"],
        },
      },
      {
        job_id: "job-2",
        driver_id: "drv-2",
        driver_name: "Driver Two",
        status: "completed",
        scheduled_at: "2026-03-06T08:10:00Z",
        attempt_count: 1,
        last_error: null,
        call_id: "call-2",
        call_started_at: "2026-03-06T08:12:00Z",
        call_ended_at: "2026-03-06T08:16:00Z",
        outcome: "confirmed",
        discrepancy_flags: {
          location_mismatch: false,
          extracted_location: "Vilnius terminal",
          telematics_location: "Vilnius terminal",
        },
      },
    ];
    const patchLog: Array<{ driverId: string; body: Record<string, unknown> }> = [];

    await primeSessionCookie(page, "client_operator");

    await page.route("**/api/platform/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "driver_verification",
              enabled: true,
              version: "latest",
              description: "Driver verification",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: null,
              active_revision: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/drivers?**", async (route) => {
      const url = new URL(route.request().url());
      const active = url.searchParams.get("active");
      const filtered = active === null ? drivers : drivers.filter((driver) => String(driver.active) === active);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          drivers: filtered,
          total: filtered.length,
          limit: 200,
          offset: 0,
        }),
      });
    });

    await page.route("**/api/platform/drivers/*/status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          driver_id: "drv-1",
          job_id: "job-1",
          source_provider: "fleet_hand",
          telematics_status: "unloading",
          telematics_occurred_at: "2026-03-06T07:58:00Z",
          telematics_position: { label: "Vilnius" },
          telematics_snapshot: { location: "Vilnius", trailer: "LT-TEST" },
        }),
      });
    });

    await page.route("**/api/platform/drivers/*", async (route) => {
      if (route.request().method() !== "PATCH") {
        await route.fallback();
        return;
      }
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/api\/platform\/drivers\/([^/]+)$/);
      const driverId = match ? decodeURIComponent(match[1]) : "";
      const body = JSON.parse(route.request().postData() ?? "{}") as Record<string, unknown>;
      patchLog.push({ driverId, body });
      const driver = drivers.find((item) => item.driver_id === driverId);
      if (!driver) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Driver not found" }),
        });
        return;
      }
      Object.assign(driver, body);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(driver),
      });
    });

    await page.route("**/api/platform/driver-verification/jobs?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobs,
          total: jobs.length,
          limit: 200,
          offset: 0,
        }),
      });
    });

    await page.route("**/api/platform/driver-verification/jobs/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          job_id: "job-1",
          driver_id: "drv-1",
          driver_name: "Driver One",
          status: "completed",
          scheduled_at: "2026-03-06T07:55:00Z",
          attempt_count: 1,
          last_error: null,
          call_id: "call-1",
          call_started_at: "2026-03-06T08:00:00Z",
          call_ended_at: "2026-03-06T08:04:00Z",
          outcome: "discrepancy",
          discrepancy_flags: {
            status_mismatch: true,
            missing_required_fields: ["expected_arrival"],
          },
          telematics_status: "unloading",
          telematics_occurred_at: "2026-03-06T07:58:00Z",
          telematics_snapshot: { location: "Vilnius", trailer: "LT-TEST" },
          extracted_fields: {
            current_stop: "Vilnius terminal",
            next_stop: "Kaunas depot",
            expected_arrival: null,
          },
        }),
      });
    });

    await page.goto("/driver-verification/drivers");

    await expect(page.getByRole("heading", { name: "Driver checks" })).toBeVisible();
    await expect(page.getByText("Checks needing review")).toBeVisible();
    await expect(page.getByTestId("driver-name-drv-1")).toContainText("Driver One");
    await expect(page.getByRole("button", { name: "Import driver list" })).toBeVisible();
    await expect(page.getByTestId("driver-job-open-job-2")).toHaveCount(0);

    await page.getByTestId("driver-job-open-job-1").click();
    const reviewDialog = page.getByRole("dialog", { name: "Verification review" });
    await expect(reviewDialog.getByRole("heading", { name: "Verification review" })).toBeVisible();
    await expect(reviewDialog.getByText("Needs manager review")).toBeVisible();
    await expect(reviewDialog.getByText("Status Mismatch")).toBeVisible();
    await expect(reviewDialog.getByText("Current Stop")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(reviewDialog).toHaveCount(0);

    await page.getByRole("button", { name: "Latest vehicle update" }).first().click();
    const statusDialog = page.getByRole("dialog", { name: "Latest vehicle update" });
    await expect(statusDialog.getByRole("heading", { name: "Latest vehicle update" })).toBeVisible();
    await expect(statusDialog.getByText("Unloading · Vilnius")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(statusDialog).toHaveCount(0);

    await page.getByRole("button", { name: "Edit driver" }).nth(1).click();
    const editDialog = page.getByRole("dialog", { name: "Update driver" });
    await editDialog.getByLabel("Display name").fill("Driver Two Updated");
    await editDialog.getByLabel("Phone number").fill("+37069999999");
    await editDialog.getByRole("button", { name: "Save changes" }).evaluate((button: HTMLButtonElement) => button.click());
    await expect(page.getByText("Saved details for Driver Two.")).toBeVisible();
    await expect(page.getByTestId("driver-name-drv-2")).toContainText("Driver Two Updated");

    expect(patchLog).toEqual([
      { driverId: "drv-2", body: { name: "Driver Two Updated", phone: "+37069999999", active: false } },
    ]);
  });
});
