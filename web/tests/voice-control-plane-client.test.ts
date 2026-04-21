import { describe, expect, it } from "vitest";
import type { SseMessage } from "@/hooks/use-sse-stream";
import {
  adminTenantVoiceControlPlaneStreamScope,
  buildVoiceCallRuntimeStreamUrl,
  buildVoiceCallTranscriptStreamUrl,
  parseVoiceCallRuntimeStreamMessage,
  parseVoiceCallTranscriptStreamMessage,
} from "@/lib/realtime/voice-control-plane-client";

function transcriptMessage(seq: number): SseMessage {
  return {
    eventName: "segment",
    data: JSON.stringify({
      envelope_id: `voice.call.transcript:call_123:${seq}`,
      tenant_id: "tenant_123",
      scope: "tenant",
      topic: "voice.call.transcript.call_123",
      event_type: "voice.transcript.segment",
      seq,
      occurred_at: "2026-03-30T12:00:00Z",
      payload_schema_version: 1,
      payload: {
        speaker: "Agent",
        timestamp: "2026-03-30T12:00:00Z",
        text: "Shared client works",
      },
    }),
  };
}

function runtimeMessage(seq: number): SseMessage {
  return {
    eventName: "runtime_event",
    data: JSON.stringify({
      envelope_id: `voice.call.runtime:call_123:${seq}`,
      tenant_id: "tenant_123",
      scope: "tenant",
      topic: "voice.call.runtime.call_123",
      event_type: "tts.first_byte",
      seq,
      occurred_at: "2026-03-30T12:00:01Z",
      payload_schema_version: 1,
      payload: {
        provider: "google",
      },
      occurred_at_ms: 490,
      summary: "Speech started playing",
      created_at: "2026-03-30T12:00:01Z",
    }),
  };
}

describe("voice control-plane client", () => {
  it("builds tenant and admin transcript replay urls", () => {
    expect(buildVoiceCallTranscriptStreamUrl("call_123")).toBe(
      "/api/platform/calls/call_123/transcript/stream?after_seq=0&idle_timeout_seconds=30",
    );
    expect(
      buildVoiceCallTranscriptStreamUrl("call_123", {
        afterSeq: 7,
        streamScope: adminTenantVoiceControlPlaneStreamScope("tenant-ops"),
      }),
    ).toBe(
      "/api/platform/admin/tenants/tenant-ops/calls/call_123/transcript/stream?after_seq=7&idle_timeout_seconds=30",
    );
  });

  it("builds tenant and admin runtime replay urls", () => {
    expect(buildVoiceCallRuntimeStreamUrl("call_123")).toBe(
      "/api/platform/calls/call_123/ops/stream?after_seq=0&idle_timeout_seconds=5",
    );
    expect(
      buildVoiceCallRuntimeStreamUrl("call_123", {
        afterSeq: 9,
        idleTimeoutSeconds: 8,
        streamScope: adminTenantVoiceControlPlaneStreamScope("tenant-ops"),
      }),
    ).toBe(
      "/api/platform/admin/tenants/tenant-ops/calls/call_123/ops/stream?after_seq=9&idle_timeout_seconds=8",
    );
  });

  it("parses canonical transcript envelopes", () => {
    expect(parseVoiceCallTranscriptStreamMessage(transcriptMessage(2))).toMatchObject({
      topic: "voice.call.transcript.call_123",
      seq: 2,
      payload: {
        speaker: "Agent",
        timestamp: "2026-03-30T12:00:00Z",
        text: "Shared client works",
      },
    });
  });

  it("keeps the legacy transcript fallback in the shared client", () => {
    expect(
      parseVoiceCallTranscriptStreamMessage({
        eventName: "segment",
        data: JSON.stringify({
          seq: 3,
          speaker: "Caller",
          timestamp: "2026-03-30T12:00:02Z",
          text: "Legacy bridge still supported",
        }),
      }),
    ).toMatchObject({
      seq: 3,
      payload: {
        speaker: "Caller",
        timestamp: "2026-03-30T12:00:02Z",
        text: "Legacy bridge still supported",
      },
    });
  });

  it("parses canonical runtime envelopes", () => {
    expect(parseVoiceCallRuntimeStreamMessage(runtimeMessage(4))).toMatchObject({
      seq: 4,
      event_type: "tts.first_byte",
      occurred_at_ms: 490,
      summary: "Speech started playing",
      payload: {
        provider: "google",
        occurred_at_ms: 490,
        summary: "Speech started playing",
      },
    });
  });

  it("keeps the legacy runtime fallback in the shared client", () => {
    expect(
      parseVoiceCallRuntimeStreamMessage({
        eventName: "runtime_event",
        data: JSON.stringify({
          seq: 5,
          event_type: "tool.started",
          occurred_at_ms: 620,
          summary: "Tool started",
          created_at: "2026-03-30T12:00:03Z",
          payload: { tool_name: "lookup" },
        }),
      }),
    ).toMatchObject({
      seq: 5,
      event_type: "tool.started",
      occurred_at_ms: 620,
      summary: "Tool started",
      payload: {
        tool_name: "lookup",
        occurred_at_ms: 620,
        summary: "Tool started",
      },
    });
  });
});
