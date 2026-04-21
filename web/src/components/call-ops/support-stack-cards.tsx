import type { CallLatencyStackComponent } from "@/lib/api/call-observability";
import { stackCardDescription } from "@/lib/call-observability-presenters";

export interface SupportStackCardsProps {
  entries: Array<[label: string, component: "llm" | "stt" | "tts", value: CallLatencyStackComponent | null]>;
}

export function SupportStackCards({ entries }: SupportStackCardsProps) {
  if (entries.length === 0) return null;

  return (
    <section className="grid gap-3 md:grid-cols-3">
      {entries.map(([label, component, value]) => (
        <div
          key={component}
          data-testid={`call-ops-support-stack-${component}`}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
        >
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{label}</p>
          <div className="mt-3 flex flex-col gap-1.5 text-sm text-[var(--color-neutral-600)]">
            {stackCardDescription(component, value).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
