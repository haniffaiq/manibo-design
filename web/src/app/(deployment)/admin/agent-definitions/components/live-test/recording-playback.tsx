"use client";

import { useEffect, useRef, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import { mockRecordings, type MockRecording } from "@/lib/mock/agent-builder-fixtures";

/**
 * Bottom strip of the live-test panel: dropdown of past recordings + audio
 * playback with progress scrubber. Uses native <audio> for simplicity since
 * we just need a working scrubber on a sample MP3.
 */
export function RecordingPlayback() {
  const [recordings] = useState<MockRecording[]>(mockRecordings);
  const [selectedId, setSelectedId] = useState<string>(recordings[0]?.id ?? "");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const selected = recordings.find((r) => r.id === selectedId) ?? recordings[0];

  // Reset when selection changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !selected) return;
    audio.pause();
    audio.src = selected.url;
    audio.currentTime = 0;
    setCurrentMs(0);
    setDurationMs(selected.duration_ms);
    setPlaying(false);
    setError(null);
  }, [selected]);

  function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise.catch((err) => {
          // Most likely the sample asset is missing in /public/mock-recordings.
          setError(err instanceof Error ? err.message : "Unable to play audio.");
          setPlaying(false);
        });
      }
      setPlaying(true);
    }
  }

  function seek(progressPercent: number) {
    const audio = audioRef.current;
    if (!audio || !selected) return;
    const clamped = Math.max(0, Math.min(1, progressPercent));
    const targetSec = (clamped * selected.duration_ms) / 1000;
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
      audio.currentTime = clamped * audio.duration;
    } else {
      audio.currentTime = targetSec;
    }
    setCurrentMs(targetSec * 1000);
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentMs(audio.currentTime * 1000);
  }

  function handleLoaded() {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    setDurationMs(audio.duration * 1000);
  }

  function handleEnded() {
    setPlaying(false);
  }

  if (recordings.length === 0) {
    return null;
  }

  const progress = durationMs > 0 ? Math.min(1, currentMs / durationMs) : 0;

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-[var(--color-border)] bg-white px-4 py-2.5">
      <button
        type="button"
        onClick={togglePlay}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-neutral-900)] text-white"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "❚❚" : "▶"}
      </button>

      <button
        type="button"
        className="relative h-2 flex-1 cursor-pointer rounded-full bg-[var(--color-neutral-200)]"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seek((e.clientX - rect.left) / rect.width);
        }}
        aria-label="Seek"
      >
        <span
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--color-primary-500)]"
          style={{ width: `${progress * 100}%` }}
        />
      </button>

      <span className="font-mono text-[11px] tabular-nums text-[var(--color-neutral-600)]">
        {formatMs(currentMs)} / {formatMs(durationMs)}
      </span>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-[11px] text-[var(--color-neutral-500)]">Recording</span>
        <div className="w-[260px]">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {recordings.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  <span className="truncate text-[12px]">{r.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <p className="basis-full text-[11px] text-[var(--color-danger)]">
          Audio unavailable ({error}). Drop a sample at <code>/public/mock-recordings/sample-call-01.mp3</code> to enable playback.
        </p>
      ) : null}

      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoaded}
        onEnded={handleEnded}
        className="hidden"
      />
    </div>
  );
}

function formatMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "00:00";
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
