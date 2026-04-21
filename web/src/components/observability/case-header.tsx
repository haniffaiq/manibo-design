"use client";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { CardHeader } from "@grove/ui/card";
import type {
  ObservabilityMetric,
  ObservabilityRunSummary as RunSummary,
} from "@/lib/api/observability";
import { compareKeyForRun } from "@/lib/api/observability";
import { isComparableSelection } from "@/lib/observability-routes";
import { TIMELINE_FILTERS } from "./types";
import {
  candidateRunLabel,
  formatDateTime,
  runChannelBadgeClassName,
  runChannelBadgeLabel,
  statusVariant,
  timelineGroupLabel,
} from "./formatters";
import { observabilityErrorMessage } from "./domain-logic";
import { useObservability } from "./observability-context";

export interface CaseHeaderProps {
  detailSummary: RunSummary | null;
  detailMetrics: ObservabilityMetric[];
}

export function CaseHeader({ detailSummary, detailMetrics }: CaseHeaderProps) {
  const {
    selection,
    selectionRequiredMessage,
    detail,
    timelineError,
    summaryAlerts,
    timelineFilter,
    setTimelineFilter,
    jumpToNextIssue,
    openListView,
    compareCandidates,
    compareTargetKey,
    setCompareTargetKey,
  } = useObservability();

  return (
    <CardHeader className="space-y-4">
      {selectionRequiredMessage ? (
        <p className="rounded-xl border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]">
          {selectionRequiredMessage}
        </p>
      ) : null}
      {detail.error ? (
        <p className="rounded-xl border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]">
          {observabilityErrorMessage(detail.error, "detail")}
        </p>
      ) : null}
      {timelineError ? (
        <p className="rounded-xl border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]">
          {timelineError}
        </p>
      ) : null}

      {detailSummary ? (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">
                Case workspace
              </p>
              <h2
                data-testid="observability-selected-title"
                className="text-2xl font-semibold text-[var(--color-neutral-950)]"
              >
                {detailSummary.title}
              </h2>
              <p className="text-sm text-[var(--color-neutral-600)]">
                {detailSummary.subtitle ?? "No secondary context"} · Started {formatDateTime(detailSummary.started_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className={runChannelBadgeClassName(detailSummary.kind)}>{runChannelBadgeLabel(detailSummary.kind)}</Badge>
              <Badge data-testid="observability-selected-status" variant={statusVariant(detailSummary.status)}>
                {detailSummary.status}
              </Badge>
              <Button variant="outline" size="sm" onClick={openListView}>
                Back to run list
              </Button>
            </div>
          </div>

          {detailMetrics.length > 0 ? (
            <div
              data-testid="observability-metrics-strip"
              className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-3"
            >
              {detailMetrics.map((metric, i) => (
                <span key={metric.key} className="flex items-center gap-1 text-sm text-[var(--color-neutral-700)]">
                  {i > 0 ? <span className="mx-1 text-[var(--color-neutral-300)]">|</span> : null}
                  <span className="font-medium">{metric.label}</span>
                  <span className="font-semibold text-[var(--color-neutral-950)]">{metric.value}</span>
                </span>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {summaryAlerts.map((message) => (
              <Badge key={message} variant="warning">
                {message}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {TIMELINE_FILTERS.map((filter) => (
              <Button
                key={filter}
                size="sm"
                variant={timelineFilter === filter ? "primary" : "outline"}
                onClick={() => setTimelineFilter(filter)}
              >
                {timelineGroupLabel(filter)}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={jumpToNextIssue}>
              Jump to next issue
            </Button>
          </div>

          {selection && isComparableSelection(selection) && compareCandidates.length > 0 ? (
            <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Compare with another case</p>
                  <p className="text-xs text-[var(--color-neutral-500)]">
                    Use comparison to explain what changed in duration, tools, context, and failures.
                  </p>
                </div>
                <div className="flex flex-col gap-2 md:flex-row">
                  <select
                    data-testid="observability-compare-select"
                    value={compareTargetKey}
                    onChange={(event) => setCompareTargetKey(event.currentTarget.value)}
                    className="h-10 min-w-[280px] rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                  >
                    <option value="">Select a comparison run</option>
                    {compareCandidates.map((run) => {
                      const value = compareKeyForRun(run);
                      if (!value) {
                        return null;
                      }
                      return (
                        <option key={value} value={value}>
                          {candidateRunLabel(run)}
                        </option>
                      );
                    })}
                  </select>
                  {compareTargetKey ? (
                    <Button variant="outline" size="sm" onClick={() => setCompareTargetKey("")}>
                      Clear compare
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : selection && !isComparableSelection(selection) ? (
            <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4">
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">
                Comparison is not available for this case type yet
              </p>
              <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                Compare stays limited to voice sessions, channel sessions, and workflow cases until the newer V2 subjects have stable baseline semantics.
              </p>
            </div>
          ) : null}
        </>
      ) : (
        <div className="rounded-2xl border border-dashed border-[rgba(15,23,42,0.12)] bg-[rgba(248,250,252,0.6)] px-4 py-8 text-sm text-[var(--color-neutral-500)]">
          {selection
            ? "Loading the selected case..."
            : "Pick a case from the queue to load timeline, context, and evidence."}
        </div>
      )}
    </CardHeader>
  );
}
