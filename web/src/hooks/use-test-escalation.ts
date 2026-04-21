import useSWR from "swr";

import { deriveEscalationState, type CallEscalationState } from "@/lib/call-ops-escalation";
import { platformApiRequest } from "@/lib/api/platform";
import type { ActiveCallEventsResponse } from "@grove/web-shared/types/call-events";

/**
 * Polls the active-call events endpoint every 3 seconds and derives
 * the current escalation state for the test workbench.
 *
 * Returns `null` when there is no active call or no escalation detected.
 */
export function useTestEscalation(
  callId: string | null,
  tenantId: string,
): CallEscalationState | null {
  const { data: escalationState } = useSWR<CallEscalationState | null>(
    callId ? `test-workbench-escalation-${callId}` : null,
    async () => {
      if (!callId) return null;
      try {
        const response = await platformApiRequest<ActiveCallEventsResponse>(
          `/admin/tenants/${encodeURIComponent(tenantId)}/calls/active/${encodeURIComponent(callId)}/events`,
        );
        return deriveEscalationState(response.events);
      } catch {
        return null;
      }
    },
    { refreshInterval: 3000 },
  );

  return escalationState ?? null;
}
