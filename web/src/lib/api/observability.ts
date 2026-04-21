import { platformApiRequest } from "@/lib/api/platform";
import type { SolutionObservabilityCaseDetailField, SolutionObservabilityEnricher, SolutionObservabilityEvidenceItem, SolutionObservabilityRelatedAction, SolutionObservabilityTimelineDecorator } from "@/lib/api/observability-enrichers";
import type { ObservabilityTimelineSeverity } from "@/lib/api/observability-shared";

export type { SolutionObservabilityCaseDetailField, SolutionObservabilityEnricher, SolutionObservabilityEvidenceItem, SolutionObservabilityRelatedAction, SolutionObservabilityTimelineDecorator } from "@/lib/api/observability-enrichers";
export type { ObservabilityTimelineSeverity } from "@/lib/api/observability-shared";

export type ObservabilityRunKind = "call_session" | "workflow_run" | "interactive_channel_session" | "control_plane_incident" | "channel_runtime" | "tenant_composition";
export type ComparableObservabilityRunKind = "call_session" | "workflow_run" | "interactive_channel_session";
export type ObservabilityListKind = "all" | ObservabilityRunKind;
export type ObservabilityTimelineKind = "system" | "transcript" | "log" | "node" | "route" | "metric" | "recording" | "workflow_step" | "tool";

export interface ObservabilityRunSummary {
  kind: ObservabilityRunKind;
  subject_id: string;
  title: string;
  subtitle: string | null;
  status: string;
  started_at: string | null;
  ended_at: string | null;
  duration_ms: number | null;
  call_id: string | null;
  workflow_id: string | null;
  run_id: string | null;
  channel_session_id: string | null;
  conversation_id: string | null;
  correlation_id: string | null;
  composition_version: string | null;
  artifact_hash: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  solution_name: string | null;
  assistant_name: string | null;
  trace_available: boolean;
  recording_available: boolean;
  warning_count: number;
  error_count: number;
}

export interface ObservabilityMetric {
  key: string;
  label: string;
  value: string;
  value_ms: number | null;
}

export interface ObservabilitySummaryInsight {
  key: string;
  label: string;
  detail: string;
  severity: ObservabilityTimelineSeverity;
}

export interface ObservabilityRecording {
  id: string;
  status: string;
  created_at: string;
  signed_url_path: string;
}

export interface ObservabilityAvailability {
  recording_unavailable: boolean;
  timeline_partial: boolean;
  logs_unavailable: boolean;
  trace_unavailable: boolean;
}

export interface ObservabilityRelatedEntity {
  label: string;
  href: string;
}

export interface ObservabilityRecommendedAction {
  key: string;
  label: string;
  detail: string;
  href: string | null;
  cta_label: string | null;
  severity: ObservabilityTimelineSeverity;
}

export interface ObservabilityIntegrityGap {
  key: string;
  label: string;
  detail: string;
  severity: ObservabilityTimelineSeverity;
}

export interface ObservabilityTimelineItem {
  id: string;
  kind: ObservabilityTimelineKind;
  severity: ObservabilityTimelineSeverity;
  occurred_at: string | null;
  occurred_at_ms: number | null;
  label: string;
  detail: string | null;
  actor: string | null;
  duration_ms: number | null;
  correlation_id: string | null;
  payload: Record<string, unknown>;
}

export interface ObservabilityFacetValue {
  value: string;
  label: string;
  count: number;
}

export interface ObservabilityFacetCounts {
  kinds: ObservabilityFacetValue[];
  statuses: ObservabilityFacetValue[];
  tenants: ObservabilityFacetValue[];
  solutions: ObservabilityFacetValue[];
  assistants: ObservabilityFacetValue[];
}

export interface ObservabilityRunsResponse {
  runs: ObservabilityRunSummary[];
  facets: ObservabilityFacetCounts;
}

export interface ObservabilityChannelRuntimeSummary {
  widget_id: string;
  tenant_id: string | null;
  tenant_name: string | null;
  title: string;
  channel_type: string;
  status: string;
  auth_state: string;
  webhook_state: string;
  delivery_state: string;
  latest_activity_at: string | null;
  correlation_id: string | null;
  composition_version: string | null;
  artifact_hash: string | null;
  session_count: number;
  active_session_count: number;
  blocked_session_count: number;
  expired_session_count: number;
  captured_submission_count: number;
  lead_delivered_count: number;
  delivery_failure_count: number;
  escalation_count: number;
  warning_count: number;
  error_count: number;
  degraded_reasons: string[];
}

export interface ObservabilityChannelRuntimeListResponse {
  runtimes: ObservabilityChannelRuntimeSummary[];
}

export interface ObservabilityChannelRuntimeDetailResponse {
  summary: ObservabilityChannelRuntimeSummary;
  availability: ObservabilityAvailability;
  metrics: ObservabilityMetric[];
  summary_insights: ObservabilitySummaryInsight[];
  context_fields: ObservabilityCompareContextField[];
  related_entities: ObservabilityRelatedEntity[];
}

export interface ObservabilityChannelRuntimeTimelineResponse {
  summary: ObservabilityChannelRuntimeSummary;
  availability: ObservabilityAvailability;
  items: ObservabilityTimelineItem[];
  next_cursor: string | null;
  returned: number;
  total_items: number;
}

export interface ObservabilityRunDetailResponse {
  summary: ObservabilityRunSummary;
  availability: ObservabilityAvailability;
  metrics: ObservabilityMetric[];
  summary_insights: ObservabilitySummaryInsight[];
  recommended_actions: ObservabilityRecommendedAction[];
  integrity_gaps: ObservabilityIntegrityGap[];
  recordings: ObservabilityRecording[];
  context_fields: ObservabilityCompareContextField[];
  trace_context: Record<string, unknown>;
  transcript_text: string | null;
  related_entities: ObservabilityRelatedEntity[];
  solution_enrichers: SolutionObservabilityEnricher[];
}

export interface ObservabilityTimelineResponse {
  summary: ObservabilityRunSummary;
  availability: ObservabilityAvailability;
  items: ObservabilityTimelineItem[];
  next_cursor: string | null;
  returned: number;
  total_items: number;
}

export interface ObservabilityCompareMetricDelta {
  key: string;
  label: string;
  left_value: string;
  right_value: string;
  delta_value: string | null;
}

export interface ObservabilityCompareContextField {
  key: string;
  label: string;
  value: string;
}

export interface ObservabilityCompareContextDelta {
  key: string;
  label: string;
  left_value: string | null;
  right_value: string | null;
  changed: boolean;
}

export interface ObservabilityCompareValueSet {
  shared: string[];
  left_only: string[];
  right_only: string[];
}

export interface ObservabilityCompareSnapshot {
  summary: ObservabilityRunSummary;
  availability: ObservabilityAvailability;
  key_metrics: ObservabilityMetric[];
  transcript_excerpt: string | null;
  tool_names: string[];
  context_fields: ObservabilityCompareContextField[];
  related_entities: ObservabilityRelatedEntity[];
}

export interface ObservabilityCompareResponse {
  kind: ObservabilityRunKind;
  left: ObservabilityCompareSnapshot;
  right: ObservabilityCompareSnapshot;
  duration_delta_ms: number | null;
  warning_delta: number;
  error_delta: number;
  metric_deltas: ObservabilityCompareMetricDelta[];
  context_deltas: ObservabilityCompareContextDelta[];
  tool_usage: ObservabilityCompareValueSet;
  node_usage: ObservabilityCompareValueSet;
  route_usage: ObservabilityCompareValueSet;
  workflow_step_usage: ObservabilityCompareValueSet;
}

export interface RecordingSignedUrlResponse {
  url: string;
  expires_in_seconds: number;
}

export interface ListObservabilityRunsQuery {
  kind?: ObservabilityListKind;
  query?: string;
  status?: string;
  start?: string;
  end?: string;
  limit?: number;
  solution?: string;
  assistant?: string;
  error_only?: boolean;
  recordings_only?: boolean;
  recording_unavailable_only?: boolean;
  needs_review_only?: boolean;
  min_duration_ms?: number;
}

export interface ListAdminObservabilityRunsQuery extends ListObservabilityRunsQuery {
  tenant_id?: string;
  include_non_production?: boolean;
}

export interface GetObservabilityRunDetailQuery {
  kind: ObservabilityRunKind;
  call_id?: string;
  channel_session_id?: string;
  workflow_id?: string;
  run_id?: string;
  subject_id?: string;
}

export interface GetAdminObservabilityRunDetailQuery extends GetObservabilityRunDetailQuery {
  tenant_id: string;
}

export interface ListObservabilityChannelRuntimesQuery {
  query?: string;
  status?: string;
  limit?: number;
}

export interface ListAdminObservabilityChannelRuntimesQuery extends ListObservabilityChannelRuntimesQuery {
  tenant_id?: string;
}

export interface ObservabilityTimelineQuery {
  cursor?: string;
  limit?: number;
}

export interface AdminObservabilityTimelineQuery extends ObservabilityTimelineQuery {
  tenant_id: string;
}

export interface CompareObservabilityRunsQuery {
  kind: ComparableObservabilityRunKind;
  left: string;
  right: string;
}

export interface CompareAdminObservabilityRunsQuery extends CompareObservabilityRunsQuery {
  tenant_id: string;
}

function buildQuery(params: Record<string, string | number | boolean | null | undefined> | object): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, string | number | boolean | null | undefined>)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }
    searchParams.set(key, String(value));
  }
  const suffix = searchParams.toString();
  return suffix ? `?${suffix}` : "";
}

export function encodeWorkflowRunPath(workflowId: string, runId: string): string {
  return [...workflowId.split("/"), runId].map((segment) => encodeURIComponent(segment)).join("/");
}

export function compareKeyForRun(run: ObservabilityRunSummary): string {
  if (run.kind === "call_session") {
    return run.call_id ?? "";
  }
  if (run.kind === "interactive_channel_session") {
    return run.channel_session_id ?? "";
  }
  if (run.kind === "workflow_run") {
    return run.workflow_id && run.run_id ? `${run.workflow_id}/${run.run_id}` : "";
  }
  return "";
}

export function listObservabilityRuns(query: ListObservabilityRunsQuery = {}): Promise<ObservabilityRunsResponse> {
  return platformApiRequest<ObservabilityRunsResponse>(`/observability/runs${buildQuery(query)}`, {
    method: "GET",
  });
}

export function listAdminObservabilityRuns(query: ListAdminObservabilityRunsQuery = {}): Promise<ObservabilityRunsResponse> {
  return platformApiRequest<ObservabilityRunsResponse>(`/admin/observability/runs${buildQuery(query)}`, {
    method: "GET",
  });
}

export function getObservabilityRunDetail(
  query: GetObservabilityRunDetailQuery,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(`/observability/run-detail${buildQuery(query)}`, {
    method: "GET",
  });
}

export function getAdminObservabilityRunDetail(
  query: GetAdminObservabilityRunDetailQuery,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(`/admin/observability/run-detail${buildQuery(query)}`, {
    method: "GET",
  });
}

export function listObservabilityChannelRuntimeWidgets(
  query: ListObservabilityChannelRuntimesQuery = {},
): Promise<ObservabilityChannelRuntimeListResponse> {
  return platformApiRequest<ObservabilityChannelRuntimeListResponse>(
    `/observability/channel-runtimes${buildQuery(query)}`,
    {
      method: "GET",
    },
  );
}

export function listAdminObservabilityChannelRuntimeWidgets(
  query: ListAdminObservabilityChannelRuntimesQuery = {},
): Promise<ObservabilityChannelRuntimeListResponse> {
  return platformApiRequest<ObservabilityChannelRuntimeListResponse>(
    `/admin/observability/channel-runtimes${buildQuery(query)}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityChannelRuntimeWidgetDetail(
  widgetId: string,
): Promise<ObservabilityChannelRuntimeDetailResponse> {
  return platformApiRequest<ObservabilityChannelRuntimeDetailResponse>(
    `/observability/channel-runtimes/${encodeURIComponent(widgetId)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityChannelRuntimeWidgetDetail(
  tenantId: string,
  widgetId: string,
): Promise<ObservabilityChannelRuntimeDetailResponse> {
  return platformApiRequest<ObservabilityChannelRuntimeDetailResponse>(
    `/admin/observability/channel-runtimes/${encodeURIComponent(widgetId)}${buildQuery({ tenant_id: tenantId })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityChannelRuntimeWidgetTimeline(
  widgetId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityChannelRuntimeTimelineResponse> {
  return platformApiRequest<ObservabilityChannelRuntimeTimelineResponse>(
    `/observability/channel-runtimes/${encodeURIComponent(widgetId)}/timeline${buildQuery(query)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityChannelRuntimeWidgetTimeline(
  tenantId: string,
  widgetId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityChannelRuntimeTimelineResponse> {
  return platformApiRequest<ObservabilityChannelRuntimeTimelineResponse>(
    `/admin/observability/channel-runtimes/${encodeURIComponent(widgetId)}/timeline${buildQuery({
      tenant_id: tenantId,
      ...query,
    })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityCallDetail(callId: string): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(`/observability/runs/call_session/${encodeURIComponent(callId)}`, {
    method: "GET",
  });
}

export function getAdminObservabilityCallDetail(
  tenantId: string,
  callId: string,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(
    `/admin/observability/runs/call_session/${encodeURIComponent(callId)}${buildQuery({ tenant_id: tenantId })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityCallTimeline(
  callId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/observability/runs/call_session/${encodeURIComponent(callId)}/timeline${buildQuery(query)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityCallTimeline(
  tenantId: string,
  callId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/admin/observability/runs/call_session/${encodeURIComponent(callId)}/timeline${buildQuery({
      tenant_id: tenantId,
      ...query,
    })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityWorkflowDetail(
  workflowId: string,
  runId: string,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(
    `/observability/runs/workflow_run/${encodeWorkflowRunPath(workflowId, runId)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityWorkflowDetail(
  tenantId: string,
  workflowId: string,
  runId: string,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(
    `/admin/observability/runs/workflow_run/${encodeWorkflowRunPath(workflowId, runId)}${buildQuery({
      tenant_id: tenantId,
    })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityWorkflowTimeline(
  workflowId: string,
  runId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/observability/runs/workflow_run/${encodeWorkflowRunPath(workflowId, runId)}/timeline${buildQuery(query)}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityInteractiveChannelDetail(
  channelSessionId: string,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(
    `/observability/runs/interactive_channel_session/${encodeURIComponent(channelSessionId)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityInteractiveChannelDetail(
  tenantId: string,
  channelSessionId: string,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(
    `/admin/observability/runs/interactive_channel_session/${encodeURIComponent(channelSessionId)}${buildQuery({
      tenant_id: tenantId,
    })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityInteractiveChannelTimeline(
  channelSessionId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/observability/runs/interactive_channel_session/${encodeURIComponent(channelSessionId)}/timeline${buildQuery(query)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityInteractiveChannelTimeline(
  tenantId: string,
  channelSessionId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/admin/observability/runs/interactive_channel_session/${encodeURIComponent(channelSessionId)}/timeline${buildQuery({
      tenant_id: tenantId,
      ...query,
    })}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityWorkflowTimeline(
  tenantId: string,
  workflowId: string,
  runId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/admin/observability/runs/workflow_run/${encodeWorkflowRunPath(workflowId, runId)}/timeline${buildQuery({
      tenant_id: tenantId,
      ...query,
    })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityControlPlaneIncidentDetail(
  incidentId: string,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(
    `/observability/runs/control_plane_incident/${encodeURIComponent(incidentId)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityControlPlaneIncidentDetail(
  tenantId: string,
  incidentId: string,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(
    `/admin/observability/runs/control_plane_incident/${encodeURIComponent(incidentId)}${buildQuery({
      tenant_id: tenantId,
    })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityControlPlaneIncidentTimeline(
  incidentId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/observability/runs/control_plane_incident/${encodeURIComponent(incidentId)}/timeline${buildQuery(query)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityControlPlaneIncidentTimeline(
  tenantId: string,
  incidentId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/admin/observability/runs/control_plane_incident/${encodeURIComponent(incidentId)}/timeline${buildQuery({
      tenant_id: tenantId,
      ...query,
    })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityChannelRuntimeDetail(
  runtimeId: string,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(
    `/observability/runs/channel_runtime/${encodeURIComponent(runtimeId)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityChannelRuntimeDetail(
  tenantId: string,
  runtimeId: string,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(
    `/admin/observability/runs/channel_runtime/${encodeURIComponent(runtimeId)}${buildQuery({
      tenant_id: tenantId,
    })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityChannelRuntimeTimeline(
  runtimeId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/observability/runs/channel_runtime/${encodeURIComponent(runtimeId)}/timeline${buildQuery(query)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityChannelRuntimeTimeline(
  tenantId: string,
  runtimeId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/admin/observability/runs/channel_runtime/${encodeURIComponent(runtimeId)}/timeline${buildQuery({
      tenant_id: tenantId,
      ...query,
    })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityTenantCompositionDetail(
  compositionId: string,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(
    `/observability/runs/tenant_composition/${encodeURIComponent(compositionId)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityTenantCompositionDetail(
  tenantId: string,
  compositionId: string,
): Promise<ObservabilityRunDetailResponse> {
  return platformApiRequest<ObservabilityRunDetailResponse>(
    `/admin/observability/runs/tenant_composition/${encodeURIComponent(compositionId)}${buildQuery({
      tenant_id: tenantId,
    })}`,
    {
      method: "GET",
    },
  );
}

export function getObservabilityTenantCompositionTimeline(
  compositionId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/observability/runs/tenant_composition/${encodeURIComponent(compositionId)}/timeline${buildQuery(query)}`,
    {
      method: "GET",
    },
  );
}

export function getAdminObservabilityTenantCompositionTimeline(
  tenantId: string,
  compositionId: string,
  query: ObservabilityTimelineQuery = {},
): Promise<ObservabilityTimelineResponse> {
  return platformApiRequest<ObservabilityTimelineResponse>(
    `/admin/observability/runs/tenant_composition/${encodeURIComponent(compositionId)}/timeline${buildQuery({
      tenant_id: tenantId,
      ...query,
    })}`,
    {
      method: "GET",
    },
  );
}

export function compareObservabilityRuns(
  query: CompareObservabilityRunsQuery,
): Promise<ObservabilityCompareResponse> {
  return platformApiRequest<ObservabilityCompareResponse>(`/observability/runs/compare${buildQuery(query)}`, {
    method: "GET",
  });
}

export function compareAdminObservabilityRuns(
  query: CompareAdminObservabilityRunsQuery,
): Promise<ObservabilityCompareResponse> {
  return platformApiRequest<ObservabilityCompareResponse>(`/admin/observability/runs/compare${buildQuery(query)}`, {
    method: "GET",
  });
}

export function getObservabilityRecordingSignedUrl(
  signedUrlPath: string,
  expiresInSeconds = 3600,
): Promise<RecordingSignedUrlResponse> {
  const separator = signedUrlPath.includes("?") ? "&" : "?";
  return platformApiRequest<RecordingSignedUrlResponse>(
    `${signedUrlPath}${separator}expires_in_seconds=${encodeURIComponent(String(expiresInSeconds))}`,
    { method: "GET" },
  );
}
