import { platformApiRequest } from "@/lib/api/platform";

export interface CallLatencyMetricSummary {
  sample_count: number;
  average_ms: number | null;
  latest_ms: number | null;
  max_ms: number | null;
}

export interface CallLatencyStackComponent {
  provider: string | null;
  model: string | null;
  language: string | null;
  voice_id: string | null;
  voice_name: string | null;
}

export interface CallLatencyStack {
  llm: CallLatencyStackComponent | null;
  stt: CallLatencyStackComponent | null;
  tts: CallLatencyStackComponent | null;
}

export interface LiveCallToolExecution {
  tool_name: string;
  duration_ms: number | null;
  status: string;
  error_detail: string | null;
}

export interface LiveCallTurnLatency {
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
  tool_executions: LiveCallToolExecution[];
}

export interface CallLatencyResponse {
  call_id: string;
  source: "persisted_metadata";
  has_latency_data: boolean;
  turns: LiveCallTurnLatency[];
  summaries: Record<string, CallLatencyMetricSummary>;
  stack: CallLatencyStack | null;
}

export interface CallTraceContext {
  source: "call_metadata" | "none";
  correlation_id: string | null;
  traceparent: string | null;
  trace_id: string | null;
  parent_span_id: string | null;
  tracestate: string | null;
}

export interface CallTraceToolIO {
  tool_name: string;
  tool_args: unknown;
  tool_result: unknown;
  duration_ms: number | null;
  status: string;
  error_detail: string | null;
}

export interface CallTraceNodeSummary {
  graph_type: string | null;
  node_name: string;
  started_at_ms: number | null;
  completed_at_ms: number | null;
  latency_ms: number | null;
  ttft_ms: number | null;
  route: string | null;
  next_node_name: string | null;
  llm_roundtrips: number | null;
  retry_count: number | null;
  tools_called: string[];
  prompt_tokens: number | null;
  completion_tokens: number | null;
  tool_io: CallTraceToolIO[];
}

export interface CallTraceRouteSelection {
  seq: number;
  occurred_at_ms: number;
  graph_type: string | null;
  node_name: string | null;
  route: string;
  next_node_name: string | null;
}

export interface CallTraceSummaryResponse {
  call_id: string;
  has_trace_context: boolean;
  trace_context: CallTraceContext;
  event_count: number;
  first_event_at_ms: number | null;
  last_event_at_ms: number | null;
  stack: CallLatencyStack | null;
  nodes: CallTraceNodeSummary[];
  routes: CallTraceRouteSelection[];
}

export interface CallOpsComponentComparison {
  component: "llm" | "stt" | "tts";
  provider: string | null;
  model: string | null;
  language: string | null;
  voice_id: string | null;
  voice_name: string | null;
  sample_count: number;
  average_ms: number | null;
  p95_ms: number | null;
  max_ms: number | null;
}

export interface CallOpsRouteHotspot {
  graph_type: string | null;
  node_name: string;
  route: string | null;
  sample_count: number;
  average_latency_ms: number | null;
  p95_latency_ms: number | null;
  max_latency_ms: number | null;
}

export interface CallObservabilitySummaryResponse {
  sampled_calls: number;
  window_start: string;
  window_end: string;
  stack_comparisons: CallOpsComponentComparison[];
  route_hotspots: CallOpsRouteHotspot[];
}

export interface CallObservabilitySummaryQuery {
  start?: string;
  end?: string;
  limit?: number;
}

export interface AdminCallTraceOptions {
  includeToolPayloads?: boolean;
}

function buildSummaryQueryString(query: CallObservabilitySummaryQuery): string {
  const params = new URLSearchParams();
  if (query.start) {
    params.set("start", query.start);
  }
  if (query.end) {
    params.set("end", query.end);
  }
  if (typeof query.limit === "number") {
    params.set("limit", String(query.limit));
  }
  return params.toString();
}

export function getCallLatency(callId: string): Promise<CallLatencyResponse> {
  return platformApiRequest<CallLatencyResponse>(`/calls/${encodeURIComponent(callId)}/latency`, {
    method: "GET",
  });
}

export function getAdminCallLatency(tenantId: string, callId: string): Promise<CallLatencyResponse> {
  return platformApiRequest<CallLatencyResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/calls/${encodeURIComponent(callId)}/latency`,
    {
      method: "GET",
    },
  );
}

export function getCallTrace(callId: string): Promise<CallTraceSummaryResponse> {
  return platformApiRequest<CallTraceSummaryResponse>(`/calls/${encodeURIComponent(callId)}/trace`, {
    method: "GET",
  });
}

export function getAdminCallTrace(
  tenantId: string,
  callId: string,
  options: AdminCallTraceOptions = {},
): Promise<CallTraceSummaryResponse> {
  const params = new URLSearchParams();
  if (options.includeToolPayloads) {
    params.set("include_tool_payloads", "true");
  }
  const queryString = params.toString();
  const suffix = queryString.length > 0 ? `?${queryString}` : "";
  return platformApiRequest<CallTraceSummaryResponse>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/calls/${encodeURIComponent(callId)}/trace${suffix}`,
    { method: "GET" },
  );
}

export function getCallObservabilitySummary(
  query: CallObservabilitySummaryQuery = {},
): Promise<CallObservabilitySummaryResponse> {
  const queryString = buildSummaryQueryString(query);
  const suffix = queryString.length > 0 ? `?${queryString}` : "";
  return platformApiRequest<CallObservabilitySummaryResponse>(`/calls/observability-summary${suffix}`, {
    method: "GET",
  });
}
