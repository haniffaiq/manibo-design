import { test, expect } from "./harness";
import { isBuildEnabledSolution } from "./build-solutions";
import { primeSessionCookie } from "./session-helpers";

function mockActiveCallsWithEscalation(page: import("@playwright/test").Page) {
  return page.route("**/api/platform/calls/active", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        calls: [
          { call_id: "call-normal-1", workflow_id: "wf-1", run_id: "run-1", workflow_type: "voice_call" },
          { call_id: "call-escalated-1", workflow_id: "wf-2", run_id: "run-2", workflow_type: "voice_call" },
          { call_id: "call-urgent-1", workflow_id: "wf-3", run_id: "run-3", workflow_type: "voice_call" },
        ],
      }),
    });
  });
}

function mockCallEvents(page: import("@playwright/test").Page) {
  return page.route("**/api/platform/calls/active/*/events", async (route) => {
    const url = route.request().url();
    if (url.includes("call-escalated-1")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "call-escalated-1",
          events: [
            {
              seq: 1,
              event_type: "call.escalated",
              occurred_at_ms: Date.now(),
              summary: "Agent requested human help",
              payload: { reason: "insurance_compensated_visit", priority: "STANDARD" },
            },
          ],
        }),
      });
    } else if (url.includes("call-urgent-1")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "call-urgent-1",
          events: [
            {
              seq: 1,
              event_type: "call.escalation.transfer_requested",
              occurred_at_ms: Date.now(),
              summary: "Urgent transfer requested",
              payload: { reason: "urgent_medical_need", priority: "URGENT", transfer_immediately: true },
            },
          ],
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ call_id: "call-normal-1", events: [] }),
      });
    }
  });
}

test.describe("clinic handoff in call-ops", () => {
  test("shows escalation badges and sorts urgent calls first", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await mockActiveCallsWithEscalation(page);
    await mockCallEvents(page);

    await page.goto("/call-ops");
    await page.waitForURL("**/call-ops");

    // Urgent badge visible
    const urgentBadge = page.getByTestId("call-ops-escalation-badge-call-urgent-1");
    await expect(urgentBadge).toBeVisible();
    await expect(urgentBadge).toContainText("Urgent transfer");

    // Standard escalation badge visible
    const escalatedBadge = page.getByTestId("call-ops-escalation-badge-call-escalated-1");
    await expect(escalatedBadge).toBeVisible();
    await expect(escalatedBadge).toContainText("Needs help");

    // Normal call has no badge
    await expect(page.getByTestId("call-ops-escalation-badge-call-normal-1")).not.toBeVisible();

    // Urgent call sorts to top (first row in table)
    const allCallIds = page.locator("[data-testid^='call-ops-call-id-']");
    await expect(allCallIds.first()).toContainText("call-urgent-1");

    // Claim button appears for escalated calls, replaces "Take over"
    await expect(page.getByTestId("call-ops-claim-call-urgent-1")).toBeVisible();
    await expect(page.getByTestId("call-ops-claim-call-escalated-1")).toBeVisible();
    // Normal call shows "Take over" instead
    await expect(page.getByTestId("call-ops-takeover-call-normal-1")).toBeVisible();
  });

  test("shows urgent banner when transfer_requested calls exist", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await mockActiveCallsWithEscalation(page);
    await mockCallEvents(page);

    await page.goto("/call-ops");
    await page.waitForURL("**/call-ops");

    const banner = page.getByTestId("call-ops-urgent-banner");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("call-urgent-1");
    await expect(banner).toContainText("needs immediate transfer");
  });
});

test.describe("call history to bookings continuity", () => {
  test("escalated call shows View follow-up link", async ({ page }) => {
    test.skip(!isBuildEnabledSolution("appointment_booking"), "Follow-up continuity only applies when appointment booking ships in the build.");

    await primeSessionCookie(page, "client_admin");

    // Override the harness default (empty solutions) so bookings link appears
    await page.unroute("**/api/platform/solutions");
    await page.route("**/api/platform/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [{ solution_name: "appointment_booking", enabled: true }],
        }),
      });
    });

    await page.route("**/api/platform/calls?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calls: [
            {
              id: "call-esc-1",
              direction: "inbound",
              state: "completed",
              outcome: "escalated",
              caller_number: "+37060000001",
              callee_number: null,
              started_at: "2026-03-25T10:00:00Z",
              ended_at: "2026-03-25T10:05:00Z",
              duration_seconds: 300,
              created_at: "2026-03-25T10:00:00Z",
              updated_at: "2026-03-25T10:05:00Z",
              metadata: {},
              quality_score: { overall: 0.8, clarity: 0.9, completion: 0.7, latency: 0.8 },
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }),
      });
    });

    await page.route("**/api/platform/calls/call-esc-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call: {
            id: "call-esc-1",
            direction: "inbound",
            state: "completed",
            outcome: "escalated",
            caller_number: "+37060000001",
            callee_number: null,
            started_at: "2026-03-25T10:00:00Z",
            ended_at: "2026-03-25T10:05:00Z",
            duration_seconds: 300,
            created_at: "2026-03-25T10:00:00Z",
            updated_at: "2026-03-25T10:05:00Z",
            metadata: {},
            quality_score: { overall: 0.8, clarity: 0.9, completion: 0.7, latency: 0.8 },
          },
          events: [],
          recordings: [],
          has_more: { events: false, recordings: false },
          latency_summary: null,
          trace_summary: null,
        }),
      });
    });

    await page.route("**/api/platform/calls/call-esc-1/events?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "call-esc-1",
          events: [],
        }),
      });
    });

    await page.route("**/api/platform/calls/call-esc-1/trace", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "call-esc-1",
          has_trace_context: false,
          trace_context: {
            source: "none",
            correlation_id: null,
            traceparent: null,
            trace_id: null,
            parent_span_id: null,
            tracestate: null,
          },
          event_count: 0,
          first_event_at_ms: null,
          last_event_at_ms: null,
          stack: null,
          routes: [],
          nodes: [],
        }),
      });
    });

    await page.goto("/call-ops/history?call_id=call-esc-1");
    await page.waitForURL("**/call-ops/history**");

    const followUpLink = page.getByTestId("call-history-open-follow-up");
    await expect(followUpLink).toBeVisible();
    await expect(followUpLink).toContainText("View follow-up");
  });
});
