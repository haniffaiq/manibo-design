import type { SseMessage } from "@/hooks/use-sse-stream";
import type { CallRuntimeEvent } from "@/lib/api/call-history";
import { parseVoiceControlPlaneEnvelope, type VoiceControlPlaneEnvelope } from "@/lib/realtime/voice-control-plane";

export type TranscriptPayload = {
  speaker: string;
  timestamp: string;
  text: string;
};

type RuntimeEnvelopePayload = {
  createdAt: string | null;
  occurredAtMs: number | null;
  payload: Record<string, unknown>;
  summary: string | null;
};

export type VoiceControlPlaneStreamScope =
  | { kind: "tenant" }
  | { kind: "admin_tenant"; tenantId: string };

export const TENANT_VOICE_CONTROL_PLANE_STREAM_SCOPE: VoiceControlPlaneStreamScope = { kind: "tenant" };

export function adminTenantVoiceControlPlaneStreamScope(tenantId: string): VoiceControlPlaneStreamScope {
  return { kind: "admin_tenant", tenantId };
}

export function buildVoiceCallTranscriptStreamUrl(
  callId: string,
  options?: {
    afterSeq?: number;
    streamScope?: VoiceControlPlaneStreamScope;
    idleTimeoutSeconds?: number;
  },
): string {
  const afterSeq = options?.afterSeq ?? 0;
  const idleTimeoutSeconds = options?.idleTimeoutSeconds ?? 30;
  const streamScope = options?.streamScope ?? TENANT_VOICE_CONTROL_PLANE_STREAM_SCOPE;

  switch (streamScope.kind) {
    case "admin_tenant":
      return `/api/platform/admin/tenants/${encodeURIComponent(streamScope.tenantId)}/calls/${encodeURIComponent(callId)}/transcript/stream?after_seq=${afterSeq}&idle_timeout_seconds=${idleTimeoutSeconds}`;
    case "tenant":
      return `/api/platform/calls/${encodeURIComponent(callId)}/transcript/stream?after_seq=${afterSeq}&idle_timeout_seconds=${idleTimeoutSeconds}`;
  }
}

export function buildVoiceCallRuntimeStreamUrl(
  callId: string,
  options?: {
    afterSeq?: number;
    streamScope?: VoiceControlPlaneStreamScope;
    idleTimeoutSeconds?: number;
  },
): string {
  const afterSeq = options?.afterSeq ?? 0;
  const idleTimeoutSeconds = options?.idleTimeoutSeconds ?? 5;
  const streamScope = options?.streamScope ?? TENANT_VOICE_CONTROL_PLANE_STREAM_SCOPE;

  switch (streamScope.kind) {
    case "admin_tenant":
      return `/api/platform/admin/tenants/${encodeURIComponent(streamScope.tenantId)}/calls/${encodeURIComponent(callId)}/ops/stream?after_seq=${afterSeq}&idle_timeout_seconds=${idleTimeoutSeconds}`;
    case "tenant":
      return `/api/platform/calls/${encodeURIComponent(callId)}/ops/stream?after_seq=${afterSeq}&idle_timeout_seconds=${idleTimeoutSeconds}`;
  }
}

export function parseVoiceCallTranscriptStreamMessage(
  message: SseMessage,
): VoiceControlPlaneEnvelope<TranscriptPayload> | null {
  if (message.eventName === "end") {
    return null;
  }
  if (message.eventName && message.eventName !== "segment") {
    return null;
  }

  const canonicalEnvelope = parseVoiceControlPlaneEnvelope(message.data, (payload, root) => {
    const speaker = readTextField(payload, "speaker") ?? readTextField(root, "speaker");
    const timestamp = readTextField(payload, "timestamp") ?? readTextField(root, "timestamp");
    const text = readTextField(payload, "text") ?? readTextField(root, "text");
    if (!speaker || !timestamp || !text) {
      return null;
    }
    return { speaker, timestamp, text };
  });
  if (canonicalEnvelope) {
    return canonicalEnvelope;
  }

  return parseLegacyTranscriptEnvelope(message.data);
}

export function parseVoiceCallRuntimeStreamMessage(message: SseMessage): CallRuntimeEvent | null {
  if (message.eventName === "end") {
    return null;
  }
  if (message.eventName && message.eventName !== "runtime_event") {
    return null;
  }

  const canonicalEnvelope = parseVoiceControlPlaneEnvelope(message.data, (payload, root) => {
    const normalizedPayload = normalizePayload(payload);
    const occurredAtMs = readIntField(normalizedPayload, "occurred_at_ms") ?? readIntField(root, "occurred_at_ms");
    const summary = readTextField(normalizedPayload, "summary") ?? readTextField(root, "summary");
    if (occurredAtMs !== null && normalizedPayload.occurred_at_ms === undefined) {
      normalizedPayload.occurred_at_ms = occurredAtMs;
    }
    if (summary && normalizedPayload.summary === undefined) {
      normalizedPayload.summary = summary;
    }
    return {
      createdAt: readTextField(root, "created_at") ?? readTextField(root, "occurred_at"),
      occurredAtMs,
      payload: normalizedPayload,
      summary,
    };
  });

  if (canonicalEnvelope) {
    return runtimeEventFromEnvelope(canonicalEnvelope.seq, canonicalEnvelope.event_type, canonicalEnvelope.payload);
  }

  return parseLegacyRuntimeEvent(message.data);
}

function runtimeEventFromEnvelope(
  seq: number,
  eventType: string,
  payload: RuntimeEnvelopePayload,
): CallRuntimeEvent | null {
  if (payload.occurredAtMs === null || !payload.summary || !payload.createdAt) {
    return null;
  }

  return {
    seq,
    event_type: eventType,
    occurred_at_ms: payload.occurredAtMs,
    summary: payload.summary,
    created_at: payload.createdAt,
    payload: payload.payload,
  };
}

function parseLegacyTranscriptEnvelope(data: string): VoiceControlPlaneEnvelope<TranscriptPayload> | null {
  const trimmed = data.trim();
  if (!trimmed || trimmed === "{}") {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const speaker = readTextField(parsed, "speaker");
  const timestamp = readTextField(parsed, "timestamp");
  const text = readTextField(parsed, "text");
  const seq = (parsed as { seq?: unknown }).seq;
  if (!speaker || !timestamp || !text || typeof seq !== "number" || !Number.isInteger(seq)) {
    return null;
  }

  const payload: TranscriptPayload = { speaker, timestamp, text };

  return {
    envelope_id: `legacy.voice.call.transcript:${seq}`,
    tenant_id: "",
    scope: "tenant",
    topic: "voice.call.transcript",
    event_type: "voice.transcript.segment",
    seq,
    occurred_at: payload.timestamp,
    correlation_id: null,
    causation_id: null,
    payload_schema_version: 1,
    payload,
  };
}

function parseLegacyRuntimeEvent(data: string): CallRuntimeEvent | null {
  const trimmed = data.trim();
  if (!trimmed || trimmed === "{}") {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed) as unknown;
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return null;
  }

  const seq = (parsed as { seq?: unknown }).seq;
  const eventType = readTextField(parsed, "event_type");
  const occurredAtMs = readIntField(parsed, "occurred_at_ms");
  const summary = readTextField(parsed, "summary");
  const createdAt = readTextField(parsed, "created_at");
  const payload = normalizePayload((parsed as { payload?: unknown }).payload);
  if (occurredAtMs !== null && payload.occurred_at_ms === undefined) {
    payload.occurred_at_ms = occurredAtMs;
  }
  if (summary && payload.summary === undefined) {
    payload.summary = summary;
  }

  if (
    typeof seq !== "number" ||
    !Number.isInteger(seq) ||
    !eventType ||
    occurredAtMs === null ||
    !summary ||
    !createdAt
  ) {
    return null;
  }

  return {
    seq,
    event_type: eventType,
    occurred_at_ms: occurredAtMs,
    summary,
    created_at: createdAt,
    payload,
  };
}

function normalizePayload(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, unknown>) };
}

function readTextField(source: unknown, key: string): string | null {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return null;
  }
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function readIntField(source: unknown, key: string): number | null {
  if (!source || typeof source !== "object" || Array.isArray(source)) {
    return null;
  }
  const value = (source as Record<string, unknown>)[key];
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}
