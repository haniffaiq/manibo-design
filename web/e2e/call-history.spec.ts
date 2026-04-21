import { test, expect } from "./harness";
import { primeSessionCookie } from "./session-helpers";

test.describe("call history", () => {
  test("client admin can filter calls, inspect detail, open technical view, and open recording link", async ({ page }) => {
    const callsQueryLog: string[] = [];
    const detailLog: string[] = [];
    const eventLog: Array<{ callId: string; limit: string | null }> = [];
    const latencyLog: string[] = [];
    const traceLog: string[] = [];
    const signedUrlLog: Array<{ recordingId: string; expiresInSeconds: number }> = [];

    await primeSessionCookie(page, "client_admin");
    await page.addInitScript(() => {
      (window as typeof window & { __openedUrls?: string[] }).__openedUrls = [];
      window.open = ((url?: string | URL | undefined | null) => {
        const value = typeof url === "string" ? url : url?.toString() ?? "";
        (window as typeof window & { __openedUrls?: string[] }).__openedUrls?.push(value);
        return null;
      }) as typeof window.open;
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

    await page.route("**/api/platform/calls?**", async (route) => {
      const url = new URL(route.request().url());
      callsQueryLog.push(url.searchParams.toString());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calls: [
            {
              id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              direction: "inbound",
              state: "completed",
              outcome: "resolved",
              caller_number: "+37060000001",
              callee_number: "+37060000002",
              started_at: "2026-03-05T09:00:00Z",
              ended_at: "2026-03-05T09:02:00Z",
              duration_seconds: 120,
              created_at: "2026-03-05T09:00:00Z",
              updated_at: "2026-03-05T09:02:00Z",
              metadata: { contact_id: "driver-001" },
              quality_score: {
                overall: 0.82,
                clarity: 0.9,
                resolution: 0.78,
                sentiment: 0.8,
              },
              needs_human_review: false,
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }),
      });
    });

    await page.route("**/api/platform/calls/*/events**", async (route) => {
      const request = route.request();
      if (request.method() !== "GET") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }

      const url = new URL(request.url());
      const match = url.pathname.match(/\/api\/platform\/calls\/([^/]+)\/events$/);
      const callId = match ? decodeURIComponent(match[1]) : "";
      eventLog.push({ callId, limit: url.searchParams.get("limit") });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: callId,
          events: [
            {
              seq: 1,
              event_type: "llm.started",
              occurred_at_ms: 130,
              summary: "Assistant started thinking",
              created_at: "2026-03-05T09:00:05Z",
              payload: { turn_index: 0 },
            },
            {
              seq: 2,
              event_type: "tts.first_byte",
              occurred_at_ms: 490,
              summary: "Speech started playing",
              created_at: "2026-03-05T09:00:05Z",
              payload: { turn_index: 0, provider: "telnyx" },
            },
            {
              seq: 3,
              event_type: "call.escalation.transfer_failed",
              occurred_at_ms: 1200,
              summary: "Immediate transfer failed; operator still needs to join manually",
              created_at: "2026-03-05T09:00:09Z",
              payload: {
                reason: "urgent_medical_need",
                reason_summary: "Caller reported chest pain.",
                priority: "urgent",
                transfer_immediately: true,
              },
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/calls/*/latency", async (route) => {
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/api\/platform\/calls\/([^/]+)\/latency$/);
      const callId = match ? decodeURIComponent(match[1]) : "";
      latencyLog.push(callId);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: callId,
          source: "persisted_metadata",
          has_latency_data: true,
          turns: [],
          summaries: {
            llm_ttft_ms: { sample_count: 1, average_ms: 420, latest_ms: 420, max_ms: 420 },
            tts_ttfb_ms: { sample_count: 1, average_ms: 310, latest_ms: 310, max_ms: 310 },
            stt_finalize_delay_ms: { sample_count: 1, average_ms: 260, latest_ms: 260, max_ms: 260 },
            eot_to_agent_speak_ms: { sample_count: 1, average_ms: 980, latest_ms: 980, max_ms: 980 },
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
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/api\/platform\/calls\/([^/]+)\/trace$/);
      const callId = match ? decodeURIComponent(match[1]) : "";
      traceLog.push(callId);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: callId,
          has_trace_context: true,
          trace_context: {
            source: "call_metadata",
            correlation_id: "corr-123",
            traceparent: "00-123-456-01",
            trace_id: "trace-123",
            parent_span_id: "span-456",
            tracestate: null,
          },
          event_count: 8,
          first_event_at_ms: 100,
          last_event_at_ms: 3000,
          stack: {
            llm: { provider: "openai", model: "gpt-4.1-mini", language: "en", voice_id: null, voice_name: null },
            stt: { provider: "deepgram", model: "nova-3", language: "en", voice_id: null, voice_name: null },
            tts: { provider: "telnyx", model: null, language: "en", voice_id: "voice-1", voice_name: "Mila" },
          },
          routes: [
            {
              seq: 4,
              occurred_at_ms: 730,
              graph_type: "conversation",
              node_name: "triage",
              route: "booking_request",
              next_node_name: "availability",
            },
          ],
          nodes: [
            {
              graph_type: "conversation",
              node_name: "triage",
              started_at_ms: 200,
              completed_at_ms: 900,
              latency_ms: 700,
              ttft_ms: 420,
              route: "booking_request",
              next_node_name: "availability",
              llm_roundtrips: 1,
              retry_count: 0,
              tools_called: ["lookup_clinic_slots"],
              prompt_tokens: 120,
              completion_tokens: 34,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/calls/*", async (route) => {
      const request = route.request();
      if (request.method() !== "GET") {
        await route.fulfill({
          status: 405,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Method not allowed" }),
        });
        return;
      }
      const url = new URL(request.url());
      const match = url.pathname.match(/\/api\/platform\/calls\/([^/]+)$/);
      const callId = match ? decodeURIComponent(match[1]) : "";
      detailLog.push(callId);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call: {
            id: callId,
            direction: "inbound",
            state: "completed",
            outcome: "resolved",
            caller_number: "+37060000001",
            callee_number: "+37060000002",
            started_at: "2026-03-05T09:00:00Z",
            ended_at: "2026-03-05T09:02:00Z",
            duration_seconds: 120,
            created_at: "2026-03-05T09:00:00Z",
            updated_at: "2026-03-05T09:02:00Z",
            metadata: { contact_id: "driver-001" },
            quality_score: {
              overall: 0.82,
              clarity: 0.9,
              resolution: 0.78,
              sentiment: 0.8,
            },
            needs_human_review: false,
          },
          transcript: {
            language: "en",
            full_text: "Driver: Arrival in 15 minutes.\nAgent: Confirmed and recorded.",
          },
          recordings: [
            {
              id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              status: "ready",
              created_at: "2026-03-05T09:02:05Z",
              signed_url_path: "/recordings/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/signed-url",
            },
          ],
          has_more: { transcript: false, recordings: false },
        }),
      });
    });

    await page.route("**/api/platform/recordings/*/signed-url?**", async (route) => {
      const url = new URL(route.request().url());
      const match = url.pathname.match(/\/api\/platform\/recordings\/([^/]+)\/signed-url$/);
      const recordingId = match ? decodeURIComponent(match[1]) : "";
      signedUrlLog.push({
        recordingId,
        expiresInSeconds: Number(url.searchParams.get("expires_in_seconds") || "0"),
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: "https://recordings.example.com/signed/recording.wav",
          expires_in_seconds: 3600,
        }),
      });
    });

    await page.goto("/call-ops/history");
    await expect(page.getByRole("heading", { name: "Call History" })).toBeVisible();

    await page.getByTestId("call-history-filter-driver-id").fill("driver-001");
    await page.getByTestId("call-history-filter-phone").fill("+37060000001");
    await page.getByTestId("call-history-filter-outcome").selectOption("resolved");
    await page.getByTestId("call-history-filter-started-after").fill("2026-03-05T09:00");
    await page.getByTestId("call-history-filter-started-before").fill("2026-03-05T10:00");
    await page.getByTestId("call-history-search-submit").click();

    await expect(page.getByTestId("call-history-detail-open-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")).toBeVisible();
    await page.getByTestId("call-history-detail-open-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa").click();

    await expect(page.getByTestId("call-history-detail")).toBeVisible();
    await expect(page.getByTestId("call-history-session-feed")).toBeVisible();
    await expect(page.getByTestId("call-history-session-item-transcript")).toContainText("Saved conversation transcript");
    await expect(page.getByTestId("call-history-session-item-transcript")).toContainText("Driver: Arrival in 15 minutes.");
    await expect(page.getByTestId("call-history-session-item-event-1")).toContainText("Assistant started thinking");
    await expect(page.getByTestId("call-history-session-item-event-2")).toContainText("Speech started playing");
    await expect(page.getByTestId("call-history-session-item-event-2")).toContainText("Provider: telnyx");
    await expect(page.getByTestId("call-history-session-item-event-3")).toContainText("Urgent transfer failed; join manually");
    await expect(page.getByTestId("call-history-session-item-event-3")).toContainText("Reason: Urgent medical need");
    await expect(page.getByTestId("call-history-session-item-event-3")).toContainText("Urgency: Urgent");
    await expect(page.getByTestId("call-history-session-item-route-4")).toContainText("booking_request");

    await page.getByTestId("call-history-open-technical-details").click();
    await expect(page.getByTestId("call-history-technical-modal")).toBeVisible();
    await expect(page.getByTestId("call-history-technical-summary-llm_ttft_ms")).toContainText("420 ms");
    await expect(page.getByTestId("call-history-technical-stack-llm")).toContainText("openai");
    await expect(page.getByTestId("call-history-trace-route-4")).toContainText("booking_request");
    await expect(page.getByTestId("call-history-trace-node-0")).toContainText("lookup_clinic_slots");
    await page.getByTestId("call-history-trace-context").click();
    await expect(page.getByTestId("call-history-trace-context")).toContainText("trace-123");
    await page.getByLabel("Close").click();

    await page.getByTestId("call-history-recording-open-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb").click();
    await expect(page.getByTestId("call-history-notice")).toContainText("Recording URL opened");

    await expect
      .poll(() =>
        page.evaluate(() => {
          return (window as typeof window & { __openedUrls?: string[] }).__openedUrls ?? [];
        }),
      )
      .toContain("https://recordings.example.com/signed/recording.wav");

    expect(callsQueryLog).toHaveLength(1);
    expect(callsQueryLog[0]).toContain("driver_id=driver-001");
    expect(callsQueryLog[0]).toContain("phone=%2B37060000001");
    expect(callsQueryLog[0]).toContain("outcome=resolved");
    expect(callsQueryLog[0]).toContain("started_after=");
    expect(callsQueryLog[0]).toContain("started_before=");
    expect(detailLog).toEqual(["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]);
    expect(eventLog).toEqual([{ callId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", limit: "200" }]);
    expect(latencyLog).toEqual(["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]);
    expect(traceLog).toEqual(["aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]);
    expect(signedUrlLog).toEqual([
      {
        recordingId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        expiresInSeconds: 3600,
      },
    ]);
  });

  test.describe("deep-linked call detail retries after an initial fetch failure", () => {
    test.use({
      allowConsoleErrors: [/503 \(Service Unavailable\)/],
      allowRequestFailures: [/\/api\/platform\/calls\/call-1$/],
    });

    test("deep-linked call detail retries after an initial fetch failure", async ({ page }) => {
      let detailAttempts = 0;

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

    await page.route("**/api/platform/calls?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calls: [
            {
              id: "call-1",
              direction: "inbound",
              state: "completed",
              outcome: "resolved",
              caller_number: "+37060000001",
              callee_number: "+37060000002",
              started_at: "2026-03-05T09:00:00Z",
              ended_at: "2026-03-05T09:02:00Z",
              duration_seconds: 120,
              created_at: "2026-03-05T09:00:00Z",
              updated_at: "2026-03-05T09:02:00Z",
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
          routes: [],
          nodes: [],
        }),
      });
    });

    await page.route("**/api/platform/calls/call-1", async (route) => {
      detailAttempts += 1;
      if (detailAttempts === 1) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Temporary backend warm-up" }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call: {
            id: "call-1",
            direction: "inbound",
            state: "completed",
            outcome: "resolved",
            caller_number: "+37060000001",
            callee_number: "+37060000002",
            started_at: "2026-03-05T09:00:00Z",
            ended_at: "2026-03-05T09:02:00Z",
            duration_seconds: 120,
            created_at: "2026-03-05T09:00:00Z",
            updated_at: "2026-03-05T09:02:00Z",
            metadata: {},
            quality_score: null,
            needs_human_review: false,
          },
          transcript: {
            language: "en",
            full_text: "Caller: I need to move the visit.\nAgent: I will ask the clinic to call you back.",
          },
          recordings: [],
          has_more: { transcript: false, recordings: false },
        }),
      });
    });

      await page.goto("/call-ops/history?call_id=call-1");
      await expect(page.getByTestId("call-history-detail")).toBeVisible({ timeout: 15000 });
      await expect(page.getByTestId("call-history-session-item-transcript")).toContainText(
        "I need to move the visit.",
        { timeout: 15000 },
      );
      expect(detailAttempts).toBeGreaterThanOrEqual(2);
    });
  });

  test("same-call deep link can reopen the technical drawer", async ({ page }) => {
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

    await page.route("**/api/platform/calls?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calls: [
            {
              id: "call-1",
              direction: "inbound",
              state: "completed",
              outcome: "resolved",
              caller_number: "+37060000001",
              callee_number: "+37060000002",
              started_at: "2026-03-05T09:00:00Z",
              ended_at: "2026-03-05T09:02:00Z",
              duration_seconds: 120,
              created_at: "2026-03-05T09:00:00Z",
              updated_at: "2026-03-05T09:02:00Z",
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
            direction: "inbound",
            state: "completed",
            outcome: "resolved",
            caller_number: "+37060000001",
            callee_number: "+37060000002",
            started_at: "2026-03-05T09:00:00Z",
            ended_at: "2026-03-05T09:02:00Z",
            duration_seconds: 120,
            created_at: "2026-03-05T09:00:00Z",
            updated_at: "2026-03-05T09:02:00Z",
            metadata: {},
            quality_score: null,
            needs_human_review: false,
          },
          transcript: {
            language: "en",
            full_text: "Caller: I need to move the visit.\nAgent: I will ask the clinic to call you back.",
          },
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
          has_trace_context: true,
          trace_context: {
            source: "call_metadata",
            correlation_id: "corr-123",
            traceparent: "00-123-456-01",
            trace_id: "trace-123",
            parent_span_id: "span-456",
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

    await page.route("**/api/platform/calls/call-1/latency", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "call-1",
          source: "persisted_metadata",
          has_latency_data: true,
          turns: [],
          summaries: {
            llm_ttft_ms: { sample_count: 1, average_ms: 420, latest_ms: 420, max_ms: 420 },
          },
          stack: {
            llm: { provider: "openai", model: "gpt-4.1-mini", language: "en", voice_id: null, voice_name: null },
            stt: null,
            tts: null,
          },
        }),
      });
    });

    await page.goto("/call-ops/history?call_id=call-1");
    await expect(page.getByTestId("call-history-detail")).toBeVisible();

    await page.evaluate(() => {
      window.history.pushState({}, "", "/call-ops/history?call_id=call-1&technical=1");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    await expect(page.getByTestId("call-history-technical-modal")).toBeVisible();
    await expect(page.getByTestId("call-history-technical-summary-llm_ttft_ms")).toContainText("420 ms");
  });

  test.describe("failed technical deep links settle on one error instead of retrying forever", () => {
    test.use({
      allowConsoleErrors: [/503 \(Service Unavailable\)/],
      allowRequestFailures: [/\/api\/platform\/calls\/call-1\/latency$/],
    });

    test("failed technical deep links settle on one error instead of retrying forever", async ({ page }) => {
      let latencyAttempts = 0;

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

    await page.route("**/api/platform/calls?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          calls: [
            {
              id: "call-1",
              direction: "inbound",
              state: "completed",
              outcome: "resolved",
              caller_number: "+37060000001",
              callee_number: "+37060000002",
              started_at: "2026-03-05T09:00:00Z",
              ended_at: "2026-03-05T09:02:00Z",
              duration_seconds: 120,
              created_at: "2026-03-05T09:00:00Z",
              updated_at: "2026-03-05T09:02:00Z",
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
            direction: "inbound",
            state: "completed",
            outcome: "resolved",
            caller_number: "+37060000001",
            callee_number: "+37060000002",
            started_at: "2026-03-05T09:00:00Z",
            ended_at: "2026-03-05T09:02:00Z",
            duration_seconds: 120,
            created_at: "2026-03-05T09:00:00Z",
            updated_at: "2026-03-05T09:02:00Z",
            metadata: {},
            quality_score: null,
            needs_human_review: false,
          },
          transcript: {
            language: "en",
            full_text: "Caller: I need to move the visit.\nAgent: I will ask the clinic to call you back.",
          },
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
          has_trace_context: true,
          trace_context: {
            source: "call_metadata",
            correlation_id: "corr-123",
            traceparent: "00-123-456-01",
            trace_id: "trace-123",
            parent_span_id: "span-456",
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

    await page.route("**/api/platform/calls/call-1/latency", async (route) => {
      latencyAttempts += 1;
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Latency backend warming up" }),
      });
    });

      await page.goto("/call-ops/history?call_id=call-1&technical=1");
      await expect(page.getByText("Latency backend warming up")).toBeVisible();
      await expect(page.getByTestId("call-history-technical-modal")).toBeVisible();
      await page.waitForTimeout(1000);
      expect(latencyAttempts).toBe(1);
    });
  });
});
