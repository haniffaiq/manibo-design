import { expect, test } from "./harness";
import { primeSessionCookie } from "./session-helpers";

async function clickAndWaitForUrl(
  page: import("@playwright/test").Page,
  locator: import("@playwright/test").Locator,
  pattern: RegExp,
): Promise<void> {
  await Promise.all([page.waitForURL(pattern, { timeout: 15000 }), locator.click()]);
}

const emptyFacets = {
  kinds: [],
  statuses: [],
  tenants: [],
  solutions: [],
  assistants: [],
};

test.describe("observability workspace", () => {
  test.use({
    allowConsoleErrors: [/502 \(Bad Gateway\)/],
    allowRequestFailures: [
      /\/api\/platform\/calls\/call-1\/latency$/,
      /\/api\/platform\/calls\/call-1\/trace$/,
      /\/api\/platform\/calls\/admin-call-1\/latency$/,
      /\/api\/platform\/calls\/admin-call-1\/trace$/,
    ],
  });
  test.beforeEach(async ({ page }) => {
    for (const callId of ["call-1", "admin-call-1"]) {
      await page.route(`**/api/platform/calls/${callId}/latency`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            call_id: callId,
            source: "persisted_metadata",
            has_latency_data: false,
            turns: [],
            summaries: {},
            stack: null,
          }),
        });
      });

      await page.route(`**/api/platform/calls/${callId}/trace`, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            call_id: callId,
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
    }
  });

  test("tenant operator can inspect route-backed runs, page timeline events, and compare sessions", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/observability/runs**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          runs: [
            {
              kind: "call_session",
              title: "Driver Anna",
              subtitle: "appointment_booking · completed",
              status: "Completed",
              started_at: "2026-03-10T08:00:00Z",
              ended_at: "2026-03-10T08:03:10Z",
              duration_ms: 190000,
              call_id: "call-1",
              workflow_id: null,
              run_id: null,
              tenant_id: null,
              tenant_name: null,
              solution_name: "appointment_booking",
              assistant_name: "Anna voice",
              trace_available: true,
              recording_available: true,
              warning_count: 1,
              error_count: 0,
            },
            {
              kind: "call_session",
              title: "Driver Ben",
              subtitle: "appointment_booking · completed",
              status: "Completed",
              started_at: "2026-03-10T07:45:00Z",
              ended_at: "2026-03-10T07:47:10Z",
              duration_ms: 130000,
              call_id: "call-2",
              workflow_id: null,
              run_id: null,
              tenant_id: null,
              tenant_name: null,
              solution_name: "appointment_booking",
              assistant_name: "Ben voice",
              trace_available: true,
              recording_available: true,
              warning_count: 0,
              error_count: 0,
            },
            {
              kind: "workflow_run",
              title: "Reminder Delivery",
              subtitle: "sol.appointment_booking/send-reminder",
              status: "Failed",
              started_at: "2026-03-10T07:50:00Z",
              ended_at: "2026-03-10T07:51:05Z",
              duration_ms: 65000,
              call_id: null,
              workflow_id: "sol.appointment_booking/send-reminder",
              run_id: "run-1",
              tenant_id: null,
              tenant_name: null,
              solution_name: "appointment_booking",
              assistant_name: "Reminder assistant",
              trace_available: false,
              recording_available: false,
              warning_count: 0,
              error_count: 1,
            },
          ],
          facets: {
            kinds: [
              { value: "call_session", label: "call_session", count: 2 },
              { value: "workflow_run", label: "workflow_run", count: 1 },
            ],
            statuses: [
              { value: "Completed", label: "Completed", count: 2 },
              { value: "Failed", label: "Failed", count: 1 },
            ],
            tenants: [],
            solutions: [{ value: "appointment_booking", label: "appointment_booking", count: 3 }],
            assistants: [
              { value: "Anna voice", label: "Anna voice", count: 1 },
              { value: "Ben voice", label: "Ben voice", count: 1 },
              { value: "Reminder assistant", label: "Reminder assistant", count: 1 },
            ],
          },
        }),
      });
    });

    await page.route("**/api/platform/observability/runs/call_session/call-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "call_session",
            title: "Driver Anna",
            subtitle: "appointment_booking · completed",
            status: "Completed",
            started_at: "2026-03-10T08:00:00Z",
            ended_at: "2026-03-10T08:03:10Z",
            duration_ms: 190000,
            call_id: "call-1",
            workflow_id: null,
            run_id: null,
            tenant_id: null,
            tenant_name: null,
            solution_name: "appointment_booking",
            assistant_name: "Anna voice",
            trace_available: true,
            recording_available: true,
            warning_count: 1,
            error_count: 0,
          },
          availability: {
            recording_unavailable: false,
            timeline_partial: true,
            logs_unavailable: false,
            trace_unavailable: false,
          },
          metrics: [
            { key: "tts_ttfb_ms", label: "Voice playback start", value: "420 ms", value_ms: 420 },
            { key: "llm_ttft_ms", label: "AI first token", value: "810 ms", value_ms: 810 },
          ],
          summary_insights: [
            {
              key: "interrupted_turns",
              label: "Interrupted turns",
              detail: "User barge-in interrupted 1 turn(s). Check turn detection before blaming the model.",
              severity: "warning",
            },
            {
              key: "trace_shape",
              label: "Runtime path",
              detail: "2 LangGraph node(s) and 1 route decision(s) were recorded for this session.",
              severity: "info",
            },
          ],
          recommended_actions: [
            {
              key: "review_follow_up_queue",
              label: "Review the follow-up queue",
              detail: "This session already escalated to staff. Open the clinic queue and confirm the owner before the callback promise goes stale.",
              href: "/bookings?call_id=call-1#clinic-selected-case",
              cta_label: "Open follow-up queue",
              severity: "warning",
            },
          ],
          recordings: [
            {
              id: "rec-1",
              status: "ready",
              created_at: "2026-03-10T08:03:15Z",
              signed_url_path: "/recordings/rec-1/signed-url",
            },
          ],
          context_fields: [
            { key: "tenant", label: "Tenant", value: "Clinic Detail" },
            { key: "assistant_release", label: "Assistant release", value: "v2" },
            { key: "llm", label: "LLM stack", value: "openai · gpt-4o-mini" },
            { key: "tts", label: "TTS stack", value: "cartesia · sonic-2" },
            { key: "vad", label: "Turn detection", value: "livekit · silero-vad" },
          ],
          trace_context: {
            trace_id: "trace-call-1",
            correlation_id: "trace-call-1",
            traceparent: "00-11111111111111111111111111111111-2222222222222222-01",
          },
          transcript_text: "caller: I need to move my booking.\nassistant: I can hand this to staff.",
          related_entities: [
            { label: "Open call history", href: "/call-ops/history?call_id=call-1" },
            {
              label: "Find workflow trace",
              href: "/observability?filter_kind=workflow_run&query=sol.appointment_booking%2Fsend-reminder",
            },
            { label: "Open clinic case", href: "/bookings?call_id=call-1#clinic-selected-case" },
          ],
          solution_enrichers: [
            {
              solution_name: "appointment_booking",
              label: "Appointment booking",
              case_detail_fields: [
                {
                  key: "booking_status",
                  label: "Booking status",
                  value: "Handed Off",
                  severity: "warning",
                  href: null,
                },
                {
                  key: "follow_up_state",
                  label: "Follow-up state",
                  value: "Staff review overdue",
                  severity: "error",
                  href: "/bookings?call_id=call-1#clinic-selected-case",
                },
              ],
              evidence_items: [
                {
                  key: "booking_extraction",
                  label: "Clinic booking extraction",
                  detail: "Caller requested a cardiology follow-up and staff handoff.",
                  severity: "info",
                  occurred_at: "2026-03-10T08:10:04Z",
                  href: null,
                },
                {
                  key: "follow_up_state",
                  label: "Clinic follow-up state",
                  detail: "The follow-up queue is still open and waiting for staff ownership.",
                  severity: "error",
                  occurred_at: "2026-03-10T08:10:06Z",
                  href: "/bookings?call_id=call-1#clinic-selected-case",
                },
              ],
              timeline_decorators: [
                {
                  key: "follow_up_opened",
                  label: "Clinic follow-up opened",
                  detail: "Staff follow-up case was created from the call.",
                  severity: "warning",
                  occurred_at: "2026-03-10T08:10:05Z",
                },
              ],
              related_actions: [
                {
                  key: "open_booking_case",
                  label: "Open clinic case",
                  detail: "Review the clinic queue and assign an owner.",
                  href: "/bookings?call_id=call-1#clinic-selected-case",
                  cta_label: "Open clinic case",
                  severity: "warning",
                },
              ],
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/observability/runs/call_session/call-1/timeline**", async (route) => {
      const url = new URL(route.request().url());
      const cursor = url.searchParams.get("cursor");
      const payload =
        cursor === "40"
          ? {
              summary: {
                kind: "call_session",
                title: "Driver Anna",
                subtitle: "appointment_booking · completed",
                status: "Completed",
                started_at: "2026-03-10T08:00:00Z",
                ended_at: "2026-03-10T08:03:10Z",
                duration_ms: 190000,
                call_id: "call-1",
                workflow_id: null,
                run_id: null,
                tenant_id: null,
                tenant_name: null,
                solution_name: "appointment_booking",
                assistant_name: "Anna voice",
                trace_available: true,
                recording_available: true,
                warning_count: 1,
                error_count: 0,
              },
              availability: {
                recording_unavailable: false,
                timeline_partial: true,
                logs_unavailable: false,
                trace_unavailable: false,
              },
              items: [
                {
                  id: "tool-1",
                  kind: "tool",
                  severity: "info",
                  occurred_at: "2026-03-10T08:00:22Z",
                  occurred_at_ms: 22000,
                  label: "Tool call: request_human_handoff",
                  detail: "The assistant requested staff follow-up.",
                  actor: "assistant",
                  duration_ms: 800,
                  correlation_id: "trace-call-1",
                  payload: { tool_name: "request_human_handoff" },
                },
              ],
              next_cursor: null,
              returned: 1,
              total_items: 3,
            }
          : {
              summary: {
                kind: "call_session",
                title: "Driver Anna",
                subtitle: "appointment_booking · completed",
                status: "Completed",
                started_at: "2026-03-10T08:00:00Z",
                ended_at: "2026-03-10T08:03:10Z",
                duration_ms: 190000,
                call_id: "call-1",
                workflow_id: null,
                run_id: null,
                tenant_id: null,
                tenant_name: null,
                solution_name: "appointment_booking",
                assistant_name: "Anna voice",
                trace_available: true,
                recording_available: true,
                warning_count: 1,
                error_count: 0,
              },
              availability: {
                recording_unavailable: false,
                timeline_partial: true,
                logs_unavailable: false,
                trace_unavailable: false,
              },
              items: [
                {
                  id: "segment-1",
                  kind: "transcript",
                  severity: "info",
                  occurred_at: "2026-03-10T08:00:05Z",
                  occurred_at_ms: 5000,
                  label: "Patient confirmed availability",
                  detail: "Caller agreed to a follow-up visit.",
                  actor: "caller",
                  duration_ms: null,
                  correlation_id: "trace-call-1",
                  payload: { speaker: "caller" },
                },
                {
                  id: "route-1",
                  kind: "route",
                  severity: "warning",
                  occurred_at: "2026-03-10T08:00:18Z",
                  occurred_at_ms: 18000,
                  label: "Route changed to staff follow-up",
                  detail: "The assistant escalated after hearing a reschedule request.",
                  actor: "system",
                  duration_ms: 1200,
                  correlation_id: "trace-call-1",
                  payload: { route: "staff_follow_up" },
                },
              ],
              next_cursor: "40",
              returned: 2,
              total_items: 3,
            };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(payload),
      });
    });

    await page.route("**/api/platform/recordings/rec-1/signed-url**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "data:audio/ogg;base64,T2dnUw==",
          expires_in_seconds: 3600,
        }),
      });
    });

    await page.route("**/api/platform/observability/runs/compare**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          kind: "call_session",
          left: {
            summary: {
              kind: "call_session",
              title: "Driver Anna",
              subtitle: "appointment_booking · completed",
              status: "Completed",
              started_at: "2026-03-10T08:00:00Z",
              ended_at: "2026-03-10T08:03:10Z",
              duration_ms: 190000,
              call_id: "call-1",
              workflow_id: null,
              run_id: null,
              tenant_id: null,
              tenant_name: null,
              solution_name: "appointment_booking",
              assistant_name: "Anna voice",
              trace_available: true,
              recording_available: true,
              warning_count: 1,
              error_count: 0,
            },
            availability: {
              recording_unavailable: false,
              timeline_partial: true,
              logs_unavailable: false,
              trace_unavailable: false,
            },
            key_metrics: [{ key: "llm_ttft_ms", label: "AI first token", value: "810 ms", value_ms: 810 }],
            transcript_excerpt: "assistant: I can hand this to staff.",
            tool_names: ["request_human_handoff"],
            context_fields: [
              { key: "tenant", label: "Tenant", value: "Clinic Detail" },
              { key: "assistant_version", label: "Assistant release", value: "v2" },
              { key: "llm", label: "LLM stack", value: "openai · gpt-4o-mini" },
              { key: "vad", label: "Turn detection", value: "livekit · silero-vad" },
            ],
            related_entities: [],
          },
          right: {
            summary: {
              kind: "call_session",
              title: "Driver Ben",
              subtitle: "appointment_booking · completed",
              status: "Completed",
              started_at: "2026-03-10T07:45:00Z",
              ended_at: "2026-03-10T07:47:10Z",
              duration_ms: 130000,
              call_id: "call-2",
              workflow_id: null,
              run_id: null,
              tenant_id: null,
              tenant_name: null,
              solution_name: "appointment_booking",
              assistant_name: "Ben voice",
              trace_available: true,
              recording_available: true,
              warning_count: 0,
              error_count: 0,
            },
            availability: {
              recording_unavailable: false,
              timeline_partial: false,
              logs_unavailable: false,
              trace_unavailable: false,
            },
            key_metrics: [{ key: "llm_ttft_ms", label: "AI first token", value: "540 ms", value_ms: 540 }],
            transcript_excerpt: "assistant: Your booking is confirmed.",
            tool_names: [],
            context_fields: [
              { key: "tenant", label: "Tenant", value: "Clinic Detail" },
              { key: "assistant_version", label: "Assistant release", value: "v3" },
              { key: "llm", label: "LLM stack", value: "openai · gpt-4.1-mini" },
              { key: "vad", label: "Turn detection", value: "livekit · smart-turn-v2" },
            ],
            related_entities: [],
          },
          duration_delta_ms: 60000,
          warning_delta: 1,
          error_delta: 0,
          metric_deltas: [
            {
              key: "llm_ttft_ms",
              label: "AI first token",
              left_value: "810 ms",
              right_value: "540 ms",
              delta_value: "+270 ms",
            },
          ],
          context_deltas: [
            {
              key: "tenant",
              label: "Tenant",
              left_value: "Clinic Detail",
              right_value: "Clinic Detail",
              changed: false,
            },
            {
              key: "assistant_version",
              label: "Assistant release",
              left_value: "v2",
              right_value: "v3",
              changed: true,
            },
            {
              key: "llm",
              label: "LLM stack",
              left_value: "openai · gpt-4o-mini",
              right_value: "openai · gpt-4.1-mini",
              changed: true,
            },
            {
              key: "vad",
              label: "Turn detection",
              left_value: "livekit · silero-vad",
              right_value: "livekit · smart-turn-v2",
              changed: true,
            },
          ],
          tool_usage: {
            shared: [],
            left_only: ["request_human_handoff"],
            right_only: [],
          },
          node_usage: {
            shared: [],
            left_only: ["greeting"],
            right_only: ["triage"],
          },
          route_usage: {
            shared: [],
            left_only: ["staff_follow_up"],
            right_only: ["self_serve"],
          },
          workflow_step_usage: {
            shared: [],
            left_only: [],
            right_only: [],
          },
        }),
      });
    });

    await page.route("**/api/platform/observability/runs/workflow_run/**/timeline**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "workflow_run",
            title: "Reminder Delivery",
            subtitle: "sol.appointment_booking/send-reminder",
            status: "Failed",
            started_at: "2026-03-10T07:50:00Z",
            ended_at: "2026-03-10T07:51:05Z",
            duration_ms: 65000,
            call_id: "call-1",
            workflow_id: "sol.appointment_booking/send-reminder",
            run_id: "run-1",
            tenant_id: null,
            tenant_name: null,
            solution_name: "appointment_booking",
            assistant_name: "Reminder assistant",
            trace_available: false,
            recording_available: false,
            warning_count: 0,
            error_count: 1,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: true,
            trace_unavailable: true,
          },
          items: [
            {
              id: "workflow-step-2",
              kind: "workflow_step",
              severity: "error",
              occurred_at: "2026-03-10T07:50:40Z",
              occurred_at_ms: 40000,
              label: "Send sms failed",
              detail: "Workflow run failed after SMS delivery step timed out.",
              actor: "workflow",
              duration_ms: 19000,
              correlation_id: null,
              payload: { step_id: "send_sms", retry_state: "backoff_complete" },
            },
          ],
          next_cursor: null,
          returned: 1,
          total_items: 1,
        }),
      });
    });

    await page.route("**/api/platform/observability/runs/workflow_run/**", async (route) => {
      if (route.request().url().includes("/timeline")) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "workflow_run",
            title: "Reminder Delivery",
            subtitle: "sol.appointment_booking/send-reminder",
            status: "Failed",
            started_at: "2026-03-10T07:50:00Z",
            ended_at: "2026-03-10T07:51:05Z",
            duration_ms: 65000,
            call_id: null,
            workflow_id: "sol.appointment_booking/send-reminder",
            run_id: "run-1",
            tenant_id: null,
            tenant_name: null,
            solution_name: "appointment_booking",
            assistant_name: "Reminder assistant",
            trace_available: false,
            recording_available: false,
            warning_count: 0,
            error_count: 1,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: true,
            trace_unavailable: true,
          },
          metrics: [
            { key: "total_steps", label: "Total steps", value: "3", value_ms: null },
            { key: "retries", label: "Retry attempts", value: "1", value_ms: null },
          ],
          summary_insights: [
            {
              key: "workflow_failure",
              label: "Workflow failure",
              detail: "send_sms ended failed after 2 attempt(s). Send sms failed",
              severity: "error",
            },
            {
              key: "retry_pressure",
              label: "Retry pressure",
              detail: "The workflow retried 1 time(s) across 3 step(s).",
              severity: "warning",
            },
          ],
          recommended_actions: [
            {
              key: "reopen_clinic_queue",
              label: "Reopen the clinic follow-up queue",
              detail: "The reminder run failed after the patient interaction. Confirm the booking case is owned before retrying automation.",
              href: "/bookings?call_id=call-1#clinic-selected-case",
              cta_label: "Open clinic queue",
              severity: "warning",
            },
          ],
          recordings: [],
          context_fields: [
            { key: "tenant", label: "Tenant", value: "Clinic Detail" },
            { key: "workflow_type", label: "Workflow type", value: "sol.appointment_booking.send_reminder" },
            { key: "assistant_release", label: "Assistant release", value: "v2" },
          ],
          trace_context: {},
          transcript_text: null,
          related_entities: [
            { label: "Open automations", href: "/automations" },
            { label: "Open related session", href: "/observability/sessions/call-1" },
            { label: "Open clinic case", href: "/bookings?call_id=call-1#clinic-selected-case" },
          ],
        }),
      });
    });

    await page.goto("/observability");

    await expect(page.getByRole("heading", { name: "Observability" })).toBeVisible();
    await expect(page.getByText("Driver Anna", { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId("observability-subject-coverage")).toBeVisible();
    await expect(page.getByTestId("observability-subject-coverage").getByText("Interactive channel sessions", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-subject-coverage").getByText("Control-plane incidents", { exact: true })).toBeVisible();

    await Promise.all([
      page.waitForRequest((request) => request.url().includes("recording_unavailable_only=true")),
      page.getByRole("button", { name: "Recordings missing" }).click(),
    ]);
    await expect(page).toHaveURL(/recording_unavailable_only=1/);

    await Promise.all([
      page.waitForRequest((request) => request.url().includes("needs_review_only=true")),
      page.getByRole("button", { name: "Needs review" }).click(),
    ]);
    await expect(page).toHaveURL(/needs_review_only=1/);

    await page.getByTestId("observability-start-date").fill("2026-03-09");
    await page.getByTestId("observability-end-date").fill("2026-03-10");
    await Promise.all([
      page.waitForRequest(
        (request) =>
          request.url().includes("start=2026-03-09T00%3A00%3A00.000Z") &&
          request.url().includes("end=2026-03-10T23%3A59%3A59.999Z"),
      ),
      page.getByRole("button", { name: "Apply search" }).click(),
    ]);

    await clickAndWaitForUrl(
      page,
      page.getByText("Driver Anna", { exact: true }).first(),
      /\/observability\/sessions\/call-1/,
    );
    await expect(page.getByTestId("observability-case-record")).toBeVisible();
    await expect(page.getByTestId("observability-case-record")).toContainText("Case type");
    await expect(page.getByTestId("observability-case-record")).toContainText("Voice session");
    await expect(page.getByTestId("observability-case-record")).toContainText("call-1");
    await expect(page.getByText("Audio waveform", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-related-entity-2")).toBeVisible();
    await expect(page.getByTestId("observability-summary-insights")).toBeVisible();
    await expect(page.getByTestId("observability-summary-insights").getByText("Interrupted turns", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-evidence-map")).toBeVisible();
    await expect(page.getByTestId("observability-evidence-map").getByText("Session evidence", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-evidence-map").getByText("Control-plane evidence", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-evidence-map").getByText("Composition context", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-solution-context")).toBeVisible();
    await expect(page.getByTestId("observability-solution-context").getByText("Appointment booking", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-solution-context").getByText("Booking status", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-solution-context").getByText("Handed Off", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-solution-action-appointment_booking-0")).toBeVisible();
    await expect(page.getByTestId("observability-solution-evidence")).toBeVisible();
    await expect(
      page.getByTestId("observability-solution-evidence").getByText("Clinic booking extraction", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByTestId("observability-solution-evidence").getByText("Clinic follow-up state", { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("observability-solution-timeline-markers")).toBeVisible();
    await expect(
      page.getByTestId("observability-solution-timeline-markers").getByText("Clinic follow-up opened", { exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId("observability-detail-context")).toBeVisible();
    await expect(page.getByTestId("observability-detail-context").getByText("Assistant release", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-detail-context").getByText("openai · gpt-4o-mini", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-detail-context").getByText("livekit · silero-vad", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-recommended-actions")).toBeVisible();
    await expect(page.getByTestId("observability-recommended-actions")).toContainText("What to do next");
    await expect(page.getByTestId("observability-recommended-actions").getByText("Review the follow-up queue", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-recommended-actions").getByRole("link", { name: "Open follow-up queue" })).toBeVisible();
    await expect(page.getByTestId("observability-related-records")).toBeVisible();
    await expect(page.getByTestId("observability-related-records")).toContainText("Open related records");
    await expect(page.getByText("Route changed to staff follow-up", { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId("conversation-turns-section")).toBeVisible();
    await expect(page.getByText("System Events", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Load more timeline" }).click();
    await expect(page.getByText("Tool call: request_human_handoff", { exact: true }).first()).toBeVisible();

    await page.getByTestId("observability-compare-select").selectOption("call-2");
    await expect(page.getByText("Run comparison", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-compare-context")).toBeVisible();
    await expect(page.getByTestId("observability-compare-context").getByText("Context changes", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-compare-context").getByText("Assistant release", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-compare-context").getByText("Turn detection", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-compare-path")).toBeVisible();
    await expect(page.getByText("request_human_handoff", { exact: true })).toBeVisible();
    await expect(page.getByText("staff_follow_up", { exact: true })).toBeVisible();

    // Navigate back to queue before selecting the workflow run
    // (compare mode is full-width and does not render the queue)
    await page.goto("/observability");
    await expect(page.getByText("Reminder Delivery", { exact: true }).first()).toBeVisible();
    await clickAndWaitForUrl(
      page,
      page.getByText("Reminder Delivery", { exact: true }).first(),
      /\/observability\/workflow-runs\/sol\.appointment_booking\/send-reminder\/run-1/,
    );
    await expect(page.getByTestId("observability-case-record")).toBeVisible();
    await expect(page.getByTestId("observability-case-record")).toContainText("Workflow run");
    await expect(page.getByTestId("observability-summary-insights")).toBeVisible();
    await expect(page.getByTestId("observability-summary-insights").getByText("Workflow failure", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-detail-context")).toBeVisible();
    await expect(page.getByTestId("observability-detail-context").getByText("Workflow type", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-recommended-actions")).toBeVisible();
    await expect(page.getByTestId("observability-recommended-actions").getByText("Reopen the clinic follow-up queue", { exact: true })).toBeVisible();
    await expect(page.getByText("Send sms failed", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Structured logs were not available for this run.", { exact: true }).first()).toBeVisible();
  });

  test("tenant operator can inspect interactive channel sessions from the normalized observability route", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/observability/runs**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          runs: [
            {
              kind: "interactive_channel_session",
              title: "Website visitor chat",
              subtitle: "web_chat · escalated",
              status: "Escalated",
              started_at: "2026-03-10T09:00:00Z",
              ended_at: "2026-03-10T09:05:00Z",
              duration_ms: 300000,
              call_id: null,
              workflow_id: null,
              run_id: null,
              channel_session_id: "guest-1",
              conversation_id: "conv-1",
              correlation_id: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
              composition_version: "comp-web-v2",
              artifact_hash: "artifact-web-v2",
              tenant_id: null,
              tenant_name: null,
              solution_name: "appointment_booking",
              assistant_name: "Website concierge",
              trace_available: true,
              recording_available: false,
              warning_count: 1,
              error_count: 0,
            },
          ],
          facets: {
            kinds: [{ value: "interactive_channel_session", label: "interactive_channel_session", count: 1 }],
            statuses: [{ value: "Escalated", label: "Escalated", count: 1 }],
            tenants: [],
            solutions: [{ value: "appointment_booking", label: "appointment_booking", count: 1 }],
            assistants: [{ value: "Website concierge", label: "Website concierge", count: 1 }],
          },
        }),
      });
    });

    await page.route("**/api/platform/observability/runs/interactive_channel_session/guest-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "interactive_channel_session",
            title: "Website visitor chat",
            subtitle: "web_chat · escalated",
            status: "Escalated",
            started_at: "2026-03-10T09:00:00Z",
            ended_at: "2026-03-10T09:05:00Z",
            duration_ms: 300000,
            call_id: null,
            workflow_id: null,
            run_id: null,
            channel_session_id: "guest-1",
            conversation_id: "conv-1",
            correlation_id: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
            composition_version: "comp-web-v2",
            artifact_hash: "artifact-web-v2",
            tenant_id: null,
            tenant_name: null,
            solution_name: "appointment_booking",
            assistant_name: "Website concierge",
            trace_available: true,
            recording_available: false,
            warning_count: 1,
            error_count: 0,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: false,
          },
          metrics: [{ key: "first_response_ms", label: "First response time", value: "4.8 s", value_ms: 4800 }],
          summary_insights: [
            {
              key: "escalation_state",
              label: "Escalation state",
              detail: "The chat escalated after lead capture because a staff callback was required.",
              severity: "warning",
            },
          ],
          recordings: [],
          context_fields: [
            { key: "tenant", label: "Tenant", value: "Clinic Detail" },
            { key: "channel", label: "Channel", value: "web_chat" },
            { key: "conversation_id", label: "Conversation ID", value: "conv-1" },
            { key: "composition_version", label: "Composition version", value: "comp-web-v2" },
            { key: "artifact_hash", label: "Artifact hash", value: "artifact-web-v2" },
          ],
          trace_context: {
            trace_id: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
            span_id: "bbbbbbbbbbbbbbbb",
            correlation_id: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
            traceparent: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
          },
          transcript_text: "guest: I need a same-day appointment.\nassistant: I can hand this to staff.",
          related_entities: [
            {
              label: "Filter this widget",
              href: "/observability?filter_kind=interactive_channel_session&query=widget-main",
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/observability/runs/interactive_channel_session/guest-1/timeline**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "interactive_channel_session",
            title: "Website visitor chat",
            subtitle: "web_chat · escalated",
            status: "Escalated",
            started_at: "2026-03-10T09:00:00Z",
            ended_at: "2026-03-10T09:05:00Z",
            duration_ms: 300000,
            call_id: null,
            workflow_id: null,
            run_id: null,
            channel_session_id: "guest-1",
            conversation_id: "conv-1",
            correlation_id: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
            composition_version: "comp-web-v2",
            artifact_hash: "artifact-web-v2",
            tenant_id: null,
            tenant_name: null,
            solution_name: "appointment_booking",
            assistant_name: "Website concierge",
            trace_available: true,
            recording_available: false,
            warning_count: 1,
            error_count: 0,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: false,
          },
          items: [
            {
              id: "interactive-start-1",
              kind: "route",
              severity: "info",
              occurred_at: "2026-03-10T09:00:00Z",
              occurred_at_ms: 0,
              label: "Interactive channel session started",
              detail: "Public web chat bootstrap minted the guest token and opened the session.",
              actor: "system",
              duration_ms: null,
              correlation_id: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
              payload: { channel: "web_chat" },
            },
            {
              id: "interactive-escalation-1",
              kind: "route",
              severity: "warning",
              occurred_at: "2026-03-10T09:04:30Z",
              occurred_at_ms: 270000,
              label: "Escalation submitted",
              detail: "Operator follow-up was requested for the guest session.",
              actor: "system",
              duration_ms: 800,
              correlation_id: "00-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-bbbbbbbbbbbbbbbb-01",
              payload: { escalation_ref: "esc-1" },
            },
          ],
          next_cursor: null,
          returned: 2,
          total_items: 2,
        }),
      });
    });

    await page.goto("/observability");
    await clickAndWaitForUrl(
      page,
      page.getByText("Website visitor chat", { exact: true }).first(),
      /\/observability\/channel-sessions\/guest-1/,
    );
    await expect(page.getByRole("button", { name: "Back to queue" })).toBeVisible();
    await expect(page.getByTestId("observability-case-record").getByText("Channel session", { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId("observability-case-record").getByText("Case ID", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-case-record").getByText("guest-1", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-detail-context")).toBeVisible();
    await expect(page.getByTestId("observability-detail-context").getByText("Composition version", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-detail-context").getByText("comp-web-v2", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-trace-context")).toContainText("traceparent");
    await expect(page.getByText("Interactive channel session started", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Escalation submitted", { exact: true }).first()).toBeVisible();

    // T02/T03: Gap marker appears when recording_unavailable is true
    await expect(page.getByTestId("observability-gap-marker")).toBeVisible();
    await expect(page.getByTestId("observability-gap-marker")).toContainText("Recording expected but asset missing");

    // T04: Metrics strip renders in compact format
    await expect(page.getByTestId("observability-metrics-strip")).toBeVisible();
    await expect(page.getByTestId("observability-metrics-strip")).toContainText("First response time");

    // T01: Timeline items have data-severity attribute
    const firstTimelineItem = page.locator("[data-testid^='observability-timeline-'][data-severity]").first();
    await expect(firstTimelineItem).toBeVisible();
  });

  test("call history links into the session observability route", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/calls?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calls: [
            {
              id: "call-1",
              direction: "outbound",
              state: "completed",
              outcome: "completed",
              caller_number: "+37060000001",
              callee_number: "+37060000002",
              started_at: "2026-03-10T08:00:00Z",
              ended_at: "2026-03-10T08:03:10Z",
              duration_seconds: 190,
              created_at: "2026-03-10T08:00:00Z",
              updated_at: "2026-03-10T08:03:10Z",
              metadata: {},
              quality_score: null,
              needs_human_review: false,
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }),
      });
    });

    await page.route("**/api/platform/calls/call-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call: {
            id: "call-1",
            direction: "outbound",
            state: "completed",
            outcome: "completed",
            caller_number: "+37060000001",
            callee_number: "+37060000002",
            started_at: "2026-03-10T08:00:00Z",
            ended_at: "2026-03-10T08:03:10Z",
            duration_seconds: 190,
            created_at: "2026-03-10T08:00:00Z",
            updated_at: "2026-03-10T08:03:10Z",
            metadata: {},
            quality_score: null,
            needs_human_review: false,
          },
          transcript: { language: "en", full_text: "Caller asked to move the visit." },
          recordings: [],
          has_more: { transcript: false, recordings: false },
        }),
      });
    });

    await page.route("**/api/platform/calls/call-1/events?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "call-1",
          events: [],
        }),
      });
    });

    await page.route("**/api/platform/calls/call-1/trace", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "call-1",
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

    await page.route("**/api/platform/observability/runs?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ runs: [], facets: emptyFacets }),
      });
    });

    await page.route("**/api/platform/observability/runs/call_session/call-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "call_session",
            title: "Patient callback",
            subtitle: "clinic follow-up · completed",
            status: "Completed",
            started_at: "2026-03-10T08:00:00Z",
            ended_at: "2026-03-10T08:03:10Z",
            duration_ms: 190000,
            call_id: "call-1",
            workflow_id: null,
            run_id: null,
            tenant_id: null,
            tenant_name: null,
            solution_name: "appointment_booking",
            assistant_name: "Clinic concierge",
            trace_available: true,
            recording_available: false,
            warning_count: 0,
            error_count: 0,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: false,
          },
          metrics: [],
          recordings: [],
          context_fields: [
            { key: "tenant", label: "Tenant", value: "Clinic Detail" },
            { key: "assistant", label: "Assistant", value: "Clinic concierge" },
          ],
          trace_context: { trace_id: "trace-call-1", correlation_id: "trace-call-1" },
          transcript_text: null,
          related_entities: [],
        }),
      });
    });

    await page.route("**/api/platform/observability/runs/call_session/call-1/timeline**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "call_session",
            title: "Patient callback",
            subtitle: "clinic follow-up · completed",
            status: "Completed",
            started_at: "2026-03-10T08:00:00Z",
            ended_at: "2026-03-10T08:03:10Z",
            duration_ms: 190000,
            call_id: "call-1",
            workflow_id: null,
            run_id: null,
            tenant_id: null,
            tenant_name: null,
            solution_name: "appointment_booking",
            assistant_name: "Clinic concierge",
            trace_available: true,
            recording_available: false,
            warning_count: 0,
            error_count: 0,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: false,
          },
          items: [],
          next_cursor: null,
          returned: 0,
          total_items: 0,
        }),
      });
    });

    await page.goto("/call-ops/history");
    await page.getByTestId("call-history-search-submit").click();
    await page.getByTestId("call-history-detail-open-call-1").click();
    await expect(page.getByTestId("call-history-open-observability")).toBeVisible();
    await clickAndWaitForUrl(
      page,
      page.getByTestId("call-history-open-observability"),
      /\/observability\/sessions\/call-1/,
    );
  });

  test("automation detail links into the workflow observability route", async ({ page }) => {
    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/workflows/executions**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          executions: [
            {
              workflow_id: "sol.appointment_booking/send-reminder",
              run_id: "run-1",
              workflow_type: "sol.appointment_booking.send_reminder",
              execution_status: "Failed",
              started_at: "2026-03-10T07:50:00Z",
              closed_at: "2026-03-10T07:51:05Z",
            },
          ],
          limit: 50,
        }),
      });
    });

    await page.route(
      "**/api/platform/workflows/executions/sol.appointment_booking%2Fsend-reminder/run-1",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            workflow_id: "sol.appointment_booking/send-reminder",
            run_id: "run-1",
            workflow_type: "sol.appointment_booking.send_reminder",
            execution_status: "Failed",
            started_at: "2026-03-10T07:50:00Z",
            closed_at: "2026-03-10T07:51:05Z",
            current_step: null,
            failed_step: "send_sms",
            error_summary: "SMS delivery timed out.",
            total_steps: 3,
            completed_steps: 2,
            retry_summary: {
              steps_with_retries: 1,
              total_retry_attempts: 1,
              max_attempt: 2,
            },
          }),
        });
      },
    );

    await page.route(
      "**/api/platform/workflows/executions/sol.appointment_booking%2Fsend-reminder/run-1/steps",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            workflow_id: "sol.appointment_booking/send-reminder",
            run_id: "run-1",
            steps: [],
          }),
        });
      },
    );

    await page.route("**/api/platform/observability/runs?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ runs: [], facets: emptyFacets }),
      });
    });

    await page.route("**/api/platform/observability/runs/workflow_run/**/timeline**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "workflow_run",
            title: "Reminder Delivery",
            subtitle: "sol.appointment_booking/send-reminder",
            status: "Failed",
            started_at: "2026-03-10T07:50:00Z",
            ended_at: "2026-03-10T07:51:05Z",
            duration_ms: 65000,
            call_id: null,
            workflow_id: "sol.appointment_booking/send-reminder",
            run_id: "run-1",
            tenant_id: null,
            tenant_name: null,
            solution_name: "appointment_booking",
            assistant_name: "Reminder assistant",
            trace_available: false,
            recording_available: false,
            warning_count: 0,
            error_count: 1,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: true,
            trace_unavailable: true,
          },
          items: [],
          next_cursor: null,
          returned: 0,
          total_items: 0,
        }),
      });
    });

    await page.route("**/api/platform/observability/runs/workflow_run/**", async (route) => {
      if (route.request().url().includes("/timeline")) {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "workflow_run",
            title: "Reminder Delivery",
            subtitle: "sol.appointment_booking/send-reminder",
            status: "Failed",
            started_at: "2026-03-10T07:50:00Z",
            ended_at: "2026-03-10T07:51:05Z",
            duration_ms: 65000,
            call_id: null,
            workflow_id: "sol.appointment_booking/send-reminder",
            run_id: "run-1",
            tenant_id: null,
            tenant_name: null,
            solution_name: "appointment_booking",
            assistant_name: "Reminder assistant",
            trace_available: false,
            recording_available: false,
            warning_count: 0,
            error_count: 1,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: true,
            trace_unavailable: true,
          },
          metrics: [{ key: "total_steps", label: "Total steps", value: "3", value_ms: null }],
          recordings: [],
          context_fields: [
            { key: "tenant", label: "Tenant", value: "Clinic Detail" },
            { key: "workflow_type", label: "Workflow type", value: "sol.appointment_booking.send_reminder" },
            { key: "assistant_release", label: "Assistant release", value: "v2" },
          ],
          trace_context: {},
          transcript_text: null,
          related_entities: [],
        }),
      });
    });

    await page.goto("/automations");
    await expect(page.getByTestId("automations-open-observability")).toBeVisible();
    await clickAndWaitForUrl(
      page,
      page.getByTestId("automations-open-observability"),
      /\/observability\/workflow-runs\/sol\.appointment_booking\/send-reminder\/run-1/,
    );
    await expect(page.getByTestId("observability-detail-context")).toBeVisible();
    await expect(page.getByTestId("observability-detail-context").getByText("Workflow type", { exact: true })).toBeVisible();
  });

  test("deployment support can inspect cross-tenant runs from the admin observability route", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/reports/platform-health**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          checked_at: "2026-03-10T08:01:00Z",
          call_error_rate: 0.12,
          average_call_duration_seconds: 87,
          active_calls: { voice_call: 2, inbound_call: 1, total: 3 },
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
              bucket_start: "2026-03-10T08:00:00Z",
              completed: 7,
              escalated: 1,
              total_calls: 8,
              average_duration_seconds: 87,
              outcome_distribution: { completed: 7, transferred: 1 },
              escalation_rate: 0.125,
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
          sampled_calls: 12,
          window_start: "2026-03-01T00:00:00Z",
          window_end: "2026-03-10T00:00:00Z",
          stack_comparisons: [],
          route_hotspots: [],
        }),
      });
    });

    await page.route("**/api/platform/admin/observability/runs**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          runs: [
            {
              kind: "call_session",
              title: "Clinic A patient callback",
              subtitle: "clinic follow-up · completed",
              status: "Completed",
              started_at: "2026-03-10T08:00:00Z",
              ended_at: "2026-03-10T08:02:00Z",
              duration_ms: 120000,
              call_id: "admin-call-1",
              workflow_id: null,
              run_id: null,
              tenant_id: "tenant-1",
              tenant_name: "Clinic A",
              solution_name: "clinic_follow_up",
              assistant_name: "Clinic concierge",
              trace_available: true,
              recording_available: true,
              warning_count: 0,
              error_count: 0,
            },
          ],
          facets: {
            ...emptyFacets,
            tenants: [{ value: "tenant-1", label: "Clinic A", count: 1 }],
            solutions: [{ value: "clinic_follow_up", label: "clinic_follow_up", count: 1 }],
            assistants: [{ value: "Clinic concierge", label: "Clinic concierge", count: 1 }],
          },
        }),
      });
    });

    await page.route("**/api/platform/admin/observability/runs/call_session/admin-call-1?tenant_id=tenant-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "call_session",
            title: "Clinic A patient callback",
            subtitle: "clinic follow-up · completed",
            status: "Completed",
            started_at: "2026-03-10T08:00:00Z",
            ended_at: "2026-03-10T08:02:00Z",
            duration_ms: 120000,
            call_id: "admin-call-1",
            workflow_id: null,
            run_id: null,
            tenant_id: "tenant-1",
            tenant_name: "Clinic A",
            solution_name: "clinic_follow_up",
            assistant_name: "Clinic concierge",
            trace_available: true,
            recording_available: true,
            warning_count: 0,
            error_count: 0,
          },
          availability: {
            recording_unavailable: false,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: false,
          },
          metrics: [{ key: "llm_ttft_ms", label: "AI first token", value: "620 ms", value_ms: 620 }],
          recommended_actions: [
            {
              key: "open_assistant_release_lane",
              label: "Review the assistant release lane",
              detail: "The tenant session evidence points back to a governed assistant release. Inspect that lane before changing runtime routing.",
              href: "/admin/agent-definitions?tenant_id=tenant-1&definition_id=definition-1&version=2&source=observability",
              cta_label: "Open assistant release lane",
              severity: "info",
            },
          ],
          recordings: [
            {
              id: "rec-admin-1",
              status: "ready",
              created_at: "2026-03-10T08:02:03Z",
              signed_url_path: "/admin/recordings/rec-admin-1/signed-url?tenant_id=tenant-1",
            },
          ],
          context_fields: [
            { key: "tenant", label: "Tenant", value: "Clinic A" },
            { key: "assistant_release", label: "Assistant release", value: "v2" },
            { key: "llm", label: "LLM stack", value: "openai · gpt-4o-mini" },
          ],
          trace_context: { trace_id: "trace-admin-1", correlation_id: "trace-admin-1" },
          transcript_text: "assistant: A staff member will call you back.",
          related_entities: [
            {
              label: "Open assistant release lane",
              href: "/admin/agent-definitions?tenant_id=tenant-1&definition_id=definition-1&version=2&source=observability",
            },
            { label: "Filter this tenant", href: "/admin/observability?filter_tenant_id=tenant-1" },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/observability/runs/call_session/admin-call-1/timeline?tenant_id=tenant-1**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "call_session",
            title: "Clinic A patient callback",
            subtitle: "clinic follow-up · completed",
            status: "Completed",
            started_at: "2026-03-10T08:00:00Z",
            ended_at: "2026-03-10T08:02:00Z",
            duration_ms: 120000,
            call_id: "admin-call-1",
            workflow_id: null,
            run_id: null,
            tenant_id: "tenant-1",
            tenant_name: "Clinic A",
            solution_name: "clinic_follow_up",
            assistant_name: "Clinic concierge",
            trace_available: true,
            recording_available: false,
            warning_count: 0,
            error_count: 0,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: false,
          },
          items: [
            {
              id: "admin-log-1",
              kind: "log",
              severity: "info",
              occurred_at: "2026-03-10T08:00:10Z",
              occurred_at_ms: 10000,
              label: "Escalation request accepted",
              detail: "The session remained inside clinic tenant routing.",
              actor: "system",
              duration_ms: null,
              correlation_id: "trace-admin-1",
              payload: { tenant: "Clinic A" },
            },
          ],
          next_cursor: null,
          returned: 1,
          total_items: 1,
        }),
      });
    });

    await page.route("**/api/platform/admin/recordings/rec-admin-1/signed-url?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "data:audio/ogg;base64,T2dnUw==",
          expires_in_seconds: 3600,
        }),
      });
    });

    await page.goto("/admin/health");
    await clickAndWaitForUrl(page, page.getByTestId("admin-health-open-observability"), /\/admin\/observability/);
    await clickAndWaitForUrl(
      page,
      page.getByText("Clinic A patient callback", { exact: true }).first(),
      /\/admin\/observability\/sessions\/admin-call-1\?tenant_id=tenant-1/,
    );
    await expect(page.getByRole("button", { name: "Back to queue" })).toBeVisible();
    await expect(page.getByTestId("observability-detail-context")).toBeVisible();
    await expect(page.getByTestId("observability-evidence-map")).toBeVisible();
    await expect(page.getByTestId("observability-detail-context").getByText("Tenant", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-detail-context").getByText("Clinic A", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-recommended-actions")).toBeVisible();
    await expect(page.getByTestId("observability-recommended-actions").getByText("Review the assistant release lane", { exact: true })).toBeVisible();
    await expect(page.getByText("Audio waveform", { exact: true })).toBeVisible();
    await expect(page.locator("audio.hidden")).toHaveAttribute("src", /data:audio\/ogg/);
    await expect(page.getByText("Forbidden", { exact: false })).toHaveCount(0);
    await expect(page.getByText("Escalation request accepted", { exact: true }).first()).toBeVisible();
    await expect(page.getByTestId("observability-recommended-action-0")).toBeVisible();
    await expect(page.getByText("Filter this tenant", { exact: true })).toBeVisible();
  });

  test("deployment support can inspect v2 observability subjects with fix-oriented detail", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");

    await page.route("**/api/platform/admin/observability/runs**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          runs: [
            {
              kind: "control_plane_incident",
              subject_id: "incident-1",
              title: "Routing command stalled",
              subtitle: "Clinic A · open incident",
              status: "Open",
              started_at: "2026-03-10T08:10:00Z",
              ended_at: null,
              duration_ms: null,
              call_id: null,
              workflow_id: null,
              run_id: null,
              tenant_id: "tenant-1",
              tenant_name: "Clinic A",
              solution_name: "appointment_booking",
              assistant_name: "Clinic concierge",
              trace_available: true,
              recording_available: false,
              warning_count: 1,
              error_count: 0,
            },
            {
              kind: "channel_runtime",
              subject_id: "runtime-1",
              title: "Main inbound line",
              subtitle: "Clinic A · voice entry point",
              status: "Needs setup",
              started_at: null,
              ended_at: null,
              duration_ms: null,
              call_id: null,
              workflow_id: null,
              run_id: null,
              tenant_id: "tenant-1",
              tenant_name: "Clinic A",
              solution_name: "voice",
              assistant_name: "Clinic concierge",
              trace_available: false,
              recording_available: false,
              warning_count: 1,
              error_count: 0,
            },
            {
              kind: "tenant_composition",
              subject_id: "tenant-1",
              title: "Tenant composition",
              subtitle: "Clinic A · rollout drift",
              status: "Needs review",
              started_at: null,
              ended_at: null,
              duration_ms: null,
              call_id: null,
              workflow_id: null,
              run_id: null,
              tenant_id: "tenant-1",
              tenant_name: "Clinic A",
              solution_name: null,
              assistant_name: null,
              trace_available: false,
              recording_available: false,
              warning_count: 1,
              error_count: 0,
            },
          ],
          facets: {
            kinds: [
              { value: "control_plane_incident", label: "control_plane_incident", count: 1 },
              { value: "channel_runtime", label: "channel_runtime", count: 1 },
              { value: "tenant_composition", label: "tenant_composition", count: 1 },
            ],
            statuses: [
              { value: "Open", label: "Open", count: 1 },
              { value: "Needs setup", label: "Needs setup", count: 1 },
              { value: "Needs review", label: "Needs review", count: 1 },
            ],
            tenants: [{ value: "tenant-1", label: "Clinic A", count: 3 }],
            solutions: [
              { value: "appointment_booking", label: "appointment_booking", count: 1 },
              { value: "voice", label: "voice", count: 1 },
            ],
            assistants: [{ value: "Clinic concierge", label: "Clinic concierge", count: 2 }],
          },
        }),
      });
    });

    await page.route("**/api/platform/admin/observability/runs/control_plane_incident/incident-1?tenant_id=tenant-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "control_plane_incident",
            subject_id: "incident-1",
            title: "Routing command stalled",
            subtitle: "Clinic A · open incident",
            status: "Open",
            started_at: "2026-03-10T08:10:00Z",
            ended_at: null,
            duration_ms: null,
            call_id: null,
            workflow_id: null,
            run_id: null,
            tenant_id: "tenant-1",
            tenant_name: "Clinic A",
            solution_name: "appointment_booking",
            assistant_name: "Clinic concierge",
            trace_available: true,
            recording_available: false,
            warning_count: 1,
            error_count: 0,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: false,
          },
          metrics: [
            { key: "linked_entities", label: "Linked entities", value: "2", value_ms: null },
          ],
          summary_insights: [
            {
              key: "operator_owner",
              label: "Operator owner",
              detail: "No operator has acknowledged this incident yet.",
              severity: "warning",
            },
          ],
          recommended_actions: [
            {
              key: "review_open_incident",
              label: "Review the open incident queue",
              detail: "This control-plane incident is still open. Confirm whether the runtime command should be retried or explicitly closed.",
              href: "/admin/observability?filter_tenant_id=tenant-1&filter_kind=control_plane_incident&status=Open",
              cta_label: "Open incident queue",
              severity: "warning",
            },
            {
              key: "open_related_session",
              label: "Open the linked voice session",
              detail: "The incident already points at a captured session. Use that session evidence before changing any routing config.",
              href: "/admin/observability/sessions/call-1?tenant_id=tenant-1",
              cta_label: "Open linked session",
              severity: "info",
            },
          ],
          integrity_gaps: [
            {
              key: "incident_unresolved",
              label: "Incident still open",
              detail: "No acknowledgement or resolution has been recorded yet.",
              severity: "warning",
            },
          ],
          recordings: [],
          context_fields: [
            { key: "correlation_id", label: "Correlation", value: "corr-incident-1" },
            { key: "linked_session", label: "Linked session", value: "call-1" },
            { key: "linked_workflow", label: "Linked workflow", value: "sol.appointment_booking/send-reminder/run-1" },
            { key: "operator_owner", label: "Operator owner", value: "Unassigned" },
          ],
          trace_context: { trace_id: "trace-incident-1", correlation_id: "corr-incident-1" },
          transcript_text: null,
          related_entities: [
            { label: "Open linked session", href: "/admin/observability/sessions/call-1?tenant_id=tenant-1" },
            { label: "Open linked workflow", href: "/admin/observability/workflow-runs/sol.appointment_booking%2Fsend-reminder%2Frun-1?tenant_id=tenant-1" },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/observability/runs/control_plane_incident/incident-1/timeline?tenant_id=tenant-1**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "control_plane_incident",
            subject_id: "incident-1",
            title: "Routing command stalled",
            subtitle: "Clinic A · open incident",
            status: "Open",
            started_at: "2026-03-10T08:10:00Z",
            ended_at: null,
            duration_ms: null,
            call_id: null,
            workflow_id: null,
            run_id: null,
            tenant_id: "tenant-1",
            tenant_name: "Clinic A",
            solution_name: "appointment_booking",
            assistant_name: "Clinic concierge",
            trace_available: true,
            recording_available: false,
            warning_count: 1,
            error_count: 0,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: false,
          },
          items: [
            {
              id: "incident-opened",
              kind: "log",
              severity: "warning",
              occurred_at: "2026-03-10T08:10:00Z",
              occurred_at_ms: 0,
              label: "Runtime command failed",
              detail: "The route publish command expired before the runtime acknowledged it.",
              actor: "control-plane",
              duration_ms: null,
              correlation_id: "corr-incident-1",
              payload: { command: "publish_route" },
            },
          ],
          next_cursor: null,
          returned: 1,
          total_items: 1,
        }),
      });
    });

    await page.route("**/api/platform/admin/observability/runs/channel_runtime/runtime-1?tenant_id=tenant-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "channel_runtime",
            subject_id: "runtime-1",
            title: "Main inbound line",
            subtitle: "Clinic A · voice entry point",
            status: "Needs setup",
            started_at: null,
            ended_at: null,
            duration_ms: null,
            call_id: null,
            workflow_id: null,
            run_id: null,
            tenant_id: "tenant-1",
            tenant_name: "Clinic A",
            solution_name: "voice",
            assistant_name: "Clinic concierge",
            trace_available: false,
            recording_available: false,
            warning_count: 1,
            error_count: 0,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: true,
          },
          metrics: [
            { key: "evidence_scope", label: "Evidence scope", value: "Routing state only", value_ms: null },
          ],
          summary_insights: [
            {
              key: "routing_state",
              label: "Routing state",
              detail: "This line exists, but it does not point at a published assistant release yet.",
              severity: "warning",
            },
          ],
          recommended_actions: [
            {
              key: "review_phone_routing",
              label: "Review channels",
              detail: "Confirm the public number points at the intended published assistant before callers land here.",
              href: "/admin/channels?tenant_id=tenant-1",
              cta_label: "Open channels",
              severity: "warning",
            },
            {
              key: "publish_assistant",
              label: "Publish an assistant first",
              detail: "Routing is blocked until this tenant has a published assistant version ready to take calls.",
              href: "/admin/agent-definitions?tenant_id=tenant-1",
              cta_label: "Open assistants",
              severity: "warning",
            },
          ],
          integrity_gaps: [
            {
              key: "delivery_telemetry_unavailable",
              label: "Delivery telemetry not available yet",
              detail: "Voice route evidence currently exposes routing and publish state only. Delivery retries and channel lifecycle telemetry still need dedicated V2 channel APIs.",
              severity: "warning",
            },
          ],
          recordings: [],
          context_fields: [
            { key: "tenant", label: "Tenant", value: "Clinic A" },
            { key: "phone_number", label: "Phone number", value: "+37060000001" },
            { key: "assistant_release", label: "Assistant release", value: "Not published yet" },
          ],
          trace_context: {},
          transcript_text: null,
          related_entities: [
            { label: "Open channels", href: "/admin/channels?tenant_id=tenant-1" },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/observability/runs/channel_runtime/runtime-1/timeline?tenant_id=tenant-1**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "channel_runtime",
            subject_id: "runtime-1",
            title: "Main inbound line",
            subtitle: "Clinic A · voice entry point",
            status: "Needs setup",
            started_at: null,
            ended_at: null,
            duration_ms: null,
            call_id: null,
            workflow_id: null,
            run_id: null,
            tenant_id: "tenant-1",
            tenant_name: "Clinic A",
            solution_name: "voice",
            assistant_name: "Clinic concierge",
            trace_available: false,
            recording_available: false,
            warning_count: 1,
            error_count: 0,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: true,
          },
          items: [
            {
              id: "runtime-created",
              kind: "route",
              severity: "warning",
              occurred_at: "2026-03-10T08:00:00Z",
              occurred_at_ms: 0,
              label: "Line created without live routing",
              detail: "The public number exists, but the publish step has not completed yet.",
              actor: "system",
              duration_ms: null,
              correlation_id: null,
              payload: { route_state: "needs_setup" },
            },
          ],
          next_cursor: null,
          returned: 1,
          total_items: 1,
        }),
      });
    });

    await page.route("**/api/platform/admin/observability/runs/tenant_composition/tenant-1?tenant_id=tenant-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "tenant_composition",
            subject_id: "tenant-1",
            title: "Tenant composition",
            subtitle: "Clinic A · rollout drift",
            status: "Needs review",
            started_at: null,
            ended_at: null,
            duration_ms: null,
            call_id: null,
            workflow_id: null,
            run_id: null,
            tenant_id: "tenant-1",
            tenant_name: "Clinic A",
            solution_name: null,
            assistant_name: null,
            trace_available: false,
            recording_available: false,
            warning_count: 1,
            error_count: 0,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: true,
          },
          metrics: [
            { key: "drifted_solutions", label: "Drifted solutions", value: "2", value_ms: null },
          ],
          summary_insights: [
            {
              key: "release_target_mismatch",
              label: "Release target mismatch",
              detail: "The tenant wants Clinic Release Candidate, but the active rollout is still Clinic Baseline.",
              severity: "warning",
            },
            {
              key: "drifted_solution_scope",
              label: "Solutions out of sync",
              detail: "driver_verification and appointment_booking are enabled, but their active revisions do not match the desired rollout.",
              severity: "warning",
            },
          ],
          recommended_actions: [
            {
              key: "finish_rollout",
              label: "Finish the rollout",
              detail: "The tenant is still pinned to an older release than the one it is meant to run.",
              href: "/admin/releases?tenant_id=tenant-1",
              cta_label: "Open releases",
              severity: "warning",
            },
            {
              key: "resync_solution_revisions",
              label: "Resync solution revisions",
              detail: "driver_verification and appointment_booking are the drifted solutions. Update those tenant solution revisions before blaming runtime behavior.",
              href: "/admin/solutions?tenant_id=tenant-1",
              cta_label: "Open solutions",
              severity: "warning",
            },
          ],
          integrity_gaps: [],
          recordings: [],
          context_fields: [
            { key: "desired_release", label: "Desired release", value: "Clinic Release Candidate" },
            { key: "active_release", label: "Active release", value: "Clinic Baseline" },
            { key: "platform_defaults", label: "Platform defaults", value: "Not pinned" },
            { key: "drifted_solutions", label: "Drifted solutions", value: "driver_verification, appointment_booking" },
          ],
          trace_context: {},
          transcript_text: null,
          related_entities: [
            { label: "Open releases", href: "/admin/releases?tenant_id=tenant-1" },
            { label: "Open solutions", href: "/admin/solutions?tenant_id=tenant-1" },
          ],
        }),
      });
    });

    await page.route("**/api/platform/admin/observability/runs/tenant_composition/tenant-1/timeline?tenant_id=tenant-1**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "tenant_composition",
            subject_id: "tenant-1",
            title: "Tenant composition",
            subtitle: "Clinic A · rollout drift",
            status: "Needs review",
            started_at: null,
            ended_at: null,
            duration_ms: null,
            call_id: null,
            workflow_id: null,
            run_id: null,
            tenant_id: "tenant-1",
            tenant_name: "Clinic A",
            solution_name: null,
            assistant_name: null,
            trace_available: false,
            recording_available: false,
            warning_count: 1,
            error_count: 0,
          },
          availability: {
            recording_unavailable: true,
            timeline_partial: false,
            logs_unavailable: false,
            trace_unavailable: true,
          },
          items: [
            {
              id: "composition-drift",
              kind: "metric",
              severity: "warning",
              occurred_at: "2026-03-10T08:05:00Z",
              occurred_at_ms: 0,
              label: "Composition drift detected",
              detail: "Tenant solution revisions no longer match the desired release assignment.",
              actor: "system",
              duration_ms: null,
              correlation_id: null,
              payload: { drifted_solutions: ["driver_verification", "appointment_booking"] },
            },
          ],
          next_cursor: null,
          returned: 1,
          total_items: 1,
        }),
      });
    });

    await page.goto("/admin/observability?filter_tenant_id=tenant-1");

    await clickAndWaitForUrl(
      page,
      page.getByText("Routing command stalled", { exact: true }).first(),
      /\/admin\/observability\/control-plane-incidents\/incident-1\?.*tenant_id=tenant-1/,
    );
    await expect(page.getByTestId("observability-case-record")).toBeVisible();
    await expect(page.getByTestId("observability-case-record")).toContainText("Control-plane incident");
    await expect(page.getByTestId("observability-related-records")).toBeVisible();
    await expect(page.getByTestId("observability-recommended-actions")).toBeVisible();
    await expect(page.getByTestId("observability-recommended-actions").getByText("Review the open incident queue", { exact: true })).toBeVisible();
    await expect(page.getByText("Incident still open", { exact: true })).toBeVisible();
    await expect(page.getByText("Runtime command failed", { exact: true }).first()).toBeVisible();

    await page.goto("/admin/observability?filter_tenant_id=tenant-1");
    await clickAndWaitForUrl(
      page,
      page.getByText("Main inbound line", { exact: true }).first(),
      /\/admin\/observability\/channel-runtimes\/runtime-1\?.*tenant_id=tenant-1/,
    );
    await expect(page.getByTestId("observability-case-record")).toContainText("Channel runtime");
    await expect(page.getByTestId("observability-recommended-actions").getByText("Review channels", { exact: true })).toBeVisible();
    await expect(page.getByText("Delivery telemetry not available yet", { exact: true })).toBeVisible();
    await expect(page.getByText("Routing state only", { exact: true })).toBeVisible();

    await page.goto("/admin/observability/composition/tenant-1?filter_tenant_id=tenant-1&tenant_id=tenant-1");
    await expect(page).toHaveURL(/\/admin\/observability\/composition\/tenant-1/);
    await expect(page.getByTestId("observability-case-record")).toContainText("Composition state");
    await expect(page.getByTestId("observability-recommended-actions").getByText("Finish the rollout", { exact: true })).toBeVisible();
    await expect(page.getByTestId("observability-detail-context").getByText("Drifted solutions", { exact: true })).toBeVisible();
    await expect(page.getByText("driver_verification, appointment_booking", { exact: true })).toBeVisible();
    await expect(page.getByText("Release target mismatch", { exact: true })).toBeVisible();
  });
});
