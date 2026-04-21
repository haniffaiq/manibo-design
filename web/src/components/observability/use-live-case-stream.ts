import { useMemo } from "react";

import {
  mapTranscriptEvent,
  mapOpsEvent,
  mergeLiveEvents,
} from "./live-event-mapper";
import type { ObservabilityTimelineItem } from "@/lib/api/observability";
import {
  TENANT_VOICE_CONTROL_PLANE_STREAM_SCOPE,
  type VoiceControlPlaneStreamScope,
} from "@/lib/realtime/voice-control-plane-client";
import { useVoiceCallRuntimeFeed } from "@/lib/realtime/use-voice-call-runtime-feed";
import { useVoiceCallTranscriptFeed } from "@/lib/realtime/use-voice-call-transcript-feed";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type LivePhase = "agent_speaking" | "caller_speaking" | "tool_running" | "idle";

export interface LiveCaseStreamResult {
  /** Merged timeline items from both streams, chronologically ordered */
  liveItems: ObservabilityTimelineItem[];
  /** Whether at least one SSE stream is actively connected */
  streaming: boolean;
  /** Combined error from either stream */
  error: string | null;
  /** Inferred live phase from latest events */
  livePhase: LivePhase;
  /** Number of transcript turns so far */
  turnCount: number;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useLiveCaseStream(
  callId: string | null,
  enabled: boolean,
  options?: {
    streamScope?: VoiceControlPlaneStreamScope;
  },
): LiveCaseStreamResult {
  const streamScope = options?.streamScope ?? TENANT_VOICE_CONTROL_PLANE_STREAM_SCOPE;
  const { segments, streaming: transcriptStreaming, error: transcriptError } = useVoiceCallTranscriptFeed(callId, {
    enabled,
    streamScope,
    idleTimeoutSeconds: 5,
  });
  const { events, streaming: opsStreaming, error: opsError } = useVoiceCallRuntimeFeed(callId, {
    enabled,
    streamScope,
    idleTimeoutSeconds: 5,
  });

  const transcriptItems = useMemo<ObservabilityTimelineItem[]>(
    () => segments.map((segment) => mapTranscriptEvent(segment)),
    [segments],
  );
  const opsItems = useMemo<ObservabilityTimelineItem[]>(
    () => events.map((event) => mapOpsEvent(event)),
    [events],
  );

  /* -- Derived values ------------------------------------------------ */

  const liveItems = useMemo(
    () => mergeLiveEvents(transcriptItems, opsItems),
    [transcriptItems, opsItems],
  );

  const streaming = transcriptStreaming || opsStreaming;

  const error = transcriptError || opsError
    ? `Live stream interrupted: ${[transcriptError, opsError].filter(Boolean).join("; ")}`
    : null;

  const latestItem = liveItems.at(-1) ?? null;
  const livePhase: LivePhase = (() => {
    if (!latestItem) return "idle";
    if (latestItem.kind === "tool") return "tool_running";
    if (latestItem.kind === "transcript" && latestItem.actor?.toLowerCase() === "agent") return "agent_speaking";
    if (latestItem.kind === "transcript" && latestItem.actor) return "caller_speaking";
    return "idle";
  })();

  const turnCount = segments.length;

  return { liveItems, streaming, error, livePhase, turnCount };
}
