import { platformApiRequest } from "@grove/web-shared/api/platform";
import type { ActiveCallEvent, ActiveCallEventsResponse } from "@grove/web-shared/types/call-events";

export type EscalationStatus = "escalated" | "transfer_requested";

export type CallEscalationState = {
  status: EscalationStatus;
  reason: string | null;
  priority: string | null;
};

const ESCALATION_EVENTS: Record<string, EscalationStatus> = {
  "call.escalation.transfer_requested": "transfer_requested",
  "call.escalation.transfer_failed": "transfer_requested",
  "call.escalated": "escalated",
  "call.escalation": "escalated",
  "call.escalation.operator_notify": "escalated",
};

export function deriveEscalationState(events: ActiveCallEvent[]): CallEscalationState | null {
  let bestStatus: EscalationStatus | null = null;
  let bestReason: string | null = null;
  let bestPriority: string | null = null;

  for (const event of events) {
    const status = ESCALATION_EVENTS[event.event_type];
    if (!status) continue;

    const payload = event.payload;
    const reason = typeof payload["reason"] === "string" ? payload["reason"] : null;
    const priority = typeof payload["priority"] === "string" ? payload["priority"] : null;

    const transferImmediately = payload["transfer_immediately"] === true;

    if (reason) bestReason = reason;
    if (priority) bestPriority = priority;
    // transfer_immediately or urgent priority elevates to transfer_requested (case-insensitive — backend serializes as lowercase)
    const effectiveStatus = transferImmediately || priority?.toUpperCase() === "URGENT" ? "transfer_requested" : status;
    if (!bestStatus || effectiveStatus === "transfer_requested") bestStatus = effectiveStatus;
  }

  if (!bestStatus) return null;
  return { status: bestStatus, reason: bestReason, priority: bestPriority };
}

function escalationSortKey(escalation: CallEscalationState | null | undefined): number {
  if (!escalation) return 2;
  return escalation.status === "transfer_requested" ? 0 : 1;
}

/** Sort calls: urgent first, then standard escalations, then normal. Stable sort. */
export function sortByEscalationPriority<T extends { escalation?: CallEscalationState | null }>(calls: T[]): T[] {
  return [...calls].sort((a, b) => escalationSortKey(a.escalation) - escalationSortKey(b.escalation));
}

/** Fetch events for a single active call and derive its escalation state. */
async function fetchCallEscalationState(callId: string): Promise<CallEscalationState | null> {
  try {
    const response = await platformApiRequest<ActiveCallEventsResponse>(
      `/calls/active/${encodeURIComponent(callId)}/events`,
    );
    return deriveEscalationState(response.events);
  } catch {
    return null;
  }
}

/**
 * Enrich a list of active calls with escalation state.
 * Fetches events per call in parallel (active calls are typically <10).
 */
export async function enrichCallsWithEscalation<T extends { call_id: string }>(
  calls: T[],
): Promise<(T & { escalation: CallEscalationState | null })[]> {
  if (calls.length === 0) return [];

  const states = await Promise.all(calls.map((call) => fetchCallEscalationState(call.call_id)));

  return calls.map((call, index) => ({ ...call, escalation: states[index] ?? null }));
}
