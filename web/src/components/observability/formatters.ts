import type {
  ObservabilityRunSummary,
  ObservabilityTimelineItem,
  ObservabilityTimelineSeverity,
  ObservabilityFacetValue,
  ObservabilityListKind,
} from "@/lib/api/observability";

import type { CoverageState, TimelineFilter } from "./types";

/* ------------------------------------------------------------------ */
/*  Date / duration formatting                                        */
/* ------------------------------------------------------------------ */

export function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not recorded";
  }
  return new Date(value).toLocaleString();
}

export function formatDurationMs(value: number | null): string {
  if (value == null) {
    return "Not recorded";
  }
  if (value < 1000) {
    return `${value} ms`;
  }
  const seconds = value / 1000;
  if (seconds >= 60) {
    return `${(seconds / 60).toFixed(1)} min`;
  }
  return `${seconds.toFixed(1)} s`;
}

/* ------------------------------------------------------------------ */
/*  Query-string parsing                                              */
/* ------------------------------------------------------------------ */

export function parseMinDuration(value: string | null): string {
  return value && /^\d+$/.test(value) ? value : "";
}

export function parseDateFilter(value: string | null): string {
  if (!value) {
    return "";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
}

export function startDateToIso(value: string): string {
  return `${value}T00:00:00.000Z`;
}

export function endDateToIso(value: string): string {
  return `${value}T23:59:59.999Z`;
}

/* ------------------------------------------------------------------ */
/*  Label / variant helpers                                           */
/* ------------------------------------------------------------------ */

export function timelineGroupLabel(kind: TimelineFilter): string {
  switch (kind) {
    case "transcript":
      return "Transcript";
    case "workflow_step":
      return "Workflow";
    case "recording":
      return "Audio";
    case "metric":
      return "Metrics";
    case "node":
      return "Nodes";
    case "tool":
      return "Tools";
    case "route":
      return "Routes";
    case "log":
      return "Logs";
    case "issues":
      return "Warnings & errors";
    default:
      return "All";
  }
}

export function statusVariant(status: string): "success" | "warning" | "error" | "neutral" {
  const lowered = status.toLowerCase();
  if (lowered.includes("complete")) {
    return "success";
  }
  if (lowered.includes("fail") || lowered.includes("timed") || lowered.includes("error")) {
    return "error";
  }
  if (lowered.includes("run") || lowered.includes("progress")) {
    return "warning";
  }
  return "neutral";
}

export function coverageVariant(state: CoverageState): "success" | "warning" | "neutral" {
  if (state === "live") {
    return "success";
  }
  if (state === "partial") {
    return "warning";
  }
  return "neutral";
}

export function coverageLabel(state: CoverageState): string {
  if (state === "live") {
    return "Live now";
  }
  if (state === "partial") {
    return "Partial now";
  }
  return "Planned";
}

/* ------------------------------------------------------------------ */
/*  Timeline kind badge styling                                       */
/* ------------------------------------------------------------------ */

export interface TimelineKindBadgeStyle {
  bg: string;
  text: string;
  label: string;
}

const KIND_BADGE_STYLES: Record<string, TimelineKindBadgeStyle> = {
  node: { bg: "bg-purple-100", text: "text-purple-700", label: "Node" },
  route: { bg: "bg-blue-100", text: "text-blue-700", label: "Route" },
  tool: { bg: "bg-orange-100", text: "text-orange-700", label: "Tool" },
  workflow_step: { bg: "bg-green-100", text: "text-green-700", label: "Workflow" },
  recording: { bg: "bg-teal-100", text: "text-teal-700", label: "Audio" },
  metric: { bg: "bg-amber-100", text: "text-amber-700", label: "Metric" },
  transcript: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Transcript" },
  log: { bg: "bg-neutral-100", text: "text-neutral-600", label: "Log" },
};

const DEFAULT_KIND_STYLE: TimelineKindBadgeStyle = { bg: "bg-neutral-100", text: "text-neutral-600", label: "Log" };

export function timelineKindBadgeStyle(kind: string): TimelineKindBadgeStyle {
  return KIND_BADGE_STYLES[kind] ?? DEFAULT_KIND_STYLE;
}

export function severityVariant(item: ObservabilityTimelineItem): "success" | "warning" | "error" | "neutral" {
  if (item.severity === "error") {
    return "error";
  }
  if (item.severity === "warning") {
    return "warning";
  }
  if (item.kind === "transcript") {
    return "success";
  }
  return "neutral";
}

export function severityBadgeVariant(severity: ObservabilityTimelineSeverity): "success" | "warning" | "error" | "neutral" {
  if (severity === "error") {
    return "error";
  }
  if (severity === "warning") {
    return "warning";
  }
  return "neutral";
}

export function timelineMatchesFilter(item: ObservabilityTimelineItem, filter: TimelineFilter): boolean {
  if (filter === "all") {
    return true;
  }
  if (filter === "issues") {
    return item.severity !== "info";
  }
  return item.kind === filter;
}

export function runSummaryKindLabel(kind: ObservabilityRunSummary["kind"]): string {
  if (kind === "call_session") {
    return "Session";
  }
  if (kind === "interactive_channel_session") {
    return "Channel session";
  }
  if (kind === "workflow_run") {
    return "Workflow";
  }
  if (kind === "control_plane_incident") {
    return "Control-plane incident";
  }
  if (kind === "channel_runtime") {
    return "Channel runtime";
  }
  return "Tenant composition";
}

export function runChannelBadgeLabel(kind: ObservabilityRunSummary["kind"]): string {
  if (kind === "call_session") {
    return "\u{1F4DE} Voice";
  }
  if (kind === "interactive_channel_session") {
    return "\u{1F4AC} Channel";
  }
  if (kind === "workflow_run") {
    return "\u2699\uFE0F Workflow";
  }
  if (kind === "control_plane_incident") {
    return "\u{1F534} Incident";
  }
  if (kind === "channel_runtime") {
    return "\u26A1 Runtime";
  }
  return "\u{1F9E9} Composition";
}

export function runChannelBadgeClassName(kind: ObservabilityRunSummary["kind"]): string {
  if (kind === "call_session") {
    return "border-[var(--color-info-300,#93c5fd)] bg-[var(--color-info-50,#eff6ff)] text-[var(--color-info-700,#1d4ed8)]";
  }
  if (kind === "interactive_channel_session") {
    return "border-[#86efac] bg-[#f0fdf4] text-[#15803d]";
  }
  if (kind === "workflow_run") {
    return "border-[#c4b5fd] bg-[#f5f3ff] text-[#6d28d9]";
  }
  if (kind === "control_plane_incident") {
    return "border-[var(--color-error-500)] bg-[var(--color-error-50)] text-[var(--color-error-700)]";
  }
  if (kind === "channel_runtime") {
    return "border-[var(--color-warning-500)] bg-[var(--color-warning-50)] text-[var(--color-neutral-700)]";
  }
  return "border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-neutral-700)]";
}

/** Active statuses: voice "Running", chat "Open"/"Lead captured" (not terminal). */
export function isRunningStatus(status: string): boolean {
  const lowered = status.toLowerCase();
  if (lowered.includes("running") || lowered.includes("progress")) return true;
  // Interactive channel sessions use lifecycle statuses that don't contain "running"
  if (lowered === "open" || lowered === "lead captured") return true;
  return false;
}

export function facetLabel(facet: ObservabilityFacetValue): string {
  return `${facet.label} (${facet.count})`;
}

export function runFilterKindLabel(kind: ObservabilityListKind): string {
  if (kind === "call_session") {
    return "Voice session cases";
  }
  if (kind === "interactive_channel_session") {
    return "Channel session cases";
  }
  if (kind === "workflow_run") {
    return "Workflow cases";
  }
  if (kind === "control_plane_incident") {
    return "Control-plane cases";
  }
  if (kind === "channel_runtime") {
    return "Channel runtime cases";
  }
  if (kind === "tenant_composition") {
    return "Composition cases";
  }
  return "All case types";
}

export function candidateRunLabel(run: ObservabilityRunSummary): string {
  const parts = [run.title, run.status];
  if (run.kind === "interactive_channel_session") {
    parts.push("channel session");
  } else if (run.kind === "control_plane_incident") {
    parts.push("control-plane");
  } else if (run.kind === "channel_runtime") {
    parts.push("channel runtime");
  } else if (run.kind === "tenant_composition") {
    parts.push("tenant composition");
  }
  if (run.started_at) {
    parts.push(new Date(run.started_at).toLocaleString());
  }
  return parts.join(" · ");
}
