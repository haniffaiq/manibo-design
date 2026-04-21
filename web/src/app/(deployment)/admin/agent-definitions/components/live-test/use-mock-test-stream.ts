"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { liveTestStream, type LiveTestFrame } from "@/lib/mock/agent-builder-fixtures";

export interface LiveTestTranscriptTurn {
  index: number;
  role: "user" | "agent";
  text: string;
  /** elapsed ms since session start */
  at_ms: number;
}

export interface LiveTestLogEntry {
  index: number;
  at_ms: number;
  event_type: string;
  summary: string;
}

export interface LiveTestState {
  /** True between start() and end-of-stream / stop(). */
  active: boolean;
  /** Mic input level 0..1 (mocked). */
  micLevel: number;
  /** Agent output level 0..1 (mocked). */
  agentLevel: number;
  /** Elapsed ms since session start. */
  elapsedMs: number;
  transcript: LiveTestTranscriptTurn[];
  logs: LiveTestLogEntry[];
  ended: boolean;
}

export interface UseMockTestStream extends LiveTestState {
  start: () => void;
  stop: () => void;
  reset: () => void;
}

const INITIAL_STATE: LiveTestState = {
  active: false,
  micLevel: 0,
  agentLevel: 0,
  elapsedMs: 0,
  transcript: [],
  logs: [],
  ended: false,
};

/**
 * Mock-only test session driver. Plays back the scripted `liveTestStream`
 * fixture frames at their declared timestamps and exposes a snapshot of the
 * resulting transcript / log / level state.
 *
 * Returns the same shape as a real LiveKit-backed driver would, so the
 * consumer (live-test-panel) can stay agnostic.
 */
export function useMockTestStream(): UseMockTestStream {
  const [state, setState] = useState<LiveTestState>(INITIAL_STATE);
  const startedAtRef = useRef<number | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAll = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
    if (tickerRef.current) {
      clearInterval(tickerRef.current);
      tickerRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearAll();
    startedAtRef.current = Date.now();
    setState({ ...INITIAL_STATE, active: true });

    // Schedule each scripted frame.
    for (const frame of liveTestStream) {
      const handle = setTimeout(() => applyFrame(frame, setState), frame.delayMs);
      timersRef.current.push(handle);
    }

    // Tick elapsed ms ~10/s and decay sample levels between frames so the
    // waveform looks alive even when no log/transcript event is firing.
    tickerRef.current = setInterval(() => {
      setState((prev) => {
        if (!prev.active) return prev;
        const startedAt = startedAtRef.current ?? Date.now();
        const elapsedSec = (Date.now() - startedAt) / 1000;
        return {
          ...prev,
          elapsedMs: Date.now() - startedAt,
          // Soft sine wobble on top of last frame value so the bars don't go flat.
          micLevel: jitter(prev.micLevel, 0.08, elapsedSec * 6),
          agentLevel: jitter(prev.agentLevel, 0.08, elapsedSec * 5 + 1.3),
        };
      });
    }, 100);
  }, [clearAll]);

  const stop = useCallback(() => {
    clearAll();
    setState((prev) => ({ ...prev, active: false }));
  }, [clearAll]);

  const reset = useCallback(() => {
    clearAll();
    startedAtRef.current = null;
    setState(INITIAL_STATE);
  }, [clearAll]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => clearAll();
  }, [clearAll]);

  return { ...state, start, stop, reset };
}

function applyFrame(frame: LiveTestFrame, setState: (updater: (prev: LiveTestState) => LiveTestState) => void) {
  setState((prev) => {
    const next: LiveTestState = { ...prev };
    if (frame.kind === "log") {
      next.logs = [
        ...prev.logs,
        {
          index: prev.logs.length,
          at_ms: frame.delayMs,
          event_type: frame.payload.eventType ?? "log",
          summary: frame.payload.summary ?? "",
        },
      ];
    } else if (frame.kind === "transcript_user" || frame.kind === "transcript_agent") {
      next.transcript = [
        ...prev.transcript,
        {
          index: prev.transcript.length,
          role: frame.kind === "transcript_user" ? "user" : "agent",
          text: frame.payload.text ?? "",
          at_ms: frame.delayMs,
        },
      ];
    } else if (frame.kind === "level") {
      if (frame.payload.micLevel != null) next.micLevel = frame.payload.micLevel;
      if (frame.payload.agentLevel != null) next.agentLevel = frame.payload.agentLevel;
    } else if (frame.kind === "ended") {
      next.active = false;
      next.ended = true;
      next.micLevel = 0;
      next.agentLevel = 0;
    }
    return next;
  });
}

function jitter(base: number, amplitude: number, phase: number): number {
  const wobble = Math.sin(phase) * amplitude;
  return Math.max(0, Math.min(1, base + wobble * 0.5));
}
