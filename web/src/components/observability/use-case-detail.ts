import { useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import {
  getObservabilityRecordingSignedUrl,
  type ObservabilityTimelineItem,
} from "@/lib/api/observability";
import {
  getCallLatency,
  getCallTrace,
  type CallTraceNodeSummary,
  type CallTraceRouteSelection,
  type CallLatencyMetricSummary,
  type LiveCallTurnLatency,
} from "@/lib/api/call-observability";
import { observabilitySelectionKey, type ObservabilitySelection } from "@/lib/observability-routes";
import * as swrKeys from "@/lib/swr-keys";
import {
  type Scope,
  type TimelineFilter,
  EMPTY_TIMELINE,
  resolveSubjectCoverage,
} from "./types";
import { timelineMatchesFilter } from "./formatters";
import {
  type MergedConversationTurn,
  availabilityMessages,
  buildCaseRecordFields,
  buildSolutionCaseDetailSections,
  buildSolutionEvidenceItems,
  buildSolutionTimelineDecorators,
  computeMaxEotMs,
  evidenceCoverage,
  mergeConversationTurns,
  observabilityErrorMessage,
} from "./domain-logic";
import { loadRunDetail, loadTimelinePage } from "./loaders";

const EMPTY_LATENCY_TURNS: LiveCallTurnLatency[] = [];
const EMPTY_MERGED_TURNS: MergedConversationTurn[] = [];

interface CaseDetailProps {
  scope: Scope;
  selection: ObservabilitySelection;
  detailTenantId: string | null;
  coverageSolutions: ReadonlySet<string>;
}

export function useCaseDetail({ scope, selection, detailTenantId, coverageSolutions }: CaseDetailProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const selectionKey = observabilitySelectionKey(selection);
  const activeSelection = selection ?? undefined;

  /* -- Local state ------------------------------------------------- */

  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const [timelineItems, setTimelineItems] = useState<ObservabilityTimelineItem[]>(EMPTY_TIMELINE);
  const [timelineNextCursor, setTimelineNextCursor] = useState<string | null>(null);
  const [timelineTotalItems, setTimelineTotalItems] = useState(0);
  const [timelineLoadingMore, setTimelineLoadingMore] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  /* -- SWR: detail ------------------------------------------------- */

  const detail = useSWR(
    activeSelection && (scope === "tenant" || detailTenantId)
      ? swrKeys.observabilityDetail(scope, selectionKey, detailTenantId)
      : null,
    ([, nextScope]) => {
      if (!activeSelection) {
        throw new Error("observability detail requested without a selection");
      }
      return loadRunDetail(nextScope as Scope, activeSelection, detailTenantId);
    },
    { revalidateOnFocus: false },
  );

  /* -- SWR: timeline ----------------------------------------------- */

  const timeline = useSWR(
    activeSelection && (scope === "tenant" || detailTenantId)
      ? swrKeys.observabilityTimeline(scope, selectionKey, detailTenantId)
      : null,
    ([, nextScope]) => {
      if (!activeSelection) {
        throw new Error("observability timeline requested without a selection");
      }
      return loadTimelinePage(nextScope as Scope, activeSelection, detailTenantId);
    },
    { revalidateOnFocus: false },
  );

  /* -- SWR: call latency (voice sessions only) --------------------- */

  const voiceCallId =
    detail.data?.summary.kind === "call_session" ? (detail.data.summary.call_id ?? null) : null;

  const latency = useSWR(
    voiceCallId ? swrKeys.callLatency(voiceCallId) : null,
    ([, id]) => getCallLatency(id),
    { revalidateOnFocus: false },
  );

  /* -- SWR: call trace (voice sessions only) ----------------------- */

  const trace = useSWR(
    voiceCallId ? swrKeys.callTrace(voiceCallId) : null,
    ([, id]) => getCallTrace(id),
    { revalidateOnFocus: false },
  );

  /* -- Reset on selection change ----------------------------------- */

  useEffect(() => {
    setTimelineFilter("all");
    setSelectedItemId(null);
    setCopyNotice(null);
  }, [selectionKey]);

  /* -- Sync timeline data ------------------------------------------ */

  useEffect(() => {
    if (!timeline.data) {
      setTimelineItems(EMPTY_TIMELINE);
      setTimelineNextCursor(null);
      setTimelineTotalItems(0);
      setTimelineError(null);
      return;
    }
    setTimelineItems(timeline.data.items ?? EMPTY_TIMELINE);
    setTimelineNextCursor(timeline.data.next_cursor ?? null);
    setTimelineTotalItems(timeline.data.total_items ?? 0);
    setTimelineError(null);
  }, [timeline.data]);

  useEffect(() => {
    if (timeline.error) {
      setTimelineError(observabilityErrorMessage(timeline.error, "timeline"));
    }
  }, [timeline.error]);

  /* -- Filtered timeline ------------------------------------------- */

  const filteredTimeline = useMemo(
    () => timelineItems.filter((item) => timelineMatchesFilter(item, timelineFilter)),
    [timelineFilter, timelineItems],
  );

  useEffect(() => {
    if (filteredTimeline.length === 0) {
      setSelectedItemId(null);
      return;
    }
    if (selectedItemId && filteredTimeline.some((item) => item.id === selectedItemId)) {
      return;
    }
    const nextSelected = filteredTimeline.find((item) => item.severity !== "info")?.id ?? filteredTimeline[0]?.id ?? null;
    setSelectedItemId(nextSelected);
  }, [filteredTimeline, selectedItemId]);

  /* -- Derived detail values --------------------------------------- */

  const selectedItem = filteredTimeline.find((item) => item.id === selectedItemId) ?? null;
  const summaryAlerts = availabilityMessages(detail.data ?? null);
  const summaryInsights = detail.data?.summary_insights ?? [];
  const recommendedActions = detail.data?.recommended_actions ?? [];
  const integrityGaps = detail.data?.integrity_gaps ?? [];
  const detailRecordings = detail.data?.recordings ?? null;
  const detailContextFields = detail.data?.context_fields ?? [];
  const detailRelatedEntities = detail.data?.related_entities ?? [];
  const detailSolutionEnrichers = useMemo(
    () => detail.data?.solution_enrichers ?? [],
    [detail.data?.solution_enrichers],
  );
  const firstRecording = detailRecordings?.[0] ?? null;
  const caseCoverage = detail.data ? evidenceCoverage(detail.data) : [];
  const subjectCoverage = useMemo(() => resolveSubjectCoverage(coverageSolutions), [coverageSolutions]);
  const solutionCaseDetailSections = useMemo(
    () => buildSolutionCaseDetailSections(detailSolutionEnrichers),
    [detailSolutionEnrichers],
  );
  const solutionEvidenceItems = useMemo(
    () => buildSolutionEvidenceItems(detailSolutionEnrichers),
    [detailSolutionEnrichers],
  );
  const solutionTimelineDecorators = useMemo(
    () => buildSolutionTimelineDecorators(detailSolutionEnrichers),
    [detailSolutionEnrichers],
  );

  const caseRecordFields = useMemo(
    () => (detail.data ? buildCaseRecordFields(detail.data.summary) : []),
    [detail.data],
  );

  /* -- Latency turn merge ------------------------------------------ */

  const latencyTurns: LiveCallTurnLatency[] = latency.data?.turns ?? EMPTY_LATENCY_TURNS;
  const isVoiceSession = detail.data?.summary.kind === "call_session";

  const mergedTurns = useMemo(
    () => (isVoiceSession ? mergeConversationTurns(latencyTurns, timelineItems) : EMPTY_MERGED_TURNS),
    [isVoiceSession, latencyTurns, timelineItems],
  );

  const maxEotMs = useMemo(
    () => computeMaxEotMs(latencyTurns),
    [latencyTurns],
  );

  /* -- Recording hydration ----------------------------------------- */

  useEffect(() => {
    let cancelled = false;

    async function hydrateRecording(): Promise<void> {
      setRecordingUrl(null);
      setRecordingError(null);
      if (!firstRecording) {
        return;
      }
      try {
        const signed = await getObservabilityRecordingSignedUrl(firstRecording.signed_url_path, 3600);
        if (!cancelled) {
          setRecordingUrl(signed.url);
        }
      } catch {
        if (!cancelled) {
          setRecordingError("Audio playback is unavailable right now. Refresh the case or inspect the rest of the evidence.");
        }
      }
    }

    void hydrateRecording();
    return () => {
      cancelled = true;
    };
  }, [firstRecording]);

  /* -- Timeline navigation ----------------------------------------- */

  function jumpToNextIssue(): void {
    const issues = filteredTimeline.filter((item) => item.severity !== "info");
    if (issues.length === 0) {
      return;
    }
    const currentIndex = issues.findIndex((item) => item.id === selectedItemId);
    const nextItem = issues[(currentIndex + 1) % issues.length] ?? issues[0];
    setSelectedItemId(nextItem.id);
    if (recordingUrl && detail.data?.summary.started_at && nextItem.occurred_at) {
      const audio = audioRef.current;
      if (audio) {
        const offsetSeconds =
          (new Date(nextItem.occurred_at).getTime() - new Date(detail.data.summary.started_at).getTime()) / 1000;
        audio.currentTime = Math.max(offsetSeconds, 0);
      }
    }
  }

  function seekRecording(item: ObservabilityTimelineItem): void {
    setSelectedItemId(item.id);
    if (!recordingUrl || !detail.data?.summary.started_at || !item.occurred_at) {
      return;
    }
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    const offsetSeconds =
      (new Date(item.occurred_at).getTime() - new Date(detail.data.summary.started_at).getTime()) / 1000;
    audio.currentTime = Math.max(offsetSeconds, 0);
    void audio.play().catch(() => undefined);
  }

  /* -- Clipboard --------------------------------------------------- */

  function copyCorrelationId(value: string): void {
    void (async () => {
      try {
        await navigator.clipboard.writeText(value);
        setCopyNotice("Correlation ID copied.");
      } catch {
        setCopyNotice("Could not copy the correlation ID from this browser.");
      }
    })();
  }

  /* -- Load more timeline ------------------------------------------ */

  function loadMoreTimeline(): void {
    if (!selection || !timelineNextCursor || timelineLoadingMore) {
      return;
    }
    void (async () => {
      setTimelineLoadingMore(true);
      setTimelineError(null);
      try {
        const nextPage = await loadTimelinePage(scope, selection, detailTenantId, timelineNextCursor);
        setTimelineItems((current) => [...current, ...(nextPage.items ?? EMPTY_TIMELINE)]);
        setTimelineNextCursor(nextPage.next_cursor ?? null);
        setTimelineTotalItems(nextPage.total_items ?? 0);
      } catch (error) {
        setTimelineError(observabilityErrorMessage(error, "timeline"));
      } finally {
        setTimelineLoadingMore(false);
      }
    })();
  }

  /* ---------------------------------------------------------------- */

  return {
    selectionKey,
    detail,
    timeline,
    filteredTimeline,
    timelineItems,
    timelineTotalItems,
    timelineLoading: timeline.isLoading,
    timelineHasData: !!timeline.data,
    timelineNextCursor,
    timelineLoadingMore,
    timelineError,
    timelineFilter,
    selectedItemId,
    selectedItem,
    recordingUrl,
    recordingError,
    audioRef,
    summaryAlerts,
    summaryInsights,
    recommendedActions,
    integrityGaps,
    detailRecordings,
    detailContextFields,
    detailRelatedEntities,
    detailSolutionEnrichers,
    firstRecording,
    caseCoverage,
    subjectCoverage,
    caseRecordFields,
    solutionCaseDetailSections,
    solutionEvidenceItems,
    solutionTimelineDecorators,
    isVoiceSession: !!isVoiceSession,
    mergedTurns,
    maxEotMs,
    traceNodes: (trace.data?.nodes ?? []) as CallTraceNodeSummary[],
    traceRoutes: (trace.data?.routes ?? []) as CallTraceRouteSelection[],
    latencySummaries: (latency.data?.summaries ?? {}) as Record<string, CallLatencyMetricSummary>,
    latencyTurns,
    copyNotice,
    setTimelineFilter,
    jumpToNextIssue,
    seekRecording,
    copyCorrelationId,
    loadMoreTimeline,
  };
}
