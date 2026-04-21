# Data Models Reference — Calls + Agent Builder

Complete reference of all TypeScript types used. Copy-paste into the target repo.

---

## Calls Module

### File: `web/src/lib/api/admin-calls.ts`

```typescript
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
```

---

## Agent Builder Module

### File: `web/src/lib/mock/agent-builder-fixtures.ts` (types only)

```typescript
export type ModelProviderId = "openai" | "anthropic" | "google";
export interface ModelOption {
  id: string;
  label: string;
  context_window: number;
  notes?: string;
}
export interface ModelProvider {
  id: ModelProviderId;
  label: string;
  models: ModelOption[];
}

export type VoiceProviderId = "azure" | "elevenlabs" | "openai_tts";
export type VoiceGender = "female" | "male" | "neutral";
export interface VoiceOption {
  id: string;
  label: string;
  gender: VoiceGender;
  language: string;
}
export interface VoiceProvider {
  id: VoiceProviderId;
  label: string;
  voices: VoiceOption[];
}

export type TranscriberProviderId = "deepgram" | "openai_whisper" | "azure_stt";
export interface TranscriberOption {
  id: string;
  label: string;
  languages: string[];
}
export interface TranscriberProvider {
  id: TranscriberProviderId;
  label: string;
  models: TranscriberOption[];
}

export type ToolParamType = "string" | "number" | "boolean" | "object" | "array";
export interface ToolParam {
  name: string;
  type: ToolParamType;
  required: boolean;
  description: string;
}
export interface ToolCatalogEntry {
  id: string;
  name: string;
  description: string;
  parameters: ToolParam[];
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaults: {
    modelProviderId: ModelProviderId;
    modelId: string;
    voiceProviderId: VoiceProviderId;
    voiceId: string;
    language: string;
    systemPrompt: string;
    firstMessage: string;
    tools: string[];
  };
}

export type StreamFrameKind = "transcript" | "event" | "state";
export interface StreamFrame {
  delayMs: number;
  kind: StreamFrameKind;
  payload: unknown;
}
```

### File: `web/src/lib/api/agent-builder-catalogs.ts`

```typescript
import { platformApiRequest } from "@/lib/api/platform";
import type {
  AgentTemplate,
  ModelProvider,
  ToolCatalogEntry,
  TranscriberProvider,
  VoiceProvider,
} from "@/lib/mock/agent-builder-fixtures";

export type {
  AgentTemplate, ModelOption, ModelProvider, ModelProviderId,
  ToolCatalogEntry, ToolParam, ToolParamType,
  TranscriberOption, TranscriberProvider, TranscriberProviderId,
  VoiceGender, VoiceOption, VoiceProvider, VoiceProviderId,
} from "@/lib/mock/agent-builder-fixtures";

export function getModelProviders(): Promise<ModelProvider[]> {
  return platformApiRequest<ModelProvider[]>("/admin/model-providers", { method: "GET" });
}

export function getVoiceProviders(): Promise<VoiceProvider[]> {
  return platformApiRequest<VoiceProvider[]>("/admin/voice-providers", { method: "GET" });
}

export function getTranscriberProviders(): Promise<TranscriberProvider[]> {
  return platformApiRequest<TranscriberProvider[]>("/admin/transcriber-providers", { method: "GET" });
}

export function getToolCatalog(): Promise<ToolCatalogEntry[]> {
  return platformApiRequest<ToolCatalogEntry[]>("/admin/tool-catalog", { method: "GET" });
}

export function getAgentTemplates(): Promise<AgentTemplate[]> {
  return platformApiRequest<AgentTemplate[]>("/admin/agent-templates", { method: "GET" });
}
```

### File: `web/src/app/(deployment)/admin/agent-definitions/components/agent-config-types.ts`

```typescript
export interface ExtractionField {
  name: string;
  jsonPath: string;
  type: "string" | "number" | "boolean" | "enum";
}

export interface AgentConfig {
  modelProviderId: string;
  modelId: string;
  firstMessageMode: "assistant_first" | "user_first" | "wait_greeting";
  firstMessage: string;
  systemPrompt: string;
  voiceProviderId: string;
  voiceId: string;
  language: string;
  activeTools: string[];
  analysisSummaryPrompt: string;
  analysisCriteria: string;
  extractionFields: ExtractionField[];
  transcriberProviderId: string;
  transcriberModelId: string;
  retentionDays: number;
  piiRedaction: boolean;
}
```
