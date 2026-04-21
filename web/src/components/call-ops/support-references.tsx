import type { ActiveCall } from "@/components/call-ops/escalation-modal";
import type { CallTraceContext } from "@/lib/api/call-observability";

export interface SupportReferencesProps {
  call: ActiveCall | null;
  traceContext: CallTraceContext | null;
}

export function SupportReferences({ call, traceContext }: SupportReferencesProps) {
  return (
    <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <summary className="cursor-pointer text-sm font-semibold text-[var(--color-neutral-950)]">Support references</summary>
      <div className="mt-3 grid gap-2 text-sm text-[var(--color-neutral-600)]">
        <p>
          <span className="font-medium text-[var(--color-neutral-900)]">Call ID:</span> {call?.call_id ?? "\u2014"}
        </p>
        <p>
          <span className="font-medium text-[var(--color-neutral-900)]">Workflow:</span> {call?.workflow_id ?? "\u2014"}
        </p>
        <p>
          <span className="font-medium text-[var(--color-neutral-900)]">Run:</span> {call?.run_id ?? "\u2014"}
        </p>
        <p>
          <span className="font-medium text-[var(--color-neutral-900)]">Trace ID:</span> {traceContext?.trace_id ?? "\u2014"}
        </p>
        <p>
          <span className="font-medium text-[var(--color-neutral-900)]">Correlation ID:</span> {traceContext?.correlation_id ?? "\u2014"}
        </p>
      </div>
    </details>
  );
}
