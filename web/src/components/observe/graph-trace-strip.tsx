"use client";

import { useMemo, useState } from "react";

import type { CallTraceNodeSummary, CallTraceRouteSelection } from "@/lib/api/call-observability";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface GraphTraceStripProps {
  nodes: CallTraceNodeSummary[];
  routes: CallTraceRouteSelection[];
  selectedNodeIndex: number | null;
  onSelectNode: (index: number | null) => void;
  isLive: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMs(value: number | null): string {
  if (value == null) return "--";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function formatTokens(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}

type NodeStatus = "completed" | "active" | "pending";

function nodeStatus(node: CallTraceNodeSummary, isLive: boolean): NodeStatus {
  if (node.completed_at_ms != null) return "completed";
  if (node.started_at_ms != null && isLive) return "active";
  return "pending";
}

const STATUS_STYLES: Record<NodeStatus, { dot: string; line: string; label: string }> = {
  completed: {
    dot: "bg-[var(--color-primary-600)]",
    line: "bg-[var(--color-primary-300)]",
    label: "text-[var(--color-neutral-700)]",
  },
  active: {
    dot: "bg-green-500 animate-pulse",
    line: "bg-[var(--color-neutral-200)]",
    label: "text-[var(--color-neutral-900)] font-semibold",
  },
  pending: {
    dot: "bg-[var(--color-neutral-300)]",
    line: "bg-[var(--color-neutral-200)] border-dashed",
    label: "text-[var(--color-neutral-400)]",
  },
};

function latencyColor(ms: number | null): string {
  if (ms == null) return "text-[var(--color-neutral-400)]";
  if (ms < 200) return "text-green-600";
  if (ms < 500) return "text-amber-600";
  return "text-red-600";
}

function latencyBgColor(ms: number | null): string {
  if (ms == null) return "bg-[var(--color-neutral-300)]";
  if (ms < 200) return "bg-green-500";
  if (ms < 500) return "bg-amber-500";
  return "bg-red-500";
}

function latencyBgLight(ms: number | null): string {
  if (ms == null) return "bg-[var(--color-neutral-200)]";
  if (ms < 200) return "bg-green-200";
  if (ms < 500) return "bg-amber-200";
  return "bg-red-200";
}

/** Find the route label between two consecutive nodes. */
function routeLabelBetween(
  fromNode: CallTraceNodeSummary,
  routes: CallTraceRouteSelection[],
): string | null {
  if (fromNode.route) return fromNode.route;
  const match = routes.find(
    (r) => r.node_name === fromNode.node_name && r.route,
  );
  return match?.route ?? null;
}

/* ------------------------------------------------------------------ */
/*  Enriched node with visit index                                     */
/* ------------------------------------------------------------------ */

interface EnrichedNode {
  node: CallTraceNodeSummary;
  index: number;
  displayLabel: string;
  visitIndex: number;
  isFirstVisit: boolean;
}

function enrichNodes(nodes: CallTraceNodeSummary[]): EnrichedNode[] {
  const visitCounts = new Map<string, number>();
  const totalVisits = new Map<string, number>();

  // First pass: count total visits per node name
  for (const node of nodes) {
    totalVisits.set(node.node_name, (totalVisits.get(node.node_name) ?? 0) + 1);
  }

  // Second pass: assign visit indices
  return nodes.map((node, index) => {
    const visit = (visitCounts.get(node.node_name) ?? 0) + 1;
    visitCounts.set(node.node_name, visit);
    const total = totalVisits.get(node.node_name) ?? 1;
    const isFirstVisit = visit === 1;
    const displayLabel = total > 1
      ? (isFirstVisit ? node.node_name : `#${visit}`)
      : node.node_name;

    return { node, index, displayLabel, visitIndex: visit, isFirstVisit };
  });
}

/* ------------------------------------------------------------------ */
/*  Token aggregation                                                  */
/* ------------------------------------------------------------------ */

function aggregateTokens(nodes: CallTraceNodeSummary[]): { prompt: number; completion: number; total: number } | null {
  let prompt = 0;
  let completion = 0;
  let hasAny = false;
  for (const node of nodes) {
    if (node.prompt_tokens != null) { prompt += node.prompt_tokens; hasAny = true; }
    if (node.completion_tokens != null) { completion += node.completion_tokens; hasAny = true; }
  }
  if (!hasAny) return null;
  return { prompt, completion, total: prompt + completion };
}

/* ------------------------------------------------------------------ */
/*  View type                                                          */
/* ------------------------------------------------------------------ */

type ViewMode = "chain" | "waterfall";

/* ------------------------------------------------------------------ */
/*  Chain View                                                         */
/* ------------------------------------------------------------------ */

function ChainView({
  enrichedNodes,
  routes,
  selectedIndex,
  onSelectNode,
  isLive,
}: {
  enrichedNodes: EnrichedNode[];
  routes: CallTraceRouteSelection[];
  selectedIndex: number | null;
  onSelectNode: (index: number | null) => void;
  isLive: boolean;
}) {
  return (
    <div data-testid="graph-trace-chain" className="flex items-start gap-0 overflow-x-auto py-2">
      {enrichedNodes.map((en, i) => {
        const status = nodeStatus(en.node, isLive);
        const styles = STATUS_STYLES[status];
        const isSelected = selectedIndex === en.index;
        const routeLabel = i < enrichedNodes.length - 1 ? routeLabelBetween(en.node, routes) : null;
        const isLast = i === enrichedNodes.length - 1;

        return (
          <div key={`${en.node.node_name}-${en.index}`} className="flex items-start">
            <button
              type="button"
              data-testid={`graph-node-${en.index}`}
              onClick={() => onSelectNode(isSelected ? null : en.index)}
              className={`group flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 transition hover:bg-[var(--color-neutral-50)] ${
                isSelected ? "bg-[var(--color-primary-50)] ring-1 ring-[var(--color-primary-200)]" : ""
              }`}
            >
              <div className={`h-2.5 w-2.5 rounded-full ${styles.dot} shrink-0`} />
              <span className={`whitespace-nowrap text-[10px] ${styles.label}`}>
                {en.displayLabel}
              </span>
              {status === "completed" ? (
                <span className={`text-[10px] font-medium ${latencyColor(en.node.latency_ms)}`}>
                  {formatMs(en.node.latency_ms)}
                </span>
              ) : status === "active" ? (
                <span className="text-[10px] font-medium text-green-600">running</span>
              ) : null}
              {en.node.tools_called.length > 0 ? (
                <span className="text-[9px] text-[var(--color-neutral-400)]">
                  {en.node.tools_called.length} tool{en.node.tools_called.length > 1 ? "s" : ""}
                </span>
              ) : null}
            </button>
            {!isLast ? (
              <div className="flex flex-col items-center justify-center self-center pt-0.5">
                <div className={`h-0.5 w-6 ${styles.line}`} />
                {routeLabel ? (
                  <span className="mt-0.5 max-w-[4rem] truncate whitespace-nowrap text-[8px] text-[var(--color-neutral-400)]">
                    {routeLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Waterfall View                                                     */
/* ------------------------------------------------------------------ */

function WaterfallView({
  enrichedNodes,
  selectedIndex,
  onSelectNode,
  isLive,
}: {
  enrichedNodes: EnrichedNode[];
  selectedIndex: number | null;
  onSelectNode: (index: number | null) => void;
  isLive: boolean;
}) {
  // Compute time range from nodes that have actually started
  const startedTimes = enrichedNodes
    .map((en) => en.node.started_at_ms)
    .filter((t): t is number => t != null)
    .sort((a, b) => a - b);

  let firstStart = startedTimes[0] ?? 0;
  let maxEnd = firstStart;
  for (const en of enrichedNodes) {
    const end = en.node.completed_at_ms ?? en.node.started_at_ms ?? firstStart;
    if (end > maxEnd) maxEnd = end;
  }

  // Clip initial dead space: if the gap from the first to second node is
  // >50% of the total range, skip to where the main activity begins
  if (startedTimes.length >= 2) {
    const totalRange = maxEnd - firstStart;
    const gapToSecond = startedTimes[1] - startedTimes[0];
    if (totalRange > 0 && gapToSecond > totalRange * 0.5) {
      firstStart = startedTimes[1];
    }
  }

  const dataSpan = maxEnd - firstStart;
  const totalSpan = Math.max(dataSpan * 1.1, 1);
  const totalSec = totalSpan / 1000;

  // Smart tick interval
  const tickInterval = totalSec <= 3 ? 0.5 : totalSec <= 8 ? 1 : totalSec <= 20 ? 2 : 5;
  const ticks: number[] = [];
  for (let t = 0; t <= totalSec; t += tickInterval) ticks.push(Math.round(t * 10) / 10);

  return (
    <div data-testid="graph-trace-waterfall" className="py-2">
      {/* Rows */}
      <div className="space-y-1">
        {enrichedNodes.map((en) => {
          const status = nodeStatus(en.node, isLive);
          const isSelected = selectedIndex === en.index;
          const startOffset = Math.max(0, ((en.node.started_at_ms ?? firstStart) - firstStart) / totalSpan);
          const duration = status === "active"
            ? totalSpan - ((en.node.started_at_ms ?? firstStart) - firstStart)
            : (en.node.latency_ms ?? ((en.node.completed_at_ms ?? en.node.started_at_ms ?? 0) - (en.node.started_at_ms ?? 0)));
          const widthPct = Math.max((duration / totalSpan) * 100, 2);
          const ttft = en.node.ttft_ms;
          const ttftPct = ttft != null && duration > 0 ? (ttft / duration) * 100 : 0;

          return (
            <button
              type="button"
              key={`wf-${en.index}`}
              data-testid={`waterfall-bar-${en.index}`}
              onClick={() => onSelectNode(isSelected ? null : en.index)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition hover:bg-[var(--color-neutral-50)] ${
                isSelected ? "bg-[var(--color-primary-50)] ring-1 ring-[var(--color-primary-200)]" : ""
              }`}
            >
              {/* Label */}
              <span className="w-28 shrink-0 truncate text-right text-xs text-[var(--color-neutral-600)]">
                {en.displayLabel}
              </span>

              {/* Bar container — visible background track */}
              <div className="relative h-6 flex-1 rounded bg-[var(--color-neutral-100)]">
                {/* Time grid lines */}
                {ticks.map((t) => (
                  <div
                    key={`grid-${en.index}-${t}`}
                    className="absolute top-0 h-full w-px bg-[var(--color-neutral-200)]"
                    style={{ left: `${(t / totalSec) * 100}%` }}
                  />
                ))}
                {/* The bar itself */}
                <div
                  className="absolute top-0.5 bottom-0.5 flex overflow-hidden rounded"
                  style={{ left: `${startOffset * 100}%`, width: `${widthPct}%` }}
                >
                  {/* TTFT segment (lighter) */}
                  {ttftPct > 0 ? (
                    <div
                      className={`h-full ${latencyBgLight(en.node.latency_ms)}`}
                      style={{ width: `${ttftPct}%` }}
                      title={`TTFT: ${formatMs(ttft)}`}
                    />
                  ) : null}
                  {/* Post-TTFT / main segment */}
                  <div
                    className={`h-full flex-1 ${status === "active" ? "animate-pulse bg-green-400" : latencyBgColor(en.node.latency_ms)}`}
                    title={ttft != null ? `Post-TTFT: ${formatMs(duration - ttft)}` : formatMs(en.node.latency_ms)}
                  />
                </div>
              </div>

              {/* Duration label */}
              <span className={`w-12 shrink-0 text-right text-xs font-semibold ${latencyColor(en.node.latency_ms)}`}>
                {status === "active" ? "\u2026" : formatMs(en.node.latency_ms)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time axis at the bottom */}
      <div className="ml-[7.5rem] mr-14 mt-1 flex justify-between text-[9px] text-[var(--color-neutral-400)]">
        {ticks.map((t) => (
          <span key={`tick-${t}`}>{t}s</span>
        ))}
      </div>

      {/* Legend */}
      <div className="ml-[7.5rem] mt-1 flex gap-3 text-[9px] text-[var(--color-neutral-400)]">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-amber-200" />TTFT
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-4 rounded-sm bg-amber-500" />Post-TTFT
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export function GraphTraceStrip({
  nodes,
  routes,
  selectedNodeIndex,
  onSelectNode,
  isLive,
}: GraphTraceStripProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("chain");

  const enrichedNodes = useMemo(() => enrichNodes(nodes), [nodes]);
  const tokenAgg = useMemo(() => aggregateTokens(nodes), [nodes]);

  if (nodes.length === 0) {
    return (
      <div
        data-testid="graph-trace-empty"
        className="flex h-16 items-center justify-center text-sm text-[var(--color-neutral-400)]"
      >
        No graph nodes traversed yet.
      </div>
    );
  }

  return (
    <div data-testid="graph-trace-strip">
      {/* Header */}
      <div className="mb-1 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-md border border-[var(--color-border)] text-[10px]">
            <button
              type="button"
              onClick={() => setViewMode("chain")}
              className={`px-2 py-0.5 transition ${viewMode === "chain" ? "bg-[var(--color-neutral-100)] font-medium text-[var(--color-neutral-900)]" : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]"}`}
            >
              Chain
            </button>
            <button
              type="button"
              onClick={() => setViewMode("waterfall")}
              className={`border-l border-[var(--color-border)] px-2 py-0.5 transition ${viewMode === "waterfall" ? "bg-[var(--color-neutral-100)] font-medium text-[var(--color-neutral-900)]" : "text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]"}`}
            >
              Waterfall
            </button>
          </div>
        </div>
        <span className="text-xs text-[var(--color-neutral-400)]">
          {nodes.length} {nodes.length === 1 ? "node" : "nodes"}
          {routes.length > 0 ? ` \u00b7 ${routes.length} route${routes.length > 1 ? "s" : ""}` : ""}
          {tokenAgg ? ` \u00b7 ${formatTokens(tokenAgg.total)} tokens` : ""}
        </span>
      </div>

      {/* View */}
      {viewMode === "chain" ? (
        <ChainView
          enrichedNodes={enrichedNodes}
          routes={routes}
          selectedIndex={selectedNodeIndex}
          onSelectNode={onSelectNode}
          isLive={isLive}
        />
      ) : (
        <WaterfallView
          enrichedNodes={enrichedNodes}
          selectedIndex={selectedNodeIndex}
          onSelectNode={onSelectNode}
          isLive={isLive}
        />
      )}
    </div>
  );
}
