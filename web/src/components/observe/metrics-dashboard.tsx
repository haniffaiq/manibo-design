"use client";

import type {
  CallOpsComponentComparison,
  CallOpsRouteHotspot,
} from "@/lib/api/call-observability";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface MetricsDashboardProps {
  sampledCalls: number;
  windowStart: string;
  windowEnd: string;
  stackComparisons: CallOpsComponentComparison[];
  routeHotspots: CallOpsRouteHotspot[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMs(value: number | null): string {
  if (value == null) return "--";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function latencyColor(ms: number | null): string {
  if (ms == null) return "text-[var(--color-neutral-400)]";
  if (ms < 200) return "text-green-600";
  if (ms < 500) return "text-amber-600";
  return "text-red-600";
}

/* ------------------------------------------------------------------ */
/*  Stack comparison table                                             */
/* ------------------------------------------------------------------ */

function StackComparisonTable({ comparisons }: { comparisons: CallOpsComponentComparison[] }) {
  if (comparisons.length === 0) {
    return <p className="text-sm text-[var(--color-neutral-400)]">No component data available.</p>;
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)]">
      <div className="grid grid-cols-6 gap-2 border-b border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 py-1.5 text-[10px] font-medium text-[var(--color-neutral-500)]">
        <span>Component</span>
        <span>Provider / Model</span>
        <span className="text-right">Samples</span>
        <span className="text-right">Avg</span>
        <span className="text-right">P95</span>
        <span className="text-right">Max</span>
      </div>
      {comparisons.map((row, i) => (
        <div key={`${row.component}-${row.provider}-${i}`} className="grid grid-cols-6 gap-2 border-b border-[var(--color-border)] px-3 py-1.5 text-xs last:border-b-0">
          <span className="font-medium uppercase text-[var(--color-neutral-700)]">{row.component}</span>
          <span className="truncate text-[var(--color-neutral-600)]">{row.provider ?? "--"} / {row.model ?? "--"}</span>
          <span className="text-right text-[var(--color-neutral-600)]">{row.sample_count}</span>
          <span className={`text-right font-medium ${latencyColor(row.average_ms)}`}>{formatMs(row.average_ms)}</span>
          <span className={`text-right font-medium ${latencyColor(row.p95_ms)}`}>{formatMs(row.p95_ms)}</span>
          <span className={`text-right font-medium ${latencyColor(row.max_ms)}`}>{formatMs(row.max_ms)}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Route hotspot table                                                */
/* ------------------------------------------------------------------ */

function RouteHotspotTable({ hotspots }: { hotspots: CallOpsRouteHotspot[] }) {
  if (hotspots.length === 0) {
    return <p className="text-sm text-[var(--color-neutral-400)]">No route hotspot data available.</p>;
  }

  return (
    <div className="rounded-lg border border-[var(--color-border)]">
      <div className="grid grid-cols-6 gap-2 border-b border-[var(--color-border)] bg-[var(--color-neutral-50)] px-3 py-1.5 text-[10px] font-medium text-[var(--color-neutral-500)]">
        <span>Node</span>
        <span>Route</span>
        <span className="text-right">Samples</span>
        <span className="text-right">Avg</span>
        <span className="text-right">P95</span>
        <span className="text-right">Max</span>
      </div>
      {hotspots.map((row, i) => (
        <div key={`${row.node_name}-${row.route}-${i}`} className="grid grid-cols-6 gap-2 border-b border-[var(--color-border)] px-3 py-1.5 text-xs last:border-b-0">
          <span className="font-medium text-[var(--color-neutral-700)]">{row.node_name.replace(/_/g, " ")}</span>
          <span className="text-[var(--color-neutral-600)]">{row.route ?? "--"}</span>
          <span className="text-right text-[var(--color-neutral-600)]">{row.sample_count}</span>
          <span className={`text-right font-medium ${latencyColor(row.average_latency_ms)}`}>{formatMs(row.average_latency_ms)}</span>
          <span className={`text-right font-medium ${latencyColor(row.p95_latency_ms)}`}>{formatMs(row.p95_latency_ms)}</span>
          <span className={`text-right font-medium ${latencyColor(row.max_latency_ms)}`}>{formatMs(row.max_latency_ms)}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function MetricsDashboard({
  sampledCalls,
  windowStart,
  windowEnd,
  stackComparisons,
  routeHotspots,
}: MetricsDashboardProps) {
  return (
    <div data-testid="metrics-dashboard" className="space-y-6">
      {/* Summary header */}
      <div className="flex items-center gap-4 text-xs text-[var(--color-neutral-500)]">
        <span>{sampledCalls} calls sampled</span>
        <span>&middot;</span>
        <span>{formatDate(windowStart)} &ndash; {formatDate(windowEnd)}</span>
      </div>

      {/* Stack performance */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
          Component latency
        </h3>
        <StackComparisonTable comparisons={stackComparisons} />
      </div>

      {/* Route hotspots */}
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
          Route hotspots
        </h3>
        <RouteHotspotTable hotspots={routeHotspots} />
      </div>
    </div>
  );
}
