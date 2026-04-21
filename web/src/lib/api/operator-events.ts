import { platformApiRequest } from "@/lib/api/platform";

export type OperatorEventSeverity = "info" | "warning" | "critical";
export type OperatorEventStatus = "open" | "acked" | "resolved";

export interface OperatorEvent {
  id: string;
  event_type: string;
  severity: OperatorEventSeverity;
  status: OperatorEventStatus;
  entity_type: string | null;
  entity_id: string | null;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  acked_at: string | null;
  acked_by: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface OperatorEventsResponse {
  events: OperatorEvent[];
}

export interface OperatorEventResponse {
  event: OperatorEvent;
}

export interface ListOperatorEventsQuery {
  severity?: OperatorEventSeverity;
  status?: OperatorEventStatus;
  since?: string;
  limit?: number;
}

export function listOperatorEvents(query: ListOperatorEventsQuery = {}): Promise<OperatorEventsResponse> {
  const params = new URLSearchParams();
  if (query.severity) {
    params.set("severity", query.severity);
  }
  if (query.status) {
    params.set("status", query.status);
  }
  if (query.since) {
    params.set("since", query.since);
  }
  if (typeof query.limit === "number") {
    params.set("limit", String(query.limit));
  }
  const queryString = params.toString();
  const suffix = queryString.length > 0 ? `?${queryString}` : "";
  return platformApiRequest<OperatorEventsResponse>(`/operator-events${suffix}`, { method: "GET" });
}

export function ackOperatorEvent(eventId: string): Promise<OperatorEventResponse> {
  return platformApiRequest<OperatorEventResponse>(`/operator-events/${encodeURIComponent(eventId)}/ack`, {
    method: "POST",
  });
}

export function resolveOperatorEvent(eventId: string): Promise<OperatorEventResponse> {
  return platformApiRequest<OperatorEventResponse>(`/operator-events/${encodeURIComponent(eventId)}/resolve`, {
    method: "POST",
  });
}
