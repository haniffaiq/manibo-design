import {
  getAdminObservabilityChannelRuntimeDetail,
  getAdminObservabilityChannelRuntimeTimeline,
  getAdminObservabilityInteractiveChannelDetail,
  getAdminObservabilityInteractiveChannelTimeline,
  getAdminObservabilityCallDetail,
  getAdminObservabilityCallTimeline,
  getAdminObservabilityControlPlaneIncidentDetail,
  getAdminObservabilityControlPlaneIncidentTimeline,
  getAdminObservabilityTenantCompositionDetail,
  getAdminObservabilityTenantCompositionTimeline,
  getAdminObservabilityWorkflowDetail,
  getAdminObservabilityWorkflowTimeline,
  getObservabilityChannelRuntimeDetail,
  getObservabilityChannelRuntimeTimeline,
  getObservabilityInteractiveChannelDetail,
  getObservabilityInteractiveChannelTimeline,
  getObservabilityCallDetail,
  getObservabilityCallTimeline,
  getObservabilityControlPlaneIncidentDetail,
  getObservabilityControlPlaneIncidentTimeline,
  getObservabilityWorkflowDetail,
  getObservabilityWorkflowTimeline,
  getObservabilityTenantCompositionDetail,
  getObservabilityTenantCompositionTimeline,
  type ObservabilityRunDetailResponse,
  type ObservabilityTimelineQuery,
  type ObservabilityTimelineResponse,
} from "@/lib/api/observability";
import type { ObservabilitySelection } from "@/lib/observability-routes";

import type { Scope } from "./types";
import { TIMELINE_PAGE_SIZE } from "./types";

/* ------------------------------------------------------------------ */
/*  Data loaders                                                      */
/* ------------------------------------------------------------------ */

type NonNullSelection = Exclude<ObservabilitySelection, null>;

interface ObservabilityDispatchEntry {
  adminDetail: (tenantId: string) => Promise<ObservabilityRunDetailResponse>;
  tenantDetail: () => Promise<ObservabilityRunDetailResponse>;
  adminTimeline: (tenantId: string, query: ObservabilityTimelineQuery) => Promise<ObservabilityTimelineResponse>;
  tenantTimeline: (query: ObservabilityTimelineQuery) => Promise<ObservabilityTimelineResponse>;
}

function dispatchFor(selection: NonNullSelection): ObservabilityDispatchEntry {
  switch (selection.kind) {
    case "call_session":
      return {
        adminDetail: (t) => getAdminObservabilityCallDetail(t, selection.callId),
        tenantDetail: () => getObservabilityCallDetail(selection.callId),
        adminTimeline: (t, q) => getAdminObservabilityCallTimeline(t, selection.callId, q),
        tenantTimeline: (q) => getObservabilityCallTimeline(selection.callId, q),
      };
    case "interactive_channel_session":
      return {
        adminDetail: (t) => getAdminObservabilityInteractiveChannelDetail(t, selection.channelSessionId),
        tenantDetail: () => getObservabilityInteractiveChannelDetail(selection.channelSessionId),
        adminTimeline: (t, q) => getAdminObservabilityInteractiveChannelTimeline(t, selection.channelSessionId, q),
        tenantTimeline: (q) => getObservabilityInteractiveChannelTimeline(selection.channelSessionId, q),
      };
    case "workflow_run":
      return {
        adminDetail: (t) => getAdminObservabilityWorkflowDetail(t, selection.workflowId, selection.runId),
        tenantDetail: () => getObservabilityWorkflowDetail(selection.workflowId, selection.runId),
        adminTimeline: (t, q) => getAdminObservabilityWorkflowTimeline(t, selection.workflowId, selection.runId, q),
        tenantTimeline: (q) => getObservabilityWorkflowTimeline(selection.workflowId, selection.runId, q),
      };
    case "control_plane_incident":
      return {
        adminDetail: (t) => getAdminObservabilityControlPlaneIncidentDetail(t, selection.incidentId),
        tenantDetail: () => getObservabilityControlPlaneIncidentDetail(selection.incidentId),
        adminTimeline: (t, q) => getAdminObservabilityControlPlaneIncidentTimeline(t, selection.incidentId, q),
        tenantTimeline: (q) => getObservabilityControlPlaneIncidentTimeline(selection.incidentId, q),
      };
    case "channel_runtime":
      return {
        adminDetail: (t) => getAdminObservabilityChannelRuntimeDetail(t, selection.runtimeId),
        tenantDetail: () => getObservabilityChannelRuntimeDetail(selection.runtimeId),
        adminTimeline: (t, q) => getAdminObservabilityChannelRuntimeTimeline(t, selection.runtimeId, q),
        tenantTimeline: (q) => getObservabilityChannelRuntimeTimeline(selection.runtimeId, q),
      };
    case "tenant_composition":
      return {
        adminDetail: (t) => getAdminObservabilityTenantCompositionDetail(t, selection.compositionId),
        tenantDetail: () => getObservabilityTenantCompositionDetail(selection.compositionId),
        adminTimeline: (t, q) => getAdminObservabilityTenantCompositionTimeline(t, selection.compositionId, q),
        tenantTimeline: (q) => getObservabilityTenantCompositionTimeline(selection.compositionId, q),
      };
  }
}

export async function loadRunDetail(
  scope: Scope,
  selection: NonNullSelection,
  tenantId: string | null,
): Promise<ObservabilityRunDetailResponse> {
  const entry = dispatchFor(selection);
  return scope === "admin" ? entry.adminDetail(tenantId ?? "") : entry.tenantDetail();
}

export async function loadTimelinePage(
  scope: Scope,
  selection: NonNullSelection,
  tenantId: string | null,
  cursor?: string,
): Promise<ObservabilityTimelineResponse> {
  const entry = dispatchFor(selection);
  const query: ObservabilityTimelineQuery = { cursor, limit: TIMELINE_PAGE_SIZE };
  return scope === "admin" ? entry.adminTimeline(tenantId ?? "", query) : entry.tenantTimeline(query);
}
