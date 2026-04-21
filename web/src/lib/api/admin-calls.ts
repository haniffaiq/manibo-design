import { platformApiRequest } from "@/lib/api/platform";

export type CallState = "ringing" | "in_progress" | "on_hold" | "supervised" | "wrapping_up" | "ended" | "failed";
export type CallEndReason = "completed" | "caller_hangup" | "agent_hangup" | "supervisor_end" | "error" | "timeout";
export type CallChannel = "pstn" | "sip" | "web" | "test";
export type TranscriptRole = "caller" | "agent" | "supervisor" | "system";
export type EventKind = "state_change" | "model_invocation" | "asr_event" | "tts_event" | "dtmf" | "handoff" | "supervisor_action" | "log";
export type EventSeverity = "debug" | "info" | "warn" | "warning" | "error";
export type ToolStatus = "ok" | "error" | "timeout" | "cancelled";

export interface AdminLiveCall {
  id: string;
  tenant_id: string;
  tenant_name: string;
  agent_id: string;
  agent_name: string;
  agent_version: string;
  state: CallState;
  direction: "inbound" | "outbound";
  caller_number: string;
  caller_name: string | null;
  callee_number: string;
  channel: CallChannel;
  started_at: string;
  duration_ms: number;
  current_intent: string | null;
  cost_cents: number;
  latency_ms: number | null;
  tools: string[];
}

export interface AdminHistoricalCall {
  id: string;
  tenant_id: string;
  tenant_name: string;
  agent_name: string;
  state: CallState;
  end_reason: CallEndReason;
  direction: "inbound" | "outbound";
  caller_number: string;
  caller_name: string | null;
  callee_number: string;
  channel: CallChannel;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  cost_cents: number;
  current_intent: string | null;
  tools: string[];
  supervised_by: string | null;
}

export interface TranscriptTurn {
  id: string;
  seq: number;
  role: TranscriptRole;
  started_at_ms: number;
  ended_at_ms: number;
  text: string;
  confidence: number;
  language: string;
}

export interface CallEvent {
  id: string;
  at_ms: number;
  kind: EventKind;
  severity: EventSeverity;
  payload: Record<string, unknown>;
  label: string;
}

export interface ToolExecution {
  id: string;
  turn_id: string | null;
  tool_name: string;
  tool_version: string;
  started_at_ms: number;
  ended_at_ms: number;
  status: ToolStatus;
  arguments: Record<string, unknown>;
  result: unknown;
  error?: { code: string; message: string } | null;
  latency_ms: number;
}

export interface CallRecording {
  id: string;
  codec: string;
  sample_rate: number;
  channels: number;
  duration_ms: number;
  bytes: number;
  waveform_peaks_uri: string | null;
}

export interface AdminCallReplay {
  call: AdminLiveCall & {
    end_reason?: CallEndReason;
    ended_at?: string;
    recording_uri?: string;
  };
  transcript: TranscriptTurn[];
  events: CallEvent[];
  tool_executions: ToolExecution[];
  recording: CallRecording | null;
}

export function listAdminLiveCalls(): Promise<{ calls: AdminLiveCall[] }> {
  return platformApiRequest<{ calls: AdminLiveCall[] }>("/admin/calls/live", { method: "GET" });
}

export function listAdminCallHistory(params?: {
  tenant_id?: string;
  agent_name?: string;
  end_reason?: string;
  started_after?: string;
  started_before?: string;
}): Promise<{ calls: AdminHistoricalCall[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.tenant_id) query.set("tenant_id", params.tenant_id);
  if (params?.agent_name) query.set("agent_name", params.agent_name);
  if (params?.end_reason) query.set("end_reason", params.end_reason);
  if (params?.started_after) query.set("started_after", params.started_after);
  if (params?.started_before) query.set("started_before", params.started_before);
  const qs = query.toString();
  return platformApiRequest<{ calls: AdminHistoricalCall[]; total: number }>(
    `/admin/calls/history${qs ? `?${qs}` : ""}`,
    { method: "GET" },
  );
}

export function getAdminCallReplay(callId: string): Promise<AdminCallReplay> {
  return platformApiRequest<AdminCallReplay>(
    `/admin/calls/${encodeURIComponent(callId)}/replay`,
    { method: "GET" },
  );
}
