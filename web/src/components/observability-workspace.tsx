"use client";

import { useState } from "react";
import { Badge } from "@grove/ui/badge";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@grove/ui/tabs";
import { PageHeader } from "@/components/page-header";
import { PageFrame } from "@/components/page-frame";
import { useTenantCopy } from "@/components/tenant-locale-provider";
import { BUILD_ENABLED_SOLUTIONS, useTenantSolutions } from "@/lib/solutions";
import type { ObservabilitySelection } from "@/lib/observability-routes";
import { GraphTraceStrip } from "./observe/graph-trace-strip";
import { LatencyStripGauges } from "./observe/latency-strip-gauges";
import { CaseCoverageCard } from "./observability/case-coverage-card";
import { CaseQueue } from "./observability/case-queue";
import { CaseHeader } from "./observability/case-header";
import { EvidenceRail } from "./observability/evidence-rail";
import { CaseRecordPanel } from "./observability/case-record-panel";
import { CaseLiveOverlay } from "./observability/case-live-overlay";
import { ComparisonSection } from "./observability/run-compare";
import { ObservabilityProvider, useObservability } from "./observability/observability-context";
import { useLiveCaseSession } from "./observability/use-live-case-session";

import type { Scope } from "./observability/types";

const KPI_COLOR_MAP: Record<string, string> = {
  warning: "text-[var(--color-warning-500)]",
  error: "text-[var(--color-error-500)]",
  success: "text-[var(--color-success-500)]",
};

function KpiCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-400)]">{label}</p>
      <p className={`mt-0.5 text-xl font-semibold tabular-nums ${color ? KPI_COLOR_MAP[color] ?? "" : "text-[var(--color-neutral-900)]"}`}>{value}</p>
    </div>
  );
}

function formatAvgDuration(durations: number[]): string {
  if (durations.length === 0) return "—";
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const secs = Math.round(avg / 1000);
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
}

function WorkspaceContent({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const ws = useObservability();
  const [selectedTraceNodeIndex, setSelectedTraceNodeIndex] = useState<number | null>(null);

  const detailSummary = ws.detail.data?.summary ?? null;
  const live = useLiveCaseSession(
    detailSummary,
    ws.detail.data?.metrics ?? [],
    () => ws.detail.mutate(),
  );

  if (ws.mode === "queue") {
    return (
      <PageFrame width="full">
        <PageHeader title={title} description={description} />
        <Tabs
          value={ws.appliedKind}
          onValueChange={(value: string) => ws.setFilter("filter_kind", value === "all" ? "" : value)}
        >
          <TabsList>
            {ws.RUN_KIND_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value} data-testid={`observability-tab-${option.value}`}>
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Total cases" value={String(ws.visibleRuns.length)} />
          <KpiCard label="Attention" value={String(ws.countRunsNeedingAttention(ws.visibleRuns))} color="warning" />
          <KpiCard
            label="Active"
            value={String(ws.visibleRuns.filter((r) => r.ended_at == null && r.status !== "failed").length)}
            color="success"
          />
          <KpiCard
            label="Error rate"
            value={ws.visibleRuns.length > 0 ? `${((ws.visibleRuns.filter((r) => r.status === "failed").length / ws.visibleRuns.length) * 100).toFixed(0)}%` : "—"}
            color="error"
          />
          <KpiCard
            label="Avg duration"
            value={ws.visibleRuns.length > 0 ? formatAvgDuration(ws.visibleRuns.filter((r): r is typeof r & { duration_ms: number } => r.duration_ms != null && r.duration_ms > 0).map((r) => r.duration_ms)) : "—"}
          />
          <KpiCard label="With audio" value={String(ws.countRunsWithAudio(ws.visibleRuns))} />
        </div>
        <CaseCoverageCard subjectCoverage={ws.subjectCoverage} />
        <CaseQueue />
      </PageFrame>
    );
  }

  if (ws.mode === "compare") {
    return (
      <PageFrame width="full">
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-950)]"
          onClick={() => ws.setCompareTargetKey("")}
        >
          <span aria-hidden="true">&larr;</span> Back to case
        </button>

        {ws.compare.isLoading ? (
          <p className="text-sm text-[var(--color-neutral-500)]">Loading comparison...</p>
        ) : null}
        {ws.compare.error ? (
          <p className="rounded-xl border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]">
            {ws.observabilityErrorMessage(ws.compare.error, "compare")}
          </p>
        ) : null}
        {ws.compare.data ? <ComparisonSection compare={ws.compare.data} /> : null}
      </PageFrame>
    );
  }

  return (
    <PageFrame width="full">
      <button
        type="button"
        className="flex items-center gap-1.5 text-sm text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-950)]"
        onClick={ws.openListView}
      >
        <span aria-hidden="true">&larr;</span> Back to queue
      </button>
      <Card className="border-[rgba(15,23,42,0.08)] bg-white/95">
        <CaseHeader
          detailSummary={detailSummary}
          detailMetrics={live.displayMetrics}
        />

        {live.isLive && live.liveSessionId && detailSummary ? (
          <CaseLiveOverlay
            callId={live.liveSessionId}
            channelKind={detailSummary.kind}
            isVoiceCase={live.isVoiceCase}
            liveKit={live.liveKit}
          />
        ) : null}

        {ws.detail.data ? (
          <CardContent className="space-y-6">
            {/* Voice session: trace + latency strip */}
            {ws.isVoiceSession && ws.traceNodes.length > 0 ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2">
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">Graph Trace</h3>
                  <GraphTraceStrip
                    nodes={ws.traceNodes}
                    routes={ws.traceRoutes}
                    selectedNodeIndex={selectedTraceNodeIndex}
                    onSelectNode={setSelectedTraceNodeIndex}
                    isLive={live.isLive}
                  />
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3">
                  <LatencyStripGauges summaries={ws.latencySummaries} turns={ws.latencyTurns} isLive={live.isLive} />
                </div>
              </div>
            ) : null}

            <div className="grid gap-8 2xl:grid-cols-[minmax(0,1fr)_360px] 4xl:grid-cols-[minmax(0,1fr)_420px]">
              <EvidenceRail
                summaryInsights={ws.summaryInsights}
                caseCoverage={ws.caseCoverage}
                solutionEvidenceItems={ws.solutionEvidenceItems}
                solutionTimelineDecorators={ws.solutionTimelineDecorators}
                firstRecording={ws.firstRecording}
                recordingUnavailable={ws.detail.data.availability.recording_unavailable}
                recordingUrl={ws.recordingUrl}
                recordingError={ws.recordingError}
                audioRef={ws.audioRef}
                sessionStartedAt={detailSummary?.started_at ?? null}
                filteredTimeline={ws.filteredTimeline}
                timelineItems={ws.timelineItems}
                timelineTotalItems={ws.timelineTotalItems}
                timelineLoading={ws.timelineLoading}
                timelineHasData={ws.timelineHasData}
                timelineNextCursor={ws.timelineNextCursor}
                timelineLoadingMore={ws.timelineLoadingMore}
                selectedItemId={ws.selectedItemId}
                onSeekRecording={ws.seekRecording}
                onLoadMore={ws.loadMoreTimeline}
                isLive={live.isLive}
                liveItems={live.liveStream.liveItems}
                liveStreaming={live.liveStream.streaming}
                liveStreamingError={live.liveStream.error}
                timelineFilter={ws.timelineFilter}
                isVoiceSession={ws.isVoiceSession}
                mergedTurns={ws.mergedTurns}
                maxEotMs={ws.maxEotMs}
              />

              <CaseRecordPanel
                caseKind={detailSummary?.kind}
                caseRecordFields={ws.caseRecordFields}
                solutionCaseDetailSections={ws.solutionCaseDetailSections}
                recommendedActions={ws.recommendedActions}
                integrityGaps={ws.integrityGaps}
                detailRelatedEntities={ws.detailRelatedEntities}
                detailContextFields={ws.detailContextFields}
                traceContext={ws.detail.data.trace_context}
                transcriptText={ws.detail.data.transcript_text}
                selectedItem={ws.selectedItem}
                copyNotice={ws.copyNotice}
                onCopyCorrelationId={ws.copyCorrelationId}
                isLive={live.isLive}
                livePhase={live.liveStream.livePhase}
                turnCount={live.liveStream.turnCount}
              />
            </div>
          </CardContent>
        ) : null}
      </Card>
    </PageFrame>
  );
}

function Workspace({
  scope,
  title,
  description,
  selection,
  coverageSolutions,
}: {
  scope: Scope;
  title: string;
  description: string;
  selection: ObservabilitySelection;
  coverageSolutions: ReadonlySet<string>;
}) {
  return (
    <ObservabilityProvider scope={scope} selection={selection} coverageSolutions={coverageSolutions}>
      <WorkspaceContent title={title} description={description} />
    </ObservabilityProvider>
  );
}

export function TenantObservabilityWorkspace({ selection = null }: { selection?: ObservabilitySelection }) {
  const copy = useTenantCopy();
  const { visibleEnabledSet } = useTenantSolutions();
  return (
    <Workspace
      scope="tenant"
      title={copy.observability.title}
      description={copy.observability.description}
      selection={selection}
      coverageSolutions={visibleEnabledSet}
    />
  );
}

export function ObservabilityWorkspaceFallback({ title, description }: { title: string; description: string }) {
  return (
    <PageFrame width="full">
      <PageHeader title={title} description={description} />
      <Card className="border-[rgba(15,23,42,0.08)] bg-white/95">
        <CardContent className="px-6 py-10 text-sm text-[var(--color-neutral-500)]">Loading observability workspace...</CardContent>
      </Card>
    </PageFrame>
  );
}

export function AdminObservabilityWorkspace({ selection = null }: { selection?: ObservabilitySelection }) {
  return <Workspace scope="admin" title="Observability" description="Cross-tenant case queue for sessions, channel sessions, workflows, incidents, runtimes, and composition state." selection={selection} coverageSolutions={BUILD_ENABLED_SOLUTIONS} />;
}
