import { expect, test } from "./harness";
import { isBuildEnabledSolution } from "./build-solutions";
import { primeSessionCookie } from "./session-helpers";

test.describe("tenant dashboard", () => {
  test("shows a clinic-friendly dashboard when appointment booking is enabled", async ({ page }) => {
    test.skip(!isBuildEnabledSolution("appointment_booking"), "Appointment booking widgets are excluded from this build.");

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
              description: "Clinic bookings",
              active_revision: "rev-1",
              desired_revision: "rev-1",
              requires_enabled: [],
              optional_enabled: [],
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/calls/active", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calls: [
            { call_id: "call-1", workflow_id: "wf-1", run_id: "run-1", workflow_type: "platform.InboundCallWorkflow" },
            { call_id: "call-2", workflow_id: "wf-2", run_id: "run-2", workflow_type: "platform.VoiceCallWorkflow" },
          ],
        }),
      });
    });

    await page.route("**/api/platform/billing/usage**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenant_id: "tenant-1",
          period_start: "2026-03-01",
          period_end: "2026-04-01",
          currency: "EUR",
          voice_seconds: 7200,
          voice_minutes: 120,
          production_voice_seconds: 7200,
          production_voice_minutes: 120,
          test_voice_seconds: 0,
          test_voice_minutes: 0,
          llm_tokens: 34000,
          stt_characters: 9000,
          tts_characters: 8500,
          platform_fee_cents: 1200,
          telephony_fee_cents: 800,
          llm_fee_cents: 1500,
          stt_fee_cents: 200,
          tts_fee_cents: 300,
          discount_cents: 0,
          subtotal_cents: 4000,
          total_cents: 4000,
          budget_mode: "soft",
          monthly_budget_cents: 10000,
          over_budget: false,
          utilization_percent: 40,
        }),
      });
    });

    await page.route("**/api/platform/reports/calls**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          buckets: [
            {
              bucket_start: "2026-03-01T00:00:00Z",
              completed: 18,
              escalated: 4,
              total_calls: 22,
              average_duration_seconds: 212,
              outcome_distribution: { completed: 18, transferred: 4 },
              escalation_rate: 0.1818,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/calls/observability-summary**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sampled_calls: 22,
          window_start: "2026-03-01T00:00:00Z",
          window_end: "2026-03-07T00:00:00Z",
          stack_comparisons: [],
          route_hotspots: [
            {
              graph_type: "appointment_booking",
              node_name: "AvailabilityCheck",
              route: "offer_slots",
              sample_count: 8,
              average_latency_ms: 410,
              p95_latency_ms: 920,
              max_latency_ms: 1300,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/clinic/follow-ups**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [],
          summary: {
            total: 6,
            urgent: 2,
            normal: 4,
            open: 3,
            claimed: 1,
            resolved: 2,
            handed_off: 2,
            pending: 1,
            failed: 1,
          },
          limit: 50,
          offset: 0,
        }),
      });
    });

    await page.route("**/api/platform/clinic/integration-status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          overall_status: "ready",
          integrations: [
            {
              integration_id: "patient_record_sync",
              label: "Patient record sync",
              connector_type: "crm",
              channel: null,
              configured_adapter: "clinic_ehr",
              connector_id: "connector-1",
              connector_display_name: "Clinic EHR",
              readiness_status: "ready",
              status_detail: "Patient records will sync automatically after confirmed bookings.",
              configured_minutes_before_appointment: null,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T09:00:00Z",
              latest_health_error: null,
            },
            {
              integration_id: "confirmation_sms",
              label: "Confirmation SMS",
              connector_type: "notifications",
              channel: "sms",
              configured_adapter: "telnyx_sms",
              connector_id: "connector-2",
              connector_display_name: "Patient SMS",
              readiness_status: "ready",
              status_detail: "Confirmation messages will send automatically.",
              configured_minutes_before_appointment: null,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T09:00:00Z",
              latest_health_error: null,
            },
            {
              integration_id: "appointment_reminder",
              label: "Appointment reminder",
              connector_type: "notifications",
              channel: "sms",
              configured_adapter: "telnyx_sms",
              connector_id: "connector-2",
              connector_display_name: "Patient SMS",
              readiness_status: "ready",
              status_detail: "Reminder messages are scheduled before the appointment.",
              configured_minutes_before_appointment: 90,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T09:00:00Z",
              latest_health_error: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/clinic/booking-results**", async (route) => {
      const url = new URL(route.request().url());
      const bookingStatus = url.searchParams.get("booking_status");
      const limit = url.searchParams.get("limit");

      if (bookingStatus === "confirmed" && limit === "1") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            results: [],
            total: 12,
            limit: 1,
            offset: 0,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              call_id: "call-booking-1",
              booking_status: "confirmed",
              handoff_reason: null,
              needs_follow_up: false,
              specialty: "Cardiology",
              clinic_city: "Vilnius",
              clinic_address: "Gedimino pr. 1",
              appointment_date: "2026-03-10",
              appointment_time: "09:00",
              patient_full_name: "Austeja Petrauskaite",
              patient_phone: "+37060000001",
              price_eur: 80,
              state: "completed",
              outcome: "completed",
              caller_number: "+37060000001",
              callee_number: "+37050000000",
              started_at: "2026-03-06T09:00:00Z",
              ended_at: "2026-03-06T09:08:00Z",
              created_at: "2026-03-06T09:00:00Z",
              updated_at: "2026-03-06T09:08:00Z",
            },
          ],
          total: 14,
          limit: 5,
          offset: 0,
        }),
      });
    });

    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
    await expect(page.getByTestId("tenant-dashboard-live-calls")).toContainText("2");
    await expect(page.getByTestId("tenant-dashboard-monthly-spend")).toContainText("40");
    await expect(page.getByTestId("tenant-dashboard-clinic-confirmed")).toContainText("12");
    await expect(page.getByTestId("tenant-dashboard-clinic-follow-up")).toContainText("4");
    await expect(page.getByTestId("tenant-dashboard-clinic-urgent")).toContainText("2");
    await expect(page.getByTestId("tenant-dashboard-booking-call-booking-1")).toContainText("Austeja Petrauskaite");
    await expect(page.getByTestId("tenant-dashboard-clinic-work-now")).toContainText("Clinic work right now");
    await expect(page.getByTestId("tenant-dashboard-clinic-task-follow-ups")).toContainText("Handle now");
    await expect(page.getByTestId("tenant-dashboard-clinic-task-setup")).toContainText("Ready for live bookings");
    await expect(page.getByTestId("tenant-dashboard-clinic-open-urgent")).toHaveAttribute(
      "href",
      "/bookings?priority=urgent#clinic-follow-up-queue",
    );
    await expect(page.getByText("AvailabilityCheck · offer_slots")).toBeVisible();
  });

  test("shows a logistics-friendly dashboard when driver verification is enabled", async ({ page }) => {
    test.skip(!isBuildEnabledSolution("driver_verification"), "Driver verification widgets are excluded from this build.");

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
              description: "Driver checks",
              active_revision: "rev-1",
              desired_revision: "rev-1",
              requires_enabled: [],
              optional_enabled: [],
            },
          ],
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

    await page.route("**/api/platform/billing/usage**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tenant_id: "tenant-1",
          period_start: "2026-03-01",
          period_end: "2026-04-01",
          currency: "EUR",
          voice_seconds: 1800,
          voice_minutes: 30,
          production_voice_seconds: 1800,
          production_voice_minutes: 30,
          test_voice_seconds: 0,
          test_voice_minutes: 0,
          llm_tokens: 12000,
          stt_characters: 3000,
          tts_characters: 2500,
          platform_fee_cents: 500,
          telephony_fee_cents: 200,
          llm_fee_cents: 400,
          stt_fee_cents: 100,
          tts_fee_cents: 80,
          discount_cents: 0,
          subtotal_cents: 1280,
          total_cents: 1280,
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
        body: JSON.stringify({
          buckets: [
            {
              bucket_start: "2026-03-01T00:00:00Z",
              completed: 9,
              escalated: 1,
              total_calls: 10,
              average_duration_seconds: 145,
              outcome_distribution: { completed: 9, transferred: 1 },
              escalation_rate: 0.1,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/calls/observability-summary**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sampled_calls: 10,
          window_start: "2026-03-01T00:00:00Z",
          window_end: "2026-03-07T00:00:00Z",
          stack_comparisons: [],
          route_hotspots: [
            {
              graph_type: "driver_verification",
              node_name: "CheckStatus",
              route: "call_driver",
              sample_count: 4,
              average_latency_ms: 320,
              p95_latency_ms: 700,
              max_latency_ms: 950,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/drivers**", async (route) => {
      const url = new URL(route.request().url());
      if (url.searchParams.get("active") === "true") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ drivers: [], total: 14, limit: 1, offset: 0 }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ drivers: [], total: 3, limit: 1, offset: 0 }),
      });
    });

    await page.route("**/api/platform/driver-verification/jobs**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          jobs: [
            {
              job_id: "job-1",
              driver_id: "driver-1",
              driver_name: "Mantas Jankauskas",
              status: "completed",
              scheduled_at: "2026-03-06T08:00:00Z",
              attempt_count: 1,
              last_error: null,
              call_id: "call-1",
              call_started_at: "2026-03-06T08:00:00Z",
              call_ended_at: "2026-03-06T08:04:00Z",
              outcome: "confirmed",
              discrepancy_flags: {},
            },
            {
              job_id: "job-2",
              driver_id: "driver-2",
              driver_name: "Ieva Mikalauske",
              status: "completed",
              scheduled_at: "2026-03-06T09:00:00Z",
              attempt_count: 1,
              last_error: null,
              call_id: "call-2",
              call_started_at: "2026-03-06T09:00:00Z",
              call_ended_at: "2026-03-06T09:03:00Z",
              outcome: "discrepancy",
              discrepancy_flags: { delay: true },
            },
          ],
          total: 2,
          limit: 5,
          offset: 0,
        }),
      });
    });

    await page.goto("/dashboard");

    await expect(page.getByTestId("tenant-dashboard-driver-active")).toContainText("14");
    await expect(page.getByTestId("tenant-dashboard-driver-paused")).toContainText("3");
    await expect(page.getByTestId("tenant-dashboard-driver-attention")).toContainText("1");
    await expect(page.getByTestId("tenant-dashboard-driver-confirmed")).toContainText("1");
    await expect(page.getByTestId("tenant-dashboard-driver-job-job-1")).toContainText("Mantas Jankauskas");
    await expect(page.getByText("CheckStatus · call_driver")).toBeVisible();
    await expect(page.getByTestId("tenant-dashboard-clinic-confirmed")).toHaveCount(0);
  });
});
