import type { CallLatencyMetricSummary } from "@/lib/api/call-observability";
import { formatDurationMs, metricSummaryLabel } from "@/lib/call-observability-presenters";

export interface SupportLatencyMetricsProps {
  entries: Array<[metricKey: string, summary: CallLatencyMetricSummary | undefined]>;
}

export function SupportLatencyMetrics({ entries }: SupportLatencyMetricsProps) {
  if (entries.length === 0) return null;

  return (
    <section className="grid gap-3 sm:grid-cols-2">
      {entries.map(([metricKey, metricSummary]) => (
        <div
          key={metricKey}
          data-testid={`call-ops-support-summary-${metricKey}`}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
        >
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{metricSummaryLabel(metricKey)}</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-950)]">
            {formatDurationMs(metricSummary?.latest_ms ?? metricSummary?.average_ms ?? null)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-neutral-500)]">
            <span>Average: {formatDurationMs(metricSummary?.average_ms ?? null)}</span>
            <span>Worst: {formatDurationMs(metricSummary?.max_ms ?? null)}</span>
            <span>Samples: {metricSummary?.sample_count ?? 0}</span>
          </div>
        </div>
      ))}
    </section>
  );
}
