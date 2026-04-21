"use client";

import { useEffect, useRef } from "react";

import type { LiveTestTranscriptTurn } from "./use-mock-test-stream";

export interface LiveTranscriptProps {
  turns: LiveTestTranscriptTurn[];
  active: boolean;
}

export function LiveTranscript({ turns, active }: LiveTranscriptProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom on new turn.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns.length]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-md border border-[var(--color-border)] bg-white">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
          Transcript
        </h4>
        <span className="text-[11px] text-[var(--color-neutral-500)]">{turns.length} turn{turns.length === 1 ? "" : "s"}</span>
      </div>
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {turns.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-[var(--color-neutral-400)]">
            {active ? "Waiting for first turn…" : "Start a test call to see live transcript."}
          </p>
        ) : (
          turns.map((turn) => (
            <div
              key={turn.index}
              className={[
                "flex flex-col gap-0.5 rounded-md px-3 py-2 text-[13px] leading-5",
                turn.role === "user"
                  ? "bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)]"
                  : "bg-[var(--color-primary-50)] text-[var(--color-primary-900)]",
              ].join(" ")}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide">
                {turn.role === "user" ? "User" : "Agent"}
                <span className="ml-2 font-normal text-[var(--color-neutral-500)]">{formatMs(turn.at_ms)}</span>
              </span>
              <span>{turn.text}</span>
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
