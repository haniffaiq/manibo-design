type ControlPlaneScope = "tenant" | "deployment";

export interface VoiceControlPlaneEnvelope<TPayload> {
  envelope_id: string;
  tenant_id: string;
  scope: ControlPlaneScope;
  topic: string;
  event_type: string;
  seq: number;
  occurred_at: string;
  correlation_id: string | null;
  causation_id: string | null;
  payload_schema_version: number;
  payload: TPayload;
}

type JsonRecord = Record<string, unknown>;

export function parseVoiceControlPlaneEnvelope<TPayload>(
  data: string,
  parsePayload: (payload: unknown, root: JsonRecord) => TPayload | null,
): VoiceControlPlaneEnvelope<TPayload> | null {
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

  if (!isRecord(parsed)) {
    return null;
  }

  const seq = readInt(parsed.seq);
  const topic = readText(parsed.topic);
  const eventType = readText(parsed.event_type);
  const occurredAt = readText(parsed.occurred_at);
  const tenantId = readText(parsed.tenant_id);
  const payloadSchemaVersion = readInt(parsed.payload_schema_version);
  const payload = parsePayload(parsed.payload, parsed);

  if (seq === null || !topic || !eventType || !occurredAt || !tenantId || payloadSchemaVersion === null || !payload) {
    return null;
  }

  return {
    envelope_id: readText(parsed.envelope_id) ?? `${topic}:${seq}`,
    tenant_id: tenantId,
    scope: parsed.scope === "deployment" ? "deployment" : "tenant",
    topic,
    event_type: eventType,
    seq,
    occurred_at: occurredAt,
    correlation_id: readNullableText(parsed.correlation_id),
    causation_id: readNullableText(parsed.causation_id),
    payload_schema_version: payloadSchemaVersion,
    payload,
  };
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readNullableText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === "string" ? value : null;
}

function readInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}
