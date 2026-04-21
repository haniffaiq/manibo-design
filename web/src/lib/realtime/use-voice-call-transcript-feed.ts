import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { useSseStream, type SseMessage } from "@/hooks/use-sse-stream";
import type { VoiceControlPlaneEnvelope } from "@/lib/realtime/voice-control-plane";
import {
  buildVoiceCallTranscriptStreamUrl,
  parseVoiceCallTranscriptStreamMessage,
  TENANT_VOICE_CONTROL_PLANE_STREAM_SCOPE,
  type TranscriptPayload,
  type VoiceControlPlaneStreamScope,
} from "@/lib/realtime/voice-control-plane-client";

export type TranscriptSegment = {
  seq: number;
  speaker: string;
  timestamp: string;
  text: string;
};

const EMPTY_SEGMENTS: TranscriptSegment[] = [];

export interface UseVoiceCallTranscriptFeedResult {
  segments: TranscriptSegment[];
  streaming: boolean;
  error: string | null;
}

export function buildCallTranscriptSseBridgeUrl(
  callId: string,
  options?: {
    afterSeq?: number;
    streamScope?: VoiceControlPlaneStreamScope;
    idleTimeoutSeconds?: number;
  },
): string {
  return buildVoiceCallTranscriptStreamUrl(callId, options);
}

export function parseTranscriptBridgeMessage(
  message: SseMessage,
): VoiceControlPlaneEnvelope<TranscriptPayload> | null {
  return parseVoiceCallTranscriptStreamMessage(message);
}

export function appendTranscriptSegment(
  segments: TranscriptSegment[],
  envelope: VoiceControlPlaneEnvelope<TranscriptPayload>,
): TranscriptSegment[] {
  if (segments.some((segment) => segment.seq === envelope.seq)) {
    return segments;
  }
  const next = [...segments, { seq: envelope.seq, ...envelope.payload }];
  next.sort((left, right) => left.seq - right.seq);
  return next;
}

export function useVoiceCallTranscriptFeed(
  callId: string | null,
  options?: {
    enabled?: boolean;
    streamScope?: VoiceControlPlaneStreamScope;
    idleTimeoutSeconds?: number;
    limit?: number;
  },
): UseVoiceCallTranscriptFeedResult {
  const [segments, setSegments] = useState<TranscriptSegment[]>(EMPTY_SEGMENTS);
  const seqRef = useRef(0);

  const enabled = options?.enabled ?? true;
  const streamScope = options?.streamScope ?? TENANT_VOICE_CONTROL_PLANE_STREAM_SCOPE;
  const idleTimeoutSeconds = options?.idleTimeoutSeconds ?? 30;
  const limit = options?.limit;

  useEffect(() => {
    setSegments(EMPTY_SEGMENTS);
    seqRef.current = 0;
  }, [callId]);

  const transcriptUrl = callId && enabled
    ? buildVoiceCallTranscriptStreamUrl(callId, {
      streamScope,
      idleTimeoutSeconds,
    })
    : null;

  const handleMessage = useCallback((message: SseMessage) => {
    const envelope = parseTranscriptBridgeMessage(message);
    if (!envelope) {
      return;
    }

    seqRef.current = Math.max(seqRef.current, envelope.seq);
    startTransition(() => {
      setSegments((current) => {
        const next = appendTranscriptSegment(current, envelope);
        if (typeof limit !== "number" || next.length <= limit) {
          return next;
        }
        return next.slice(-limit);
      });
    });
  }, [limit]);

  const callIdForTranscript = callId;
  const { streaming, error } = useSseStream(transcriptUrl, handleMessage, {
    enabled,
    getUrl: () => buildCallTranscriptSseBridgeUrl(callIdForTranscript!, {
      afterSeq: seqRef.current,
      streamScope,
      idleTimeoutSeconds,
    }),
  });

  return { segments, streaming, error };
}
