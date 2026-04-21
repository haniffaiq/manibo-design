import type { ObservabilityTimelineItem, ObservabilityTimelineKind, ObservabilityTimelineSeverity } from "@/lib/api/observability";
import type { CallRuntimeEvent } from "@/lib/api/call-history";
import type { TranscriptSegment } from "@/lib/realtime/use-voice-call-transcript-feed";

/* ------------------------------------------------------------------ */
/*  SSE event shapes (from backend)                                    */
/* ------------------------------------------------------------------ */

export type TranscriptSseEvent = TranscriptSegment;

export type OpsSseEvent = CallRuntimeEvent;

/* ------------------------------------------------------------------ */
/*  Mappers                                                            */
/* ------------------------------------------------------------------ */

function opsEventKind(eventType: string): ObservabilityTimelineKind {
  if (eventType.startsWith("tool.")) return "tool";
  if (eventType.startsWith("langgraph.route.")) return "route";
  if (eventType.startsWith("langgraph.node.")) return "node";
  if (eventType.startsWith("workflow.")) return "workflow_step";
  if (eventType.startsWith("recording.")) return "recording";
  if (eventType.startsWith("metric.")) return "metric";
  return "log";
}

function opsEventSeverity(eventType: string): ObservabilityTimelineSeverity {
  if (eventType.endsWith(".failed") || eventType.endsWith(".error")) return "error";
  if (eventType.includes(".escalation.") || eventType.endsWith(".warning")) return "warning";
  return "info";
}

export function mapTranscriptEvent(event: TranscriptSseEvent): ObservabilityTimelineItem {
  return {
    id: `segment-${event.seq}`,
    kind: "transcript",
    severity: "info",
    occurred_at: event.timestamp,
    occurred_at_ms: null,
    label: event.text,
    detail: null,
    actor: event.speaker,
    duration_ms: null,
    correlation_id: null,
    payload: {},
  };
}

export function mapOpsEvent(event: OpsSseEvent): ObservabilityTimelineItem {
  return {
    id: `event-${event.seq}`,
    kind: opsEventKind(event.event_type),
    severity: opsEventSeverity(event.event_type),
    occurred_at: event.created_at ?? null,
    occurred_at_ms: event.occurred_at_ms,
    label: event.summary,
    detail: event.event_type,
    actor: null,
    duration_ms: null,
    correlation_id: null,
    payload: event.payload,
  };
}

export function mergeLiveEvents(
  transcriptItems: ObservabilityTimelineItem[],
  opsItems: ObservabilityTimelineItem[],
): ObservabilityTimelineItem[] {
  // Spread creates a disposable array — safe to sort in place
  return [...transcriptItems, ...opsItems].sort((a, b) => {
    const timeA = a.occurred_at ? new Date(a.occurred_at).getTime() : (a.occurred_at_ms ?? 0);
    const timeB = b.occurred_at ? new Date(b.occurred_at).getTime() : (b.occurred_at_ms ?? 0);
    return timeA - timeB;
  });
}
