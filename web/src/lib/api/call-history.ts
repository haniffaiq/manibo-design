import { platformApiRequest } from "@/lib/api/platform";

export interface CallsListQuery {
  started_after?: string;
  started_before?: string;
  outcome?: string;
  driver_id?: string;
  phone?: string;
  limit?: number;
  offset?: number;
}

export interface CallListItem {
  id: string;
  direction: string;
  state: string;
  outcome: string | null;
  caller_number: string | null;
  callee_number: string | null;
  started_at: string | null;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  quality_score: {
    overall: number;
    clarity: number;
    resolution: number;
    sentiment: number;
  } | null;
  needs_human_review: boolean | null;
}

export interface CallsListResponse {
  calls: CallListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface CallTranscript {
  language: string | null;
  full_text: string | null;
}

export interface CallRecordingRef {
  id: string;
  status: string;
  created_at: string;
  signed_url_path: string;
}

export interface CallDetailResponse {
  call: CallListItem;
  transcript: CallTranscript | null;
  recordings: CallRecordingRef[];
  has_more: {
    transcript: boolean;
    recordings: boolean;
  };
}

export interface CallRuntimeEvent {
  seq: number;
  event_type: string;
  occurred_at_ms: number;
  summary: string;
  created_at: string;
  payload: Record<string, unknown>;
}

export interface CallEventsResponse {
  call_id: string;
  events: CallRuntimeEvent[];
}

export interface RecordingSignedUrlResponse {
  url: string;
  expires_in_seconds: number;
}

export interface CallEventsQuery {
  limit?: number;
}

function buildQueryString(query: CallsListQuery): string {
  const params = new URLSearchParams();
  if (query.started_after) {
    params.set("started_after", query.started_after);
  }
  if (query.started_before) {
    params.set("started_before", query.started_before);
  }
  if (query.outcome) {
    params.set("outcome", query.outcome);
  }
  if (query.driver_id) {
    params.set("driver_id", query.driver_id);
  }
  if (query.phone) {
    params.set("phone", query.phone);
  }
  if (typeof query.limit === "number") {
    params.set("limit", String(query.limit));
  }
  if (typeof query.offset === "number") {
    params.set("offset", String(query.offset));
  }
  return params.toString();
}

export function listHistoricalCalls(query: CallsListQuery = {}): Promise<CallsListResponse> {
  const queryString = buildQueryString(query);
  const suffix = queryString.length > 0 ? `?${queryString}` : "";
  return platformApiRequest<CallsListResponse>(`/calls${suffix}`, { method: "GET" });
}

export function getCallDetail(callId: string): Promise<CallDetailResponse> {
  return platformApiRequest<CallDetailResponse>(`/calls/${encodeURIComponent(callId)}`, { method: "GET" });
}

export function getCallEvents(callId: string, query: CallEventsQuery = {}): Promise<CallEventsResponse> {
  const params = new URLSearchParams();
  if (typeof query.limit === "number") {
    params.set("limit", String(query.limit));
  }
  const suffix = params.size > 0 ? `?${params.toString()}` : "";
  return platformApiRequest<CallEventsResponse>(`/calls/${encodeURIComponent(callId)}/events${suffix}`, {
    method: "GET",
  });
}

export function getRecordingSignedUrl(
  recordingId: string,
  expiresInSeconds = 3600,
): Promise<RecordingSignedUrlResponse> {
  const params = new URLSearchParams({ expires_in_seconds: String(expiresInSeconds) });
  return platformApiRequest<RecordingSignedUrlResponse>(
    `/recordings/${encodeURIComponent(recordingId)}/signed-url?${params.toString()}`,
    { method: "GET" },
  );
}

export function getAdminRecordingSignedUrl(
  tenantId: string,
  recordingId: string,
  expiresInSeconds = 3600,
): Promise<RecordingSignedUrlResponse> {
  const params = new URLSearchParams({
    tenant_id: tenantId,
    expires_in_seconds: String(expiresInSeconds),
  });
  return platformApiRequest<RecordingSignedUrlResponse>(
    `/admin/recordings/${encodeURIComponent(recordingId)}/signed-url?${params.toString()}`,
    { method: "GET" },
  );
}
