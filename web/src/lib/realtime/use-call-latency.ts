import { useEffect, useRef } from "react";
import useSWR from "swr";

import {
  getAdminCallLatency,
  getCallLatency,
  type CallLatencyMetricSummary,
  type CallLatencyStack,
  type LiveCallTurnLatency,
} from "@/lib/api/call-observability";
import * as swrKeys from "@/lib/swr-keys";

export type { CallLatencyMetricSummary, CallLatencyStack, LiveCallTurnLatency };

const EMPTY_TURNS: LiveCallTurnLatency[] = [];
const EMPTY_SUMMARIES: Record<string, CallLatencyMetricSummary> = {};

export interface UseCallLatencyResult {
  turns: LiveCallTurnLatency[];
  summaries: Record<string, CallLatencyMetricSummary>;
  stack: CallLatencyStack | null;
  loading: boolean;
  error: Error | undefined;
  isValidating: boolean;
}

interface UseCallLatencyOptions {
  adminTenantId?: string | null;
}

type UseCallLatencyKey =
  | readonly ["admin-call-latency", string, string]
  | readonly ["call-latency", string];

const EMPTY_RESULT: UseCallLatencyResult = {
  turns: EMPTY_TURNS,
  summaries: EMPTY_SUMMARIES,
  stack: null,
  loading: false,
  error: undefined,
  isValidating: false,
};

/**
 * SWR hook that fetches call latency data, polling every 3s when the call is live.
 *
 * - `callId: null` returns empty state without fetching.
 * - `isLive: true` enables `refreshInterval: 3000` for polling.
 * - `isLive: false` fetches once on mount (standard SWR behaviour).
 * - When `isLive` transitions from true to false, triggers one final revalidation
 *   to capture finalized data.
 */
export function useCallLatency(
  callId: string | null,
  isLive: boolean,
  options: UseCallLatencyOptions = {},
): UseCallLatencyResult {
  const prevIsLiveRef = useRef(isLive);
  const adminTenantId = options.adminTenantId ?? null;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    callId
      ? (adminTenantId ? (["admin-call-latency", adminTenantId, callId] as const) : swrKeys.callLatency(callId))
      : null,
    (key: UseCallLatencyKey) =>
      key[0] === "admin-call-latency" ? getAdminCallLatency(key[1], key[2]) : getCallLatency(key[1]),
    {
      revalidateOnFocus: false,
      refreshInterval: isLive ? 3000 : 0,
    },
  );

  // Final revalidation on live-to-historical transition.
  useEffect(() => {
    if (prevIsLiveRef.current && !isLive && callId) {
      void mutate();
    }
    prevIsLiveRef.current = isLive;
  }, [isLive, callId, mutate]);

  if (!callId) {
    return EMPTY_RESULT;
  }

  return {
    turns: data?.turns ?? EMPTY_TURNS,
    summaries: data?.summaries ?? EMPTY_SUMMARIES,
    stack: data?.stack ?? null,
    loading: isLoading,
    error,
    isValidating,
  };
}
