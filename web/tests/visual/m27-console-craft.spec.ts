import { test, expect } from "../../e2e/harness";
import { primeSessionCookie } from "../../e2e/session-helpers";

/**
 * M27 visual regression suite.
 *
 * Each test navigates to a redesigned page with representative mock data,
 * waits for rendering, and captures a full-page screenshot compared against
 * a stored baseline. Run `pnpm --filter @nfq/web playwright:test -- tests/visual/ --update-snapshots`
 * to regenerate baselines after intentional design changes.
 */

const MOCK_CALL_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const MOCK_CALL = {
  call_id: MOCK_CALL_ID,
  workflow_id: `voice-call/${MOCK_CALL_ID}`,
  run_id: "run-1",
  workflow_type: "grove.temporal.voice_call_workflow.VoiceCallWorkflow",
};
const MOCK_ESCALATED_CALL = {
  ...MOCK_CALL,
  call_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
  workflow_id: "voice-call/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
};

function solutionsMock() {
  return JSON.stringify({
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
  });
}

function activeCallsMock() {
  return JSON.stringify({ calls: [MOCK_CALL, MOCK_ESCALATED_CALL] });
}

function observabilitySummaryMock() {
  return JSON.stringify({
    sampled_calls: 42,
    window_start: "2026-03-20T00:00:00Z",
    window_end: "2026-03-26T00:00:00Z",
    stack_comparisons: [],
    route_hotspots: [
      {
        node_name: "greeting_node",
        route: "greeting → booking_check",
        graph_type: "booking_flow",
        average_latency_ms: 320,
        p95_latency_ms: 580,
        max_latency_ms: 910,
        sample_count: 14,
      },
    ],
  });
}

function escalationEventsMock(_callId: string) {
  return JSON.stringify({
    events: [
      {
        seq: 1,
        event_type: "call.escalation.transfer_requested",
        occurred_at_ms: 12000,
        payload: { reason: "Caller needs urgent help", priority: "URGENT" },
      },
    ],
  });
}

const now = new Date().toISOString();

function operatorEventsMock() {
  return JSON.stringify({
    events: [
      {
        id: "evt-1",
        event_type: "ops.workflow_execution_failed",
        severity: "critical",
        status: "open",
        entity_type: "call",
        entity_id: MOCK_CALL_ID,
        message: "Workflow failed after retries",
        metadata: {},
        created_at: now,
        updated_at: now,
        acked_at: null,
        acked_by: null,
        resolved_at: null,
        resolved_by: null,
      },
      {
        id: "evt-2",
        event_type: "ops.sip_trunk_error",
        severity: "warning",
        status: "acked",
        entity_type: null,
        entity_id: null,
        message: "SIP trunk degraded for 2 minutes",
        metadata: {},
        created_at: new Date(Date.now() - 600_000).toISOString(),
        updated_at: now,
        acked_at: now,
        acked_by: "operator-1",
        resolved_at: null,
        resolved_by: null,
      },
    ],
  });
}

function callHistoryMock() {
  const now = new Date().toISOString();
  return JSON.stringify({
    calls: [
      {
        id: MOCK_CALL_ID,
        direction: "inbound",
        state: "completed",
        outcome: "completed",
        caller_number: "+37061234567",
        callee_number: null,
        started_at: new Date(Date.now() - 3600_000).toISOString(),
        ended_at: new Date(Date.now() - 3300_000).toISOString(),
        duration_seconds: 300,
        created_at: now,
        updated_at: now,
        metadata: {},
        quality_score: null,
        needs_human_review: null,
      },
      {
        id: "cccccccc-cccc-cccc-cccc-cccccccccccc",
        direction: "outbound",
        state: "completed",
        outcome: "error",
        caller_number: null,
        callee_number: "+37069999999",
        started_at: new Date(Date.now() - 7200_000).toISOString(),
        ended_at: new Date(Date.now() - 7000_000).toISOString(),
        duration_seconds: 200,
        created_at: now,
        updated_at: now,
        metadata: {},
        quality_score: null,
        needs_human_review: null,
      },
    ],
    total: 2,
    limit: 50,
    offset: 0,
  });
}

function platformHealthMock() {
  return JSON.stringify({
    checked_at: now,
    call_error_rate: 0.023,
    average_call_duration_seconds: 145,
    active_calls: { voice_call: 3, inbound_call: 2, total: 5 },
    worker_status: {
      platform_api: "healthy",
      temporal: "healthy",
      temporal_error: null,
    },
  });
}

// ---------------------------------------------------------------------------
// Visual regression tests
// ---------------------------------------------------------------------------

test.describe("M27 visual regression", () => {
  test.describe("operator console", () => {
    test.beforeEach(async ({ page }) => {
      await primeSessionCookie(page, "client_operator");

      await page.route("**/api/platform/solutions", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: solutionsMock() });
      });
    });

    test("call-ops: card-per-call + collapsed performance + urgent banner", async ({ page }) => {
      await page.route("**/api/platform/calls/active", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: activeCallsMock() });
      });
      await page.route("**/api/platform/calls/observability-summary**", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: observabilitySummaryMock() });
      });
      await page.route(`**/api/platform/calls/active/${MOCK_ESCALATED_CALL.call_id}/events**`, async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: escalationEventsMock(MOCK_ESCALATED_CALL.call_id) });
      });
      await page.route(`**/api/platform/calls/active/${MOCK_CALL_ID}/events**`, async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ events: [] }) });
      });

      await page.goto("/call-ops");
      await page.getByTestId("call-ops-active-table").waitFor({ state: "visible" });

      // Verify card layout rendered (not DataTable)
      await expect(page.getByTestId(`call-ops-call-id-${MOCK_CALL_ID}`)).toBeVisible();

      // Verify overflow menu exists
      await expect(page.getByTestId(`call-ops-overflow-${MOCK_CALL_ID}`)).toBeVisible();

      // Verify performance section is collapsed
      await expect(page.getByTestId("call-ops-performance-section")).toBeVisible();
      await expect(page.getByTestId("call-ops-performance-section")).not.toHaveAttribute("open");

      // Verify urgent banner has action buttons
      await expect(page.getByTestId(`call-ops-urgent-transfer-${MOCK_ESCALATED_CALL.call_id}`)).toBeVisible();
      await expect(page.getByTestId(`call-ops-urgent-join-${MOCK_ESCALATED_CALL.call_id}`)).toBeVisible();

      await expect(page).toHaveScreenshot("call-ops-card-layout.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });

    test("call-ops: overflow menu opens with secondary actions", async ({ page }) => {
      await page.route("**/api/platform/calls/active", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: activeCallsMock() });
      });
      await page.route("**/api/platform/calls/observability-summary**", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: observabilitySummaryMock() });
      });
      await page.route("**/api/platform/calls/active/*/events**", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ events: [] }) });
      });

      await page.goto("/call-ops");
      await page.getByTestId("call-ops-active-table").waitFor({ state: "visible" });

      await page.getByTestId(`call-ops-overflow-${MOCK_CALL_ID}`).click();

      await expect(page.getByTestId(`call-ops-support-${MOCK_CALL_ID}`)).toBeVisible();
      await expect(page.getByTestId(`call-ops-observe-${MOCK_CALL_ID}`)).toBeVisible();
      await expect(page.getByTestId(`call-ops-talk-${MOCK_CALL_ID}`)).toBeVisible();
      await expect(page.getByTestId(`call-ops-transcript-${MOCK_CALL_ID}`)).toBeVisible();

      await expect(page).toHaveScreenshot("call-ops-overflow-open.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });

    test("call-ops: performance section expands", async ({ page }) => {
      await page.route("**/api/platform/calls/active", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ calls: [] }) });
      });
      await page.route("**/api/platform/calls/observability-summary**", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: observabilitySummaryMock() });
      });

      await page.goto("/call-ops");
      await page.getByTestId("call-ops-performance-section").waitFor({ state: "visible" });

      // Expand the performance section
      await page.getByTestId("call-ops-performance-section").locator("summary").click();
      await expect(page.getByTestId("call-ops-performance-section")).toHaveAttribute("open", "");

      await expect(page).toHaveScreenshot("call-ops-performance-expanded.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });

    test("alerts: card-per-alert with severity borders", async ({ page }) => {
      await page.route("**/api/platform/operator-events**", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({ status: 200, contentType: "application/json", body: operatorEventsMock() });
        }
      });

      await page.goto("/call-ops/alerts");
      await page.getByTestId("operator-events-table").waitFor({ state: "visible" });

      // Verify card layout (not DataTable)
      await expect(page.getByTestId("operator-events-ack-evt-1")).toBeVisible();
      await expect(page.getByTestId("operator-events-resolve-evt-1")).toBeVisible();

      await expect(page).toHaveScreenshot("alerts-card-layout.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });

    test("call-history: master-detail split", async ({ page }) => {
      await page.route("**/api/platform/calls?**", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: callHistoryMock() });
      });

      await page.goto("/call-ops/history");

      // Drive the search to trigger the API call
      await page.getByTestId("call-history-search-submit").click();
      await page.getByTestId("call-history-table").waitFor({ state: "visible" });

      // Verify results rendered
      await expect(page.getByTestId(`call-history-detail-open-${MOCK_CALL_ID}`)).toBeVisible();

      await expect(page).toHaveScreenshot("call-history-master-detail.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  });

  test.describe("deployment console", () => {
    test("admin dashboard: health hero card", async ({ page }) => {
      await primeSessionCookie(page, "super_admin");

      await page.route("**/api/platform/admin/tenants?**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            { id: "t1", name: "Acme", slug: "acme", status: "active", created_at: now, updated_at: now },
            { id: "t2", name: "Beta", slug: "beta", status: "active", created_at: now, updated_at: now },
          ]),
        });
      });
      await page.route("**/api/platform/admin/oidc-providers", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      });
      await page.route("**/api/platform/admin/reports/platform-health**", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: platformHealthMock() });
      });

      await page.goto("/admin");
      await page.getByTestId("admin-dashboard-active-calls").waitFor({ state: "visible" });

      // Verify hero card renders with health data
      await expect(page.getByTestId("admin-dashboard-active-calls")).toContainText("5");
      await expect(page.getByTestId("admin-dashboard-error-rate")).toContainText("2.3%");
      await expect(page.getByTestId("admin-dashboard-worker-platform")).toContainText("healthy");

      await expect(page).toHaveScreenshot("admin-dashboard-hero.png", {
        fullPage: true,
        maxDiffPixelRatio: 0.01,
      });
    });
  });

  test.describe("shared components", () => {
    test("sidebar: rounded-lg nav items with token-based styling", async ({ page }) => {
      await primeSessionCookie(page, "client_operator");

      await page.route("**/api/platform/solutions", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: solutionsMock() });
      });
      await page.route("**/api/platform/calls/active", async (route) => {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ calls: [] }) });
      });
      await page.route("**/api/platform/calls/observability-summary**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ sampled_calls: 0, window_start: now, window_end: now, stack_comparisons: [], route_hotspots: [] }),
        });
      });

      await page.goto("/call-ops");
      await page.waitForLoadState("networkidle");

      // Screenshot just the sidebar area (left 288px = w-72)
      await expect(page).toHaveScreenshot("sidebar-styling.png", {
        clip: { x: 0, y: 0, width: 288, height: 600 },
        maxDiffPixelRatio: 0.01,
      });
    });
  });
});
