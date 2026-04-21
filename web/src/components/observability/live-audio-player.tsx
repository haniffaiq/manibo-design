"use client";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { AgentAudioVisualizerBar } from "@grove/ui/agent-audio-visualizer-bar";
import type { ObserverConnectionState } from "./use-livekit-observer";

export interface LiveAudioPlayerProps {
  connectionState: ObserverConnectionState;
  error: string | null;
  audioHostRef: React.RefObject<HTMLDivElement | null>;
  mediaStream?: MediaStream | null;
  micEnabled: boolean;
  onMicToggle: (enabled: boolean) => void;
}

function connectionLabel(state: ObserverConnectionState): string {
  switch (state) {
    case "connected":
      return "In call";
    case "connecting":
      return "Connecting...";
    case "reconnecting":
      return "Reconnecting...";
    default:
      return "Disconnected";
  }
}

function connectionVariant(state: ObserverConnectionState): "success" | "warning" | "neutral" {
  if (state === "connected") return "success";
  if (state === "connecting" || state === "reconnecting") return "warning";
  return "neutral";
}

export function LiveAudioPlayer({
  connectionState,
  error,
  audioHostRef,
  mediaStream = null,
  micEnabled,
  onMicToggle,
}: LiveAudioPlayerProps) {
  return (
    <div
      data-testid="observability-live-audio"
      className="rounded-2xl border border-[rgba(59,130,246,0.2)] bg-[rgba(239,246,255,0.6)] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Call audio</p>
          <p className="text-xs text-[var(--color-neutral-500)]">
            {micEnabled ? "Your microphone is live — the caller can hear you." : "Microphone muted — you can hear but not speak."}
          </p>
        </div>
        <Badge variant={connectionVariant(connectionState)}>
          {connectionLabel(connectionState)}
        </Badge>
      </div>
      {error ? (
        <p className="mt-2 text-sm text-[var(--color-error-700)]">{error}</p>
      ) : null}
      {connectionState === "connected" ? (
        <div className="mt-3 flex items-center gap-3">
          <AgentAudioVisualizerBar size="sm" barCount={5} mediaStream={mediaStream} />
          <Button
            size="sm"
            variant={micEnabled ? "primary" : "outline"}
            onClick={() => onMicToggle(!micEnabled)}
            data-testid="operator-mic-toggle"
          >
            {micEnabled ? "Mute mic" : "Unmute mic"}
          </Button>
        </div>
      ) : null}
      <div ref={audioHostRef} className="sr-only" />
    </div>
  );
}
