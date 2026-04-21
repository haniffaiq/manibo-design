"use client";

import { Button } from "@grove/ui/button";

export interface VoiceControlsProps {
  active: boolean;
  ended: boolean;
  elapsedMs: number;
  providerLabel: string;
  voiceLabel: string;
  micMuted: boolean;
  onToggleMic: () => void;
  onStart: () => void;
  onStop: () => void;
  onClose?: () => void;
}

export function VoiceControls({
  active,
  ended,
  elapsedMs,
  providerLabel,
  voiceLabel,
  micMuted,
  onToggleMic,
  onStart,
  onStop,
  onClose,
}: VoiceControlsProps) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-neutral-900)] px-4 py-2 text-white">
      {!active && !ended ? (
        <Button
          type="button"
          size="sm"
          onClick={onStart}
          className="bg-emerald-500 text-white hover:bg-emerald-600"
        >
          ▶ Start test call
        </Button>
      ) : (
        <>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onToggleMic}
            className="text-white hover:bg-white/10"
            aria-label={micMuted ? "Unmute mic" : "Mute mic"}
          >
            {micMuted ? "🔇 Mic" : "🎤 Mic"}
          </Button>
          {active ? (
            <Button
              type="button"
              size="sm"
              onClick={onStop}
              className="bg-rose-600 text-white hover:bg-rose-700"
            >
              ◼ End call
            </Button>
          ) : null}
        </>
      )}

      <span className="inline-flex items-center gap-1.5 font-mono text-[12px] tabular-nums">
        <span className={["h-1.5 w-1.5 rounded-full", active ? "bg-rose-500 animate-pulse" : "bg-white/40"].join(" ")} />
        {formatElapsed(elapsedMs)}
      </span>

      <span className="ml-2 truncate text-[11px] text-white/60">
        {providerLabel} · {voiceLabel}
      </span>

      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-md text-white/70 hover:bg-white/10"
          aria-label="Close test panel"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}

function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
