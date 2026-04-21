import {
  compareKeyForRun,
  encodeWorkflowRunPath,
  type ObservabilityRunSummary,
  type ObservabilityRunKind,
  type ComparableObservabilityRunKind,
} from "@/lib/api/observability";

export type ObservabilityScope = "tenant" | "admin";

export type ObservabilitySelection =
  | {
      kind: "call_session";
      subjectId: string;
      callId: string;
    }
  | {
      kind: "interactive_channel_session";
      channelSessionId: string;
    }
  | {
      kind: "workflow_run";
      subjectId: string;
      workflowId: string;
      runId: string;
    }
  | {
      kind: "control_plane_incident";
      subjectId: string;
      incidentId: string;
    }
  | {
      kind: "channel_runtime";
      subjectId: string;
      runtimeId: string;
    }
  | {
      kind: "tenant_composition";
      subjectId: string;
      compositionId: string;
    }
  | null;

function scopeBasePath(scope: ObservabilityScope): string {
  return scope === "admin" ? "/admin/observability" : "/observability";
}

export function observabilitySelectionKey(selection: ObservabilitySelection): string | null {
  if (!selection) {
    return null;
  }
  if (selection.kind === "call_session") {
    return `call:${selection.callId}`;
  }
  if (selection.kind === "interactive_channel_session") {
    return `channel:${selection.channelSessionId}`;
  }
  if (selection.kind === "workflow_run") {
    return `workflow:${selection.workflowId}:${selection.runId}`;
  }
  return `${selection.kind}:${selection.subjectId}`;
}

export function selectionFromRun(run: ObservabilityRunSummary): ObservabilitySelection {
  if (run.kind === "call_session" && run.call_id) {
    return { kind: "call_session", subjectId: run.subject_id || run.call_id, callId: run.call_id };
  }
  if (run.kind === "interactive_channel_session" && run.channel_session_id) {
    return { kind: "interactive_channel_session", channelSessionId: run.channel_session_id };
  }
  if (run.workflow_id && run.run_id) {
    return {
      kind: "workflow_run",
      subjectId: run.subject_id || `${run.workflow_id}/${run.run_id}`,
      workflowId: run.workflow_id,
      runId: run.run_id,
    };
  }
  if (run.kind === "control_plane_incident") {
    return {
      kind: "control_plane_incident",
      subjectId: run.subject_id || "control-plane-incident",
      incidentId: run.subject_id || "control-plane-incident",
    };
  }
  if (run.kind === "channel_runtime") {
    return { kind: "channel_runtime", subjectId: run.subject_id || "channel-runtime", runtimeId: run.subject_id || "channel-runtime" };
  }
  if (run.kind === "tenant_composition") {
    return {
      kind: "tenant_composition",
      subjectId: run.subject_id || "tenant-composition",
      compositionId: run.subject_id || "tenant-composition",
    };
  }
  return null;
}

export function compareKeyFromSelection(selection: ObservabilitySelection): string | null {
  if (!selection) {
    return null;
  }
  if (selection.kind === "call_session") {
    return selection.callId;
  }
  if (selection.kind === "interactive_channel_session") {
    return selection.channelSessionId;
  }
  if (selection.kind === "workflow_run") {
    return `${selection.workflowId}/${selection.runId}`;
  }
  return null;
}

export function observabilityRunHref(
  scope: ObservabilityScope,
  run: ObservabilityRunSummary,
  params?: URLSearchParams | ReadonlyURLSearchParams,
): string {
  const selection = selectionFromRun(run);
  if (!selection) {
    return scopeBasePath(scope);
  }
  return observabilitySelectionHref(scope, selection, params, run.tenant_id ?? undefined);
}

export function observabilitySelectionHref(
  scope: ObservabilityScope,
  selection: Exclude<ObservabilitySelection, null>,
  params?: URLSearchParams | ReadonlyURLSearchParams,
  tenantId?: string,
): string {
  const nextParams = new URLSearchParams(params?.toString() ?? "");
  if (scope === "admin") {
    if (tenantId) {
      nextParams.set("tenant_id", tenantId);
    } else {
      nextParams.delete("tenant_id");
    }
  } else {
    nextParams.delete("tenant_id");
  }

  const base = scopeBasePath(scope);
  let path = base;
  if (selection.kind === "call_session") {
    path = `${base}/sessions/${encodeURIComponent(selection.callId)}`;
  } else if (selection.kind === "interactive_channel_session") {
    path = `${base}/channel-sessions/${encodeURIComponent(selection.channelSessionId)}`;
  } else if (selection.kind === "workflow_run") {
    path = `${base}/workflow-runs/${encodeWorkflowRunPath(selection.workflowId, selection.runId)}`;
  } else if (selection.kind === "control_plane_incident") {
    path = `${base}/control-plane-incidents/${encodeURIComponent(selection.incidentId)}`;
  } else if (selection.kind === "channel_runtime") {
    path = `${base}/channel-runtimes/${encodeURIComponent(selection.runtimeId)}`;
  } else if (selection.kind === "tenant_composition") {
    path = `${base}/composition/${encodeURIComponent(selection.compositionId)}`;
  }
  const suffix = nextParams.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function observabilityListHref(
  scope: ObservabilityScope,
  params?: URLSearchParams | ReadonlyURLSearchParams,
): string {
  const nextParams = new URLSearchParams(params?.toString() ?? "");
  nextParams.delete("tenant_id");
  const suffix = nextParams.toString();
  const base = scopeBasePath(scope);
  return suffix ? `${base}?${suffix}` : base;
}

export function compareKeyFromRun(run: ObservabilityRunSummary): string | null {
  const key = compareKeyForRun(run);
  return key || null;
}

export function isComparableSelection(
  selection: ObservabilitySelection,
): selection is Exclude<ObservabilitySelection, null> & { kind: ComparableObservabilityRunKind } {
  return (
    selection?.kind === "call_session"
    || selection?.kind === "workflow_run"
    || selection?.kind === "interactive_channel_session"
  );
}

type ReadonlyURLSearchParams = { toString(): string };

export function runKindMatchesSelection(kind: ObservabilityRunKind, selection: ObservabilitySelection): boolean {
  return selection?.kind === kind;
}
