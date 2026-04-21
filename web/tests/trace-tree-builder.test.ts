import { describe, expect, it } from "vitest";

import { buildTraceTree } from "@/components/observe/trace-tree-builder";
import type { CallTraceNodeSummary, CallTraceToolIO } from "@/lib/api/call-observability";
import type { ObservabilityTimelineItem } from "@/lib/api/observability";

function makeNode(overrides: Partial<CallTraceNodeSummary> & { node_name: string }): CallTraceNodeSummary {
  return {
    graph_type: "voice",
    started_at_ms: null,
    completed_at_ms: null,
    latency_ms: null,
    ttft_ms: null,
    route: null,
    next_node_name: null,
    llm_roundtrips: null,
    retry_count: null,
    tools_called: [],
    prompt_tokens: null,
    completion_tokens: null,
    tool_io: [],
    ...overrides,
  };
}

function makeEvent(kind: string, label: string, ms: number): ObservabilityTimelineItem {
  return {
    id: `ev-${ms}-${label}`,
    kind: kind as ObservabilityTimelineItem["kind"],
    severity: "info",
    occurred_at: new Date(ms).toISOString(),
    occurred_at_ms: ms,
    label,
    detail: label,
    actor: null,
    duration_ms: null,
    correlation_id: null,
    payload: {},
  };
}

describe("buildTraceTree", () => {
  it("returns empty tree for no data", () => {
    const tree = buildTraceTree([], []);
    expect(tree.rootSpans).toEqual([]);
    expect(tree.nodeCount).toBe(0);
  });

  it("creates node spans from trace node summaries", () => {
    const nodes = [
      makeNode({ node_name: "greeting", started_at_ms: 100, completed_at_ms: 5600, latency_ms: 5500 }),
      makeNode({ node_name: "specialty_selection", started_at_ms: 5600, completed_at_ms: 6585, latency_ms: 985 }),
    ];
    const tree = buildTraceTree([], nodes);

    expect(tree.rootSpans).toHaveLength(2);
    expect(tree.rootSpans[0].kind).toBe("node");
    expect(tree.rootSpans[0].label).toBe("greeting");
    expect(tree.rootSpans[0].latencyMs).toBe(5500);
    expect(tree.rootSpans[1].label).toBe("specialty_selection");
    expect(tree.nodeCount).toBe(2);
  });

  it("nests tool I/O as child spans", () => {
    const toolIO: CallTraceToolIO[] = [
      { tool_name: "search_clinics", tool_args: { city: "Vilnius" }, tool_result: { clinics: [] }, duration_ms: 48, status: "success", error_detail: null },
      { tool_name: "check_availability", tool_args: {}, tool_result: { error: "No slots" }, duration_ms: 22, status: "error", error_detail: "No slots" },
    ];
    const nodes = [makeNode({ node_name: "booking", tool_io: toolIO })];
    const tree = buildTraceTree([], nodes);

    expect(tree.rootSpans[0].children).toHaveLength(2);
    expect(tree.rootSpans[0].children[0].kind).toBe("tool");
    expect(tree.rootSpans[0].children[0].label).toBe("search_clinics");
    expect(tree.rootSpans[0].children[0].status).toBe("success");
    expect(tree.rootSpans[0].children[1].status).toBe("error");
    expect(tree.rootSpans[0].children[1].errorDetail).toBe("No slots");
  });

  it("adds route decision as child span", () => {
    const nodes = [makeNode({ node_name: "greeting", route: "continue", next_node_name: "specialty_selection" })];
    const tree = buildTraceTree([], nodes);

    const routeChild = tree.rootSpans[0].children.find((c) => c.kind === "route");
    expect(routeChild).toBeDefined();
    expect(routeChild!.label).toBe("continue → specialty_selection");
    expect(routeChild!.routeTarget).toBe("specialty_selection");
  });

  it("computes total tokens and latency", () => {
    const nodes = [
      makeNode({ node_name: "a", latency_ms: 500, prompt_tokens: 100, completion_tokens: 50 }),
      makeNode({ node_name: "b", latency_ms: 300, prompt_tokens: 80, completion_tokens: 40 }),
    ];
    const tree = buildTraceTree([], nodes);

    expect(tree.totalTokens).toBe(270);
    expect(tree.totalLatencyMs).toBe(800);
  });

  it("nests timeline log events inside their containing node span", () => {
    const nodes = [
      makeNode({ node_name: "greeting", started_at_ms: 100, completed_at_ms: 500 }),
    ];
    const events = [
      makeEvent("log", "Model started generating a response", 200),
      makeEvent("log", "Model returned the first token", 350),
    ];
    const tree = buildTraceTree(events, nodes);

    // Log events should be nested inside the greeting span
    const logChildren = tree.rootSpans[0].children.filter((c) => c.kind === "llm" || c.kind === "log");
    expect(logChildren.length).toBeGreaterThanOrEqual(2);
  });

  it("ignores transcript events", () => {
    const nodes = [makeNode({ node_name: "greeting", started_at_ms: 100, completed_at_ms: 500 })];
    const events: ObservabilityTimelineItem[] = [
      { ...makeEvent("log", "Some log", 200), kind: "transcript", actor: "User", label: "Hello" },
    ];
    const tree = buildTraceTree(events, nodes);

    // Transcript should not appear as a child span
    expect(tree.rootSpans[0].children.filter((c) => c.label === "Hello")).toHaveLength(0);
  });
});
