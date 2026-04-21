"use client";

import Link from "next/link";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import type {
  ObservabilityCompareContextField,
  ObservabilityIntegrityGap,
  ObservabilityRecommendedAction,
  ObservabilityRelatedEntity,
  ObservabilityTimelineItem,
} from "@/lib/api/observability";
import type { LivePhase } from "./use-live-case-stream";
import type { SolutionCaseDetailSection } from "./domain-logic";
import {
  formatDateTime,
  formatDurationMs,
  severityBadgeVariant,
} from "./formatters";

type CaseKind = "call_session" | "interactive_channel_session" | "workflow_run" | "control_plane_incident" | "channel_runtime" | "tenant_composition";

function channelSectionLabel(kind: CaseKind | undefined): string {
  if (kind === "call_session") return "Voice session";
  if (kind === "interactive_channel_session") return "Channel session";
  if (kind === "workflow_run") return "Workflow run";
  if (kind === "control_plane_incident") return "Control-plane incident";
  if (kind === "channel_runtime") return "Channel runtime";
  if (kind === "tenant_composition") return "Composition state";
  return "Case record";
}

function channelSectionHint(kind: CaseKind | undefined): string {
  if (kind === "call_session") return "Voice-specific fields: DID, SIP trunk, voice stack, and recording status.";
  if (kind === "interactive_channel_session") return "Channel-specific fields: widget, locale, lead capture, and escalation state.";
  if (kind === "workflow_run") return "Workflow-specific fields: steps, route decisions, and automation status.";
  if (kind === "control_plane_incident") return "Incident-specific fields: command lineage, operator context, and runtime state.";
  if (kind === "channel_runtime") return "Runtime-specific fields: answering state, routing readiness, and health status.";
  if (kind === "tenant_composition") return "Composition-specific fields: release, solutions, provider defaults, and dependency state.";
  return "Confirm the tenant, subject, and active release context before you start blaming runtime behavior.";
}

export interface CaseRecordPanelProps {
  caseKind?: CaseKind;
  caseRecordFields: Array<{ key: string; label: string; value: string }>;
  solutionCaseDetailSections: SolutionCaseDetailSection[];
  recommendedActions: ObservabilityRecommendedAction[];
  integrityGaps: ObservabilityIntegrityGap[];
  detailRelatedEntities: ObservabilityRelatedEntity[];
  detailContextFields: ObservabilityCompareContextField[];
  traceContext: Record<string, unknown>;
  transcriptText: string | null;

  selectedItem: ObservabilityTimelineItem | null;
  copyNotice: string | null;
  onCopyCorrelationId: (value: string) => void;

  isLive?: boolean;
  livePhase?: LivePhase | null;
  turnCount?: number;
}

export function CaseRecordPanel({
  caseKind,
  caseRecordFields,
  solutionCaseDetailSections,
  recommendedActions,
  integrityGaps,
  detailRelatedEntities,
  detailContextFields,
  traceContext,
  transcriptText,
  selectedItem,
  copyNotice,
  onCopyCorrelationId,
  isLive = false,
  livePhase = null,
  turnCount = 0,
}: CaseRecordPanelProps) {
  return (
    <div className="space-y-6 2xl:sticky 2xl:top-6 2xl:self-start">
      {isLive ? (
        <div
          data-testid="observability-live-phase"
          className="rounded-2xl border border-[rgba(59,130,246,0.2)] bg-[rgba(239,246,255,0.6)] p-5"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-success-500)]" />
            <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Live phase</p>
          </div>
          <p className="mt-3 text-sm text-[var(--color-neutral-700)]">
            {livePhase === "agent_speaking"
              ? "Agent speaking"
              : livePhase === "caller_speaking"
                ? "Caller speaking"
                : livePhase === "tool_running"
                  ? "Tool running"
                  : "Idle"}
          </p>
          {turnCount > 0 ? (
            <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
              Turn {turnCount} of conversation
            </p>
          ) : null}
        </div>
      ) : null}

      <div
        data-testid="observability-case-record"
        className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] p-5"
      >
        <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{channelSectionLabel(caseKind)}</p>
        <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
          {channelSectionHint(caseKind)}
        </p>
        <div className="mt-3 space-y-2">
          {caseRecordFields.map((field) => (
            <div key={field.key} className="flex items-baseline justify-between gap-3 py-1">
              <p className="text-xs text-[var(--color-neutral-500)]">{field.label}</p>
              <p className="text-sm font-medium text-[var(--color-neutral-800)] text-right">{field.value}</p>
            </div>
          ))}
        </div>
      </div>

      {solutionCaseDetailSections.length > 0 ? (
        <div
          data-testid="observability-solution-context"
          className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Solution context</p>
              <p className="text-xs text-[var(--color-neutral-500)]">
                This is the solution-specific truth already persisted for the same shared case.
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-3">
            {solutionCaseDetailSections.map((section) => (
              <div
                key={section.key}
                data-testid={`observability-solution-section-${section.solutionName}`}
                className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 px-4 py-3"
              >
                <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{section.label}</p>
                <div className="mt-3 space-y-2">
                  {section.fields.map((field) => (
                    <div key={`${section.solutionName}-${field.key}`} className="flex items-baseline justify-between gap-3 py-1">
                      <p className="text-xs text-[var(--color-neutral-500)]">{field.label}</p>
                      {field.href ? (
                        <Link
                          href={field.href}
                          prefetch={false}
                          className="text-right text-sm font-medium text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)]"
                        >
                          {field.value}
                        </Link>
                      ) : (
                        <p className="text-right text-sm font-medium text-[var(--color-neutral-800)]">{field.value}</p>
                      )}
                    </div>
                  ))}
                </div>
                {section.relatedActions.length > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {section.relatedActions.map((action, index) => (
                      <Link
                        key={`${section.solutionName}-${action.key}`}
                        href={action.href}
                        prefetch={false}
                        data-testid={`observability-solution-action-${section.solutionName}-${index}`}
                        className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[rgba(15,23,42,0.12)] bg-white px-3 text-sm font-medium text-[var(--color-neutral-700)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-700)]"
                      >
                        {action.cta_label ?? action.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {recommendedActions.length > 0 ? (
        <div
          data-testid="observability-recommended-actions"
          className="rounded-2xl border border-[rgba(15,23,42,0.08)] border-l-[3px] border-l-[var(--color-primary-500)] bg-[rgba(248,250,252,0.84)] px-5 py-5"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">What to do next</p>
              <p className="text-xs text-[var(--color-neutral-500)]">
                These are the clearest next actions this case can support with the truth captured today.
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {recommendedActions.map((action, index) => (
              <div key={action.key} className="border-b border-[rgba(15,23,42,0.06)] pb-2 last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--color-neutral-950)]">{action.label}</p>
                  <Badge variant={severityBadgeVariant(action.severity)}>
                    {action.severity === "error" ? "Do now" : action.severity === "warning" ? "Review" : "Context"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--color-neutral-600)]">{action.detail}</p>
                {action.href ? (
                  <Link
                    href={action.href}
                    prefetch={false}
                    data-testid={`observability-recommended-action-${index}`}
                    className="mt-2 inline-flex h-8 items-center rounded-lg border border-[rgba(15,23,42,0.12)] px-2.5 text-xs font-medium text-[var(--color-neutral-700)] hover:text-[var(--color-primary-700)]"
                  >
                    {action.cta_label ?? "Open"}
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {integrityGaps.length > 0 ? (
        <div
          data-testid="observability-integrity-gaps"
          className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Integrity gaps</p>
              <p className="text-xs text-[var(--color-neutral-500)]">
                These are the evidence holes or degraded dependencies that weaken confidence in this case.
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {integrityGaps.map((gap) => (
              <div key={gap.key} className="border-b border-[rgba(15,23,42,0.06)] pb-2 last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--color-neutral-950)]">{gap.label}</p>
                  <Badge variant={severityBadgeVariant(gap.severity)}>
                    {gap.severity === "error" ? "Gap" : gap.severity === "warning" ? "Review" : "Context"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[var(--color-neutral-600)]">{gap.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {detailRelatedEntities.length > 0 ? (
        <div
          data-testid="observability-related-records"
          className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] p-4"
        >
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Open related records</p>
          <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
            Jump straight to the queue, release, workflow, or session lane that shares this case.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {detailRelatedEntities.map((entity, index) => (
              <Link
                key={entity.href}
                href={entity.href}
                prefetch={false}
                data-testid={`observability-related-entity-${index}`}
                className="inline-flex min-h-9 items-center justify-center rounded-xl border border-[rgba(15,23,42,0.12)] bg-white/80 px-3 text-sm font-medium text-[var(--color-neutral-700)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-700)]"
              >
                {entity.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {detailContextFields.length > 0 ? (
        <div
          data-testid="observability-detail-context"
          className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Runtime and release context</p>
              <p className="text-xs text-[var(--color-neutral-500)]">
                This is the composition and provider state that was active when the case ran.
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {detailContextFields.map((field) => (
              <div key={field.key} className="flex items-baseline justify-between gap-3 py-1">
                <p className="text-xs text-[var(--color-neutral-500)]">{field.label}</p>
                <p className="text-sm font-medium text-[var(--color-neutral-800)] text-right">{field.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] p-4">
        <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Selected event</p>
        {selectedItem ? (
          <div className="mt-3 space-y-3 text-sm text-[var(--color-neutral-700)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">When</p>
              <p>{formatDateTime(selectedItem.occurred_at)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">What happened</p>
              <p
                data-testid="observability-selected-event-label"
                className="font-medium text-[var(--color-neutral-950)]"
              >
                {selectedItem.label}
              </p>
              {selectedItem.detail ? <p className="mt-1">{selectedItem.detail}</p> : null}
            </div>
            {selectedItem.duration_ms != null ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">Duration</p>
                <p>{formatDurationMs(selectedItem.duration_ms)}</p>
              </div>
            ) : null}
            {selectedItem.actor ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">Actor</p>
                <p>{selectedItem.actor}</p>
              </div>
            ) : null}
            {selectedItem.correlation_id ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                  Correlation ID
                </p>
                <code
                  data-testid="observability-selected-event-correlation"
                  className="block overflow-x-auto rounded-xl bg-[rgba(15,23,42,0.06)] px-3 py-2 text-xs"
                >
                  {selectedItem.correlation_id}
                </code>
                <Button
                  data-testid="observability-copy-correlation"
                  variant="outline"
                  size="sm"
                  onClick={() => onCopyCorrelationId(selectedItem.correlation_id ?? "")}
                >
                  Copy correlation ID
                </Button>
              </div>
            ) : null}
            {copyNotice ? <p className="text-xs text-[var(--color-success-700)]">{copyNotice}</p> : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-neutral-500)]">Choose a timeline item to inspect its payload and timing context.</p>
        )}
      </div>

      <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] p-4">
        <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Trace context</p>
        {Object.keys(traceContext).length === 0 ? (
          <p className="mt-3 text-sm text-[var(--color-neutral-500)]">No trace context was recorded for this run.</p>
        ) : (
          <pre
            data-testid="observability-trace-context"
            className="mt-3 overflow-x-auto rounded-xl bg-[rgba(15,23,42,0.06)] p-3 text-xs text-[var(--color-neutral-700)]"
          >
            {JSON.stringify(traceContext, null, 2)}
          </pre>
        )}
      </div>

      {transcriptText ? (
        <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] p-4">
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Transcript summary</p>
          <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-neutral-700)]">{transcriptText}</p>
        </div>
      ) : null}

      {selectedItem ? (
        <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] p-4">
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Payload</p>
          <pre className="mt-3 overflow-x-auto rounded-xl bg-[rgba(15,23,42,0.06)] p-3 text-xs text-[var(--color-neutral-700)]">
            {JSON.stringify(selectedItem.payload, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
