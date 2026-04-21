"use client";

import Link from "next/link";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { List, useListRef } from "react-window";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { AudioWaveformTimeline } from "./audio-waveform-timeline";
import { ConversationTurnRow } from "./conversation-turn-row";
import type {
  ObservabilityRecording,
  ObservabilitySummaryInsight,
  ObservabilityTimelineItem,
} from "@/lib/api/observability";
import type {
  MergedConversationTurn,
  SolutionEvidenceDisplayItem,
  SolutionTimelineDecoratorDisplayItem,
} from "./domain-logic";
import type { CoverageState, TimelineFilter } from "./types";
import {
  coverageLabel,
  coverageVariant,
  formatDateTime,
  formatDurationMs,
  severityBadgeVariant,
  severityVariant,
  timelineGroupLabel,
  timelineMatchesFilter,
} from "./formatters";

function IntegrityGapMarker({ message }: { message: string }) {
  return (
    <div
      data-testid="observability-gap-marker"
      className="flex items-center gap-3 rounded-2xl border border-dashed border-[var(--color-warning-500)] bg-[var(--color-warning-50)] px-4 py-3"
    >
      <span className="text-sm">&#x26A0;</span>
      <span className="text-sm text-[var(--color-neutral-700)]">{message}</span>
    </div>
  );
}

const SEVERITY_LEFT_BORDER: Record<string, string> = {
  error: "border-l-[3px] border-l-[var(--color-error-500)]",
  warning: "border-l-[3px] border-l-[var(--color-warning-500)]",
};

function severityLabel(severity: "info" | "warning" | "error"): string {
  if (severity === "error") {
    return "Issue";
  }
  if (severity === "warning") {
    return "Review";
  }
  return "Context";
}

function TimelineItem({
  item,
  isSelected,
  onSeek,
}: {
  item: ObservabilityTimelineItem;
  isSelected: boolean;
  onSeek: (item: ObservabilityTimelineItem) => void;
}) {
  const leftBorder = SEVERITY_LEFT_BORDER[item.severity] ?? "";

  return (
    <button
      type="button"
      data-testid={`observability-timeline-${item.id}`}
      data-severity={item.severity}
      onClick={() => onSeek(item)}
      className={`w-full rounded-2xl border p-4 text-left transition ${leftBorder} ${
        isSelected
          ? "border-[rgba(59,130,246,0.24)] bg-[rgba(239,246,255,0.7)]"
          : "border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.72)] hover:bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={severityVariant(item)}>{timelineGroupLabel(item.kind)}</Badge>
            <span className="text-xs text-[var(--color-neutral-500)]">{formatDateTime(item.occurred_at)}</span>
          </div>
          <p className="mt-2 text-sm font-semibold text-[var(--color-neutral-950)]">{item.label}</p>
          {item.detail ? <p className="mt-1 text-sm text-[var(--color-neutral-600)]">{item.detail}</p> : null}
        </div>
        {item.duration_ms != null ? (
          <span className="text-xs font-medium text-[var(--color-neutral-500)]">{formatDurationMs(item.duration_ms)}</span>
        ) : null}
      </div>
    </button>
  );
}

export interface EvidenceRailProps {
  summaryInsights: ObservabilitySummaryInsight[];
  caseCoverage: Array<{ key: string; label: string; detail: string; state: CoverageState }>;
  solutionEvidenceItems: SolutionEvidenceDisplayItem[];
  solutionTimelineDecorators: SolutionTimelineDecoratorDisplayItem[];
  firstRecording: ObservabilityRecording | null;
  recordingUnavailable: boolean;
  recordingUrl: string | null;
  recordingError: string | null;
  audioRef: RefObject<HTMLAudioElement | null>;
  sessionStartedAt: string | null;

  filteredTimeline: ObservabilityTimelineItem[];
  timelineItems: ObservabilityTimelineItem[];
  timelineTotalItems: number;
  timelineLoading: boolean;
  timelineHasData: boolean;
  timelineNextCursor: string | null;
  timelineLoadingMore: boolean;
  selectedItemId: string | null;
  onSeekRecording: (item: ObservabilityTimelineItem) => void;
  onLoadMore: () => void;

  isLive?: boolean;
  liveItems?: ObservabilityTimelineItem[];
  liveStreaming?: boolean;
  liveStreamingError?: string | null;
  timelineFilter?: TimelineFilter;

  isVoiceSession?: boolean;
  mergedTurns?: MergedConversationTurn[];
  maxEotMs?: number;
}

export function EvidenceRail({
  summaryInsights,
  caseCoverage,
  solutionEvidenceItems,
  solutionTimelineDecorators,
  firstRecording,
  recordingUnavailable,
  recordingUrl,
  recordingError,
  audioRef,
  sessionStartedAt,
  filteredTimeline,
  timelineItems,
  timelineTotalItems,
  timelineLoading,
  timelineHasData,
  timelineNextCursor,
  timelineLoadingMore,
  selectedItemId,
  onSeekRecording,
  onLoadMore,
  isLive = false,
  liveItems = [],
  liveStreaming = false,
  liveStreamingError = null,
  timelineFilter = "all",
  isVoiceSession = false,
  mergedTurns = [],
  maxEotMs = 0,
}: EvidenceRailProps) {
  const [expandedTurnIndex, setExpandedTurnIndex] = useState<number | null>(null);
  /* -- Merge historical + live items --------------------------------- */
  const mergedTimeline = useMemo(() => {
    if (!isLive || liveItems.length === 0) return filteredTimeline;
    const filteredLive = liveItems.filter((item) => timelineMatchesFilter(item, timelineFilter));
    // Deduplicate: live items that overlap with the initial timeline payload (SSE starts from after_seq=0)
    const historicalIds = new Set(filteredTimeline.map((item) => item.id));
    const uniqueLive = filteredLive.filter((item) => !historicalIds.has(item.id));
    return [...filteredTimeline, ...uniqueLive];
  }, [filteredTimeline, liveItems, isLive, timelineFilter]);

  /* -- Voice: split into system events (non-transcript) --------------- */
  const systemEvents = useMemo(
    () => (isVoiceSession ? mergedTimeline.filter((item) => item.kind !== "transcript") : mergedTimeline),
    [isVoiceSession, mergedTimeline],
  );

  /* -- Virtualization ------------------------------------------------- */
  const VIRTUALIZATION_THRESHOLD = 40;
  const useVirtualized = mergedTimeline.length > VIRTUALIZATION_THRESHOLD;
  const listRef = useListRef(null);
  const isAtBottomRef = useRef(true);

  const getRowHeight = useCallback(
    (index: number) => {
      const item = mergedTimeline[index];
      return item?.detail ? 112 : 88;
    },
    [mergedTimeline],
  );

  // Track whether user is viewing the last row (virtualized mode)
  const handleRowsRendered = useCallback(
    (visibleRows: { stopIndex: number }) => {
      isAtBottomRef.current = visibleRows.stopIndex >= mergedTimeline.length - 2;
    },
    [mergedTimeline.length],
  );

  useEffect(() => {
    if (isLive && isAtBottomRef.current && mergedTimeline.length > 0) {
      if (useVirtualized && listRef.current) {
        listRef.current.scrollToRow({ index: mergedTimeline.length - 1, align: "end", behavior: "smooth" });
      }
    }
  }, [mergedTimeline.length, isLive, useVirtualized, listRef]);

  return (
    <div className="space-y-4">
      {summaryInsights.length > 0 ? (
        <div
          data-testid="observability-summary-insights"
          className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Case summary</p>
              <p className="text-xs text-[var(--color-neutral-500)]">
                Start here. If this summary is vague, the backend contract is still too weak and the case is not good enough yet.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 2xl:grid-cols-2">
            {summaryInsights.map((insight) => (
              <div
                key={insight.key}
                className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{insight.label}</p>
                  <Badge variant={severityBadgeVariant(insight.severity)}>
                    {insight.severity === "info" ? "Context" : insight.severity === "warning" ? "Review" : "Issue"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-[var(--color-neutral-600)]">{insight.detail}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div
        data-testid="observability-evidence-map"
        className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4"
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Evidence map</p>
            <p className="text-xs text-[var(--color-neutral-500)]">
              Before opening payloads, check which evidence layers already support this case and which V2 surfaces are still thin.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 2xl:grid-cols-2">
          {caseCoverage.map((item) => (
            <div
              key={item.key}
              className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--color-neutral-950)]">{item.label}</p>
                <Badge variant={coverageVariant(item.state)}>{coverageLabel(item.state)}</Badge>
              </div>
              <p className="mt-2 text-sm text-[var(--color-neutral-600)]">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {solutionEvidenceItems.length > 0 ? (
        <div
          data-testid="observability-solution-evidence"
          className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Solution evidence</p>
              <p className="text-xs text-[var(--color-neutral-500)]">
                Persisted solution facts stay in the shared case instead of disappearing into a custom side panel.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {solutionEvidenceItems.map((item, index) => {
              const leftBorder = SEVERITY_LEFT_BORDER[item.severity] ?? "";
              return (
                <div
                  key={item.key}
                  data-testid={`observability-solution-evidence-${item.solutionName}-${index}`}
                  className={`rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 px-4 py-3 ${leftBorder}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{item.label}</p>
                      <p className="mt-1 text-sm text-[var(--color-neutral-600)]">{item.detail}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">{item.solutionLabel}</Badge>
                      <Badge variant={severityBadgeVariant(item.severity)}>{severityLabel(item.severity)}</Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--color-neutral-500)]">
                    {item.occurred_at ? <span>{formatDateTime(item.occurred_at)}</span> : null}
                    {item.href ? (
                      <Link
                        href={item.href}
                        prefetch={false}
                        className="font-medium text-[var(--color-primary-700)] hover:text-[var(--color-primary-800)]"
                      >
                        Open source record
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {solutionTimelineDecorators.length > 0 ? (
        <div
          data-testid="observability-solution-timeline-markers"
          className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4"
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Solution timeline markers</p>
              <p className="text-xs text-[var(--color-neutral-500)]">
                These markers come from shipped solution state so the operator can line up case events with business state changes.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {solutionTimelineDecorators.map((item, index) => {
              const leftBorder = SEVERITY_LEFT_BORDER[item.severity] ?? "";
              return (
                <div
                  key={item.key}
                  data-testid={`observability-solution-marker-${item.solutionName}-${index}`}
                  className={`rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 px-4 py-3 ${leftBorder}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{item.label}</p>
                      {item.detail ? <p className="mt-1 text-sm text-[var(--color-neutral-600)]">{item.detail}</p> : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">{item.solutionLabel}</Badge>
                      <Badge variant={severityBadgeVariant(item.severity)}>{severityLabel(item.severity)}</Badge>
                    </div>
                  </div>
                  {item.occurred_at ? (
                    <p className="mt-3 text-xs text-[var(--color-neutral-500)]">{formatDateTime(item.occurred_at)}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {firstRecording ? (
        <div data-testid="observability-recording-state" data-state="available">
          {recordingError ? (
            <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] p-4">
              <p className="text-sm text-[var(--color-error-700)]">{recordingError}</p>
            </div>
          ) : recordingUrl && sessionStartedAt ? (
            <AudioWaveformTimeline
              recordingUrl={recordingUrl}
              sessionStartedAt={sessionStartedAt}
              timelineItems={timelineItems}
              onSeekToItem={onSeekRecording}
              selectedItemId={selectedItemId}
            />
          ) : (
            <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] p-4">
              <p className="text-sm text-[var(--color-neutral-500)]">Preparing audio waveform...</p>
            </div>
          )}
          {/* Hidden audio element for programmatic playback control */}
          {recordingUrl ? (
            <audio ref={audioRef} preload="metadata" className="hidden" src={recordingUrl} />
          ) : null}
        </div>
      ) : recordingUnavailable ? (
        <div
          data-testid="observability-recording-state"
          data-state="unavailable"
          className="rounded-2xl border border-dashed border-[rgba(15,23,42,0.12)] bg-[rgba(248,250,252,0.84)] p-4"
        >
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Audio recording unavailable</p>
          <p className="mt-1 text-sm text-[var(--color-neutral-600)]">
            This run still remains debuggable through transcript, trace, tool, and workflow signals.
          </p>
        </div>
      ) : null}

      {isVoiceSession && mergedTurns.length > 0 ? (
        <>
          {/* ---- Conversation section (voice only) ---- */}
          <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-neutral-950)]">
                  Conversation &middot; {mergedTurns.length} {mergedTurns.length === 1 ? "turn" : "turns"}
                </p>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-[var(--color-neutral-500)]">
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-blue-500" /> STT</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-purple-500" /> LLM</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-amber-500" /> TTS</span>
                  <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-green-500" /> Speak</span>
                </div>
              </div>
            </div>
          </div>
          <div data-testid="conversation-turns-section" className="space-y-3">
            {mergedTurns.map((merged, idx) => (
              <ConversationTurnRow
                key={`${merged.turn.turn_index}-${merged.role}`}
                turn={merged.turn}
                transcript={merged.transcript}
                maxEotMs={maxEotMs}
                expanded={expandedTurnIndex === idx}
                onToggleExpand={() =>
                  setExpandedTurnIndex((prev) => (prev === idx ? null : idx))
                }
                isLive={isLive}
              />
            ))}
          </div>

          {/* ---- System events section (voice only) ---- */}
          <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-neutral-950)]">
                  System Events &middot; {systemEvents.length} {systemEvents.length === 1 ? "item" : "items"}
                </p>
                <p className="text-xs text-[var(--color-neutral-500)]">
                  Routes, nodes, metrics, logs, and other non-transcript events.
                </p>
              </div>
            </div>
          </div>
          {systemEvents.length > 0 ? (
            <div className="space-y-3">
              {systemEvents.map((item) => (
                <TimelineItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItemId === item.id}
                  onSeek={onSeekRecording}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--color-neutral-500)]">No system events for this session.</p>
          )}
        </>
      ) : (
        <>
          {/* ---- Unified evidence rail (non-voice) ---- */}
          <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Evidence rail</p>
                <p className="text-xs text-[var(--color-neutral-500)]">
                  One ordered chain for this case. Use the filter chips to narrow the rail, not to switch mental models.
                </p>
              </div>
              <p className="text-sm text-[var(--color-neutral-600)]">
                Showing {filteredTimeline.length} visible events from {timelineItems.length} loaded items
                {timelineTotalItems > 0 ? ` out of ${timelineTotalItems} total.` : "."}
              </p>
            </div>
          </div>

          {timelineLoading && !timelineHasData ? (
            <p className="text-sm text-[var(--color-neutral-500)]">Loading timeline...</p>
          ) : null}
          {mergedTimeline.length === 0 && !timelineLoading ? (
            <p className="text-sm text-[var(--color-neutral-500)]">
              {isLive ? "Waiting for live events..." : "No timeline items match this filter."}
            </p>
          ) : null}

          {mergedTimeline.length > 0 && useVirtualized ? (
            <List
              listRef={listRef}
              rowCount={mergedTimeline.length}
              rowHeight={getRowHeight}
              rowProps={{}}
              style={{ height: "70vh" }}
              overscanCount={5}
              onRowsRendered={handleRowsRendered}
              rowComponent={({ index, style: rowStyle }) => {
                const item = mergedTimeline[index];
                if (!item) return null;
                return (
                  <div style={{ ...rowStyle, paddingBottom: 12 }}>
                    <TimelineItem
                      item={item}
                      isSelected={selectedItemId === item.id}
                      onSeek={onSeekRecording}
                    />
                  </div>
                );
              }}
            />
          ) : mergedTimeline.length > 0 ? (
            <div className="space-y-3">
              {mergedTimeline.map((item) => (
                <TimelineItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItemId === item.id}
                  onSeek={onSeekRecording}
                />
              ))}
            </div>
          ) : null}
        </>
      )}

      {liveStreamingError ? (
        <p className="rounded-xl border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]">
          {liveStreamingError}
        </p>
      ) : null}

      {recordingUnavailable ? (
        <IntegrityGapMarker message="Recording expected but asset missing" />
      ) : null}

      {isLive && liveStreaming ? (
        <div className="flex items-center gap-2 py-2">
          <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-success-500)]" />
          <span className="text-xs text-[var(--color-neutral-500)]">Streaming live events...</span>
        </div>
      ) : null}

      {timelineNextCursor ? (
        <div className="flex justify-center">
          <Button variant="outline" onClick={onLoadMore} disabled={timelineLoadingMore}>
            {timelineLoadingMore ? "Loading more..." : "Load more timeline"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
