import { expect, test } from "./harness";
import { primeSessionCookie } from "./session-helpers";

const emptyFacets = { kinds: [], statuses: [], tenants: [], solutions: [], assistants: [] };

function makeRunSummary(overrides: Record<string, unknown> = {}) {
  return {
    kind: "call_session",
    subject_id: "call-live-1",
    title: "Live Voice Call",
    subtitle: "appointment_booking · running",
    status: "Running",
    started_at: new Date(Date.now() - 45_000).toISOString(),
    ended_at: null,
    duration_ms: null,
    call_id: "call-live-1",
    workflow_id: null,
    run_id: null,
    channel_session_id: null,
    conversation_id: null,
    correlation_id: null,
    composition_version: null,
    artifact_hash: null,
    tenant_id: null,
    tenant_name: null,
    solution_name: "appointment_booking",
    assistant_name: "Clinic voice",
    trace_available: false,
    recording_available: false,
    warning_count: 0,
    error_count: 0,
    ...overrides,
  };
}

function makeDetailResponse(summaryOverrides: Record<string, unknown> = {}) {
  return {
    summary: makeRunSummary(summaryOverrides),
    availability: {
      recording_unavailable: true,
      timeline_partial: false,
      logs_unavailable: false,
      trace_unavailable: false,
    },
    metrics: [
      { key: "v2v_ms", label: "V2V", value: "—", value_ms: null },
      { key: "stt_ms", label: "STT", value: "—", value_ms: null },
    ],
    summary_insights: [],
    recommended_actions: [],
    integrity_gaps: [],
    recordings: [],
    context_fields: [],
    trace_context: {},
    transcript_text: null,
    related_entities: [],
  };
}

function makeTimelineResponse() {
  return {
    items: [
      {
        id: "tl-1",
        kind: "transcript",
        severity: "info",
        occurred_at: "2026-03-25T10:42:14Z",
        occurred_at_ms: null,
        label: "Call started",
        detail: null,
        actor: "system",
        duration_ms: null,
        correlation_id: null,
        payload: {},
      },
    ],
    next_cursor: null,
    returned: 1,
    total_items: 1,
  };
}

async function setupLiveVoiceCaseRoutes(page: import("@playwright/test").Page) {
  await page.route("**/api/platform/observability/runs**", async (route) => {
    if (route.request().url().includes("/call_session/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(makeDetailResponse()),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        runs: [makeRunSummary()],
        facets: {
          ...emptyFacets,
          kinds: [{ value: "call_session", label: "call_session", count: 1 }],
          statuses: [{ value: "Running", label: "Running", count: 1 }],
        },
      }),
    });
  });

  await page.route("**/api/platform/observability/runs/call_session/call-live-1/timeline**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(makeTimelineResponse()),
    });
  });

  await page.route("**/api/platform/calls/call-live-1/latency", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        call_id: "call-live-1",
        source: "persisted_metadata",
        has_latency_data: false,
        turns: [],
        summaries: {},
        stack: null,
      }),
    });
  });

  await page.route("**/api/platform/calls/call-live-1/trace", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        call_id: "call-live-1",
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
        nodes: [],
        routes: [],
      }),
    });
  });

  await page.route("**/api/platform/calls/*/transcript/stream**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        "event: segment",
        'data: {"seq":1,"speaker":"caller","timestamp":"2026-03-25T10:42:14Z","text":"Hello, I need an appointment"}',
        "",
        "event: segment",
        'data: {"seq":2,"speaker":"agent","timestamp":"2026-03-25T10:42:16Z","text":"Of course, let me find options for you"}',
        "",
        "event: end",
        "data: {}",
        "",
        "",
      ].join("\n"),
    });
  });

  await page.route("**/api/platform/calls/*/ops/stream**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: [
        "event: runtime_event",
        'data: {"seq":1,"event_type":"tool.search_clinics","occurred_at_ms":2400,"summary":"Searching for clinics","created_at":"2026-03-25T10:42:17Z","payload":{}}',
        "",
        "event: end",
        "data: {}",
        "",
        "",
      ].join("\n"),
    });
  });
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test.describe("observability live streaming", () => {
  test.use({
    allowConsoleErrors: [/502 \(Bad Gateway\)/],
    allowRequestFailures: [
      /\/api\/platform\/calls\/call-live-1\/latency$/,
      /\/api\/platform\/calls\/call-live-1\/trace$/,
    ],
  });

  test("live voice case shows operator action bar with voice-specific actions", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupLiveVoiceCaseRoutes(page);

    await page.goto("/observability/sessions/call-live-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    const actionBar = page.locator('[data-testid="operator-action-bar"]');
    await expect(actionBar).toBeVisible();

    await expect(page.locator('[data-testid="operator-action-join_call"]')).toBeVisible();
    await expect(page.locator('[data-testid="operator-action-takeover"]')).toBeVisible();
    await expect(page.locator('[data-testid="operator-action-transfer"]')).toBeVisible();

    // Chat actions should NOT be visible for voice cases
    await expect(page.locator('[data-testid="operator-action-watch"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="operator-action-join"]')).not.toBeVisible();
  });

  test("Join call button starts as 'Join call' and audio player is not visible before joining", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupLiveVoiceCaseRoutes(page);

    // Mock the livekit-operator-token endpoint
    await page.route("**/api/platform/calls/*/livekit-operator-token", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ room_name: "rm_test123", token: "fake-jwt", expires_at: "2026-03-25T12:00:00Z" }),
      });
    });

    await page.goto("/observability/sessions/call-live-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // Join call button should be visible, audio player should NOT be visible before joining
    const joinButton = page.locator('[data-testid="operator-action-join_call"]');
    await expect(joinButton).toBeVisible();
    await expect(joinButton).toHaveText("Join call");
    await expect(page.locator('[data-testid="observability-live-audio"]')).not.toBeVisible();
  });

  test("live chat case shows chat-specific operator actions", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    const chatRun = makeRunSummary({
      kind: "interactive_channel_session",
      subject_id: "cs-live-1",
      call_id: null,
      channel_session_id: "cs-live-1",
      title: "Live Chat Session",
    });

    await page.route("**/api/platform/observability/runs**", async (route) => {
      if (route.request().url().includes("/interactive_channel_session/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(makeDetailResponse({
            kind: "interactive_channel_session",
            subject_id: "cs-live-1",
            call_id: null,
            channel_session_id: "cs-live-1",
          })),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ runs: [chatRun], facets: emptyFacets }),
      });
    });

    await page.route("**/api/platform/observability/runs/interactive_channel_session/cs-live-1/timeline**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(makeTimelineResponse()),
      });
    });

    await page.route("**/api/platform/calls/*/transcript/stream**", async (route) => {
      await route.fulfill({ status: 200, contentType: "text/event-stream", body: "" });
    });
    await page.route("**/api/platform/calls/*/ops/stream**", async (route) => {
      await route.fulfill({ status: 200, contentType: "text/event-stream", body: "" });
    });

    await page.goto("/observability/channel-sessions/cs-live-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    await expect(page.locator('[data-testid="operator-action-watch"]')).toBeVisible();
    await expect(page.locator('[data-testid="operator-action-join"]')).toBeVisible();
    await expect(page.locator('[data-testid="operator-action-escalate"]')).toBeVisible();

    // Voice actions should NOT be visible
    await expect(page.locator('[data-testid="operator-action-join_call"]')).not.toBeVisible();
  });

  test("queue shows live badge and ticking duration for running cases", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/observability/runs**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          runs: [
            makeRunSummary({ started_at: new Date(Date.now() - 60_000).toISOString() }),
            makeRunSummary({
              subject_id: "call-done",
              call_id: "call-done",
              title: "Completed Call",
              status: "Completed",
              duration_ms: 120000,
            }),
          ],
          facets: emptyFacets,
        }),
      });
    });

    await page.goto("/observability");

    // Live badge should be visible for the running case
    const liveRun = page.locator('[data-testid="observability-run-call_session-call-live-1"]');
    await expect(liveRun).toBeVisible();
    await expect(liveRun.getByText("Live", { exact: true })).toBeVisible();

    // Duration should be ticking (greater than 0)
    const durationText = liveRun.locator("span").filter({ hasText: /\d+.*s|min/ });
    await expect(durationText.first()).toBeVisible();
  });

  test("metrics strip shows placeholder dashes for live case", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupLiveVoiceCaseRoutes(page);

    await page.goto("/observability/sessions/call-live-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // Metrics should show "--" values while live
    const metricsSection = page.locator("text=--");
    await expect(metricsSection.first()).toBeVisible();
  });

  test("live phase indicator shows in right rail for live cases", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupLiveVoiceCaseRoutes(page);

    await page.goto("/observability/sessions/call-live-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    const livePhase = page.locator('[data-testid="observability-live-phase"]');
    await expect(livePhase).toBeVisible();
    await expect(livePhase.locator("text=Live phase")).toBeVisible();
  });

  test("workflow case does not show operator action bar", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    const workflowRun = makeRunSummary({
      kind: "workflow_run",
      subject_id: "wf-live-1",
      call_id: null,
      workflow_id: "sol.booking/send-reminder",
      run_id: "run-live-1",
      title: "Live Workflow",
    });

    await page.route("**/api/platform/observability/runs**", async (route) => {
      if (route.request().url().includes("/workflow_run/")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(makeDetailResponse({
            kind: "workflow_run",
            subject_id: "wf-live-1",
            call_id: null,
            workflow_id: "sol.booking/send-reminder",
            run_id: "run-live-1",
          })),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ runs: [workflowRun], facets: emptyFacets }),
      });
    });

    await page.route("**/api/platform/observability/runs/workflow_run/sol.booking~2Fsend-reminder/run-live-1/timeline**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(makeTimelineResponse()),
      });
    });

    await page.goto("/observability/workflow-runs/sol.booking/send-reminder/run-live-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // Workflow cases should NOT show operator action bar
    await expect(page.locator('[data-testid="operator-action-bar"]')).not.toBeVisible();
  });
});
