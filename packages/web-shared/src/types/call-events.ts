export interface ActiveCallEvent {
  seq: number;
  event_type: string;
  occurred_at_ms: number;
  summary: string;
  payload: Record<string, unknown>;
}

export interface ActiveCallEventsResponse {
  call_id: string;
  events: ActiveCallEvent[];
}
