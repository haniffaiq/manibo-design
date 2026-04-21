import { expect, test } from "./harness";
import { primeSessionCookie } from "./session-helpers";

/* ------------------------------------------------------------------ */
/*  Shared mock data factories                                         */
/* ------------------------------------------------------------------ */

const emptyFacets = { kinds: [], statuses: [], tenants: [], solutions: [], assistants: [] };

function makeVoiceRunSummary(overrides: Record<string, unknown> = {}) {
  return {
    kind: "call_session",
    subject_id: "call-latency-1",
    title: "Latency Test Call",
    subtitle: "appointment_booking · completed",
    status: "Completed",
    started_at: "2026-03-25T10:00:00Z",
    ended_at: "2026-03-25T10:03:10Z",
    duration_ms: 190_000,
    call_id: "call-latency-1",
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
    summary: makeVoiceRunSummary(summaryOverrides),
    availability: {
      recording_unavailable: true,
      timeline_partial: false,
      logs_unavailable: false,
      trace_unavailable: false,
    },
    metrics: [
      { key: "v2v_ms", label: "V2V", value: "320 ms", value_ms: 320 },
      { key: "stt_ms", label: "STT", value: "80 ms", value_ms: 80 },
    ],
    summary_insights: [],
    recommended_actions: [],
    integrity_gaps: [],
    recordings: [],
    context_fields: [],
    trace_context: {},
    transcript_text: null,
    related_entities: [],
    solution_enrichers: [],
  };
}

function makeTimelineResponse() {
  return {
    items: [
      {
        id: "tl-t0",
        kind: "transcript",
        severity: "info",
        occurred_at: "2026-03-25T10:00:02Z",
        occurred_at_ms: 2000,
        label: "Hello, I need an appointment",
        detail: null,
        actor: "caller",
        duration_ms: null,
        correlation_id: null,
        payload: {},
      },
      {
        id: "tl-t1",
        kind: "transcript",
        severity: "info",
        occurred_at: "2026-03-25T10:00:05Z",
        occurred_at_ms: 5000,
        label: "Sure, let me check available slots",
        detail: null,
        actor: "agent",
        duration_ms: null,
        correlation_id: null,
        payload: {},
      },
      {
        id: "tl-t2",
        kind: "transcript",
        severity: "info",
        occurred_at: "2026-03-25T10:00:10Z",
        occurred_at_ms: 10_000,
        label: "Actually I changed my mind",
        detail: null,
        actor: "caller",
        duration_ms: null,
        correlation_id: null,
        payload: {},
      },
      {
        id: "tl-sys-1",
        kind: "node_execution",
        severity: "info",
        occurred_at: "2026-03-25T10:00:01Z",
        occurred_at_ms: 1000,
        label: "greeting_node started",
        detail: "LangGraph node execution",
        actor: "system",
        duration_ms: 200,
        correlation_id: null,
        payload: {},
      },
    ],
    next_cursor: null,
    returned: 4,
    total_items: 4,
  };
}

function makeLatencyResponse() {
  return {
    call_id: "call-latency-1",
    source: "persisted_metadata",
    has_latency_data: true,
    turns: [
      {
        turn_index: 0,
        user_speech_started_at_ms: 1000,
        user_speech_ended_at_ms: 2000,
        user_final_transcript_at_ms: 2050,
        user_final_transcript_chars: 28,
        stt_duration_ms: 1050,
        llm_start_at_ms: 2100,
        llm_ttft_at_ms: 2250,
        llm_duration_ms: 400,
        agent_speaking_started_at_ms: 2500,
        agent_speaking_ended_at_ms: 3500,
        tts_ttfb_ms: 40,
        tts_duration_ms: 500,
        stt_finalize_delay_ms: 50,
        eot_to_llm_start_ms: 100,
        llm_ttft_ms: 150,
        eot_to_agent_speak_ms: 320,
        first_speech_latency_ms: 320,
        tts_pre_speech_gap_ms: 20,
        user_interrupted_agent: false,
        interruption_started_at_ms: null,
        agent_stop_after_interrupt_ms: null,
        speech_overlap_duration_ms: null,
        tool_executions: [],
      },
      {
        turn_index: 1,
        user_speech_started_at_ms: 4000,
        user_speech_ended_at_ms: 5000,
        user_final_transcript_at_ms: 5060,
        user_final_transcript_chars: 34,
        stt_duration_ms: 1060,
        llm_start_at_ms: 5100,
        llm_ttft_at_ms: 5400,
        llm_duration_ms: 800,
        agent_speaking_started_at_ms: 5700,
        agent_speaking_ended_at_ms: 7000,
        tts_ttfb_ms: 60,
        tts_duration_ms: 700,
        stt_finalize_delay_ms: 60,
        eot_to_llm_start_ms: 100,
        llm_ttft_ms: 300,
        eot_to_agent_speak_ms: 700,
        first_speech_latency_ms: 700,
        tts_pre_speech_gap_ms: 40,
        user_interrupted_agent: false,
        interruption_started_at_ms: null,
        agent_stop_after_interrupt_ms: null,
        speech_overlap_duration_ms: null,
        tool_executions: [
          { tool_name: "search_clinics", duration_ms: 120, status: "success", error_detail: null },
        ],
      },
      {
        turn_index: 2,
        user_speech_started_at_ms: 8000,
        user_speech_ended_at_ms: 10_000,
        user_final_transcript_at_ms: 10_050,
        user_final_transcript_chars: 26,
        stt_duration_ms: 2050,
        llm_start_at_ms: 10_100,
        llm_ttft_at_ms: 10_200,
        llm_duration_ms: 300,
        agent_speaking_started_at_ms: 10_400,
        agent_speaking_ended_at_ms: 11_000,
        tts_ttfb_ms: 30,
        tts_duration_ms: 400,
        stt_finalize_delay_ms: 50,
        eot_to_llm_start_ms: 100,
        llm_ttft_ms: 100,
        eot_to_agent_speak_ms: 250,
        first_speech_latency_ms: 250,
        tts_pre_speech_gap_ms: 20,
        user_interrupted_agent: true,
        interruption_started_at_ms: 10_600,
        agent_stop_after_interrupt_ms: 80,
        speech_overlap_duration_ms: 200,
        tool_executions: [],
      },
    ],
    summaries: {},
    stack: null,
  };
}

/** Latency response with a slow turn (eot_to_agent_speak_ms > 500ms default threshold). */
function makeSlowLatencyResponse() {
  const base = makeLatencyResponse();
  return {
    ...base,
    turns: base.turns.map((turn) =>
      turn.turn_index === 1
        ? {
            ...turn,
            stt_finalize_delay_ms: 200,
            llm_ttft_ms: 600,
            tts_ttfb_ms: 80,
            eot_to_agent_speak_ms: 1200,
          }
        : turn,
    ),
  };
}

/* ------------------------------------------------------------------ */
/*  Route setup helpers                                                */
/* ------------------------------------------------------------------ */

async function setupVoiceCaseRoutes(
  page: import("@playwright/test").Page,
  latencyOverride?: ReturnType<typeof makeLatencyResponse>,
) {
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
        runs: [makeVoiceRunSummary()],
        facets: {
          ...emptyFacets,
          kinds: [{ value: "call_session", label: "call_session", count: 1 }],
          statuses: [{ value: "Completed", label: "Completed", count: 1 }],
        },
      }),
    });
  });

  await page.route("**/api/platform/observability/runs/call_session/call-latency-1/timeline**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(makeTimelineResponse()),
    });
  });

  await page.route("**/api/platform/calls/call-latency-1/latency**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(latencyOverride ?? makeLatencyResponse()),
    });
  });

  await page.route("**/api/platform/calls/call-latency-1/trace", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        call_id: "call-latency-1",
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
    await route.fulfill({ status: 200, contentType: "text/event-stream", body: "" });
  });

  await page.route("**/api/platform/calls/*/ops/stream**", async (route) => {
    await route.fulfill({ status: 200, contentType: "text/event-stream", body: "" });
  });
}

async function setupWorkflowCaseRoutes(page: import("@playwright/test").Page) {
  const workflowRun = {
    kind: "workflow_run",
    subject_id: "wf-turn-1",
    title: "Reminder Delivery",
    subtitle: "sol.booking/send-reminder",
    status: "Completed",
    started_at: "2026-03-25T10:00:00Z",
    ended_at: "2026-03-25T10:01:05Z",
    duration_ms: 65_000,
    call_id: null,
    workflow_id: "sol.booking/send-reminder",
    run_id: "run-turn-1",
    channel_session_id: null,
    conversation_id: null,
    correlation_id: null,
    composition_version: null,
    artifact_hash: null,
    tenant_id: null,
    tenant_name: null,
    solution_name: "appointment_booking",
    assistant_name: "Reminder assistant",
    trace_available: false,
    recording_available: false,
    warning_count: 0,
    error_count: 0,
  };

  await page.route("**/api/platform/observability/runs**", async (route) => {
    if (route.request().url().includes("/workflow_run/")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(makeDetailResponse({
          kind: "workflow_run",
          subject_id: "wf-turn-1",
          call_id: null,
          workflow_id: "sol.booking/send-reminder",
          run_id: "run-turn-1",
          title: "Reminder Delivery",
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

  await page.route(
    "**/api/platform/observability/runs/workflow_run/sol.booking~2Fsend-reminder/run-turn-1/timeline**",
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              id: "tl-wf-1",
              kind: "node_execution",
              severity: "info",
              occurred_at: "2026-03-25T10:00:02Z",
              occurred_at_ms: 2000,
              label: "send_reminder executed",
              detail: "Workflow step completed",
              actor: "system",
              duration_ms: 500,
              correlation_id: null,
              payload: {},
            },
          ],
          next_cursor: null,
          returned: 1,
          total_items: 1,
        }),
      });
    },
  );
}

function turnRows(page: import("@playwright/test").Page, turnIndex: number) {
  return page.locator(`[data-testid="conversation-turn-${turnIndex}"]`);
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

test.describe("observability conversation turn latency", () => {
  test.use({
    allowConsoleErrors: [/502 \(Bad Gateway\)/],
    allowRequestFailures: [/\/api\/platform\/calls\/call-latency-1\/trace$/],
  });

  test("voice call case shows conversation turns section with turn rows", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupVoiceCaseRoutes(page);

    await page.goto("/observability/sessions/call-latency-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // Conversation turns section should be visible
    const turnsSection = page.locator('[data-testid="conversation-turns-section"]');
    await expect(turnsSection).toBeVisible();
    await expect(page.getByText("Conversation · 6 turns")).toBeVisible();

    // Each latency turn now renders user and agent evidence rows.
    await expect(turnRows(page, 0)).toHaveCount(2);
    await expect(turnRows(page, 1)).toHaveCount(2);
    await expect(turnRows(page, 2)).toHaveCount(2);
    await expect(turnRows(page, 0).first()).toBeVisible();
    await expect(turnRows(page, 1).first()).toBeVisible();
    await expect(turnRows(page, 2).first()).toBeVisible();
  });

  test("latency bars render inside turn rows", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupVoiceCaseRoutes(page);

    await page.goto("/observability/sessions/call-latency-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    const firstTurn = turnRows(page, 0).first();
    const secondTurn = turnRows(page, 1).first();
    const thirdTurn = turnRows(page, 2).first();

    await expect(firstTurn.locator('[data-testid="latency-bar"]')).toBeVisible();
    await expect(secondTurn.locator('[data-testid="latency-bar"]')).toBeVisible();
    await expect(thirdTurn.locator('[data-testid="latency-bar"]')).toBeVisible();

    // Verify segments are present within the first bar
    await expect(firstTurn.locator('[data-testid="latency-segment-stt"]')).toBeVisible();
    await expect(firstTurn.locator('[data-testid="latency-segment-llm"]')).toBeVisible();
    await expect(firstTurn.locator('[data-testid="latency-segment-tts"]')).toBeVisible();
  });

  test("click turn row to expand shows pipeline breakdown", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupVoiceCaseRoutes(page);

    await page.goto("/observability/sessions/call-latency-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // Pipeline breakdown should NOT be visible before clicking
    await expect(page.locator('[data-testid="pipeline-breakdown"]')).not.toBeVisible();

    // Click turn 0 to expand
    await turnRows(page, 0).first().click();

    // Pipeline breakdown should now be visible
    await expect(page.locator('[data-testid="pipeline-breakdown"]')).toBeVisible();

    // Timing milestones should appear in expanded view
    await expect(page.locator('[data-testid="timing-milestones"]')).toBeVisible();
  });

  test("slow turn shows warning indicator", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupVoiceCaseRoutes(page, makeSlowLatencyResponse());

    await page.goto("/observability/sessions/call-latency-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // Turn 1 has eot_to_agent_speak_ms=1200 which exceeds the 500ms default threshold
    const slowTurn = turnRows(page, 1).first();
    await expect(slowTurn.locator('[data-testid="slow-warning"]')).toBeVisible();

    // Turn 0 (320ms) should NOT have slow warning
    const normalTurn = turnRows(page, 0).first();
    await expect(normalTurn.locator('[data-testid="slow-warning"]')).not.toBeVisible();
  });

  test("interrupted turn shows interruption marker and overlap duration", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupVoiceCaseRoutes(page);

    await page.goto("/observability/sessions/call-latency-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // Turn 2 has user_interrupted_agent=true
    const interruptedTurn = turnRows(page, 2).first();
    await expect(interruptedTurn.locator('[data-testid="interrupted-marker"]')).toBeVisible();
    await expect(interruptedTurn.locator('[data-testid="overlap-duration"]')).toBeVisible();

    // Click to expand and verify interruption section
    await interruptedTurn.click();
    await expect(page.locator('[data-testid="interruption-section"]')).toBeVisible();
  });

  test("non-voice case does not show conversation turns section", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupWorkflowCaseRoutes(page);

    await page.goto("/observability/workflow-runs/sol.booking/send-reminder/run-turn-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // Conversation turns section should NOT be visible for workflow runs
    await expect(page.locator('[data-testid="conversation-turns-section"]')).not.toBeVisible();

    // The unified evidence rail header should be visible instead
    await expect(page.getByText("Evidence rail")).toBeVisible();
  });

  test("system events section renders separately for voice cases", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupVoiceCaseRoutes(page);

    await page.goto("/observability/sessions/call-latency-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // System events header should be visible
    await expect(page.getByText("System Events")).toBeVisible();

    // The non-transcript timeline item should appear in system events
    // (node_execution "greeting_node started" from our mock)
    await expect(page.locator('[data-testid="observability-timeline-tl-sys-1"]')).toBeVisible();
  });

  test("tool execution renders within turn row", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupVoiceCaseRoutes(page);

    await page.goto("/observability/sessions/call-latency-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // Turn 1 has a tool execution for search_clinics
    const turnWithTool = turnRows(page, 1).first();
    await expect(turnWithTool.locator('[data-testid="tool-execution-search_clinics"]')).toBeVisible();
  });

  test("felt latency value displays for turns with complete data", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupVoiceCaseRoutes(page);

    await page.goto("/observability/sessions/call-latency-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // Turn 0: eot_to_agent_speak_ms=320 -> "320ms"
    const turn0 = turnRows(page, 0).first();
    const feltLatency0 = turn0.locator('[data-testid="felt-latency"]');
    await expect(feltLatency0).toBeVisible();
    await expect(feltLatency0).toContainText("320ms");

    // Turn 1: eot_to_agent_speak_ms=700 -> "700ms"
    const turn1 = turnRows(page, 1).first();
    const feltLatency1 = turn1.locator('[data-testid="felt-latency"]');
    await expect(feltLatency1).toBeVisible();
    await expect(feltLatency1).toContainText("700ms");
  });

  test("collapsing expanded turn hides pipeline breakdown", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");
    await setupVoiceCaseRoutes(page);

    await page.goto("/observability/sessions/call-latency-1");
    await page.waitForSelector('[data-testid="observability-selected-status"]');

    // Expand turn 0
    await turnRows(page, 0).first().click();
    await expect(page.locator('[data-testid="pipeline-breakdown"]')).toBeVisible();

    // Click again to collapse
    await turnRows(page, 0).first().click();
    await expect(page.locator('[data-testid="pipeline-breakdown"]')).not.toBeVisible();
  });
});
