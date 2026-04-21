import type {
  ObservabilityFacetCounts,
  ObservabilityListKind,
  ObservabilityRunSummary,
  ObservabilityTimelineItem,
  ObservabilityTimelineKind,
} from "@/lib/api/observability";
import type { ObservabilityScope } from "@/lib/observability-routes";
import { getSolutionObservabilityContributions } from "@/solutions/registry";

/* ------------------------------------------------------------------ */
/*  Type aliases                                                      */
/* ------------------------------------------------------------------ */

export type Scope = ObservabilityScope;

/** Queue = list view, Case = single case detail, Compare = side-by-side run comparison. */
export type WorkspaceMode = "queue" | "case" | "compare";
export type TimelineFilter = "all" | "issues" | ObservabilityTimelineKind;
export type FilterPreset = "errors" | "slow" | "recent_failures" | "recordings_missing" | "needs_review";
export type SearchParamsLike = { get(name: string): string | null; toString(): string };
export type CoverageState = "live" | "partial" | "planned";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

export const EMPTY_RUNS: ObservabilityRunSummary[] = [];
export const EMPTY_TIMELINE: ObservabilityTimelineItem[] = [];
export const EMPTY_FACETS: ObservabilityFacetCounts = {
  kinds: [],
  statuses: [],
  tenants: [],
  solutions: [],
  assistants: [],
};
export const TIMELINE_PAGE_SIZE = 40;

export const RUN_KIND_OPTIONS: Array<{ value: ObservabilityListKind; label: string }> = [
  { value: "all", label: "All runs" },
  { value: "call_session", label: "Voice sessions" },
  { value: "interactive_channel_session", label: "Channel sessions" },
  { value: "workflow_run", label: "Workflow runs" },
  { value: "control_plane_incident", label: "Control-plane incidents" },
  { value: "channel_runtime", label: "Channel runtimes" },
  { value: "tenant_composition", label: "Tenant composition" },
];

export const CORE_SUBJECT_COVERAGE: Array<{
  key: string;
  label: string;
  detail: string;
  state: CoverageState;
}> = [
  {
    key: "voice_session",
    label: "Voice sessions",
    detail: "Live today. Summary, timing, transcript, trace, and audio evidence already fit the case model.",
    state: "live",
  },
  {
    key: "workflow_run",
    label: "Workflow runs",
    detail: "Live today. Background automation and follow-up flows already land in the same queue and compare path.",
    state: "live",
  },
  {
    key: "interactive_channel_session",
    label: "Interactive channel sessions",
    detail:
      "Live today. Chat/public-ingress sessions, lead capture, escalation, and recommendation evidence now land in the same case workspace.",
    state: "live",
  },
  {
    key: "control_plane_incident",
    label: "Control-plane incidents",
    detail: "Now partially live. Command acknowledgements, operator lineage, and incident state can enter the same case queue.",
    state: "partial",
  },
  {
    key: "tenant_composition",
    label: "Tenant composition state",
    detail: "Now partially live. Release assignment, solution visibility, and provider context surface here; richer invalidation and dependency health still need backend growth.",
    state: "partial",
  },
];

export function resolveSubjectCoverage(
  coverageSolutions: ReadonlySet<string>,
): Array<{
  key: string;
  label: string;
  detail: string;
  state: CoverageState;
}> {
  return [
    ...CORE_SUBJECT_COVERAGE,
    ...getSolutionObservabilityContributions(coverageSolutions),
  ];
}

export const STATUS_OPTIONS = ["all", "Running", "Completed", "Failed", "Canceled", "Terminated", "TimedOut"];
export const DURATION_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "Any duration" },
  { value: "30000", label: "30 seconds or more" },
  { value: "60000", label: "1 minute or more" },
  { value: "120000", label: "2 minutes or more" },
];

export const FILTER_PRESETS: Array<{ value: FilterPreset; label: string }> = [
  { value: "errors", label: "Errors" },
  { value: "slow", label: "Slow runs" },
  { value: "recent_failures", label: "Recent failures" },
  { value: "recordings_missing", label: "Recordings missing" },
  { value: "needs_review", label: "Needs review" },
];

export const TIMELINE_FILTERS: TimelineFilter[] = [
  "all",
  "issues",
  "transcript",
  "node",
  "tool",
  "route",
  "metric",
  "log",
  "recording",
  "workflow_step",
];
