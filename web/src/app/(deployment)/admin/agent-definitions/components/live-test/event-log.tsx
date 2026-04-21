"use client";

import { useEffect, useRef } from "react";

import type { LiveTestLogEntry } from "./use-mock-test-stream";

export interface EventLogProps {
  entries: LiveTestLogEntry[];
  active: boolean;
}

export function EventLog({ entries, active }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-neutral-900)] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-white/70">Event log</h4>
        <span className="text-[11px] text-white/50">{entries.length}</span>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-5">
        {entries.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-white/40">
            {active ? "Waiting for first event…" : "No events yet."}
          </p>
        ) : (
          entries.map((entry) => (
            <div key={entry.index} className="grid grid-cols-[44px_140px_1fr] gap-2 py-0.5">
              <span className="text-white/40 tabular-nums">{formatMs(entry.at_ms)}</span>
              <span className="truncate text-emerald-300">{entry.event_type}</span>
              <span className="truncate text-white/80">{entry.summary}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
