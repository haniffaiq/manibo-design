/**
 * Transforms flat timeline events + trace node summaries into a hierarchical
 * trace tree structure suitable for rendering a LangSmith-style nested tree.
 *
 * The tree groups events by their containing graph node span:
 *   ▼ greeting (5.5s)
 *     ● llm.call (1.3s)
 *     ► tts.stream (0.3s)
 *     → route: continue → specialty_selection
 *   ▼ specialty_selection (985ms)
 *     ● llm.call (0.8s)
 *     ⚙ search_clinics (0ms) ✗
 *     ● llm.call (0.6s)
 *     → route: continue → location_selection
 */

import type { ObservabilityTimelineItem } from "@/lib/api/observability";
import type { CallTraceNodeSummary, CallTraceToolIO } from "@/lib/api/call-observability";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SpanKind = "node" | "llm" | "tool" | "route" | "stt" | "tts" | "log";

export interface TraceSpan {
  id: string;
  kind: SpanKind;
  label: string;
  /** Latency in ms. Null if still running or unknown. */
  latencyMs: number | null;
  /** Absolute time offset from call start (ms). */
  startMs: number | null;
  endMs: number | null;
  /** For tool spans: success/error status. */
  status: "success" | "error" | null;
  /** Error detail string for tool/llm failures. */
  errorDetail: string | null;
  /** Tool I/O data if this is a tool span. */
  toolIO: CallTraceToolIO | null;
  /** Route target if this is a route span. */
  routeTarget: string | null;
  /** The raw node summary if this is a node span. */
  nodeSummary: CallTraceNodeSummary | null;
  /** Nested child spans. */
  children: TraceSpan[];
  /** Original event payload for the detail inspector. */
  payload: Record<string, unknown>;
}

export interface TraceTree {
  rootSpans: TraceSpan[];
  totalLatencyMs: number | null;
  totalTokens: number | null;
  nodeCount: number;
}

/* ------------------------------------------------------------------ */
/*  Builder                                                            */
/* ------------------------------------------------------------------ */

function eventKindToSpanKind(eventKind: string, eventDetail: string | null): SpanKind {
  if (eventKind === "node") return "node";
  if (eventKind === "tool") return "tool";
  if (eventKind === "route") return "route";
  const detail = (eventDetail ?? "").toLowerCase();
  if (detail.includes("llm") || detail.includes("model")) return "llm";
  if (detail.includes("stt") || detail.includes("speech recognition")) return "stt";
  if (detail.includes("tts") || detail.includes("streaming audio")) return "tts";
  return "log";
}

function spanKindFromEventType(eventType: string): SpanKind {
  if (eventType.startsWith("langgraph.node")) return "node";
  if (eventType.startsWith("langgraph.route")) return "route";
  if (eventType.startsWith("tool.")) return "tool";
  if (eventType.startsWith("llm.")) return "llm";
  if (eventType.startsWith("stt.")) return "stt";
  if (eventType.startsWith("tts.")) return "tts";
  return "log";
}

export function buildTraceTree(
  events: ObservabilityTimelineItem[],
  nodes: CallTraceNodeSummary[],
): TraceTree {
  // Build node spans from trace node summaries (authoritative timing)
  const nodeSpans: TraceSpan[] = [];
  const nodeSpanByName = new Map<string, TraceSpan[]>();

  for (const node of nodes) {
    const span: TraceSpan = {
      id: `node-${node.node_name}-${node.started_at_ms ?? nodeSpans.length}`,
      kind: "node",
      label: node.node_name,
      latencyMs: node.latency_ms,
      startMs: node.started_at_ms,
      endMs: node.completed_at_ms,
      status: node.completed_at_ms != null ? "success" : null,
      errorDetail: null,
      toolIO: null,
      routeTarget: null,
      nodeSummary: node,
      children: [],
      payload: {},
    };

    // Add tool I/O as child spans
    if (node.tool_io) {
      for (const tool of node.tool_io) {
        span.children.push({
          id: `tool-${tool.tool_name}-${span.children.length}`,
          kind: "tool",
          label: tool.tool_name,
          latencyMs: tool.duration_ms,
          startMs: null,
          endMs: null,
          status: tool.status === "success" || tool.status === "ok" ? "success" : "error",
          errorDetail: tool.error_detail,
          toolIO: tool,
          routeTarget: null,
          nodeSummary: null,
          children: [],
          payload: {},
        });
      }
    }

    // Add route decision as child span
    if (node.route) {
      span.children.push({
        id: `route-${node.node_name}-${node.route}`,
        kind: "route",
        label: `${node.route} → ${node.next_node_name ?? "?"}`,
        latencyMs: null,
        startMs: null,
        endMs: null,
        status: null,
        errorDetail: null,
        toolIO: null,
        routeTarget: node.next_node_name,
        nodeSummary: null,
        children: [],
        payload: { route: node.route, next_node_name: node.next_node_name },
      });
    }

    nodeSpans.push(span);
    const list = nodeSpanByName.get(node.node_name) ?? [];
    list.push(span);
    nodeSpanByName.set(node.node_name, list);
  }

  // Enrich node spans with child events from the timeline
  // Events between node.started and node.completed belong to that node
  const sortedEvents = events
    .filter((e) => e.kind !== "transcript")
    .sort((a, b) => (a.occurred_at_ms ?? 0) - (b.occurred_at_ms ?? 0));

  for (const event of sortedEvents) {
    const eventMs = event.occurred_at_ms ?? 0;
    const eventType = event.detail ?? event.label;
    const kind = event.kind === "node" || event.kind === "tool" || event.kind === "route"
      ? (event.kind as SpanKind)
      : spanKindFromEventType(eventType);

    // Skip node-level events (already represented by nodeSpans)
    if (kind === "node") continue;
    // Skip tool events if already in tool_io
    if (kind === "tool") continue;
    // Skip route events if already as child
    if (kind === "route") continue;

    // Find the containing node span (the one whose time range covers this event)
    let parent: TraceSpan | null = null;
    for (const nodeSpan of nodeSpans) {
      const start = nodeSpan.startMs ?? 0;
      const end = nodeSpan.endMs ?? Infinity;
      if (eventMs >= start && eventMs <= end) {
        parent = nodeSpan;
        // Don't break — later nodes with overlapping ranges take precedence
      }
    }

    if (parent) {
      parent.children.push({
        id: `${kind}-${event.id}`,
        kind,
        label: event.label,
        latencyMs: event.duration_ms,
        startMs: event.occurred_at_ms,
        endMs: event.duration_ms != null && event.occurred_at_ms != null
          ? event.occurred_at_ms + event.duration_ms
          : null,
        status: null,
        errorDetail: null,
        toolIO: null,
        routeTarget: null,
        nodeSummary: null,
        children: [],
        payload: event.payload ?? {},
      });
    }
  }

  // Sort children within each node by start time
  for (const span of nodeSpans) {
    span.children.sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));
  }

  // Compute totals
  let totalTokens = 0;
  let hasTokens = false;
  for (const node of nodes) {
    if (node.prompt_tokens != null) { totalTokens += node.prompt_tokens; hasTokens = true; }
    if (node.completion_tokens != null) { totalTokens += node.completion_tokens; hasTokens = true; }
  }

  const totalLatencyMs = nodes.length > 0
    ? nodes.reduce((sum, n) => sum + (n.latency_ms ?? 0), 0)
    : null;

  return {
    rootSpans: nodeSpans,
    totalLatencyMs,
    totalTokens: hasTokens ? totalTokens : null,
    nodeCount: nodes.length,
  };
}
