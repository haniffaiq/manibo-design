import { expect } from "@playwright/test";

import { test } from "./harness";
import { primeSessionCookie } from "./session-helpers";

const TEST_TENANT_ID = "22222222-2222-2222-2222-222222222222";
const TEST_DEFINITION_ID = "adef-1111-2222-3333-444444444444";

type StubVersionsResponse = Array<{
  id: string;
  agent_definition_id: string;
  tenant_id: string;
  version: number;
  status: string;
  source_yaml: string;
  source_yaml_hash: string;
  compiled_hash: string;
  created_at: string;
  published_at?: string | null;
}>;

type StubCallLatencyResponse = {
  call_id: string;
  source: "persisted_metadata";
  has_latency_data: boolean;
  turns: Array<{
    turn_index: number;
    user_speech_started_at_ms: number | null;
    user_speech_ended_at_ms: number | null;
    user_final_transcript_at_ms: number | null;
    user_final_transcript_chars: number | null;
    stt_duration_ms: number | null;
    llm_start_at_ms: number | null;
    llm_ttft_at_ms: number | null;
    llm_duration_ms: number | null;
    agent_speaking_started_at_ms: number | null;
    agent_speaking_ended_at_ms: number | null;
    tts_ttfb_ms: number | null;
    tts_duration_ms: number | null;
    stt_finalize_delay_ms: number | null;
    eot_to_llm_start_ms: number | null;
    llm_ttft_ms: number | null;
    eot_to_agent_speak_ms: number | null;
    first_speech_latency_ms: number | null;
    tts_pre_speech_gap_ms: number | null;
    user_interrupted_agent: boolean;
    interruption_started_at_ms: number | null;
    agent_stop_after_interrupt_ms: number | null;
    speech_overlap_duration_ms: number | null;
    tool_executions: Array<{
      tool_name: string;
      duration_ms: number | null;
      status: string;
      error_detail: string | null;
    }>;
  }>;
  summaries: Record<
    string,
    {
      sample_count: number;
      average_ms: number | null;
      latest_ms: number | null;
      max_ms: number | null;
    }
  >;
  stack: {
    llm: {
      provider: string | null;
      model: string | null;
      language: string | null;
      voice_id: string | null;
      voice_name: string | null;
    } | null;
    stt: {
      provider: string | null;
      model: string | null;
      language: string | null;
      voice_id: string | null;
      voice_name: string | null;
    } | null;
    tts: {
      provider: string | null;
      model: string | null;
      language: string | null;
      voice_id: string | null;
      voice_name: string | null;
    } | null;
  } | null;
};

const EMPTY_CALL_LATENCY_RESPONSE: StubCallLatencyResponse = {
  call_id: "call-test-7f2b9c1d",
  source: "persisted_metadata",
  has_latency_data: false,
  turns: [],
  summaries: {},
  stack: null,
};

const DEFAULT_TEST_HISTORY = [
  {
    call_id: "call-prev-0001",
    started_at: "2026-03-29T08:15:00Z",
    duration_seconds: 42,
    outcome: "completed",
    agent_definition_version: 3,
    agent_definition_name: "clinic-registrator",
    compiled_hash: "def456abc789",
  },
];

async function installFakeBrowserVoiceRoom(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const scope = window as typeof window & {
      __testVoiceEvents?: unknown[];
      __GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__?: () => unknown;
    };

    scope.__testVoiceEvents = [];
    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: { getUserMedia: async () => ({}) },
      });
    }

    scope.__GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__ = () => {
      const listeners = new Set<{
        onStateChange?: (state: "connected" | "disconnected" | "reconnecting") => void;
        onDisconnected?: (reason?: string) => void;
      }>();

      return {
        name: "test-voice-room-abc",
        canPlaybackAudio: true,
        subscribe(events: {
          onStateChange?: (state: "connected" | "disconnected" | "reconnecting") => void;
          onDisconnected?: (reason?: string) => void;
        }) {
          listeners.add(events);
          return () => listeners.delete(events);
        },
        async connect(url: string, token: string) {
          scope.__testVoiceEvents?.push({ type: "connect", url, token });
          listeners.forEach((listener) => listener.onStateChange?.("connected"));
        },
        async startAudio() {
          scope.__testVoiceEvents?.push({ type: "startAudio" });
        },
        async setMicrophoneEnabled(enabled: boolean) {
          scope.__testVoiceEvents?.push({ type: "microphone", enabled });
        },
        disconnect() {
          scope.__testVoiceEvents?.push({ type: "disconnect" });
          listeners.forEach((listener) => listener.onDisconnected?.());
        },
      };
    };
  });
}

async function stubTestWorkbenchApis(
  page: import("@playwright/test").Page,
  options?: {
    versions?: StubVersionsResponse;
    transcriptStreamBody?: string;
    opsStreamBody?: string;
    callLatencyResponse?: StubCallLatencyResponse;
    cleanupLog?: string[];
    testHistoryRequestLog?: string[];
    testHistoryResponse?: Array<{
      call_id: string;
      started_at: string | null;
      duration_seconds: number | null;
      outcome: string | null;
      agent_definition_version: number | null;
      agent_definition_name: string | null;
      compiled_hash: string | null;
    }>;
  },
) {
  await page.route("**/api/platform/admin/platform-defaults", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          version: "clinic_default_v1",
          config_yaml_hash: "cfg-hash-1",
          created_by: "11111111-1111-1111-1111-111111111111",
          created_at: "2026-03-26T06:00:00Z",
        },
      ]),
    });
  });

  await page.route("**/api/platform/admin/agent-starters", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route(`**/api/platform/admin/tenants/${TEST_TENANT_ID}/solutions`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        solutions: [
          {
            solution_name: "appointment_booking",
            enabled: true,
            version: "1.0.0",
            description: "Clinic booking workspace.",
            requires_enabled: [],
            optional_enabled: [],
            desired_revision: "latest",
            active_revision: "2026-03-01",
          },
        ],
      }),
    });
  });

  await page.route(`**/api/platform/admin/tenants/${TEST_TENANT_ID}/agent-definitions/${TEST_DEFINITION_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: TEST_DEFINITION_ID,
        tenant_id: TEST_TENANT_ID,
        name: "clinic-registrator",
        status: "published",
        published_version: 2,
        created_at: "2026-03-20T10:00:00Z",
        updated_at: "2026-03-26T08:00:00Z",
      }),
    });
  });

  await page.route(`**/api/platform/admin/tenants/${TEST_TENANT_ID}/agent-definitions/${TEST_DEFINITION_ID}/versions`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        options?.versions ?? [
          {
            id: "ver-001",
            agent_definition_id: TEST_DEFINITION_ID,
            tenant_id: TEST_TENANT_ID,
            version: 3,
            status: "draft",
            source_yaml: "name: clinic-registrator",
            source_yaml_hash: "abc123",
            compiled_hash: "def456abc789",
            created_at: "2026-03-26T07:00:00Z",
          },
          {
            id: "ver-002",
            agent_definition_id: TEST_DEFINITION_ID,
            tenant_id: TEST_TENANT_ID,
            version: 2,
            status: "published",
            source_yaml: "name: clinic-registrator",
            source_yaml_hash: "aaa111",
            compiled_hash: "bbb222",
            published_at: "2026-03-25T10:00:00Z",
            created_at: "2026-03-25T09:00:00Z",
          },
        ],
      ),
    });
  });

  await page.route(
    `**/api/platform/admin/tenants/${TEST_TENANT_ID}/phone-channels?agent_definition_id=${TEST_DEFINITION_ID}`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ phone_numbers: [] }),
      });
    },
  );

  await page.route(`**/api/platform/admin/tenants/${TEST_TENANT_ID}/calls/browser-session`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        room_name: "test-voice-room-abc",
        token: "test-jwt-token",
        connect_url: "wss://voice.example.com",
        call_id: "call-test-7f2b9c1d",
        agent_definition_version: 3,
        agent_definition_name: "clinic-registrator",
        compiled_hash: "def456abc789",
        expires_at: "2026-03-26T12:00:00Z",
      }),
    });
  });

  await page.route(
    new RegExp(`/api/platform/admin/tenants/${TEST_TENANT_ID}/calls/browser-session/([^/?]+)$`),
    async (route) => {
      const url = new URL(route.request().url());
      const callId = url.pathname.split("/").at(-1) ?? "";
      options?.cleanupLog?.push(callId);
      await route.fulfill({
        status: 204,
        body: "",
      });
    },
  );

  await page.route(`**/api/platform/admin/tenants/${TEST_TENANT_ID}/calls/test-history**`, async (route) => {
    const url = new URL(route.request().url());
    options?.testHistoryRequestLog?.push(url.searchParams.get("compiled_hash") ?? "");
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(options?.testHistoryResponse ?? DEFAULT_TEST_HISTORY),
    });
  });

  // Stub SSE streams — return empty and close so the hook doesn't error
  await page.route(/\/api\/platform(?:\/admin\/tenants\/[^/]+)?\/calls\/call-test-7f2b9c1d\/transcript\/stream(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: options?.transcriptStreamBody ?? "event: end\ndata: {}\n\n",
    });
  });

  await page.route(/\/api\/platform(?:\/admin\/tenants\/[^/]+)?\/calls\/call-test-7f2b9c1d\/ops\/stream(?:\?.*)?$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: options?.opsStreamBody ?? "event: end\ndata: {}\n\n",
    });
  });

  await page.route(/\/api\/platform(?:\/admin\/tenants\/[^/]+)?\/calls\/active\/call-test-7f2b9c1d\/events$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ events: [] }),
    });
  });

  await page.route(
    new RegExp(`/api/platform/admin/tenants/${TEST_TENANT_ID}/calls/call-test-7f2b9c1d/latency(?:\\?.*)?$`),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(options?.callLatencyResponse ?? EMPTY_CALL_LATENCY_RESPONSE),
      });
    },
  );

  await page.route(
    new RegExp(`/api/platform/admin/tenants/${TEST_TENANT_ID}/calls/call-test-7f2b9c1d/trace(?:\\?.*)?$`),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "call-test-7f2b9c1d",
          has_trace_context: false,
          trace_context: { source: "none", correlation_id: null, traceparent: null, trace_id: null, parent_span_id: null, tracestate: null },
          event_count: 0,
          first_event_at_ms: null,
          last_event_at_ms: null,
          stack: null,
          nodes: [],
          routes: [],
        }),
      });
    },
  );

  await page.route(
    new RegExp(`/api/platform/admin/tenants/${TEST_TENANT_ID}/calls/call-prev-0001/latency(?:\\?.*)?$`),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          ...EMPTY_CALL_LATENCY_RESPONSE,
          call_id: "call-prev-0001",
        }),
      });
    },
  );

  await page.route(
    new RegExp(`/api/platform/admin/tenants/${TEST_TENANT_ID}/calls/call-prev-0001/trace(?:\\?.*)?$`),
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "call-prev-0001",
          has_trace_context: false,
          trace_context: { source: "none", correlation_id: null, traceparent: null, trace_id: null, parent_span_id: null, tracestate: null },
          event_count: 0,
          first_event_at_ms: null,
          last_event_at_ms: null,
          stack: null,
          nodes: [],
          routes: [],
        }),
      });
    },
  );
}

function workbenchUrl(): string {
  return `/admin/agent-definitions/${TEST_DEFINITION_ID}/test?tenant_id=${TEST_TENANT_ID}`;
}

test.describe("agent test workbench", () => {
  test("renders workbench page with agent definition context", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page);

    await page.goto(workbenchUrl());

    await expect(page.getByText("Test Workbench")).toBeVisible();
    await expect(page.getByRole("link", { name: "clinic-registrator" })).toBeVisible();
    await expect(page.locator("#test-version-select")).toBeVisible();
    await expect(page.getByTestId("browser-voice-start")).toBeVisible();
  });

  test("start, mute, and end a voice session", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page);

    await page.goto(workbenchUrl());

    // Idle state
    await expect(page.getByTestId("browser-voice-state")).toContainText("Ready");

    // Start
    await page.getByTestId("browser-voice-start").click();
    await expect(page.getByTestId("browser-voice-state")).toContainText("Live");
    await expect(page.getByTestId("browser-voice-room")).toContainText("test-voice-room-abc");

    // Mute
    await page.getByTestId("browser-voice-mute").click();
    await expect(page.getByTestId("browser-voice-state")).toContainText(/muted/i);

    // End
    await page.getByTestId("browser-voice-end").click();
    await expect(page.getByTestId("browser-voice-ended")).toBeVisible();

    // Verify voice room events
    const events = await page.evaluate(() => {
      const scope = window as typeof window & { __testVoiceEvents?: unknown[] };
      return scope.__testVoiceEvents ?? [];
    });
    expect(events).toEqual([
      { type: "connect", url: "wss://voice.example.com", token: "test-jwt-token" },
      { type: "startAudio" },
      { type: "microphone", enabled: true },
      { type: "microphone", enabled: false },
      { type: "disconnect" },
    ]);
  });

  test("call context panel shows agent metadata during active session", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page);

    await page.goto(workbenchUrl());

    // Before start — no context
    await expect(page.getByText("Start a session to see context.")).toBeVisible();

    // Start session
    await page.getByTestId("browser-voice-start").click();
    await expect(page.getByTestId("browser-voice-state")).toContainText("Live");

    // Context row shows metadata
    await expect(page.getByTestId("call-context-name")).toContainText("clinic-registrator");
    await expect(page.getByTestId("call-context-version")).toContainText("v3");
    await expect(page.getByText("def456abc789".slice(0, 8))).toBeVisible();
    await expect(page.getByTestId("call-context-call-id")).toContainText("call-test-7f".slice(0, 12));
  });

  test("scopes test history requests to the active compiled hash", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    const testHistoryRequestLog: string[] = [];
    await stubTestWorkbenchApis(page, { testHistoryRequestLog });

    await page.goto(workbenchUrl());

    await expect
      .poll(() => testHistoryRequestLog[0] ?? null)
      .toBe("def456abc789");
  });

  test("live sessions lock the runs tab until the room is disconnected", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page);

    await page.goto(workbenchUrl());
    await page.getByTestId("browser-voice-start").click();
    await expect(page.getByTestId("browser-voice-state")).toContainText("Live");
    await expect(page.getByRole("button", { name: /Runs v3/i })).toBeDisabled();
    await expect(page.getByText("End the live session before switching to a saved run.")).not.toBeVisible();
  });

  test("selecting a saved run restores its governed metadata context", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page, {
      testHistoryResponse: [
        {
          call_id: "call-prev-0001",
          started_at: "2026-03-29T08:15:00Z",
          duration_seconds: 42,
          outcome: "completed",
          agent_definition_version: 2,
          agent_definition_name: "night-operator",
          compiled_hash: "feedbead1234",
        },
      ],
    });

    await page.goto(workbenchUrl());

    await expect(page.getByTestId("recent-test-runs")).toBeVisible();
    await page.getByTestId("recent-test-run-call-prev-0001").click();

    await expect(page.getByTestId("call-context-row")).toBeVisible();
    await expect(page.getByTestId("call-context-name")).toContainText("night-operator");
    await expect(page.getByTestId("call-context-version")).toContainText("v2");
    await expect(page.getByText("feedbead")).toBeVisible();
    await expect(page.getByTestId("call-context-call-id")).toContainText("call-prev-000".slice(0, 12));
  });

  test("admin workbench consumes the shared live stream client on admin routes", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page, {
      callLatencyResponse: {
        call_id: "call-test-7f2b9c1d",
        source: "persisted_metadata",
        has_latency_data: true,
        turns: [
          {
            turn_index: 0,
            user_speech_started_at_ms: 0,
            user_speech_ended_at_ms: 1200,
            user_final_transcript_at_ms: 1268,
            user_final_transcript_chars: 25,
            stt_duration_ms: 1200,
            llm_start_at_ms: 1280,
            llm_ttft_at_ms: 1605,
            llm_duration_ms: 350,
            agent_speaking_started_at_ms: 1680,
            agent_speaking_ended_at_ms: 2400,
            tts_ttfb_ms: 52,
            tts_duration_ms: 720,
            stt_finalize_delay_ms: 68,
            eot_to_llm_start_ms: 80,
            llm_ttft_ms: 325,
            eot_to_agent_speak_ms: 480,
            first_speech_latency_ms: 480,
            tts_pre_speech_gap_ms: 35,
            user_interrupted_agent: false,
            interruption_started_at_ms: null,
            agent_stop_after_interrupt_ms: null,
            speech_overlap_duration_ms: null,
            tool_executions: [],
          },
        ],
        summaries: {
          llm_ttft_ms: { sample_count: 1, average_ms: 325, latest_ms: 325, max_ms: 325 },
          tts_ttfb_ms: { sample_count: 1, average_ms: 52, latest_ms: 52, max_ms: 52 },
          stt_finalize_delay_ms: { sample_count: 1, average_ms: 68, latest_ms: 68, max_ms: 68 },
          eot_to_agent_speak_ms: { sample_count: 1, average_ms: 480, latest_ms: 480, max_ms: 480 },
        },
        stack: null,
      },
      transcriptStreamBody: [
        "event: segment",
        `data: ${JSON.stringify({
          envelope_id: "voice.call.transcript:call-test-7f2b9c1d:1",
          tenant_id: TEST_TENANT_ID,
          scope: "deployment",
          topic: "voice.call.transcript.call-test-7f2b9c1d",
          event_type: "voice.transcript.segment",
          seq: 1,
          occurred_at: "2026-03-30T09:00:00Z",
          correlation_id: "call-test-7f2b9c1d",
          causation_id: null,
          payload_schema_version: 1,
          payload: {
            speaker: "Caller",
            timestamp: "2026-03-30T09:00:00Z",
            text: "Need help with a booking",
          },
        })}`,
        "",
        "event: end",
        "data: {}",
        "",
      ].join("\n"),
      opsStreamBody: [
        "event: runtime_event",
        `data: ${JSON.stringify({
          envelope_id: "voice.call.runtime:call-test-7f2b9c1d:2",
          tenant_id: TEST_TENANT_ID,
          scope: "deployment",
          topic: "voice.call.runtime.call-test-7f2b9c1d",
          event_type: "tts.first_byte",
          seq: 2,
          occurred_at: "2026-03-30T09:00:01Z",
          correlation_id: "call-test-7f2b9c1d",
          causation_id: null,
          payload_schema_version: 1,
          payload: { provider: "google" },
          occurred_at_ms: 490,
          summary: "Speech started playing",
          created_at: "2026-03-30T09:00:01Z",
        })}`,
        "",
        "event: end",
        "data: {}",
        "",
      ].join("\n"),
    });

    await page.goto(workbenchUrl());
    await page.getByTestId("browser-voice-start").click();
    await expect(page.getByTestId("browser-voice-state")).toContainText("Live");

    // Conversation tab is auto-selected when session starts
    await expect(page.getByTestId("chat-conversation")).toBeVisible();
    await expect(page.getByText("Need help with a booking")).toBeVisible();
    // Turn count reflects live stream items (may exceed latency turn count)
    await expect(page.getByText(/\d+ turns?/)).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("latency-strip-gauges")).toBeVisible();
    await expect(page.getByTestId("gauge-eot_to_agent_speak_ms")).toContainText("480ms");
  });

  test("keeps the latest live timeline visible after the session ends", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page, {
      callLatencyResponse: {
        call_id: "call-test-7f2b9c1d",
        source: "persisted_metadata",
        has_latency_data: true,
        turns: [
          {
            turn_index: 0,
            user_speech_started_at_ms: 0,
            user_speech_ended_at_ms: 1200,
            user_final_transcript_at_ms: 1268,
            user_final_transcript_chars: 25,
            stt_duration_ms: 1200,
            llm_start_at_ms: 1280,
            llm_ttft_at_ms: 1605,
            llm_duration_ms: 350,
            agent_speaking_started_at_ms: 1680,
            agent_speaking_ended_at_ms: 2400,
            tts_ttfb_ms: 52,
            tts_duration_ms: 720,
            stt_finalize_delay_ms: 68,
            eot_to_llm_start_ms: 80,
            llm_ttft_ms: 325,
            eot_to_agent_speak_ms: 480,
            first_speech_latency_ms: 480,
            tts_pre_speech_gap_ms: 35,
            user_interrupted_agent: false,
            interruption_started_at_ms: null,
            agent_stop_after_interrupt_ms: null,
            speech_overlap_duration_ms: null,
            tool_executions: [],
          },
        ],
        summaries: {
          llm_ttft_ms: { sample_count: 1, average_ms: 325, latest_ms: 325, max_ms: 325 },
          tts_ttfb_ms: { sample_count: 1, average_ms: 52, latest_ms: 52, max_ms: 52 },
          stt_finalize_delay_ms: { sample_count: 1, average_ms: 68, latest_ms: 68, max_ms: 68 },
          eot_to_agent_speak_ms: { sample_count: 1, average_ms: 480, latest_ms: 480, max_ms: 480 },
        },
        stack: null,
      },
      transcriptStreamBody: [
        "event: segment",
        `data: ${JSON.stringify({
          envelope_id: "voice.call.transcript:call-test-7f2b9c1d:1",
          tenant_id: TEST_TENANT_ID,
          scope: "deployment",
          topic: "voice.call.transcript.call-test-7f2b9c1d",
          event_type: "voice.transcript.segment",
          seq: 1,
          occurred_at: "2026-03-30T09:00:00Z",
          correlation_id: "call-test-7f2b9c1d",
          causation_id: null,
          payload_schema_version: 1,
          payload: {
            speaker: "Caller",
            timestamp: "2026-03-30T09:00:00Z",
            text: "Need help with a booking",
          },
        })}`,
        "",
        "event: end",
        "data: {}",
        "",
      ].join("\n"),
      opsStreamBody: [
        "event: runtime_event",
        `data: ${JSON.stringify({
          envelope_id: "voice.call.runtime:call-test-7f2b9c1d:2",
          tenant_id: TEST_TENANT_ID,
          scope: "deployment",
          topic: "voice.call.runtime.call-test-7f2b9c1d",
          event_type: "tts.first_byte",
          seq: 2,
          occurred_at: "2026-03-30T09:00:01Z",
          correlation_id: "call-test-7f2b9c1d",
          causation_id: null,
          payload_schema_version: 1,
          payload: { provider: "google" },
          occurred_at_ms: 490,
          summary: "Speech started playing",
          created_at: "2026-03-30T09:00:01Z",
        })}`,
        "",
        "event: end",
        "data: {}",
        "",
      ].join("\n"),
      testHistoryResponse: [
        {
          call_id: "call-test-7f2b9c1d",
          started_at: "2026-03-30T09:00:00Z",
          duration_seconds: 31,
          outcome: "completed",
          agent_definition_version: 3,
          agent_definition_name: "clinic-registrator",
          compiled_hash: "def456abc789",
        },
        {
          call_id: "call-prev-0001",
          started_at: "2026-03-29T08:15:00Z",
          duration_seconds: 42,
          outcome: "completed",
          agent_definition_version: 3,
          agent_definition_name: "clinic-registrator",
          compiled_hash: "def456abc789",
        },
      ],
    });

    await page.goto(workbenchUrl());
    await page.getByTestId("browser-voice-start").click();
    await expect(page.getByTestId("browser-voice-state")).toContainText("Live");
    await expect(page.getByText("Need help with a booking")).toBeVisible();

    await page.getByTestId("browser-voice-end").click();
    await expect(page.getByTestId("browser-voice-ended")).toBeVisible();

    // Conversation tab content still visible after session ends
    await expect(page.getByTestId("chat-conversation")).toBeVisible();
    await expect(page.getByText("Need help with a booking")).toBeVisible();
    // Context row persists
    await expect(page.getByTestId("call-context-name")).toContainText("clinic-registrator");
    await expect(page.getByTestId("call-context-call-id")).toContainText("call-test-7f".slice(0, 12));
    await expect(page.getByTestId("latency-strip-gauges")).toBeVisible();
    await expect(page.getByTestId("gauge-eot_to_agent_speak_ms")).toContainText("480ms");
  });

  test("version selector allows choosing a specific version", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page);

    await page.goto(workbenchUrl());

    const versionSelect = page.locator("#test-version-select");
    await expect(versionSelect).toBeVisible();
    await expect(versionSelect).toHaveValue("3");

    // Select specific version
    await versionSelect.selectOption("2");
    await expect(versionSelect).toHaveValue("2");
  });

  test("does not label a previously published rollback candidate as draft", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page, {
      versions: [
        {
          id: "ver-003",
          agent_definition_id: TEST_DEFINITION_ID,
          tenant_id: TEST_TENANT_ID,
          version: 3,
          status: "previously_published",
          source_yaml: "name: clinic-registrator",
          source_yaml_hash: "abc123",
          compiled_hash: "def456",
          published_at: "2026-03-26T08:00:00Z",
          created_at: "2026-03-26T07:00:00Z",
        },
        {
          id: "ver-002",
          agent_definition_id: TEST_DEFINITION_ID,
          tenant_id: TEST_TENANT_ID,
          version: 2,
          status: "published",
          source_yaml: "name: clinic-registrator",
          source_yaml_hash: "aaa111",
          compiled_hash: "bbb222",
          published_at: "2026-03-25T10:00:00Z",
          created_at: "2026-03-25T09:00:00Z",
        },
      ],
    });

    await page.goto(workbenchUrl());

    await expect(page.getByText("Test Workbench")).toBeVisible();
    await expect(page.getByText("draft")).toHaveCount(0);
  });

  test("no escalation badge shown when events are empty", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page);

    await page.goto(workbenchUrl());

    // Start session
    await page.getByTestId("browser-voice-start").click();
    await expect(page.getByTestId("browser-voice-state")).toContainText("Live");

    // Context row visible but no escalation panel
    await expect(page.getByTestId("call-context-row")).toBeVisible();
    await expect(page.getByTestId("test-escalation-panel")).not.toBeVisible();
  });

  test("escalation panel renders urgent state when events contain transfer_requested", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page);

    // Override the events endpoint to return an escalation event
    await page.route(/\/api\/platform(?:\/admin\/tenants\/[^/]+)?\/calls\/active\/call-test-7f2b9c1d\/events$/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          events: [
            {
              event_type: "call.escalation.transfer_requested",
              payload: { reason: "urgent_medical_need", priority: "URGENT", transfer_immediately: true },
              occurred_at: "2026-03-26T10:04:03Z",
            },
          ],
        }),
      });
    });

    await page.goto(workbenchUrl());
    await page.getByTestId("browser-voice-start").click();
    await expect(page.getByTestId("browser-voice-state")).toContainText("Live");

    // Escalation inline badge should render urgent state (SWR polls every 3s)
    await expect(page.getByTestId("test-escalation-panel")).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId("test-escalation-panel")).toContainText("Urgent transfer");
    await expect(page.getByTestId("test-escalation-panel")).toContainText("urgent_medical_need");
  });

  test("shows error when WebRTC connection fails", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    const cleanupLog: string[] = [];
    // Install a fake room that rejects on connect (simulates "could not establish pc connection")
    await page.addInitScript(() => {
      const scope = window as typeof window & {
        __testVoiceEvents?: unknown[];
        __GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__?: () => unknown;
      };
      scope.__testVoiceEvents = [];
      if (!navigator.mediaDevices) {
        Object.defineProperty(navigator, "mediaDevices", {
          configurable: true,
          value: { getUserMedia: async () => ({}) },
        });
      }
      scope.__GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__ = () => ({
        name: "test-voice-room-fail",
        canPlaybackAudio: true,
        subscribe() { return () => {}; },
        async connect() { throw new Error("could not establish pc connection"); },
        async startAudio() {},
        async setMicrophoneEnabled() {},
        disconnect() {},
      });
    });
    await stubTestWorkbenchApis(page, { cleanupLog });

    await page.goto(workbenchUrl());
    await page.getByTestId("browser-voice-start").click();

    await expect(page.getByTestId("browser-voice-state")).toContainText("Error");
    await expect(page.getByTestId("browser-voice-error")).toContainText("could not establish pc connection");
    expect(cleanupLog).toEqual(["call-test-7f2b9c1d"]);
  });

  test("shows error and cleans up when microphone enable fails", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    const cleanupLog: string[] = [];
    await page.addInitScript(() => {
      const scope = window as typeof window & {
        __GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__?: () => unknown;
      };
      if (!navigator.mediaDevices) {
        Object.defineProperty(navigator, "mediaDevices", {
          configurable: true,
          value: { getUserMedia: async () => ({}) },
        });
      }
      scope.__GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__ = () => ({
        name: "test-voice-room-mic-fail",
        canPlaybackAudio: true,
        subscribe() { return () => {}; },
        async connect() {},
        async startAudio() {},
        async setMicrophoneEnabled() { throw new Error("microphone permission denied"); },
        disconnect() {},
      });
    });
    await stubTestWorkbenchApis(page, { cleanupLog });

    await page.goto(workbenchUrl());
    await page.getByTestId("browser-voice-start").click();

    await expect(page.getByTestId("browser-voice-state")).toContainText("Error");
    await expect(page.getByTestId("browser-voice-error")).toContainText("microphone permission denied");
    expect(cleanupLog).toEqual(["call-test-7f2b9c1d"]);
  });

  test("shows error when microphone is not supported", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    // Install a fake room but remove mediaDevices to simulate no microphone
    await page.addInitScript(() => {
      const scope = window as typeof window & {
        __GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__?: () => unknown;
      };
      // Remove getUserMedia to simulate unsupported browser
      Object.defineProperty(navigator, "mediaDevices", {
        configurable: true,
        value: undefined,
      });
      scope.__GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__ = () => ({
        name: "test-voice-room-no-mic",
        canPlaybackAudio: true,
        subscribe() { return () => {}; },
        async connect() {},
        async startAudio() {},
        async setMicrophoneEnabled() {},
        disconnect() {},
      });
    });
    await stubTestWorkbenchApis(page);

    await page.goto(workbenchUrl());
    await page.getByTestId("browser-voice-start").click();

    await expect(page.getByTestId("browser-voice-state")).toContainText("Error");
    await expect(page.getByTestId("browser-voice-error")).toContainText("microphone");
  });

  test("shows error when voice room disconnects unexpectedly", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    // Install a room that connects but disconnects after 500ms with a reason
    await page.addInitScript(() => {
      const scope = window as typeof window & {
        __testVoiceEvents?: unknown[];
        __GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__?: () => unknown;
      };
      scope.__testVoiceEvents = [];
      if (!navigator.mediaDevices) {
        Object.defineProperty(navigator, "mediaDevices", {
          configurable: true,
          value: { getUserMedia: async () => ({}) },
        });
      }
      scope.__GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__ = () => {
        const listeners = new Set<{
          onStateChange?: (state: string) => void;
          onDisconnected?: (reason?: string) => void;
        }>();
        return {
          name: "test-voice-room-drop",
          canPlaybackAudio: true,
          subscribe(events: { onStateChange?: (state: string) => void; onDisconnected?: (reason?: string) => void }) {
            listeners.add(events);
            return () => listeners.delete(events);
          },
          async connect() {
            listeners.forEach((l) => l.onStateChange?.("connected"));
            // Simulate unexpected disconnect after 500ms
            setTimeout(() => {
              listeners.forEach((l) => l.onDisconnected?.("signal client closed: ping timeout"));
            }, 500);
          },
          async startAudio() {},
          async setMicrophoneEnabled() {},
          disconnect() {
            listeners.forEach((l) => l.onDisconnected?.());
          },
        };
      };
    });
    await stubTestWorkbenchApis(page);

    await page.goto(workbenchUrl());
    await page.getByTestId("browser-voice-start").click();

    // Should go live first
    await expect(page.getByTestId("browser-voice-state")).toContainText("Live");

    // Then disconnect and show error
    await expect(page.getByTestId("browser-voice-state")).toContainText("Error", { timeout: 5000 });
    await expect(page.getByTestId("browser-voice-error")).toContainText("ping timeout");
  });

  test.describe("session bootstrap failures", () => {
    test.use({
      allowConsoleErrors: [/500 \(Internal Server Error\)/],
      allowRequestFailures: [/\/api\/platform\/admin\/tenants\/[^/]+\/calls\/browser-session$/],
    });

    test("session API failure shows error instead of hanging on connecting", async ({ page }) => {
      await primeSessionCookie(page, "super_admin");
      await installFakeBrowserVoiceRoom(page);
      await stubTestWorkbenchApis(page);

      // Override browser-session endpoint to return 500
      await page.route(`**/api/platform/admin/tenants/${TEST_TENANT_ID}/calls/browser-session`, async (route) => {
        await route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ detail: "LiveKit browser URL not configured" }) });
      });

      await page.goto(workbenchUrl());
      await page.getByTestId("browser-voice-start").click();

      await expect(page.getByTestId("browser-voice-state")).toContainText("Error");
      await expect(page.getByTestId("browser-voice-error")).toBeVisible();
    });
  });

  test("published (live) version has a Test button in the version table", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await stubTestWorkbenchApis(page);

    // Navigate to the agent definition detail page (not workbench)
    await page.goto(`/admin/agent-definitions/${TEST_DEFINITION_ID}?tenant_id=${TEST_TENANT_ID}`);

    // The version table should show both v3 (draft) and v2 (published/live)
    // v3 draft should have a Test button
    const draftTestButton = page.getByTestId("admin-agent-definition-test-3");
    await expect(draftTestButton).toBeVisible();

    // v2 published should ALSO have a Test button (was missing before the fix)
    const liveTestButton = page.getByTestId("admin-agent-definition-test-2");
    await expect(liveTestButton).toBeVisible();

    // The live Test button should link to the workbench with version=2
    await expect(liveTestButton).toHaveAttribute("href", expect.stringContaining("version=2"));
  });

  test("workbench version selector defaults to latest draft", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page);

    await page.goto(workbenchUrl());

    // Version selector should show draft version by default
    const versionSelect = page.locator("#test-version-select");
    await expect(versionSelect).toBeVisible();
    // The latest version (v3 draft) should be pre-selected
    await expect(versionSelect).toHaveValue("3");
  });

  test("workbench can test a published version when specified in URL", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page);

    // Navigate with version=2 (the published version)
    await page.goto(`${workbenchUrl()}&version=2`);

    const versionSelect = page.locator("#test-version-select");
    await expect(versionSelect).toBeVisible();
    await expect(versionSelect).toHaveValue("2");
  });

  test("workbench selector hides rejected and archived versions", async ({ page }) => {
    await primeSessionCookie(page, "super_admin");
    await installFakeBrowserVoiceRoom(page);
    await stubTestWorkbenchApis(page, {
      versions: [
        {
          id: "ver-005",
          agent_definition_id: TEST_DEFINITION_ID,
          tenant_id: TEST_TENANT_ID,
          version: 5,
          status: "rejected",
          source_yaml: "name: clinic-registrator",
          source_yaml_hash: "rej111",
          compiled_hash: "rej222",
          created_at: "2026-03-28T09:00:00Z",
        },
        {
          id: "ver-004",
          agent_definition_id: TEST_DEFINITION_ID,
          tenant_id: TEST_TENANT_ID,
          version: 4,
          status: "archived",
          source_yaml: "name: clinic-registrator",
          source_yaml_hash: "arc111",
          compiled_hash: "arc222",
          created_at: "2026-03-27T09:00:00Z",
        },
        {
          id: "ver-003",
          agent_definition_id: TEST_DEFINITION_ID,
          tenant_id: TEST_TENANT_ID,
          version: 3,
          status: "approved",
          source_yaml: "name: clinic-registrator",
          source_yaml_hash: "app111",
          compiled_hash: "app222",
          created_at: "2026-03-26T09:00:00Z",
        },
        {
          id: "ver-002",
          agent_definition_id: TEST_DEFINITION_ID,
          tenant_id: TEST_TENANT_ID,
          version: 2,
          status: "published",
          source_yaml: "name: clinic-registrator",
          source_yaml_hash: "pub111",
          compiled_hash: "pub222",
          created_at: "2026-03-25T09:00:00Z",
          published_at: "2026-03-25T10:00:00Z",
        },
      ],
    });

    await page.goto(workbenchUrl());

    const versionSelect = page.locator("#test-version-select");
    await expect(versionSelect).toHaveValue("3");
    await expect(versionSelect.locator("option")).toHaveCount(2);
    await expect(versionSelect).not.toContainText("rejected");
    await expect(versionSelect).not.toContainText("archived");
  });
});
