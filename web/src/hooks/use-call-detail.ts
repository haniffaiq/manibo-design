import useSWR from "swr";

import {
  getCallDetail,
  getCallEvents,
  type CallDetailResponse,
  type CallEventsResponse,
} from "@/lib/api/call-history";
import {
  getCallLatency,
  getCallTrace,
  type CallLatencyResponse,
  type CallTraceSummaryResponse,
} from "@/lib/api/call-observability";
import * as swrKeys from "@/lib/swr-keys";

export type UseCallDetailResult = {
  detail: CallDetailResponse | undefined;
  events: CallEventsResponse | undefined;
  trace: CallTraceSummaryResponse | undefined;
  latency: CallLatencyResponse | undefined;
  isLoading: boolean;
  detailError: Error | undefined;
  eventsError: Error | undefined;
  traceError: Error | undefined;
  latencyError: Error | undefined;
  /** Set to true to trigger latency fetch (used by technical drawer). */
  fetchLatency: boolean;
  setFetchLatency: (value: boolean) => void;
};

/**
 * SWR-based hook that loads call detail, events, trace, and optionally latency.
 *
 * - When `callId` is null, all data is undefined and nothing is fetched.
 * - Detail, events, and trace are fetched immediately when callId is set.
 * - Latency is only fetched when the consumer sets `fetchLatency` to true
 *   (intended for the technical drawer).
 */
export function useCallDetail(
  callId: string | null,
  options?: { fetchLatency?: boolean },
): Omit<UseCallDetailResult, "fetchLatency" | "setFetchLatency"> {
  const fetchLatency = options?.fetchLatency ?? false;

  const {
    data: detail,
    error: detailError,
    isLoading: detailLoading,
  } = useSWR(
    callId ? swrKeys.callDetail(callId) : null,
    ([, id]) => getCallDetail(id),
    { revalidateOnFocus: false },
  );

  const {
    data: events,
    error: eventsError,
    isLoading: eventsLoading,
  } = useSWR(
    callId ? swrKeys.callEvents(callId) : null,
    ([, id]) => getCallEvents(id, { limit: 200 }),
    { revalidateOnFocus: false },
  );

  const {
    data: trace,
    error: traceError,
    isLoading: traceLoading,
  } = useSWR(
    callId ? swrKeys.callTrace(callId) : null,
    ([, id]) => getCallTrace(id),
    { revalidateOnFocus: false },
  );

  const {
    data: latency,
    error: latencyError,
    isLoading: latencyLoading,
  } = useSWR(
    callId && fetchLatency ? swrKeys.callLatency(callId) : null,
    ([, id]) => getCallLatency(id),
    { revalidateOnFocus: false },
  );

  const isLoading = detailLoading || eventsLoading || traceLoading || (fetchLatency && latencyLoading);

  return {
    detail,
    events,
    trace,
    latency,
    isLoading,
    detailError,
    eventsError,
    traceError,
    latencyError,
  };
}
