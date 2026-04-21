import { test, expect } from "./harness";
import { isBuildEnabledSolution } from "./build-solutions";
import { primeSessionCookie } from "./session-helpers";

test.describe("automation activity", () => {
  test("tenant can review workflow detail and retry a failed run", async ({ page }) => {
    const listQueries: string[] = [];
    const usesAppointmentBooking = isBuildEnabledSolution("appointment_booking");
    const workflowId = usesAppointmentBooking
      ? "sol.appointment_booking/send-reminder"
      : "sol.driver_verification/sync-checks";
    const workflowType = usesAppointmentBooking
      ? "sol.appointment_booking.send_reminder"
      : "sol.driver_verification.sync_checks";
    const expectedWorkflowLabel = usesAppointmentBooking
      ? "Appointment booking: Send Reminder"
      : "Driver verification: Sync Checks";
    const runId = "run-1";

    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/workflows/executions**", async (route) => {
      const url = new URL(route.request().url());
      listQueries.push(url.search);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          executions: [
            {
              workflow_id: workflowId,
              run_id: runId,
              workflow_type: workflowType,
              execution_status: "Failed",
              started_at: "2026-03-06T10:00:00Z",
              closed_at: "2026-03-06T10:03:00Z",
            },
          ],
          limit: 50,
        }),
      });
    });

    await page.route(`**/api/platform/workflows/executions/${encodeURIComponent(workflowId)}/${runId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          workflow_id: workflowId,
          run_id: runId,
          workflow_type: workflowType,
          execution_status: "Failed",
          started_at: "2026-03-06T10:00:00Z",
          closed_at: "2026-03-06T10:03:00Z",
          current_step: null,
          failed_step: "send_sms",
          error_summary: "SMS gateway credentials are missing.",
          total_steps: 3,
          completed_steps: 2,
          retry_summary: {
            steps_with_retries: 1,
            total_retry_attempts: 1,
            max_attempt: 2,
          },
        }),
      });
    });

    await page.route(
      `**/api/platform/workflows/executions/${encodeURIComponent(workflowId)}/${runId}/steps`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            workflow_id: workflowId,
            run_id: runId,
            steps: [
              {
                sequence: 1,
                step_id: "prepare_payload",
                action: "prepare_payload",
                status: "Completed",
                attempt: 1,
                started_at: "2026-03-06T10:00:00Z",
                ended_at: "2026-03-06T10:00:10Z",
                duration_ms: 10000,
                error_detail: null,
                retry_state: null,
              },
              {
                sequence: 2,
                step_id: "send_sms",
                action: "send_sms",
                status: "Failed",
                attempt: 2,
                started_at: "2026-03-06T10:00:11Z",
                ended_at: "2026-03-06T10:00:40Z",
                duration_ms: 29000,
                error_detail: "SMS gateway credentials are missing.",
                retry_state: "backoff_complete",
              },
            ],
          }),
        });
      },
    );

    await page.route(
      `**/api/platform/workflows/executions/${encodeURIComponent(workflowId)}/${runId}/retry`,
      async (route) => {
        await route.fulfill({
          status: 202,
          contentType: "application/json",
          body: JSON.stringify({
            source_workflow_id: workflowId,
            source_run_id: runId,
            retry_workflow_id: `${workflowId}/retry-1234`,
            retry_run_id: "run-2",
            status: "started",
          }),
        });
      },
    );

    await page.goto("/automations");

    await expect(page.getByRole("heading", { name: "Automation Activity" })).toBeVisible();
    await expect(page.getByText(expectedWorkflowLabel, { exact: true }).first()).toBeVisible();
    await expect(page.getByText("What needs attention", { exact: true })).toBeVisible();
    await expect(page.getByText("SMS gateway credentials are missing.", { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId("automation-step-2")).toContainText("Needs attention");

    await page.getByTestId("automations-status-filter").selectOption("Failed");
    await expect.poll(() => listQueries.some((query) => query.includes("status=Failed"))).toBe(true);

    await page.getByTestId("automations-retry").click();
    await expect(page.getByText(`Started a new run for ${expectedWorkflowLabel}.`, { exact: false })).toBeVisible();
  });
});
