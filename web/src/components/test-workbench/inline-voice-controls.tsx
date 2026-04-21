"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@grove/ui/button";
import { createBrowserVoiceRoom, type BrowserVoiceRoom } from "@grove/web-shared/lib/livekit-browser-room";
import type { BrowserVoiceSessionInfo } from "@grove/web-shared/components/browser-voice-client";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type VoiceState = "idle" | "starting" | "connecting" | "live" | "muted" | "ended" | "error";

export interface InlineVoiceControlsProps {
  createSession: () => Promise<BrowserVoiceSessionInfo>;
  cleanupSession?: (callId: string) => Promise<void>;
  onCallStarted?: (callId: string) => void;
  onCallEnded?: () => void;
  disabled?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Icons (inline SVG, no deps)                                        */
/* ------------------------------------------------------------------ */

function MicIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="1" y1="1" x2="23" y2="23" />
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .84-.14 1.65-.4 2.4" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

function resolveError(err: unknown): string {
  return err instanceof Error ? err.message : "Unexpected error";
}

export function InlineVoiceControls({
  createSession,
  cleanupSession,
  onCallStarted,
  onCallEnded,
  disabled,
}: InlineVoiceControlsProps) {
  const [state, setState] = useState<VoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);

  const roomRef = useRef<BrowserVoiceRoom | null>(null);
  const audioRef = useRef<HTMLDivElement | null>(null);
  const disconnectingRef = useRef(false);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      unsubRef.current?.();
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  const startSession = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser does not support microphone access.");
      setState("error");
      return;
    }
    unsubRef.current?.();
    roomRef.current?.disconnect();
    roomRef.current = null;
    disconnectingRef.current = false;
    setError(null);
    setRoomName(null);
    setMicMuted(false);
    setState("starting");
    let session: BrowserVoiceSessionInfo | null = null;

    try {
      session = await createSession();
      const room = createBrowserVoiceRoom();
      unsubRef.current = room.subscribe({
        onStateChange: (s) => {
          if (s === "connected") setState((c) => (c === "muted" ? c : "live"));
          else if (s === "reconnecting") setState("connecting");
          else if (!disconnectingRef.current) setState("ended");
        },
        onDisconnected: (reason) => {
          if (disconnectingRef.current) {
            setState("ended");
            setError(null);
          } else {
            setError(reason || "Voice room disconnected unexpectedly.");
            setState("error");
          }
          onCallEnded?.();
        },
        onPlaybackBlocked: () => setError("Browser audio playback blocked."),
        onError: (msg) => { setError(msg); setState("error"); },
      });
      roomRef.current = room;
      setRoomName(session.room_name);
      setState("connecting");
      await room.connect(session.connect_url, session.token, audioRef.current);
      await room.startAudio();
      await room.setMicrophoneEnabled(true);
      setState("live");
      onCallStarted?.(session.call_id);
    } catch (e) {
      unsubRef.current?.();
      unsubRef.current = null;
      roomRef.current?.disconnect();
      roomRef.current = null;
      if (session?.call_id) {
        try {
          await cleanupSession?.(session.call_id);
        } catch {
          // Preserve the original bootstrap error when best-effort cleanup fails.
        }
      }
      setError(resolveError(e));
      setState("error");
    }
  }, [createSession, cleanupSession, onCallStarted, onCallEnded]);

  const endSession = useCallback(() => {
    disconnectingRef.current = true;
    unsubRef.current?.();
    unsubRef.current = null;
    roomRef.current?.disconnect();
    roomRef.current = null;
    setMicMuted(false);
    setState("ended");
    onCallEnded?.();
  }, [onCallEnded]);

  const toggleMic = useCallback(async () => {
    if (!roomRef.current) return;
    setError(null);
    try {
      const next = !micMuted;
      await roomRef.current.setMicrophoneEnabled(!next);
      setMicMuted(next);
      setState(next ? "muted" : "live");
    } catch (e) {
      setError(resolveError(e));
      setState("error");
    }
  }, [micMuted]);

  const isActive = state === "starting" || state === "connecting" || state === "live" || state === "muted";
  const isBusy = state === "starting" || state === "connecting";

  return (
    <div className="flex items-center gap-2" data-testid="browser-voice-client">
      {/* Status chip */}
      <span
        data-testid="browser-voice-state"
        className={`inline-flex h-5 items-center rounded-full border px-2 text-[10px] font-medium ${
          state === "live" ? "border-green-300 bg-green-50 text-green-700"
            : state === "muted" ? "border-amber-300 bg-amber-50 text-amber-700"
            : state === "error" ? "border-red-300 bg-red-50 text-red-700"
            : state === "connecting" || state === "starting" ? "border-amber-300 bg-amber-50 text-amber-700"
            : "border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-neutral-600)]"
        }`}
      >
        {state === "idle" ? "Ready" : state === "starting" ? "Starting\u2026" : state === "connecting" ? "Connecting\u2026"
          : state === "live" ? "Live" : state === "muted" ? "Muted" : state === "ended" ? "Ended" : "Error"}
      </span>

      {/* Room name (only when active) */}
      {roomName && isActive ? (
        <span className="hidden text-[10px] text-[var(--color-neutral-500)] lg:inline" data-testid="browser-voice-room">
          {roomName}
        </span>
      ) : null}

      {/* Mute toggle (only when active) */}
      {isActive && !isBusy ? (
        <button
          type="button"
          onClick={() => void toggleMic()}
          data-testid="browser-voice-mute"
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
            micMuted
              ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
              : "border-[var(--color-border)] text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]"
          }`}
          title={micMuted ? "Unmute" : "Mute"}
        >
          <MicIcon muted={micMuted} />
        </button>
      ) : null}

      {/* Start / End toggle */}
      {isActive ? (
        <Button
          type="button"
          variant="outline"
          onClick={endSession}
          disabled={isBusy}
          data-testid="browser-voice-end"
          className="h-7 px-3 text-xs"
        >
          End session
        </Button>
      ) : (
        <Button
          type="button"
          onClick={() => void startSession()}
          disabled={disabled}
          data-testid="browser-voice-start"
          className="h-7 px-3 text-xs"
        >
          {isBusy ? "Starting\u2026" : "Start session"}
        </Button>
      )}

      {/* Error message */}
      {error ? (
        <span className="text-[10px] text-red-600" data-testid="browser-voice-error">{error}</span>
      ) : state === "ended" ? (
        <span className="text-[10px] text-[var(--color-neutral-500)]" data-testid="browser-voice-ended">Session ended.</span>
      ) : null}

      <div ref={audioRef} className="sr-only" aria-hidden="true" />
    </div>
  );
}
