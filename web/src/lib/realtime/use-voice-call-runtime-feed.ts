import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import type { CallRuntimeEvent } from "@/lib/api/call-history";
import { useSseStream, type SseMessage } from "@/hooks/use-sse-stream";
import {
  buildVoiceCallRuntimeStreamUrl,
  parseVoiceCallRuntimeStreamMessage,
  TENANT_VOICE_CONTROL_PLANE_STREAM_SCOPE,
  type VoiceControlPlaneStreamScope,
} from "@/lib/realtime/voice-control-plane-client";

const EMPTY_EVENTS: CallRuntimeEvent[] = [];

export interface UseVoiceCallRuntimeFeedResult {
  events: CallRuntimeEvent[];
  streaming: boolean;
  error: string | null;
}

export function buildCallOpsSseBridgeUrl(
  callId: string,
  options?: {
    afterSeq?: number;
    streamScope?: VoiceControlPlaneStreamScope;
    idleTimeoutSeconds?: number;
  },
): string {
  return buildVoiceCallRuntimeStreamUrl(callId, options);
}

export function parseRuntimeBridgeMessage(message: SseMessage): CallRuntimeEvent | null {
  return parseVoiceCallRuntimeStreamMessage(message);
}

export function appendRuntimeEvent(events: CallRuntimeEvent[], nextEvent: CallRuntimeEvent): CallRuntimeEvent[] {
  if (events.some((event) => event.seq === nextEvent.seq)) {
    return events;
  }
  const next = [...events, nextEvent];
  next.sort((left, right) => left.seq - right.seq);
  return next;
}

export function useVoiceCallRuntimeFeed(
  callId: string | null,
  options?: {
    enabled?: boolean;
    streamScope?: VoiceControlPlaneStreamScope;
    idleTimeoutSeconds?: number;
    limit?: number;
  },
): UseVoiceCallRuntimeFeedResult {
  const [events, setEvents] = useState<CallRuntimeEvent[]>(EMPTY_EVENTS);
  const seqRef = useRef(0);

  const enabled = options?.enabled ?? true;
  const streamScope = options?.streamScope ?? TENANT_VOICE_CONTROL_PLANE_STREAM_SCOPE;
  const idleTimeoutSeconds = options?.idleTimeoutSeconds ?? 5;
  const limit = options?.limit;

  useEffect(() => {
    setEvents(EMPTY_EVENTS);
    seqRef.current = 0;
  }, [callId]);

  const opsUrl = callId && enabled
    ? buildVoiceCallRuntimeStreamUrl(callId, {
      streamScope,
      idleTimeoutSeconds,
    })
    : null;

  const handleMessage = useCallback((message: SseMessage) => {
    const event = parseRuntimeBridgeMessage(message);
    if (!event) {
      return;
    }

    seqRef.current = Math.max(seqRef.current, event.seq);
    startTransition(() => {
      setEvents((current) => {
        const next = appendRuntimeEvent(current, event);
        if (typeof limit !== "number" || next.length <= limit) {
          return next;
        }
        return next.slice(-limit);
      });
    });
  }, [limit]);

  const callIdForOps = callId;
  const { streaming, error } = useSseStream(opsUrl, handleMessage, {
    enabled,
    getUrl: () => buildCallOpsSseBridgeUrl(callIdForOps!, {
      afterSeq: seqRef.current,
      streamScope,
      idleTimeoutSeconds,
    }),
  });

  return { events, streaming, error };
}
