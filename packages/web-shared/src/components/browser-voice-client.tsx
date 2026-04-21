"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@grove/ui/button";
import { createBrowserVoiceRoom, type BrowserVoiceRoom } from "../lib/livekit-browser-room";

export type BrowserVoiceSessionInfo = {
  connect_url: string;
  token: string;
  room_name: string;
  call_id: string;
};

export type BrowserVoiceState = "idle" | "starting" | "connecting" | "live" | "muted" | "ended" | "error";

export type BrowserVoiceLabels = {
  start: string;
  starting: string;
  mute: string;
  unmute: string;
  end: string;
  ended: string;
  states: Record<BrowserVoiceState, string>;
  errors: {
    microphoneUnsupported: string;
    playbackBlocked: string;
    disconnected: string;
  };
};

const DEFAULT_LABELS: BrowserVoiceLabels = {
  start: "Start voice session",
  starting: "Starting\u2026",
  mute: "Mute",
  unmute: "Unmute",
  end: "End session",
  ended: "Session ended.",
  states: {
    idle: "Ready",
    starting: "Starting\u2026",
    connecting: "Connecting\u2026",
    live: "Live",
    muted: "Muted",
    ended: "Ended",
    error: "Error",
  },
  errors: {
    microphoneUnsupported: "This browser does not support microphone access.",
    playbackBlocked: "Browser audio playback is blocked. Interact with the page and retry.",
    disconnected: "The voice room disconnected unexpectedly.",
  },
};

export type BrowserVoiceClientProps = {
  createSession: () => Promise<BrowserVoiceSessionInfo>;
  onCallStarted?: (callId: string) => void;
  onCallEnded?: () => void;
  disabled?: boolean;
  labels?: BrowserVoiceLabels;
};

function resolveErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

function stateColor(state: BrowserVoiceState): string {
  switch (state) {
    case "live":
      return "border-[var(--color-success-500)] bg-[var(--color-success-50)] text-[var(--color-success-700)]";
    case "muted":
    case "connecting":
    case "starting":
      return "border-[var(--color-warning-500)] bg-[var(--color-warning-50)] text-[var(--color-neutral-700)]";
    case "error":
      return "border-[var(--color-error-500)] bg-[var(--color-error-50)] text-[var(--color-error-700)]";
    default:
      return "border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-neutral-700)]";
  }
}

export function BrowserVoiceClient({ createSession, onCallStarted, onCallEnded, disabled, labels: labelsProp }: BrowserVoiceClientProps) {
  const labels = labelsProp ?? DEFAULT_LABELS;
  const [state, setState] = useState<BrowserVoiceState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [roomName, setRoomName] = useState<string | null>(null);
  const [microphoneMuted, setMicrophoneMuted] = useState(false);

  const roomRef = useRef<BrowserVoiceRoom | null>(null);
  const audioHostRef = useRef<HTMLDivElement | null>(null);
  const disconnectingRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      roomRef.current?.disconnect();
      roomRef.current = null;
    };
  }, []);

  async function startSession() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(labels.errors.microphoneUnsupported);
      setState("error");
      return;
    }

    unsubscribeRef.current?.();
    roomRef.current?.disconnect();
    roomRef.current = null;
    disconnectingRef.current = false;
    setError(null);
    setRoomName(null);
    setMicrophoneMuted(false);
    setState("starting");

    try {
      const session = await createSession();
      const room = createBrowserVoiceRoom();
      unsubscribeRef.current = room.subscribe({
        onStateChange: (nextState) => {
          if (nextState === "connected") {
            setState((current) => (current === "muted" ? current : "live"));
          } else if (nextState === "reconnecting") {
            setState("connecting");
          } else if (!disconnectingRef.current) {
            setState("ended");
          }
        },
        onDisconnected: (reason) => {
          if (disconnectingRef.current) {
            setState("ended");
            setError(null);
          } else {
            setError(reason || labels.errors.disconnected);
            setState("error");
          }
          onCallEnded?.();
        },
        onPlaybackBlocked: () => {
          setError(labels.errors.playbackBlocked);
        },
        onError: (message) => {
          setError(message);
          setState("error");
        },
      });
      roomRef.current = room;
      setRoomName(session.room_name);
      setState("connecting");
      await room.connect(session.connect_url, session.token, audioHostRef.current);
      await room.startAudio();
      await room.setMicrophoneEnabled(true);
      setState("live");
      onCallStarted?.(session.call_id);
    } catch (nextError) {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      roomRef.current?.disconnect();
      roomRef.current = null;
      setError(resolveErrorMessage(nextError));
      setState("error");
    }
  }

  async function toggleMicrophone() {
    if (!roomRef.current) {
      return;
    }
    setError(null);
    try {
      const nextMuted = !microphoneMuted;
      await roomRef.current.setMicrophoneEnabled(!nextMuted);
      setMicrophoneMuted(nextMuted);
      setState(nextMuted ? "muted" : "live");
    } catch (nextError) {
      setError(resolveErrorMessage(nextError));
      setState("error");
    }
  }

  function endSession() {
    disconnectingRef.current = true;
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    roomRef.current?.disconnect();
    roomRef.current = null;
    setMicrophoneMuted(false);
    setState("ended");
    onCallEnded?.();
  }

  const isActive = state === "starting" || state === "connecting" || state === "live" || state === "muted";

  return (
    <div className="space-y-3" data-testid="browser-voice-client">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-6 items-center rounded-full border px-2.5 text-xs font-medium ${stateColor(state)}`}
          data-testid="browser-voice-state"
        >
          {labels.states[state]}
        </span>
        {roomName ? (
          <span className="text-xs text-[var(--color-neutral-500)]" data-testid="browser-voice-room">
            Room: {roomName}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          onClick={() => void startSession()}
          disabled={disabled || isActive}
          data-testid="browser-voice-start"
          className="justify-center"
        >
          {state === "starting" || state === "connecting" ? labels.starting : labels.start}
        </Button>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            type="button"
            variant="secondary"
            disabled={state !== "live" && state !== "muted"}
            onClick={() => void toggleMicrophone()}
            data-testid="browser-voice-mute"
          >
            {microphoneMuted ? labels.unmute : labels.mute}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!isActive || state === "starting" || state === "connecting"}
            onClick={endSession}
            data-testid="browser-voice-end"
          >
            {labels.end}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-[var(--color-error-700)]" data-testid="browser-voice-error">
          {error}
        </p>
      ) : state === "ended" ? (
        <p className="text-sm text-[var(--color-neutral-500)]" data-testid="browser-voice-ended">
          {labels.ended}
        </p>
      ) : null}

      <div ref={audioHostRef} className="sr-only" aria-hidden="true" />
    </div>
  );
}
