import { afterEach, describe, expect, it, vi } from "vitest";
import type { SseMessage } from "@/hooks/use-sse-stream";
import { adminTenantVoiceControlPlaneStreamScope } from "@/lib/realtime/voice-control-plane-client";

const realtimeMocks = vi.hoisted(() => ({
  error: null as string | null,
  messages: [] as SseMessage[],
  replayUrls: [] as string[],
}));

vi.mock("@/hooks/use-sse-stream", async () => {
  const React = await import("react");

  return {
    useSseStream: (
      url: string | null,
      onMessage: (message: SseMessage) => void,
      options?: {
        enabled?: boolean;
        getUrl?: () => string;
      },
    ) => {
      React.useEffect(() => {
        if (!url || options?.enabled === false) {
          return;
        }
        realtimeMocks.replayUrls.push(options?.getUrl?.() ?? url);
        for (const message of realtimeMocks.messages) {
          onMessage(message);
        }
      }, [url, onMessage, options?.enabled, options?.getUrl]);

      return {
        streaming: Boolean(url),
        error: realtimeMocks.error,
      };
    },
  };
});

import {
  appendRuntimeEvent,
  buildCallOpsSseBridgeUrl,
  parseRuntimeBridgeMessage,
} from "@/lib/realtime/use-voice-call-runtime-feed";

afterEach(() => {
  realtimeMocks.error = null;
  realtimeMocks.messages = [];
  realtimeMocks.replayUrls = [];
  vi.clearAllMocks();
});

function runtimeEnvelopeMessage(seq: number, payload: Record<string, unknown>): SseMessage {
  return {
    eventName: "runtime_event",
    data: JSON.stringify({
      envelope_id: `voice.call.runtime:call_123:${seq}`,
      tenant_id: "tenant_123",
      scope: "tenant",
      topic: "voice.call.runtime.call_123",
      event_type: "tts.first_byte",
      seq,
      occurred_at: "2026-03-29T12:00:01Z",
      correlation_id: "call_123",
      causation_id: null,
      payload_schema_version: 1,
      occurred_at_ms: 490,
      summary: "Speech started playing",
      created_at: "2026-03-29T12:00:01Z",
      payload,
    }),
  };
}

function legacyRuntimeMessage(seq: number): SseMessage {
  return {
    eventName: "runtime_event",
    data: JSON.stringify({
      seq,
      event_type: "tts.first_byte",
      occurred_at_ms: 490,
      summary: "Speech started playing",
      created_at: "2026-03-29T12:00:01Z",
      payload: { turn_index: 0, provider: "telnyx" },
    }),
  };
}

describe("voice control-plane runtime feed", () => {
  it("parses canonical runtime envelopes and keeps compatibility fields inside payload", () => {
    const parsed = parseRuntimeBridgeMessage(runtimeEnvelopeMessage(2, { turn_index: 0, provider: "telnyx" }));

    expect(parsed).toMatchObject({
      seq: 2,
      event_type: "tts.first_byte",
      occurred_at_ms: 490,
      summary: "Speech started playing",
      payload: {
        turn_index: 0,
        provider: "telnyx",
        occurred_at_ms: 490,
        summary: "Speech started playing",
      },
    });
  });

  it("keeps the rollout fallback for legacy runtime bridge events", () => {
    const parsed = parseRuntimeBridgeMessage(legacyRuntimeMessage(3));

    expect(parsed).toMatchObject({
      seq: 3,
      event_type: "tts.first_byte",
      occurred_at_ms: 490,
      summary: "Speech started playing",
      payload: {
        turn_index: 0,
        provider: "telnyx",
        occurred_at_ms: 490,
        summary: "Speech started playing",
      },
    });
  });

  it("builds replayable ops bridge urls for tenant and admin scopes", () => {
    expect(buildCallOpsSseBridgeUrl("call_123")).toBe(
      "/api/platform/calls/call_123/ops/stream?after_seq=0&idle_timeout_seconds=5",
    );
    expect(
      buildCallOpsSseBridgeUrl("call_123", {
        afterSeq: 9,
        streamScope: adminTenantVoiceControlPlaneStreamScope("tenant-admin"),
      }),
    ).toBe(
      "/api/platform/admin/tenants/tenant-admin/calls/call_123/ops/stream?after_seq=9&idle_timeout_seconds=5",
    );
  });

  it("keeps appendRuntimeEvent stable when the event already exists", () => {
    const firstEvent = parseRuntimeBridgeMessage(legacyRuntimeMessage(1));

    expect(firstEvent).not.toBeNull();
    const initial = appendRuntimeEvent([], firstEvent!);
    const deduped = appendRuntimeEvent(initial, firstEvent!);

    expect(deduped).toBe(initial);
  });

  it("keeps runtime events sorted when new events arrive out of order", () => {
    const toolStarted = parseRuntimeBridgeMessage({
      eventName: "runtime_event",
      data: JSON.stringify({
        seq: 2,
        event_type: "tool.started",
        occurred_at_ms: 620,
        summary: "Tool started",
        created_at: "2026-03-29T12:00:02Z",
        payload: { tool_name: "lookup" },
      }),
    });
    const ttsStarted = parseRuntimeBridgeMessage(legacyRuntimeMessage(1));

    expect(toolStarted).not.toBeNull();
    expect(ttsStarted).not.toBeNull();

    const sorted = appendRuntimeEvent([toolStarted!], ttsStarted!);
    expect(sorted.map((event) => event.seq)).toEqual([1, 2]);
  });
});
