"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Room, RoomEvent, Track, ConnectionState, type RemoteTrackPublication, type RemoteParticipant } from "livekit-client";
import { platformApiRequest } from "@/lib/api/platform";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type LiveKitTokenResponse = {
  room_name: string;
  token: string;
  expires_at: string;
};

export type ObserverConnectionState = "disconnected" | "connecting" | "connected" | "reconnecting";

export interface LiveKitObserverResult {
  connectionState: ObserverConnectionState;
  error: string | null;
  audioHostRef: React.RefObject<HTMLDivElement | null>;
  mediaStream: MediaStream | null;
  micEnabled: boolean;
  setMicEnabled: (enabled: boolean) => void;
  /** Connect to the LiveKit room. No-op if already connected or callId is null. */
  join: () => void;
  /** Disconnect from the LiveKit room. */
  leave: () => void;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useLiveKitObserver(callId: string | null): LiveKitObserverResult {
  const [connectionState, setConnectionState] = useState<ObserverConnectionState>("disconnected");
  const [error, setError] = useState<string | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabledState] = useState(false);
  const roomRef = useRef<Room | null>(null);
  const audioHostRef = useRef<HTMLDivElement | null>(null);
  const callIdRef = useRef(callId);
  callIdRef.current = callId;

  // Disconnect + cleanup when callId changes or component unmounts
  useEffect(() => {
    const currentAudioHost = audioHostRef.current;
    return () => {
      const room = roomRef.current;
      if (room) {
        room.disconnect();
        roomRef.current = null;
      }
      currentAudioHost?.replaceChildren();
      setConnectionState("disconnected");
      setMediaStream(null);
      setMicEnabledState(false);
      setError(null);
    };
  }, [callId]);

  const join = useCallback(() => {
    // Use ref to guard against stale closure if callId changes between click and render
    if (!callIdRef.current || roomRef.current) return;
    const activeCallId = callIdRef.current;

    const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
    if (!livekitUrl) {
      setError("LiveKit URL not configured (NEXT_PUBLIC_LIVEKIT_URL)");
      return;
    }

    const room = new Room({ adaptiveStream: true, dynacast: false });
    roomRef.current = room;

    room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      if (state === ConnectionState.Connected) setConnectionState("connected");
      else if (state === ConnectionState.Reconnecting) setConnectionState("reconnecting");
      else if (state === ConnectionState.Disconnected) setConnectionState("disconnected");
    });

    room.on(
      RoomEvent.TrackSubscribed,
      (track: RemoteTrackPublication["track"], _pub: RemoteTrackPublication, _participant: RemoteParticipant) => {
        if (!track || track.kind !== Track.Kind.Audio) return;
        const el = track.attach();
        el.autoplay = true;
        el.className = "sr-only";
        audioHostRef.current?.replaceChildren(el);
        if (track.mediaStream) setMediaStream(track.mediaStream);
      },
    );

    room.on(RoomEvent.TrackUnsubscribed, (track) => {
      if (track) track.detach();
      audioHostRef.current?.replaceChildren();
      setMediaStream(null);
    });

    room.on(RoomEvent.Disconnected, () => {
      audioHostRef.current?.replaceChildren();
      setMediaStream(null);
      setConnectionState("disconnected");
      setMicEnabledState(false);
      roomRef.current = null;
    });

    async function connect(): Promise<void> {
      setConnectionState("connecting");
      setError(null);
      try {
        // Operator token — can_publish=true so mic unmute is possible
        const response = await platformApiRequest<LiveKitTokenResponse>(
          `/calls/${encodeURIComponent(activeCallId)}/livekit-operator-token`,
          { method: "POST" },
        );
        if (!response) return;
        await room.connect(livekitUrl!, response.token);
        // Start with mic muted
        await room.localParticipant.setMicrophoneEnabled(false);
      } catch (e) {
        setError(toErrorMessage(e));
        setConnectionState("disconnected");
        roomRef.current = null;
      }
    }

    void connect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- callIdRef.current read at call time, not closure

  const leave = useCallback(() => {
    const room = roomRef.current;
    if (!room) return;
    room.disconnect();
    roomRef.current = null;
    audioHostRef.current?.replaceChildren();
    setMediaStream(null);
    setConnectionState("disconnected");
    setMicEnabledState(false);
  }, []);

  const setMicEnabled = useCallback((enabled: boolean) => {
    const room = roomRef.current;
    if (!room) return;
    void room.localParticipant.setMicrophoneEnabled(enabled).then(
      () => setMicEnabledState(enabled),
      (e: unknown) => setError(toErrorMessage(e)),
    );
  }, []);

  return { connectionState, error, audioHostRef, mediaStream, micEnabled, setMicEnabled, join, leave };
}
