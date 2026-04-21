import { renderHook, waitFor } from "@testing-library/react";
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
  appendTranscriptSegment,
  buildCallTranscriptSseBridgeUrl,
  parseTranscriptBridgeMessage,
  useVoiceCallTranscriptFeed,
} from "@/lib/realtime/use-voice-call-transcript-feed";

afterEach(() => {
  realtimeMocks.error = null;
  realtimeMocks.messages = [];
  realtimeMocks.replayUrls = [];
  vi.clearAllMocks();
});

function transcriptMessage(
  seq: number,
  payload: { speaker: string; timestamp: string; text: string },
): SseMessage {
  return {
    eventName: "segment",
    data: JSON.stringify({
      envelope_id: `voice.call.transcript:call_123:${seq}`,
      tenant_id: "tenant_123",
      scope: "tenant",
      topic: "voice.call.transcript.call_123",
      event_type: "voice.transcript.segment",
      seq,
      occurred_at: payload.timestamp,
      correlation_id: "call_123",
      causation_id: null,
      payload_schema_version: 1,
      speaker: "stale-top-level-speaker",
      text: "stale-top-level-text",
      timestamp: "stale-top-level-timestamp",
      payload,
    }),
  };
}

function legacyTranscriptMessage(
  seq: number,
  payload: { speaker: string; timestamp: string; text: string },
): SseMessage {
  return {
    eventName: "segment",
    data: JSON.stringify({
      seq,
      speaker: payload.speaker,
      timestamp: payload.timestamp,
      text: payload.text,
    }),
  };
}

describe("voice control-plane transcript feed", () => {
  it("parses canonical transcript payloads and prefers payload fields over bridge compatibility fields", () => {
    const parsed = parseTranscriptBridgeMessage(
      transcriptMessage(2, {
        speaker: "Agent",
        timestamp: "2026-03-29T12:01:00Z",
        text: "I can help with that.",
      }),
    );

    expect(parsed).toMatchObject({
      topic: "voice.call.transcript.call_123",
      event_type: "voice.transcript.segment",
      seq: 2,
      payload: {
        speaker: "Agent",
        timestamp: "2026-03-29T12:01:00Z",
        text: "I can help with that.",
      },
    });
  });

  it("builds replayable transcript bridge urls for tenant and admin scopes", () => {
    expect(buildCallTranscriptSseBridgeUrl("call_123")).toBe(
      "/api/platform/calls/call_123/transcript/stream?after_seq=0&idle_timeout_seconds=30",
    );
    expect(
      buildCallTranscriptSseBridgeUrl("call_123", {
        afterSeq: 7,
        streamScope: adminTenantVoiceControlPlaneStreamScope("tenant-admin"),
      }),
    ).toBe(
      "/api/platform/admin/tenants/tenant-admin/calls/call_123/transcript/stream?after_seq=7&idle_timeout_seconds=30",
    );
  });

  it("keeps the rollout fallback for legacy transcript bridge events", () => {
    const parsed = parseTranscriptBridgeMessage(
      legacyTranscriptMessage(3, {
        speaker: "Caller",
        timestamp: "2026-03-29T12:02:00Z",
        text: "Still on the older bridge",
      }),
    );

    expect(parsed).toMatchObject({
      seq: 3,
      event_type: "voice.transcript.segment",
      payload: {
        speaker: "Caller",
        timestamp: "2026-03-29T12:02:00Z",
        text: "Still on the older bridge",
      },
    });
  });

  it("dedupes transcript segments and exposes the shared replay bridge config", async () => {
    realtimeMocks.messages = [
      transcriptMessage(1, {
        speaker: "Caller",
        timestamp: "2026-03-29T12:00:00Z",
        text: "Hello",
      }),
      transcriptMessage(1, {
        speaker: "Caller",
        timestamp: "2026-03-29T12:00:00Z",
        text: "Hello",
      }),
      transcriptMessage(2, {
        speaker: "Agent",
        timestamp: "2026-03-29T12:00:01Z",
        text: "Hi there",
      }),
    ];

    const { result } = renderHook(() => useVoiceCallTranscriptFeed("call_123"));

    await waitFor(() => {
      expect(result.current.segments).toEqual([
        { seq: 1, speaker: "Caller", timestamp: "2026-03-29T12:00:00Z", text: "Hello" },
        { seq: 2, speaker: "Agent", timestamp: "2026-03-29T12:00:01Z", text: "Hi there" },
      ]);
    });

    expect(result.current.streaming).toBe(true);
    expect(realtimeMocks.replayUrls).toContain(
      "/api/platform/calls/call_123/transcript/stream?after_seq=0&idle_timeout_seconds=30",
    );
  });

  it("keeps appendTranscriptSegment stable when the segment already exists", () => {
    const firstEnvelope = parseTranscriptBridgeMessage(
      transcriptMessage(1, {
        speaker: "Caller",
        timestamp: "2026-03-29T12:00:00Z",
        text: "Hello",
      }),
    );

    expect(firstEnvelope).not.toBeNull();
    const initial = appendTranscriptSegment([], firstEnvelope!);
    const deduped = appendTranscriptSegment(initial, firstEnvelope!);

    expect(deduped).toBe(initial);
  });
});
