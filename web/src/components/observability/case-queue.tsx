"use client";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { Input } from "@grove/ui/input";
import type { ObservabilityRunSummary } from "@/lib/api/observability";
import { observabilityRunHref, observabilitySelectionKey, selectionFromRun } from "@/lib/observability-routes";
import { useLiveElapsed } from "./use-live-elapsed";
import {
  FILTER_PRESETS,
} from "./types";
import {
  facetLabel,
  formatDateTime,
  formatDurationMs,
  isRunningStatus,
  runChannelBadgeClassName,
  runChannelBadgeLabel,
  runSummaryKindLabel,
  statusVariant,
} from "./formatters";
import { isPresetActive, observabilityErrorMessage } from "./domain-logic";
import { QueueFilters } from "./queue-filters";
import { useObservability } from "./observability-context";

function RunDuration({ run }: { run: ObservabilityRunSummary }) {
  const isLive = isRunningStatus(run.status);
  const elapsedMs = useLiveElapsed(run.started_at, isLive);
  return <span>{formatDurationMs(isLive && elapsedMs != null ? elapsedMs : run.duration_ms)}</span>;
}

export function CaseQueue() {
  const {
    scope,
    searchParams,
    selectionKey,
    visibleRuns,
    facets,
    runsLoading,
    runsError,
    runsHasData,
    searchDraft,
    startDateDraft,
    endDateDraft,
    appliedKind,
    appliedStatus,
    appliedTenantId,
    appliedSolution,
    appliedAssistant,
    appliedIncludeNonProduction,
    appliedErrorOnly,
    appliedRecordingsOnly,
    appliedMinDuration,
    activeFilterBadges,
    advancedFilterCount,
    setSearchDraft,
    setStartDateDraft,
    setEndDateDraft,
    applySearch,
    clearFilters,
    applyPreset,
    setFilter,
    setBooleanFilter,
    openRun,
    refreshAll,
    isRefreshing,
  } = useObservability();

  return (
    <Card className="border-[rgba(15,23,42,0.08)] bg-white/95">
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">
            Case queue
          </p>
          <p className="text-sm text-[var(--color-neutral-600)]">
            Start with a saved preset, then open one case and explain it from summary, context, and evidence on one timeline.
          </p>
          <p className="text-xs text-[var(--color-neutral-500)]">
            This queue now projects voice sessions, interactive channel sessions, workflow runs, control-plane incidents, channel runtimes, and tenant composition records from persisted read APIs.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_PRESETS.map(({ value, label }) => (
            <Button
              key={value}
              size="sm"
              variant={isPresetActive(value, searchParams) ? "primary" : "outline"}
              onClick={() => applyPreset(value)}
            >
              {label}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>

        <div className="space-y-3">
          <Input
            label="Search"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.currentTarget.value)}
            placeholder="Search by phone, workflow, correlation ID, or title"
          />
          {activeFilterBadges.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">Applied filters</p>
              <div className="flex flex-wrap gap-2" data-testid="observability-applied-filters">
                {activeFilterBadges.map((badge) => (
                  <Badge key={badge} variant="neutral">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--color-neutral-500)]">
              No extra filters applied. Presets and search are enough for most investigations.
            </p>
          )}

          <QueueFilters
            scope={scope}
            facets={facets}
            advancedFilterCount={advancedFilterCount}
            startDateDraft={startDateDraft}
            endDateDraft={endDateDraft}
            appliedKind={appliedKind}
            appliedStatus={appliedStatus}
            appliedTenantId={appliedTenantId}
            appliedSolution={appliedSolution}
            appliedAssistant={appliedAssistant}
            appliedMinDuration={appliedMinDuration}
            appliedIncludeNonProduction={appliedIncludeNonProduction}
            appliedErrorOnly={appliedErrorOnly}
            appliedRecordingsOnly={appliedRecordingsOnly}
            onStartDateDraftChange={setStartDateDraft}
            onEndDateDraftChange={setEndDateDraft}
            onSetFilter={setFilter}
            onSetBooleanFilter={setBooleanFilter}
          />

          <div className="flex gap-2">
            <Button onClick={applySearch}>Apply search</Button>
            <Button
              variant="outline"
              onClick={refreshAll}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {runsError ? (
          <p className="rounded-xl border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]">
            {observabilityErrorMessage(runsError, "queue")}
          </p>
        ) : null}
        {runsLoading && !runsHasData ? <p className="text-sm text-[var(--color-neutral-500)]">Loading case queue...</p> : null}
        {!runsLoading && visibleRuns.length === 0 ? (
          <p className="text-sm text-[var(--color-neutral-500)]">No cases match these filters yet.</p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {facets.kinds.map((facet) => (
            <Badge key={facet.value} variant="neutral">
              {facetLabel(facet)}
            </Badge>
          ))}
          {facets.statuses.map((facet) => (
            <Badge key={facet.value} variant={statusVariant(facet.value)}>
              {facetLabel(facet)}
            </Badge>
          ))}
        </div>

        {(() => {
          const liveRuns = visibleRuns.filter((run) => isRunningStatus(run.status));
          const historicalRuns = visibleRuns.filter((run) => !isRunningStatus(run.status));
          const sortedRuns = [...liveRuns, ...historicalRuns];
          const liveCount = liveRuns.length;

          return sortedRuns.map((run, index) => {
            const href = observabilityRunHref(scope, run, searchParams);
            const isActive = selectionKey === observabilitySelectionKey(selectionFromRun(run));
            const isLive = isRunningStatus(run.status);
            const showSeparator = liveCount > 0 && index === liveCount;

            return (
              <div key={href}>
                {showSeparator ? (
                  <hr className="my-2 border-t border-[rgba(15,23,42,0.1)]" />
                ) : null}
                <button
                  type="button"
                  data-testid={`observability-run-${run.kind}-${run.subject_id ?? run.call_id ?? run.run_id ?? "subject"}`}
                  onClick={() => openRun(run)}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    isActive
                      ? "border-[rgba(59,130,246,0.24)] bg-[rgba(239,246,255,0.7)] shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                      : "border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.72)] hover:border-[rgba(15,23,42,0.18)] hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{run.title}</p>
                      <p className="text-xs text-[var(--color-neutral-500)]">{run.subtitle ?? "No secondary label"}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {isLive ? <Badge variant="warning">Live</Badge> : null}
                      <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--color-neutral-500)]">
                    <Badge className={runChannelBadgeClassName(run.kind)}>{runChannelBadgeLabel(run.kind)}</Badge>
                    <span>{runSummaryKindLabel(run.kind)}</span>
                    <span>·</span>
                    <span>{formatDateTime(run.started_at)}</span>
                    <span>·</span>
                    <RunDuration run={run} />
                    {scope === "admin" && run.tenant_name ? (
                      <>
                        <span>·</span>
                        <span>{run.tenant_name}</span>
                      </>
                    ) : null}
                    {run.solution_name ? (
                      <>
                        <span>·</span>
                        <span>{run.solution_name}</span>
                      </>
                    ) : null}
                    {run.assistant_name ? (
                      <>
                        <span>·</span>
                        <span>{run.assistant_name}</span>
                      </>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {run.recording_available ? <Badge variant="neutral">Audio</Badge> : null}
                    {run.trace_available ? <Badge variant="neutral">Trace</Badge> : null}
                    {run.warning_count > 0 ? <Badge variant="warning">{run.warning_count} warnings</Badge> : null}
                    {run.error_count > 0 ? <Badge variant="error">{run.error_count} errors</Badge> : null}
                  </div>
                </button>
              </div>
            );
          });
        })()}
      </CardContent>
    </Card>
  );
}
