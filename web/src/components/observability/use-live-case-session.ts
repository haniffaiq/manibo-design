import { useEffect, useRef } from "react";

import type { ObservabilityMetric, ObservabilityRunSummary } from "@/lib/api/observability";
import { useLiveCaseStream, type LiveCaseStreamResult } from "./use-live-case-stream";
import { useLiveKitObserver, type LiveKitObserverResult } from "./use-livekit-observer";
import { isRunningStatus } from "./formatters";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface LiveCaseSessionResult {
  isLive: boolean;
  isVoiceCase: boolean;
  liveCallId: string | null;
  /** Generic session ID for operator action bar — works for all live channel types. */
  liveSessionId: string | null;
  liveStream: LiveCaseStreamResult;
  liveKit: LiveKitObserverResult;
  displayMetrics: ObservabilityMetric[];
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useLiveCaseSession(
  detailSummary: ObservabilityRunSummary | null,
  detailMetrics: ObservabilityMetric[],
  detailMutate: () => Promise<unknown>,
): LiveCaseSessionResult {
  const isLive = detailSummary ? isRunningStatus(detailSummary.status) : false;
  const isVoiceCase = detailSummary?.kind === "call_session";
  // SSE endpoints are /calls/{call_id}/... — only valid for voice sessions with a call_id.
  // Chat sessions use channel_session_id which is NOT a valid call_id for SSE/LiveKit.
  const liveCallId = isLive && detailSummary?.call_id ? detailSummary.call_id : null;
  // Generic session ID for operator action bar — works for all live channel types.
  const liveSessionId = isLive
    ? detailSummary?.call_id ?? detailSummary?.channel_session_id ?? detailSummary?.subject_id ?? null
    : null;

  const liveStream = useLiveCaseStream(liveCallId, isLive);
  const liveKit = useLiveKitObserver(liveCallId);

  // Periodic detail revalidation while live — catches status transitions
  // that SSE idle-timeout `end` events cannot reliably signal.
  const detailMutateRef = useRef(detailMutate);
  detailMutateRef.current = detailMutate;

  useEffect(() => {
    if (!isLive) return;
    const interval = window.setInterval(() => {
      void detailMutateRef.current();
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [isLive]);

  // Disconnect LiveKit when case transitions from live to historical
  const wasLiveRef = useRef(isLive);
  useEffect(() => {
    if (wasLiveRef.current && !isLive) {
      liveKit.leave();
    }
    wasLiveRef.current = isLive;
  }, [isLive]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayMetrics = isLive
    ? detailMetrics.map((m) => ({ ...m, value: "--" }))
    : detailMetrics;

  return { isLive, isVoiceCase, liveCallId, liveSessionId, liveStream, liveKit, displayMetrics };
}
