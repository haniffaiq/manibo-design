"use client";

export interface CostLatencyStripProps {
  costPerMin: number; // USD
  latencyMs: number;
}

/**
 * Compact two-card strip mirroring Vapi's "Cost ~$0.14/min" + "Latency ~1150ms"
 * pair under the assistant header. Pure presentation — no fetching.
 */
export function CostLatencyStrip({ costPerMin, latencyMs }: CostLatencyStripProps) {
  return (
    <div className="flex items-center gap-2">
      <MetricBadge
        label="Cost"
        value={`~$${costPerMin.toFixed(2)}`}
        suffix="/min"
        accent="bg-emerald-500"
      />
      <MetricBadge label="Latency" value={`~${Math.round(latencyMs)} ms`} accent="bg-amber-500" />
    </div>
  );
}

function MetricBadge({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-white px-2.5 py-1.5">
      <span className={["h-1.5 w-1.5 rounded-full", accent].join(" ")} />
      <span className="text-[11px] uppercase tracking-wide text-[var(--color-neutral-500)]">{label}</span>
      <span className="text-[12px] font-semibold text-[var(--color-neutral-900)]">{value}</span>
      {suffix ? <span className="text-[11px] text-[var(--color-neutral-500)]">{suffix}</span> : null}
    </div>
  );
}
