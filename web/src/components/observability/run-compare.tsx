import Link from "next/link";

import { Badge } from "@grove/ui/badge";
import type { ObservabilityCompareResponse } from "@/lib/api/observability";
import { formatDurationMs, statusVariant } from "./formatters";

function ComparisonValueSet({
  label,
  valueSet,
}: {
  label: string;
  valueSet: { shared: string[]; left_only: string[]; right_only: string[] };
}) {
  return (
    <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.72)] px-3 py-3">
      <p className="font-medium text-[var(--color-neutral-700)]">{label}</p>
      <div className="mt-3 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">Shared</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {valueSet.shared.length > 0 ? (
              valueSet.shared.map((value) => (
                <Badge key={`${label}-shared-${value}`} variant="neutral">
                  {value}
                </Badge>
              ))
            ) : (
              <span className="text-[var(--color-neutral-500)]">None</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
            Only in current run
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {valueSet.left_only.length > 0 ? (
              valueSet.left_only.map((value) => (
                <Badge key={`${label}-left-${value}`} variant="warning">
                  {value}
                </Badge>
              ))
            ) : (
              <span className="text-[var(--color-neutral-500)]">None</span>
            )}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
            Only in comparison run
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {valueSet.right_only.length > 0 ? (
              valueSet.right_only.map((value) => (
                <Badge key={`${label}-right-${value}`} variant="success">
                  {value}
                </Badge>
              ))
            ) : (
              <span className="text-[var(--color-neutral-500)]">None</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ComparisonSection({ compare }: { compare: ObservabilityCompareResponse }) {
  const snapshots = [
    { label: "Current run", snapshot: compare.left },
    { label: "Comparison run", snapshot: compare.right },
  ] as const;

  return (
    <div className="rounded-3xl border border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.98))] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">Run comparison</p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--color-neutral-950)]">What changed between these two runs?</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {compare.duration_delta_ms != null ? (
            <Badge variant={compare.duration_delta_ms > 0 ? "warning" : "success"}>
              Duration delta {compare.duration_delta_ms > 0 ? "+" : ""}
              {formatDurationMs(compare.duration_delta_ms)}
            </Badge>
          ) : null}
          {compare.warning_delta !== 0 ? (
            <Badge variant={compare.warning_delta > 0 ? "warning" : "success"}>Warning delta {compare.warning_delta}</Badge>
          ) : null}
          {compare.error_delta !== 0 ? (
            <Badge variant={compare.error_delta > 0 ? "error" : "success"}>Error delta {compare.error_delta}</Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {snapshots.map(({ label, snapshot }) => (
          <div key={label} className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">{label}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-neutral-950)]">{snapshot.summary.title}</p>
                <p className="mt-1 text-xs text-[var(--color-neutral-500)]">{snapshot.summary.subtitle ?? "No secondary label"}</p>
              </div>
              <Badge variant={statusVariant(snapshot.summary.status)}>{snapshot.summary.status}</Badge>
            </div>

            <div className="mt-3 space-y-2 text-sm text-[var(--color-neutral-700)]">
              <p>Duration: {formatDurationMs(snapshot.summary.duration_ms)}</p>
              <p>
                Issues: {snapshot.summary.warning_count} warnings · {snapshot.summary.error_count} errors
              </p>
              {snapshot.transcript_excerpt ? (
                <p className="rounded-2xl bg-[rgba(248,250,252,0.85)] px-3 py-3 text-sm text-[var(--color-neutral-600)]">
                  {snapshot.transcript_excerpt}
                </p>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {snapshot.key_metrics.map((metric) => (
                <Badge key={`${label}-${metric.key}`} variant="neutral">
                  {metric.label}: {metric.value}
                </Badge>
              ))}
            </div>

            {snapshot.context_fields.length > 0 ? (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {snapshot.context_fields.map((field) => (
                  <div
                    key={`${label}-${field.key}`}
                    className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.72)] px-3 py-3"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-neutral-500)]">
                      {field.label}
                    </p>
                    <p className="mt-2 text-sm font-medium text-[var(--color-neutral-800)]">{field.value}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {snapshot.related_entities.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {snapshot.related_entities.map((entity) => (
                  <Link
                    key={`${label}-${entity.href}`}
                    href={entity.href}
                    prefetch={false}
                    className="inline-flex h-8 items-center justify-center rounded-full border border-[rgba(15,23,42,0.12)] bg-[rgba(248,250,252,0.84)] px-3 text-xs font-medium text-[var(--color-neutral-700)] hover:border-[var(--color-primary-500)] hover:text-[var(--color-primary-700)]"
                  >
                    {entity.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {compare.context_deltas.length > 0 ? (
        <div
          data-testid="observability-compare-context"
          className="mt-4 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 p-4"
        >
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Context changes</p>
          <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
            Use this to spot release, assistant, tenant, or stack drift before you blame the runtime.
          </p>
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {compare.context_deltas.map((field) => (
              <div
                key={field.key}
                className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-medium text-[var(--color-neutral-950)]">{field.label}</p>
                  <Badge variant={field.changed ? "warning" : "neutral"}>{field.changed ? "Changed" : "Same"}</Badge>
                </div>
                <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
                  Current: {field.left_value ?? "Not recorded"} · Comparison: {field.right_value ?? "Not recorded"}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div
          data-testid="observability-compare-path"
          className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 p-4"
        >
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Metric deltas</p>
          {compare.metric_deltas.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-neutral-500)]">No metric deltas were available for this pair.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {compare.metric_deltas.map((metric) => (
                <div key={metric.key} className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--color-neutral-950)]">{metric.label}</p>
                    {metric.delta_value ? <Badge variant="neutral">Delta {metric.delta_value}</Badge> : null}
                  </div>
                  <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
                    Current: {metric.left_value} · Comparison: {metric.right_value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 p-4">
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Path changes</p>
          <div className="mt-3 space-y-3 text-sm">
            <ComparisonValueSet label="Tools" valueSet={compare.tool_usage} />
            <ComparisonValueSet label="Nodes" valueSet={compare.node_usage} />
            <ComparisonValueSet label="Routes" valueSet={compare.route_usage} />
            <ComparisonValueSet label="Workflow steps" valueSet={compare.workflow_step_usage} />
          </div>
        </div>
      </div>
    </div>
  );
}
