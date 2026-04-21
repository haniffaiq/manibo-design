import { test, expect } from "./harness";
import { primeSessionCookie } from "./session-helpers";

test.describe("admin health", () => {
  test("super admin can view and refresh platform health metrics", async ({ page }) => {
    let requestCount = 0;
    let callsReportCount = 0;
    let observabilityCount = 0;

    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/reports/platform-health**", async (route) => {
      requestCount += 1;

      if (requestCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            checked_at: "2026-03-05T06:00:00Z",
            call_error_rate: 0.5,
            average_call_duration_seconds: 60,
            active_calls: { voice_call: 2, inbound_call: 1, total: 3 },
            worker_status: {
              platform_api: "healthy",
              temporal: "degraded",
              temporal_error: "temporal unavailable",
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          checked_at: "2026-03-05T06:01:00Z",
          call_error_rate: 0.25,
          average_call_duration_seconds: 58,
          active_calls: { voice_call: 1, inbound_call: 0, total: 1 },
          worker_status: {
            platform_api: "healthy",
            temporal: "healthy",
            temporal_error: null,
          },
        }),
      });
    });

    await page.route("**/api/platform/admin/reports/calls**", async (route) => {
      callsReportCount += 1;

      const escalated = callsReportCount === 1 ? 3 : 1;
      const completed = callsReportCount === 1 ? 5 : 4;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          buckets: [
            {
              bucket_start: "2026-03-05T06:00:00Z",
              completed,
              escalated,
              total_calls: completed + escalated,
              average_duration_seconds: callsReportCount === 1 ? 61 : 55,
              outcome_distribution: {
                completed,
                transferred: escalated,
              },
              escalation_rate: escalated / (completed + escalated),
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/calls/observability-summary**", async (route) => {
      observabilityCount += 1;

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sampled_calls: observabilityCount === 1 ? 14 : 8,
          window_start: "2026-03-01T00:00:00Z",
          window_end: "2026-03-05T00:00:00Z",
          stack_comparisons: [
            {
              component: "llm",
              provider: "openai",
              model: "gpt-4.1-mini",
              language: null,
              voice_id: null,
              voice_name: null,
              sample_count: 14,
              average_ms: observabilityCount === 1 ? 480 : 410,
              p95_ms: observabilityCount === 1 ? 620 : 500,
              max_ms: observabilityCount === 1 ? 780 : 650,
            },
            {
              component: "stt",
              provider: "deepgram",
              model: "nova-2",
              language: "lt",
              voice_id: null,
              voice_name: null,
              sample_count: 14,
              average_ms: 210,
              p95_ms: 260,
              max_ms: 310,
            },
            {
              component: "tts",
              provider: "elevenlabs",
              model: "eleven_v3",
              language: null,
              voice_id: "rachel",
              voice_name: "Rachel",
              sample_count: 14,
              average_ms: 190,
              p95_ms: 240,
              max_ms: 300,
            },
          ],
          route_hotspots: [
            {
              graph_type: "voice",
              node_name: "availability_check",
              route: "offer_slots",
              sample_count: 9,
              average_latency_ms: observabilityCount === 1 ? 250 : 210,
              p95_latency_ms: observabilityCount === 1 ? 310 : 260,
              max_latency_ms: observabilityCount === 1 ? 420 : 330,
            },
          ],
        }),
      });
    });

    await page.goto("/admin/health");
    await expect(page.getByRole("heading", { name: "Health" })).toBeVisible();
    await expect(page.getByTestId("admin-health-investigation-note")).toContainText("Per-session drill-down");
    await expect(page.getByTestId("admin-health-call-error-rate")).toContainText("50.0%");
    await expect(page.getByTestId("admin-health-average-call-duration")).toContainText("60.0s");
    await expect(page.getByTestId("admin-health-total-calls")).toContainText("8");
    await expect(page.getByTestId("admin-health-escalation-rate")).toContainText("37.5%");
    await expect(page.getByTestId("admin-health-summary-sampled")).toContainText("14 calls");
    await expect(page.getByTestId("admin-health-summary-card-llm")).toContainText("620 ms");
    await expect(page.getByTestId("admin-health-slowest-route-p95")).toContainText("310 ms");
    await expect(page.getByTestId("admin-health-worker-temporal")).toContainText("degraded");
    await expect(page.getByTestId("admin-health-temporal-error")).toContainText("temporal unavailable");

    await page.getByTestId("admin-health-refresh").click();

    await expect(page.getByTestId("admin-health-call-error-rate")).toContainText("25.0%");
    await expect(page.getByTestId("admin-health-average-call-duration")).toContainText("58.0s");
    await expect(page.getByTestId("admin-health-total-calls")).toContainText("5");
    await expect(page.getByTestId("admin-health-escalation-rate")).toContainText("20.0%");
    await expect(page.getByTestId("admin-health-summary-sampled")).toContainText("8 calls");
    await expect(page.getByTestId("admin-health-summary-card-llm")).toContainText("500 ms");
    await expect(page.getByTestId("admin-health-slowest-route-p95")).toContainText("260 ms");
    await expect(page.getByTestId("admin-health-worker-temporal")).toContainText("healthy");
    await expect(page.getByTestId("admin-health-temporal-error")).toHaveCount(0);

    expect(requestCount).toBe(2);
    expect(callsReportCount).toBe(2);
    expect(observabilityCount).toBe(2);
  });

  test.describe("health source failures", () => {
    test.use({
      allowConsoleErrors: [/503 \(Service Unavailable\)/],
      allowRequestFailures: [/\/api\/platform\/admin\/reports\/platform-health$/],
    });

    test("render unavailable states instead of fake zeros", async ({ page }) => {
      await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/reports/platform-health**", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          detail: "health backend unavailable",
        }),
      });
    });

    await page.route("**/api/platform/admin/reports/calls**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          buckets: [
            {
              bucket_start: "2026-03-05T06:00:00Z",
              completed: 4,
              escalated: 1,
              total_calls: 5,
              average_duration_seconds: 55,
              outcome_distribution: {
                completed: 4,
                transferred: 1,
              },
              escalation_rate: 0.2,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/calls/observability-summary**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sampled_calls: 8,
          window_start: "2026-03-01T00:00:00Z",
          window_end: "2026-03-05T00:00:00Z",
          stack_comparisons: [],
          route_hotspots: [],
        }),
      });
    });

      await page.goto("/admin/health");

      await expect(page.getByTestId("admin-health-load-error")).toContainText("Some health feeds are unavailable.");
      await expect(page.getByTestId("admin-health-load-error")).toContainText("Platform health rollup is unavailable.");
      await expect(page.getByTestId("admin-health-source-unavailable")).toContainText(
        "Platform health metrics are unavailable right now.",
      );
      await expect(page.getByTestId("admin-health-call-error-rate")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-average-call-duration")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-active-voice")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-active-inbound")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-worker-platform-api")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-worker-temporal")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-total-calls")).toContainText("5");
      await expect(page.getByTestId("admin-health-summary-sampled")).toContainText("8 calls");
    });
  });

  test.describe("calls source failures", () => {
    test.use({
      allowConsoleErrors: [/503 \(Service Unavailable\)/],
      allowRequestFailures: [/\/api\/platform\/admin\/reports\/calls$/],
    });

    test("render unavailable call KPI cards instead of fake zeros", async ({ page }) => {
      await primeSessionCookie(page, "super_admin");

      await page.route("**/api/platform/admin/reports/platform-health**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            checked_at: "2026-03-05T06:00:00Z",
            call_error_rate: 0.25,
            average_call_duration_seconds: 58,
            active_calls: { voice_call: 1, inbound_call: 0, total: 1 },
            worker_status: {
              platform_api: "healthy",
              temporal: "healthy",
              temporal_error: null,
            },
          }),
        });
      });

      await page.route("**/api/platform/admin/reports/calls**", async (route) => {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "calls report backend unavailable",
          }),
        });
      });

      await page.route("**/api/platform/admin/calls/observability-summary**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            sampled_calls: 8,
            window_start: "2026-03-01T00:00:00Z",
            window_end: "2026-03-05T00:00:00Z",
            stack_comparisons: [],
            route_hotspots: [],
          }),
        });
      });

      await page.goto("/admin/health");

      await expect(page.getByTestId("admin-health-load-error")).toContainText("Some health feeds are unavailable.");
      await expect(page.getByTestId("admin-health-load-error")).toContainText("Call KPI rollup is unavailable.");
      await expect(page.getByTestId("admin-health-call-error-rate")).toContainText("25.0%");
      await expect(page.getByTestId("admin-health-average-call-duration")).toContainText("58.0s");
      await expect(page.getByTestId("admin-health-worker-platform-api")).toContainText("healthy");
      await expect(page.getByTestId("admin-health-total-calls")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-completed-calls")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-escalated-calls")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-escalation-rate")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-summary-sampled")).toContainText("8 calls");
    });
  });

  test.describe("observability source failures", () => {
    test.use({
      allowConsoleErrors: [/503 \(Service Unavailable\)/],
      allowRequestFailures: [/\/api\/platform\/admin\/calls\/observability-summary(?:\?.*)?$/],
    });

    test("render unavailable slowdown summary instead of fake empty telemetry", async ({ page }) => {
      await primeSessionCookie(page, "super_admin");

      await page.route("**/api/platform/admin/reports/platform-health**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            checked_at: "2026-03-05T06:00:00Z",
            call_error_rate: 0.25,
            average_call_duration_seconds: 58,
            active_calls: { voice_call: 1, inbound_call: 0, total: 1 },
            worker_status: {
              platform_api: "healthy",
              temporal: "healthy",
              temporal_error: null,
            },
          }),
        });
      });

      await page.route("**/api/platform/admin/reports/calls**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            buckets: [
              {
                bucket_start: "2026-03-05T06:00:00Z",
                completed: 4,
                escalated: 1,
                total_calls: 5,
                average_duration_seconds: 55,
                outcome_distribution: {
                  completed: 4,
                  transferred: 1,
                },
                escalation_rate: 0.2,
              },
            ],
          }),
        });
      });

      await page.route("**/api/platform/admin/calls/observability-summary**", async (route) => {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({
            detail: "observability summary backend unavailable",
          }),
        });
      });

      await page.goto("/admin/health");

      await expect(page.getByTestId("admin-health-load-error")).toContainText("Some health feeds are unavailable.");
      await expect(page.getByTestId("admin-health-load-error")).toContainText("Slowdown summary is unavailable.");
      await expect(page.getByTestId("admin-health-total-calls")).toContainText("5");
      await expect(page.getByTestId("admin-health-escalation-rate")).toContainText("20.0%");
      await expect(page.getByTestId("admin-health-summary-sampled")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-observability-unavailable")).toContainText(
        "Slowdown summary data is unavailable right now.",
      );
      await expect(page.getByTestId("admin-health-summary-card-llm")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-summary-card-stt")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-summary-card-tts")).toContainText("Unavailable");
      await expect(page.getByTestId("admin-health-summary-window")).toContainText("Observability summary window is unavailable.");
      await expect(page.getByTestId("admin-health-slowest-route-name")).toContainText("Observability summary unavailable");
      await expect(page.getByTestId("admin-health-slowest-route-p95")).toContainText("Unavailable");
    });
  });
});
