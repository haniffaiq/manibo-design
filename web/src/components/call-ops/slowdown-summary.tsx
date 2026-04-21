import { useMemo } from "react";

import { Badge } from "@grove/ui/badge";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import type {
  CallObservabilitySummaryResponse,
  CallOpsComponentComparison,
} from "@/lib/api/call-observability";
import { formatDurationMs, routeDisplayName } from "@/lib/call-observability-presenters";

function comparisonTitle(component: "llm" | "stt" | "tts"): string {
  switch (component) {
    case "llm":
      return "AI response benchmark";
    case "stt":
      return "Speech capture benchmark";
    case "tts":
      return "Voice playback benchmark";
  }
}

function comparisonName(comparison: CallOpsComponentComparison | null): string {
  if (!comparison) {
    return "No recent data";
  }
  if (comparison.component === "tts") {
    return [comparison.provider, comparison.voice_name ?? comparison.voice_id]
      .filter((part) => part && part.trim().length > 0)
      .join(" · ");
  }
  return [comparison.provider, comparison.model].filter((part) => part && part.trim().length > 0).join(" · ");
}

function comparisonDetail(comparison: CallOpsComponentComparison | null): string {
  if (!comparison) {
    return "Run more calls to compare providers.";
  }
  return `${comparison.sample_count} recent calls${comparison.language ? ` · ${comparison.language}` : ""}`;
}

function comparisonPrimaryMetric(comparison: CallOpsComponentComparison | null): number | null {
  return comparison?.p95_ms ?? comparison?.average_ms ?? null;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

export interface SlowdownSummaryProps {
  summary: CallObservabilitySummaryResponse | null;
}

export function SlowdownSummary({ summary }: SlowdownSummaryProps) {
  const componentCards = useMemo(() => {
    const components: Array<"llm" | "stt" | "tts"> = ["llm", "stt", "tts"];
    return components.map((component) => {
      const comparison = [...(summary?.stack_comparisons ?? [])]
        .filter((entry) => entry.component === component)
        .sort((left, right) => {
          const leftMetric = comparisonPrimaryMetric(left) ?? Number.POSITIVE_INFINITY;
          const rightMetric = comparisonPrimaryMetric(right) ?? Number.POSITIVE_INFINITY;
          return leftMetric - rightMetric;
        })[0] ?? null;
      return { component, comparison };
    });
  }, [summary]);

  const topHotspots = useMemo(
    () =>
      [...(summary?.route_hotspots ?? [])].sort((left, right) => {
        const leftMetric = left.p95_latency_ms ?? left.average_latency_ms ?? 0;
        const rightMetric = right.p95_latency_ms ?? right.average_latency_ms ?? 0;
        return rightMetric - leftMetric;
      }),
    [summary],
  );

  const busiestRoute = topHotspots[0] ?? null;

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Recent slowdown summary</h2>
              <p className="text-sm text-[var(--color-neutral-500)]">
                A quick read on which providers and routes caused the most delay recently.
              </p>
            </div>
            <Badge variant="neutral" data-testid="call-ops-summary-sampled">
              {summary?.sampled_calls ?? 0} calls
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {componentCards.map(({ component, comparison }) => (
              <div
                key={component}
                data-testid={`call-ops-summary-card-${component}`}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
              >
                <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{comparisonTitle(component)}</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-950)]">
                  {formatDurationMs(comparisonPrimaryMetric(comparison))}
                </p>
                <p className="mt-2 text-sm text-[var(--color-neutral-700)]">{comparisonName(comparison)}</p>
                <p className="mt-1 text-xs text-[var(--color-neutral-500)]">{comparisonDetail(comparison)}</p>
              </div>
            ))}
          </div>
          <div
            data-testid="call-ops-summary-window"
            className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3 text-sm text-[var(--color-neutral-600)]"
          >
            Reviewing calls from {formatDateTime(summary?.window_start)} to {formatDateTime(summary?.window_end)}.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Route needing attention</h2>
          <p className="text-sm text-[var(--color-neutral-500)]">
            The conversation path with the highest recent delay.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
            <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{routeDisplayName(busiestRoute)}</p>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-950)]">
              {formatDurationMs(busiestRoute?.p95_latency_ms ?? busiestRoute?.average_latency_ms ?? null)}
            </p>
            <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
              {busiestRoute
                ? `${busiestRoute.sample_count} recent calls${busiestRoute.graph_type ? ` · ${busiestRoute.graph_type}` : ""}`
                : "No route hotspot data yet."}
            </p>
            <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
              Worst case: {formatDurationMs(busiestRoute?.max_latency_ms ?? null)}
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
