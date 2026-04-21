import { test, expect } from "./harness";
import { isBuildEnabledSolution } from "./build-solutions";
import { primeSessionCookie } from "./session-helpers";

async function clickOverflowAction(
  page: import("@playwright/test").Page,
  callId: string,
  actionTestId: string,
) {
  await page.getByTestId(`call-ops-overflow-${callId}`).click();
  await page.getByTestId(actionTestId).click();
}

test.describe("call ops live", () => {
  test("client operator can run live call actions", async ({ page }) => {
    const activeCallsLog: string[] = [];
    const summaryLog: Array<{ limit: string | null }> = [];
    const tokenLog: string[] = [];
    const transcriptLog: string[] = [];
    const supportStreamLog: string[] = [];
    const takeoverLog: Array<{ callId: string; reason: string | null }> = [];
    const transferLog: Array<{ callId: string; reason: string | null }> = [];

    await primeSessionCookie(page, "client_operator");
    await page.addInitScript(() => {
      const scope = window as typeof window & {
        __clipboardWrites?: string[];
      };
      scope.__clipboardWrites = [];
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: (text: string) => {
            scope.__clipboardWrites?.push(text);
            return Promise.resolve();
          },
        },
      });
    });

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

    await page.route("**/api/platform/calls/active", async (route) => {
      activeCallsLog.push(route.request().method());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calls: [
            {
              call_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              workflow_id: "voice-call/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              run_id: "run-1",
              workflow_type: "grove.temporal.voice_call_workflow.VoiceCallWorkflow",
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/calls/observability-summary**", async (route) => {
      const url = new URL(route.request().url());
      summaryLog.push({ limit: url.searchParams.get("limit") });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          sampled_calls: 14,
          window_start: "2026-03-01T00:00:00Z",
          window_end: "2026-03-06T00:00:00Z",
          stack_comparisons: [
            {
              component: "llm",
              provider: "openai",
              model: "gpt-4.1-mini",
              language: "en",
              voice_id: null,
              voice_name: null,
              sample_count: 14,
              average_ms: 390,
              p95_ms: 620,
              max_ms: 910,
            },
            {
              component: "stt",
              provider: "deepgram",
              model: "nova-3",
              language: "en",
              voice_id: null,
              voice_name: null,
              sample_count: 14,
              average_ms: 210,
              p95_ms: 330,
              max_ms: 480,
            },
            {
              component: "tts",
              provider: "telnyx",
              model: null,
              language: "en",
              voice_id: "voice-1",
              voice_name: "Mila",
              sample_count: 14,
              average_ms: 260,
              p95_ms: 410,
              max_ms: 540,
            },
          ],
          route_hotspots: [
            {
              graph_type: "conversation",
              node_name: "triage",
              route: "booking_request",
              sample_count: 7,
              average_latency_ms: 640,
              p95_latency_ms: 910,
              max_latency_ms: 1300,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/calls/*/latency", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          source: "persisted_metadata",
          has_latency_data: true,
          turns: [],
          summaries: {
            llm_ttft_ms: { sample_count: 1, average_ms: 280, latest_ms: 280, max_ms: 280 },
            tts_ttfb_ms: { sample_count: 1, average_ms: 190, latest_ms: 190, max_ms: 190 },
            stt_finalize_delay_ms: { sample_count: 1, average_ms: 140, latest_ms: 140, max_ms: 140 },
            eot_to_agent_speak_ms: { sample_count: 1, average_ms: 510, latest_ms: 510, max_ms: 510 },
            eot_to_llm_start_ms: { sample_count: 1, average_ms: 210, latest_ms: 210, max_ms: 210 },
          },
          stack: {
            llm: { provider: "openai", model: "gpt-4.1-mini", language: "en", voice_id: null, voice_name: null },
            stt: { provider: "deepgram", model: "nova-3", language: "en", voice_id: null, voice_name: null },
            tts: { provider: "telnyx", model: null, language: "en", voice_id: "voice-1", voice_name: "Mila" },
          },
        }),
      });
    });

    await page.route("**/api/platform/calls/*/trace", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          has_trace_context: true,
          trace_context: {
            source: "call_metadata",
            correlation_id: "trace-call-123",
            traceparent: "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
            trace_id: "4bf92f3577b34da6a3ce929d0e0e4736",
            parent_span_id: "00f067aa0ba902b7",
            tracestate: "vendor=clinic",
          },
          event_count: 4,
          first_event_at_ms: 90,
          last_event_at_ms: 181,
          stack: {
            llm: { provider: "openai", model: "gpt-4.1-mini", language: "en", voice_id: null, voice_name: null },
            stt: { provider: "deepgram", model: "nova-3", language: "en", voice_id: null, voice_name: null },
            tts: { provider: "telnyx", model: null, language: "en", voice_id: "voice-1", voice_name: "Mila" },
          },
          nodes: [
            {
              graph_type: "voice",
              node_name: "greeting",
              started_at_ms: 100,
              completed_at_ms: 180,
              latency_ms: 80,
              ttft_ms: 45,
              route: "confirm",
              next_node_name: "confirmation",
              llm_roundtrips: 1,
              retry_count: 0,
              tools_called: ["lookup_weather"],
              prompt_tokens: 31,
              completion_tokens: 12,
            },
          ],
          routes: [
            {
              seq: 4,
              occurred_at_ms: 181,
              graph_type: "voice",
              node_name: "greeting",
              route: "confirm",
              next_node_name: "confirmation",
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/calls/*/livekit-token", async (route) => {
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/api\/platform\/calls\/([^/]+)\/livekit-token$/);
      const callId = match ? decodeURIComponent(match[1]) : "";
      tokenLog.push(`observe:${callId}`);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          room_name: `room-${callId}`,
          token: "observe-token",
          expires_at: "2026-03-05T12:00:00Z",
        }),
      });
    });

    await page.route("**/api/platform/calls/*/livekit-operator-token", async (route) => {
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/api\/platform\/calls\/([^/]+)\/livekit-operator-token$/);
      const callId = match ? decodeURIComponent(match[1]) : "";
      tokenLog.push(`talk:${callId}`);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          room_name: `room-${callId}`,
          token: "talk-token",
          expires_at: "2026-03-05T12:00:00Z",
        }),
      });
    });

    await page.route("**/api/platform/calls/*/transcript/stream**", async (route) => {
      const url = new URL(route.request().url());
      transcriptLog.push(url.searchParams.toString());
      const afterSeq = url.searchParams.get("after_seq");
      const nextSegment =
        afterSeq === "1"
          ? 'data: {"seq":2,"speaker":"Agent","timestamp":"2026-03-05T10:00:35Z","text":"I can help with that update."}'
          : 'data: {"seq":1,"speaker":"Driver","timestamp":"2026-03-05T10:00:00Z","text":"Need ETA update"}';
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: [
          "event: segment",
          nextSegment,
          "",
          "event: end",
          "data: {}",
          "",
        ].join("\n"),
      });
    });

    await page.route("**/api/platform/calls/*/ops/stream**", async (route) => {
      const url = new URL(route.request().url());
      supportStreamLog.push(url.searchParams.toString());
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: [
          "event: runtime_event",
          'data: {"seq":5,"event_type":"llm.first_token","occurred_at_ms":280,"summary":"Assistant began responding","created_at":"2026-03-05T10:00:01Z","payload":{"turn_index":0,"provider":"openai"}}',
          "",
          "event: runtime_event",
          'data: {"seq":6,"event_type":"langgraph.route.selected","occurred_at_ms":320,"summary":"Route booking_request selected from triage","created_at":"2026-03-05T10:00:02Z","payload":{"graph_type":"voice","node_name":"triage","route":"booking_request","next_node_name":"availability_check"}}',
          "",
          "event: runtime_event",
          'data: {"seq":7,"event_type":"call.escalation.transfer_requested","occurred_at_ms":540,"summary":"Agent requested immediate transfer to a human","created_at":"2026-03-05T10:00:03Z","payload":{"reason":"urgent_medical_need","reason_summary":"Caller reported chest pain.","priority":"urgent","transfer_immediately":true}}',
          "",
          "",
        ].join("\n"),
      });
    });

    await page.route("**/api/platform/calls/active/*/events", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          events: [
            {
              event_type: "call.escalation.transfer_requested",
              payload: {
                reason: "urgent_medical_need",
                priority: "urgent",
                transfer_immediately: true,
              },
              occurred_at: "2026-03-05T10:00:03Z",
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/calls/*/takeover", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const match = url.pathname.match(/\/api\/platform\/calls\/([^/]+)\/takeover$/);
      const callId = match ? decodeURIComponent(match[1]) : "";
      const payload = JSON.parse(request.postData() || "{}") as { reason?: string };
      takeoverLog.push({ callId, reason: payload.reason ?? null });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "accepted" }),
      });
    });

    await page.route("**/api/platform/calls/*/terminate-transfer", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const match = url.pathname.match(/\/api\/platform\/calls\/([^/]+)\/terminate-transfer$/);
      const callId = match ? decodeURIComponent(match[1]) : "";
      const payload = JSON.parse(request.postData() || "{}") as { reason?: string };
      transferLog.push({ callId, reason: payload.reason ?? null });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "accepted" }),
      });
    });

    await page.goto("/call-ops");
    await expect(page.getByRole("heading", { name: "Call Operations" })).toBeVisible();
    await expect(page.getByTestId("call-ops-summary-sampled")).toContainText("14 calls");
    await expect(page.getByTestId("call-ops-summary-card-llm")).toContainText("620 ms");
    await expect(page.getByTestId("call-ops-hotspot-0")).toContainText("booking_request");
    await expect(page.getByTestId("call-ops-call-id-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).toBeVisible();

    await clickOverflowAction(
      page,
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "call-ops-support-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    );
    await expect(page.getByTestId("call-ops-support-modal")).toBeVisible();
    await expect(page.getByTestId("call-ops-support-guidance")).toContainText("Urgent transfer is already in flight");
    await expect(page.getByTestId("call-ops-support-guidance")).toContainText("Join the call now.");
    await expect(page.getByTestId("call-ops-support-feed")).toBeVisible();
    await expect(page.getByTestId("call-ops-support-item-segment-1")).toContainText("Need ETA update");
    await expect(page.getByTestId("call-ops-support-summary-llm_ttft_ms")).toContainText("280 ms");
    await expect(page.getByTestId("call-ops-support-stack-llm")).toContainText("gpt-4.1-mini");
    await expect(page.getByTestId("call-ops-support-item-route-4")).toContainText("confirm");
    await expect(page.getByTestId("call-ops-support-node-0")).toContainText("greeting");
    await expect(page.getByTestId("call-ops-support-item-event-6")).toContainText("booking_request");
    await expect(page.getByTestId("call-ops-support-item-event-7")).toContainText("Urgent transfer requested");
    await expect(page.getByTestId("call-ops-support-item-event-7")).toContainText("Reason: Urgent medical need");
    await expect(page.getByTestId("call-ops-support-item-event-7")).toContainText("Urgency: Urgent");
    if (isBuildEnabledSolution("appointment_booking")) {
      await expect(page.getByTestId("call-ops-open-bookings")).toHaveAttribute(
        "href",
        "/bookings?call_id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&source=live-support#clinic-selected-case",
      );
    } else {
      await expect(page.getByTestId("call-ops-bookings-unavailable")).toContainText(
        "Clinic bookings are not part of this deployment.",
      );
      await expect(page.getByTestId("call-ops-open-bookings")).toHaveCount(0);
    }
    await page.getByRole("button", { name: "Close" }).click();

    await clickOverflowAction(
      page,
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "call-ops-observe-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    );
    await clickOverflowAction(
      page,
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "call-ops-talk-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    );
    await clickOverflowAction(
      page,
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "call-ops-transcript-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    );
    await page.getByTestId("call-ops-claim-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").click();
    await expect(page.getByTestId("call-ops-escalation-modal")).toBeVisible();
    await page.getByTestId("call-ops-escalation-reason").fill("Escalation needed");
    await page.getByTestId("call-ops-escalation-confirm").click();

    await page.getByTestId("call-ops-terminate-transfer-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").click();
    await expect(page.getByTestId("call-ops-escalation-modal")).toBeVisible();
    await page.getByTestId("call-ops-escalation-reason").fill("Urgent transfer");
    await page.getByTestId("call-ops-escalation-confirm").click();

    await expect(page.getByTestId("call-ops-segment-1")).toContainText("Need ETA update");
    await expect(page.getByTestId("call-ops-segment-2")).toContainText("I can help with that update.");

    await expect
      .poll(() =>
        page.evaluate(() => {
          const scope = window as typeof window & {
            __clipboardWrites?: string[];
          };
          return {
            clipboard: scope.__clipboardWrites ?? [],
          };
        }),
      )
      .toMatchObject({
        clipboard: ["observe-token", "talk-token"],
      });

    expect(activeCallsLog.length).toBeGreaterThanOrEqual(1);
    expect(summaryLog.length).toBeGreaterThanOrEqual(1);
    expect(summaryLog.every((entry) => entry.limit === "200")).toBe(true);
    expect(tokenLog).toEqual([
      "observe:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "talk:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    ]);
    expect(transcriptLog.length).toBeGreaterThanOrEqual(3);
    expect(transcriptLog.some((entry) => entry.includes("after_seq=0"))).toBe(true);
    expect(transcriptLog.some((entry) => entry.includes("after_seq=1"))).toBe(true);
    expect(supportStreamLog.length).toBeGreaterThanOrEqual(1);
    expect(supportStreamLog[0]).toContain("after_seq=0");
    expect(takeoverLog).toEqual([
      {
        callId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        reason: "Escalation needed",
      },
    ]);
    expect(transferLog).toEqual([
      {
        callId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        reason: "Urgent transfer",
      },
    ]);
  });

  test("bookings handoff stays hidden when the tenant does not have clinic bookings enabled", async ({ page }) => {
    test.skip(!isBuildEnabledSolution("appointment_booking"), "This assertion only applies when bookings ship in the build.");

    await primeSessionCookie(page, "client_operator");

    await page.route("**/api/platform/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: false,
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

    await page.route("**/api/platform/calls/active", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calls: [
            {
              call_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              workflow_id: "voice-call/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              run_id: "run-disabled",
              workflow_type: "grove.temporal.voice_call_workflow.VoiceCallWorkflow",
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
          sampled_calls: 1,
          window_start: "2026-03-01T00:00:00Z",
          window_end: "2026-03-06T00:00:00Z",
          stack_comparisons: [],
          route_hotspots: [],
        }),
      });
    });

    await page.route("**/api/platform/calls/*/latency", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
          source: "persisted_metadata",
          has_latency_data: false,
          turns: [],
          summaries: {},
          stack: null,
        }),
      });
    });

    await page.route("**/api/platform/calls/*/trace", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
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

    await page.route("**/api/platform/calls/*/ops/stream**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: ["event: end", "data: {}", "", ""].join("\n"),
      });
    });

    await page.route("**/api/platform/calls/*/transcript/stream**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: ["event: end", "data: {}", "", ""].join("\n"),
      });
    });

    await page.route("**/api/platform/calls/active/*/events", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ events: [] }),
      });
    });

    await page.goto("/call-ops");
    await expect(page.getByRole("heading", { name: "Call Operations" })).toBeVisible();
    await expect(page.getByTestId("call-ops-call-id-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")).toBeVisible();

    await clickOverflowAction(
      page,
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      "call-ops-support-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    );

    await expect(page.getByTestId("call-ops-support-modal")).toBeVisible();
    await expect(page.getByTestId("call-ops-support-guidance")).toContainText(
      "This tenant does not have the bookings workspace enabled.",
    );
    await expect(page.getByTestId("call-ops-bookings-unavailable")).toContainText("Bookings are not enabled for this tenant.");
    await expect(page.getByTestId("call-ops-open-bookings")).toHaveCount(0);
  });
});
