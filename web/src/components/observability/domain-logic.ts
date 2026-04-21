import type {
  ObservabilityFacetCounts,
  ObservabilityListKind,
  ObservabilityTimelineSeverity,
  ObservabilityRunDetailResponse,
  ObservabilityRunSummary,
  ObservabilityTimelineItem,
  SolutionObservabilityCaseDetailField,
  SolutionObservabilityEnricher,
  SolutionObservabilityRelatedAction,
  SolutionObservabilityEvidenceItem,
  SolutionObservabilityTimelineDecorator,
} from "@/lib/api/observability";
import type { LiveCallTurnLatency } from "@/lib/api/call-observability";
import type { TurnTranscript } from "./conversation-turn-row";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";

import type { CoverageState, FilterPreset, SearchParamsLike } from "./types";
import { DURATION_OPTIONS } from "./types";
import { formatDateTime, formatDurationMs, runFilterKindLabel, runSummaryKindLabel } from "./formatters";

/* ------------------------------------------------------------------ */
/*  Error messages                                                    */
/* ------------------------------------------------------------------ */

export function observabilityErrorMessage(error: unknown, context: "queue" | "detail" | "timeline" | "compare"): string {
  const message = toErrorMessage(error).toLowerCase();
  if (message.includes("forbidden") || message.includes("unauthorized")) {
    if (context === "queue") {
      return "You do not have permission to view this observability queue.";
    }
    return "You do not have permission to inspect this case from here.";
  }
  if (context === "queue") {
    return "The case queue is unavailable right now. Refresh and try again.";
  }
  if (context === "detail") {
    return "This case could not be loaded right now. Reopen it from the queue or refresh and try again.";
  }
  if (context === "timeline") {
    return "Timeline evidence is unavailable right now. Refresh the case or use related context while the feed recovers.";
  }
  return "Case comparison is unavailable right now. Refresh and try again.";
}

/* ------------------------------------------------------------------ */
/*  Preset / filter helpers                                           */
/* ------------------------------------------------------------------ */

export function isPresetActive(name: FilterPreset, params: SearchParamsLike): boolean {
  if (name === "errors") {
    return params.get("error_only") === "1";
  }
  if (name === "slow") {
    return params.get("min_duration_ms") === "60000";
  }
  if (name === "recent_failures") {
    return params.get("status") === "Failed";
  }
  if (name === "recordings_missing") {
    return params.get("recording_unavailable_only") === "1";
  }
  return params.get("needs_review_only") === "1";
}

/* ------------------------------------------------------------------ */
/*  Run-level helpers                                                 */
/* ------------------------------------------------------------------ */

export function availabilityMessages(detail: ObservabilityRunDetailResponse | null): string[] {
  if (!detail) {
    return [];
  }
  const alerts: string[] = [];
  if (detail.availability.recording_unavailable) {
    alerts.push("Audio was not recorded for this run.");
  }
  if (detail.availability.logs_unavailable) {
    alerts.push("Structured logs were not available for this run.");
  }
  if (detail.availability.trace_unavailable) {
    alerts.push("Trace context was not available for this run.");
  }
  if (detail.availability.timeline_partial) {
    alerts.push("The timeline is partial. Load more if you need earlier or later events.");
  }
  return alerts;
}

export function countRunsNeedingAttention(runs: ObservabilityRunSummary[]): number {
  return runs.filter((run) => run.warning_count > 0 || run.error_count > 0).length;
}

export function countRunsWithAudio(runs: ObservabilityRunSummary[]): number {
  return runs.filter((run) => run.recording_available).length;
}

export function evidenceCoverage(detail: ObservabilityRunDetailResponse): Array<{
  key: string;
  label: string;
  state: CoverageState;
  detail: string;
}> {
  const isVoiceSession = detail.summary.kind === "call_session";
  const isInteractiveChannelSession = detail.summary.kind === "interactive_channel_session";
  const isWorkflowRun = detail.summary.kind === "workflow_run";
  const isControlPlaneIncident = detail.summary.kind === "control_plane_incident";
  const isChannelRuntime = detail.summary.kind === "channel_runtime";
  const isTenantComposition = detail.summary.kind === "tenant_composition";
  const hasContext = detail.context_fields.length > 0;
  const hasTimeline = !detail.availability.timeline_partial || detail.recordings.length > 0 || detail.metrics.length > 0;

  return [
    {
      key: "voice",
      label: "Session evidence",
      state: isVoiceSession || isInteractiveChannelSession ? "live" : "partial",
      detail: isVoiceSession
        ? "Transcript, timing, trace, and audio evidence stay together in one operator case."
        : isInteractiveChannelSession
          ? "Chat transcript, lead capture, escalation, and recommendation evidence stay together in one operator case."
        : isChannelRuntime
          ? "Channel runtime cases show whether voice entry points are live, paused, or blocked before a caller reaches workflow logic."
          : "This case links to session evidence when a workflow was triggered by a voice interaction.",
    },
    {
      key: "workflow",
      label: "Workflow evidence",
      state: isWorkflowRun ? "live" : "partial",
      detail:
        isWorkflowRun
          ? "Workflow steps, route choices, and failures are first-class evidence in this case."
          : isTenantComposition
            ? "Composition cases show which rollout and solution state would influence downstream workflow execution."
            : "Workflow evidence appears here when the session triggered follow-up automation or approval flow.",
    },
    {
      key: "channel",
      label: "Channel evidence",
      state: isChannelRuntime || isInteractiveChannelSession ? "live" : "planned",
      detail: isInteractiveChannelSession
        ? "Interactive channel cases surface guest activity, widget context, lead capture, escalation, and operator signals on one timeline."
        : isChannelRuntime
        ? "Channel runtime cases surface answering state, routing readiness, and delivery/health blockers on one record."
        : "Interactive web chat, delivery retries, and channel lifecycle evidence join this same case model once V2 channel APIs exist.",
    },
    {
      key: "control_plane",
      label: "Control-plane evidence",
      state: isControlPlaneIncident ? "live" : "planned",
      detail: isControlPlaneIncident
        ? "Incident cases surface command outcomes, operator lineage, and runtime state transitions without making sockets the source of truth."
        : "Runtime commands, acknowledgements, and incident lineage stay out of the UI until read models exist, but the case layout is ready for them.",
    },
    {
      key: "composition",
      label: "Composition context",
      state: isTenantComposition ? "live" : hasContext || hasTimeline ? "partial" : "planned",
      detail:
        isTenantComposition
          ? "Composition cases show which release, solutions, and provider defaults were active for this tenant at investigation time."
          : hasContext
          ? "Release, assistant, and stack context are visible now. Full composition invalidation and dependency health need the V2 read model."
          : "This case does not yet have composition context. V2 adds versioned tenant composition and degraded dependency visibility.",
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Pure computation helpers                                          */
/* ------------------------------------------------------------------ */

export interface ActiveFilterBadgeParams {
  appliedKind: ObservabilityListKind;
  appliedStatus: string;
  appliedQuery: string;
  appliedTenantId: string;
  appliedSolution: string;
  appliedAssistant: string;
  appliedIncludeNonProduction: boolean;
  appliedErrorOnly: boolean;
  appliedRecordingsOnly: boolean;
  appliedRecordingUnavailableOnly: boolean;
  appliedNeedsReviewOnly: boolean;
  appliedMinDuration: string;
  appliedStartDate: string;
  appliedEndDate: string;
  facets: ObservabilityFacetCounts;
}

export function buildActiveFilterBadges(params: ActiveFilterBadgeParams): string[] {
  const badges: string[] = [];
  if (params.appliedKind !== "all") {
    badges.push(runFilterKindLabel(params.appliedKind));
  }
  if (params.appliedStatus !== "all") {
    badges.push(`Status: ${params.appliedStatus}`);
  }
  if (params.appliedQuery) {
    badges.push(`Search: ${params.appliedQuery}`);
  }
  if (params.appliedTenantId) {
    const tenant = params.facets.tenants.find((facet) => facet.value === params.appliedTenantId);
    badges.push(`Tenant: ${tenant?.label ?? params.appliedTenantId}`);
  }
  if (params.appliedSolution) {
    const sol = params.facets.solutions.find((facet) => facet.value === params.appliedSolution);
    badges.push(`Solution: ${sol?.label ?? params.appliedSolution}`);
  }
  if (params.appliedAssistant) {
    const assistant = params.facets.assistants.find((facet) => facet.value === params.appliedAssistant);
    badges.push(`Assistant: ${assistant?.label ?? params.appliedAssistant}`);
  }
  if (params.appliedIncludeNonProduction) {
    badges.push("Includes demo/test tenants");
  }
  if (params.appliedMinDuration) {
    const duration = DURATION_OPTIONS.find((option) => option.value === params.appliedMinDuration);
    badges.push(`Duration: ${duration?.label ?? params.appliedMinDuration}`);
  }
  if (params.appliedStartDate || params.appliedEndDate) {
    if (params.appliedStartDate && params.appliedEndDate) {
      badges.push(`Window: ${params.appliedStartDate} to ${params.appliedEndDate}`);
    } else if (params.appliedStartDate) {
      badges.push(`From: ${params.appliedStartDate}`);
    } else if (params.appliedEndDate) {
      badges.push(`Until: ${params.appliedEndDate}`);
    }
  }
  if (params.appliedErrorOnly) {
    badges.push("Needs attention only");
  }
  if (params.appliedRecordingsOnly) {
    badges.push("Audio evidence only");
  }
  if (params.appliedRecordingUnavailableOnly) {
    badges.push("Missing audio evidence");
  }
  if (params.appliedNeedsReviewOnly) {
    badges.push("Needs review");
  }
  return badges;
}

export function buildCaseRecordFields(
  summary: ObservabilityRunSummary,
): Array<{ key: string; label: string; value: string }> {
  const fields: Array<{ key: string; label: string; value: string }> = [];
  const pushField = (key: string, label: string, value: string | null | undefined) => {
    if (!value) {
      return;
    }
    fields.push({ key, label, value });
  };
  pushField("kind", "Case type", runSummaryKindLabel(summary.kind));
  pushField(
    "subject",
    "Case ID",
    summary.call_id ?? summary.run_id ?? summary.workflow_id ?? summary.channel_session_id ?? summary.subject_id ?? null,
  );
  pushField("tenant", "Tenant", summary.tenant_name);
  pushField("solution", "Solution", summary.solution_name);
  pushField("assistant", "Assistant", summary.assistant_name);
  pushField("started", "Started", formatDateTime(summary.started_at));
  pushField("ended", "Ended", summary.ended_at ? formatDateTime(summary.ended_at) : null);
  pushField("duration", "Duration", formatDurationMs(summary.duration_ms));
  return fields;
}

export interface SolutionCaseDetailSection {
  key: string;
  solutionName: string;
  label: string;
  fields: SolutionObservabilityCaseDetailField[];
  relatedActions: SolutionObservabilityRelatedAction[];
}

export interface SolutionEvidenceDisplayItem extends SolutionObservabilityEvidenceItem {
  solutionName: string;
  solutionLabel: string;
}

export interface SolutionTimelineDecoratorDisplayItem extends SolutionObservabilityTimelineDecorator {
  solutionName: string;
  solutionLabel: string;
}

function stableSeverityOrder(severity: ObservabilityTimelineSeverity): number {
  if (severity === "error") {
    return 0;
  }
  if (severity === "warning") {
    return 1;
  }
  return 2;
}

export function buildSolutionCaseDetailSections(enrichers: SolutionObservabilityEnricher[]): SolutionCaseDetailSection[] {
  return enrichers
    .filter((enricher) => enricher.case_detail_fields.length > 0 || enricher.related_actions.length > 0)
    .map((enricher) => ({
      key: `${enricher.solution_name}-case-detail`,
      solutionName: enricher.solution_name,
      label: enricher.label,
      fields: enricher.case_detail_fields,
      relatedActions: enricher.related_actions,
    }));
}

export function buildSolutionEvidenceItems(enrichers: SolutionObservabilityEnricher[]): SolutionEvidenceDisplayItem[] {
  return enrichers
    .flatMap((enricher) =>
      enricher.evidence_items.map((item) => ({
        ...item,
        key: `${enricher.solution_name}:${item.key}`,
        solutionName: enricher.solution_name,
        solutionLabel: enricher.label,
      })),
    )
    .toSorted((left, right) => {
      const leftTime = left.occurred_at ? Date.parse(left.occurred_at) : -Infinity;
      const rightTime = right.occurred_at ? Date.parse(right.occurred_at) : -Infinity;
      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }
      return stableSeverityOrder(left.severity) - stableSeverityOrder(right.severity);
    });
}

export function buildSolutionTimelineDecorators(
  enrichers: SolutionObservabilityEnricher[],
): SolutionTimelineDecoratorDisplayItem[] {
  return enrichers
    .flatMap((enricher) =>
      enricher.timeline_decorators.map((decorator) => ({
        ...decorator,
        key: `${enricher.solution_name}:${decorator.key}`,
        solutionName: enricher.solution_name,
        solutionLabel: enricher.label,
      })),
    )
    .toSorted((left, right) => {
      const leftTime = left.occurred_at ? Date.parse(left.occurred_at) : -Infinity;
      const rightTime = right.occurred_at ? Date.parse(right.occurred_at) : -Infinity;
      if (leftTime !== rightTime) {
        return rightTime - leftTime;
      }
      return stableSeverityOrder(left.severity) - stableSeverityOrder(right.severity);
    });
}

/* ------------------------------------------------------------------ */
/*  Conversation turn merge                                            */
/* ------------------------------------------------------------------ */

export interface MergedConversationTurn {
  turn: LiveCallTurnLatency;
  transcript: TurnTranscript | null;
  /** Whether this entry represents the user or agent side of the round-trip. */
  role: "user" | "agent";
}

function isUserActor(actor: string | null): boolean {
  if (!actor) return false;
  const s = actor.toLowerCase();
  return s === "user" || s === "caller" || s === "human" || s === "customer";
}

function stubTurn(index: number): LiveCallTurnLatency {
  return {
    turn_index: index,
    user_speech_started_at_ms: null,
    user_speech_ended_at_ms: null,
    user_final_transcript_at_ms: null,
    user_final_transcript_chars: null,
    stt_duration_ms: null,
    llm_start_at_ms: null,
    llm_ttft_at_ms: null,
    llm_duration_ms: null,
    agent_speaking_started_at_ms: null,
    agent_speaking_ended_at_ms: null,
    tts_ttfb_ms: null,
    tts_duration_ms: null,
    stt_finalize_delay_ms: null,
    eot_to_llm_start_ms: null,
    llm_ttft_ms: null,
    eot_to_agent_speak_ms: null,
    first_speech_latency_ms: null,
    tts_pre_speech_gap_ms: null,
    user_interrupted_agent: false,
    interruption_started_at_ms: null,
    agent_stop_after_interrupt_ms: null,
    speech_overlap_duration_ms: null,
    tool_executions: [],
  };
}

function toTranscript(item: ObservabilityTimelineItem): TurnTranscript {
  return {
    speaker: item.actor ?? "Agent",
    text: item.label,
    timestamp: item.occurred_at ?? "",
  };
}

type ConversationTurnBucket = {
  turn: LiveCallTurnLatency;
  isStub: boolean;
  userTranscript: ObservabilityTimelineItem | null;
  agentTranscript: ObservabilityTimelineItem | null;
};

function turnStartMs(turn: LiveCallTurnLatency): number | null {
  const candidates = [turn.user_speech_started_at_ms, turn.agent_speaking_started_at_ms].filter(
    (value): value is number => value != null,
  );
  if (candidates.length === 0) return null;
  return Math.min(...candidates);
}

function transcriptRole(item: ObservabilityTimelineItem): "user" | "agent" {
  return isUserActor(item.actor) ? "user" : "agent";
}

function resolveTranscriptAnchorIndex(turns: LiveCallTurnLatency[], occurredAtMs: number | null): number {
  if (turns.length === 0) return -1;
  if (occurredAtMs == null) return turns.length - 1;

  let anchorIndex = 0;
  for (let index = 0; index < turns.length; index++) {
    const startMs = turnStartMs(turns[index]);
    if (startMs == null) {
      continue;
    }
    if (occurredAtMs < startMs) {
      return anchorIndex;
    }
    anchorIndex = index;
  }
  return anchorIndex;
}

function orderedBuckets(
  turns: LiveCallTurnLatency[],
  transcripts: ObservabilityTimelineItem[],
): ConversationTurnBucket[] {
  const realBuckets = turns.map((turn) => ({
    turn,
    isStub: false,
    userTranscript: null,
    agentTranscript: null,
  }));
  const overflowByAnchor = new Map<number, ConversationTurnBucket[]>();
  let nextStubIndex = turns.length;

  const ensureBucket = (anchorIndex: number, role: "user" | "agent"): ConversationTurnBucket => {
    const buckets =
      anchorIndex >= 0
        ? [realBuckets[anchorIndex], ...(overflowByAnchor.get(anchorIndex) ?? [])]
        : (overflowByAnchor.get(-1) ?? []);

    const availableBucket = buckets.find((bucket) =>
      role === "user" ? bucket.userTranscript == null : bucket.agentTranscript == null,
    );
    if (availableBucket) {
      return availableBucket;
    }

    const stubBucket: ConversationTurnBucket = {
      turn: stubTurn(nextStubIndex),
      isStub: true,
      userTranscript: null,
      agentTranscript: null,
    };
    nextStubIndex += 1;
    const existingOverflow = overflowByAnchor.get(anchorIndex) ?? [];
    existingOverflow.push(stubBucket);
    overflowByAnchor.set(anchorIndex, existingOverflow);
    return stubBucket;
  };

  for (const transcript of transcripts) {
    const role = transcriptRole(transcript);
    const anchorIndex = resolveTranscriptAnchorIndex(turns, transcript.occurred_at_ms ?? null);
    const bucket = ensureBucket(anchorIndex, role);
    if (role === "user") {
      bucket.userTranscript = transcript;
    } else {
      bucket.agentTranscript = transcript;
    }
  }

  if (realBuckets.length === 0) {
    return overflowByAnchor.get(-1) ?? [];
  }

  const mergedBuckets: ConversationTurnBucket[] = [];
  for (let index = 0; index < realBuckets.length; index++) {
    mergedBuckets.push(realBuckets[index]);
    mergedBuckets.push(...(overflowByAnchor.get(index) ?? []));
  }
  return mergedBuckets;
}

/** Merge latency turns with transcript items using turn start windows, not raw array index. */
export function mergeConversationTurns(
  turns: LiveCallTurnLatency[],
  timelineItems: ObservabilityTimelineItem[],
): MergedConversationTurn[] {
  const transcripts = timelineItems
    .filter((item) => item.kind === "transcript")
    .toSorted((a, b) => (a.occurred_at_ms ?? 0) - (b.occurred_at_ms ?? 0));

  const sortedTurns = turns.toSorted((a, b) => a.turn_index - b.turn_index);

  if (transcripts.length === 0 && sortedTurns.length === 0) return [];

  const merged: MergedConversationTurn[] = [];
  for (const bucket of orderedBuckets(sortedTurns, transcripts)) {
    if (bucket.userTranscript || (!bucket.isStub && bucket.turn.user_speech_started_at_ms != null)) {
      merged.push({
        turn: bucket.turn,
        transcript: bucket.userTranscript ? toTranscript(bucket.userTranscript) : null,
        role: "user",
      });
    }

    if (bucket.agentTranscript || !bucket.isStub) {
      merged.push({
        turn: bucket.turn,
        transcript: bucket.agentTranscript ? toTranscript(bucket.agentTranscript) : null,
        role: "agent",
      });
    }
  }

  return merged;
}

/** Compute the max eot_to_agent_speak_ms across all turns for bar normalization. */
export function computeMaxEotMs(turns: LiveCallTurnLatency[]): number {
  let max = 0;
  for (const turn of turns) {
    if (turn.eot_to_agent_speak_ms != null && turn.eot_to_agent_speak_ms > max) {
      max = turn.eot_to_agent_speak_ms;
    }
  }
  return max;
}
