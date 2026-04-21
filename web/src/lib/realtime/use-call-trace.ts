import { useEffect, useRef } from "react";
import useSWR from "swr";

import {
  getAdminCallTrace,
  getCallTrace,
  type AdminCallTraceOptions,
  type CallTraceNodeSummary,
  type CallTraceRouteSelection,
  type CallLatencyStack,
} from "@/lib/api/call-observability";

export type { CallTraceNodeSummary, CallTraceRouteSelection };

const EMPTY_NODES: CallTraceNodeSummary[] = [];
const EMPTY_ROUTES: CallTraceRouteSelection[] = [];

export interface UseCallTraceResult {
  nodes: CallTraceNodeSummary[];
  routes: CallTraceRouteSelection[];
  stack: CallLatencyStack | null;
  eventCount: number;
  loading: boolean;
  error: Error | undefined;
  isValidating: boolean;
}

interface UseCallTraceOptions {
  adminTenantId?: string | null;
  includeToolPayloads?: boolean;
}

type UseCallTraceKey =
  | readonly ["admin-call-trace", string, string, boolean]
  | readonly ["call-trace", string];

const EMPTY_RESULT: UseCallTraceResult = {
  nodes: EMPTY_NODES,
  routes: EMPTY_ROUTES,
  stack: null,
  eventCount: 0,
  loading: false,
  error: undefined,
  isValidating: false,
};

/**
 * SWR hook that fetches call trace (graph node traversal) data.
 * Polls every 3s when the call is live, fetches once when historical.
 */
export function useCallTrace(
  callId: string | null,
  isLive: boolean,
  options: UseCallTraceOptions = {},
): UseCallTraceResult {
  const prevIsLiveRef = useRef(isLive);
  const adminTenantId = options.adminTenantId ?? null;
  const includeToolPayloads = options.includeToolPayloads === true;

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useSWR(
    callId
      ? (adminTenantId
          ? (["admin-call-trace", adminTenantId, callId, includeToolPayloads] as const)
          : (["call-trace", callId] as const))
      : null,
    (key: UseCallTraceKey) =>
      key[0] === "admin-call-trace"
        ? getAdminCallTrace(key[1], key[2], { includeToolPayloads: key[3] } satisfies AdminCallTraceOptions)
        : getCallTrace(key[1]),
    {
      revalidateOnFocus: false,
      refreshInterval: isLive ? 3000 : 0,
    },
  );

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
    nodes: data?.nodes ?? EMPTY_NODES,
    routes: data?.routes ?? EMPTY_ROUTES,
    stack: data?.stack ?? null,
    eventCount: data?.event_count ?? 0,
    loading: isLoading,
    error,
    isValidating,
  };
}
