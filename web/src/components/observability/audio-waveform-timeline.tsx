"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { ObservabilityTimelineItem } from "@/lib/api/observability";
import { timelineGroupLabel } from "./formatters";

const EVENT_KIND_COLORS: Record<string, string> = {
  tool: "#3b82f6",
  route: "#8b5cf6",
  node: "#6366f1",
  transcript: "#10b981",
  recording: "#f59e0b",
  workflow_step: "#ec4899",
  metric: "#64748b",
  log: "#94a3b8",
};

interface AudioWaveformTimelineProps {
  recordingUrl: string;
  sessionStartedAt: string;
  timelineItems: ObservabilityTimelineItem[];
  onSeekToItem: (item: ObservabilityTimelineItem) => void;
  selectedItemId: string | null;
}

export function AudioWaveformTimeline({
  recordingUrl,
  sessionStartedAt,
  timelineItems,
  onSeekToItem,
  selectedItemId,
}: AudioWaveformTimelineProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<import("wavesurfer.js").default | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isReady, setIsReady] = useState(false);

  // Init wavesurfer
  useEffect(() => {
    if (!containerRef.current || !recordingUrl) return;

    let cancelled = false;

    async function init() {
      const WaveSurfer = (await import("wavesurfer.js")).default;
      if (cancelled || !containerRef.current) return;

      const ws = WaveSurfer.create({
        container: containerRef.current,
        url: recordingUrl,
        waveColor: "#cbd5e1",
        progressColor: "#3b82f6",
        cursorColor: "#1e40af",
        cursorWidth: 2,
        height: 64,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        normalize: true,
        hideScrollbar: true,
      });

      ws.on("ready", () => {
        if (cancelled) return;
        setDuration(ws.getDuration());
        setIsReady(true);
      });

      ws.on("timeupdate", (time: number) => {
        if (!cancelled) setCurrentTime(time);
      });

      wavesurferRef.current = ws;
    }

    void init();

    return () => {
      cancelled = true;
      wavesurferRef.current?.destroy();
      wavesurferRef.current = null;
      setIsReady(false);
      setDuration(0);
    };
  }, [recordingUrl]);

  // Seek waveform when a timeline item is selected
  useEffect(() => {
    if (!isReady || !selectedItemId || !wavesurferRef.current || duration === 0) return;
    const item = timelineItems.find((i) => i.id === selectedItemId);
    if (!item?.occurred_at) return;

    const offsetSeconds = (new Date(item.occurred_at).getTime() - new Date(sessionStartedAt).getTime()) / 1000;
    const clampedOffset = Math.max(0, Math.min(offsetSeconds, duration));
    wavesurferRef.current.setTime(clampedOffset);
  }, [selectedItemId, isReady, duration, timelineItems, sessionStartedAt]);

  const handlePlayPause = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  // Compute event marker positions
  const sessionStartMs = new Date(sessionStartedAt).getTime();
  const markers = duration > 0
    ? timelineItems
        .filter((item) => item.occurred_at && item.kind !== "transcript")
        .map((item) => {
          const offsetMs = new Date(item.occurred_at!).getTime() - sessionStartMs;
          const position = Math.max(0, Math.min(offsetMs / (duration * 1000), 1));
          return { item, position };
        })
        .filter((m) => m.position >= 0 && m.position <= 1)
    : [];

  return (
    <div
      data-testid="observability-audio-waveform"
      className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.84)] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Audio waveform</p>
          <p className="text-xs text-[var(--color-neutral-500)]">
            Scrub through audio to see transcript and events pinned to the same position.
          </p>
        </div>
        {isReady ? (
          <button
            type="button"
            onClick={handlePlayPause}
            className="inline-flex h-8 items-center rounded-lg border border-[rgba(15,23,42,0.12)] px-3 text-xs font-medium text-[var(--color-neutral-700)] hover:text-[var(--color-primary-700)]"
          >
            Play / Pause
          </button>
        ) : null}
      </div>

      {/* Waveform container */}
      <div className="relative mt-3">
        <div ref={containerRef} className="w-full" />

        {/* Event markers overlay */}
        {isReady && markers.length > 0 ? (
          <div className="absolute inset-x-0 top-0 h-full pointer-events-none">
            {markers.map(({ item, position }) => (
              <button
                key={item.id}
                type="button"
                title={`${timelineGroupLabel(item.kind)}: ${item.label}`}
                onClick={() => onSeekToItem(item)}
                style={{ left: `${position * 100}%` }}
                className="pointer-events-auto absolute top-0 h-full w-px"
              >
                <div
                  className="absolute top-0 h-full w-[2px]"
                  style={{ backgroundColor: EVENT_KIND_COLORS[item.kind] ?? "#94a3b8", opacity: 0.6 }}
                />
                <div
                  className="absolute -top-1 -translate-x-1/2 h-2 w-2 rounded-full border border-white"
                  style={{ backgroundColor: EVENT_KIND_COLORS[item.kind] ?? "#94a3b8" }}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Time + legend */}
      {isReady ? (
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-[var(--color-neutral-500)]">
            {formatSeconds(currentTime)} / {formatSeconds(duration)}
          </span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(EVENT_KIND_COLORS)
              .filter(([kind]) => markers.some((m) => m.item.kind === kind))
              .map(([kind, color]) => (
                <span key={kind} className="flex items-center gap-1 text-xs text-[var(--color-neutral-500)]">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  {timelineGroupLabel(kind as ObservabilityTimelineItem["kind"])}
                </span>
              ))}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--color-neutral-500)]">Loading waveform...</p>
      )}
    </div>
  );
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
