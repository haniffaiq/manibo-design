"use client";

import type { CallTraceNodeSummary } from "@/lib/api/call-observability";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface RunCompareDetailProps {
  leftLabel: string;
  rightLabel: string;
  leftNodes: CallTraceNodeSummary[];
  rightNodes: CallTraceNodeSummary[];
  leftLatencyMs: Record<string, number | null>;
  rightLatencyMs: Record<string, number | null>;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMs(value: number | null): string {
  if (value == null) return "--";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function diffColor(leftMs: number | null, rightMs: number | null): string {
  if (leftMs == null || rightMs == null) return "text-[var(--color-neutral-500)]";
  const diff = rightMs - leftMs;
  if (Math.abs(diff) < 50) return "text-[var(--color-neutral-500)]";
  return diff > 0 ? "text-red-600" : "text-green-600";
}

function diffLabel(leftMs: number | null, rightMs: number | null): string {
  if (leftMs == null || rightMs == null) return "--";
  const diff = rightMs - leftMs;
  if (Math.abs(diff) < 1) return "0ms";
  const sign = diff > 0 ? "+" : "";
  return `${sign}${formatMs(diff)}`;
}

/* ------------------------------------------------------------------ */
/*  Latency comparison table                                           */
/* ------------------------------------------------------------------ */

function LatencyComparisonTable({
  leftLabel,
  rightLabel,
  leftLatencyMs,
  rightLatencyMs,
}: {
  leftLabel: string;
  rightLabel: string;
  leftLatencyMs: Record<string, number | null>;
  rightLatencyMs: Record<string, number | null>;
}) {
  const metrics = Array.from(new Set([...Object.keys(leftLatencyMs), ...Object.keys(rightLatencyMs)]));

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white">
      <div className="grid grid-cols-4 gap-2 border-b border-[var(--color-border)] px-3 py-1.5 text-[10px] font-medium text-[var(--color-neutral-500)]">
        <span>Metric</span>
        <span className="text-right">{leftLabel}</span>
        <span className="text-right">{rightLabel}</span>
        <span className="text-right">Delta</span>
      </div>
      {metrics.map((metric) => {
        const left = leftLatencyMs[metric] ?? null;
        const right = rightLatencyMs[metric] ?? null;
        return (
          <div key={metric} className="grid grid-cols-4 gap-2 px-3 py-1 text-xs">
            <span className="text-[var(--color-neutral-600)]">{metric.replace(/_/g, " ")}</span>
            <span className="text-right font-medium">{formatMs(left)}</span>
            <span className="text-right font-medium">{formatMs(right)}</span>
            <span className={`text-right font-semibold ${diffColor(left, right)}`}>{diffLabel(left, right)}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Flow path comparison                                               */
/* ------------------------------------------------------------------ */

function FlowPathComparison({
  leftLabel,
  rightLabel,
  leftNodes,
  rightNodes,
}: {
  leftLabel: string;
  rightLabel: string;
  leftNodes: CallTraceNodeSummary[];
  rightNodes: CallTraceNodeSummary[];
}) {
  const leftPath = leftNodes.map((n) => n.node_name);
  const rightPath = rightNodes.map((n) => n.node_name);
  const maxLen = Math.max(leftPath.length, rightPath.length);

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white">
      <div className="grid grid-cols-3 gap-2 border-b border-[var(--color-border)] px-3 py-1.5 text-[10px] font-medium text-[var(--color-neutral-500)]">
        <span>Step</span>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
      {Array.from({ length: maxLen }, (_, i) => {
        const left = leftPath[i] ?? "--";
        const right = rightPath[i] ?? "--";
        const same = left === right;
        return (
          <div key={i} className="grid grid-cols-3 gap-2 px-3 py-1 text-xs">
            <span className="text-[var(--color-neutral-400)]">#{i + 1}</span>
            <span className={same ? "text-[var(--color-neutral-700)]" : "font-medium text-amber-700"}>
              {left.replace(/_/g, " ")}
            </span>
            <span className={same ? "text-[var(--color-neutral-700)]" : "font-medium text-amber-700"}>
              {right.replace(/_/g, " ")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function RunCompareDetail({
  leftLabel,
  rightLabel,
  leftNodes,
  rightNodes,
  leftLatencyMs,
  rightLatencyMs,
}: RunCompareDetailProps) {
  return (
    <div data-testid="run-compare-detail" className="space-y-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
          Latency comparison
        </h3>
        <LatencyComparisonTable
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          leftLatencyMs={leftLatencyMs}
          rightLatencyMs={rightLatencyMs}
        />
      </div>
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
          Flow path comparison
        </h3>
        <FlowPathComparison
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          leftNodes={leftNodes}
          rightNodes={rightNodes}
        />
      </div>
    </div>
  );
}
