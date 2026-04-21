"use client";

import { ConnectionState, Room, RoomEvent, Track } from "livekit-client";

export type BrowserVoiceRoomState = "connected" | "disconnected" | "reconnecting";

export type BrowserVoiceRoomEvents = {
  onStateChange?: (state: BrowserVoiceRoomState) => void;
  onDisconnected?: (reason?: string) => void;
  onPlaybackBlocked?: () => void;
  onError?: (message: string) => void;
};

export interface BrowserVoiceRoom {
  readonly name: string | null;
  readonly canPlaybackAudio: boolean;
  connect(url: string, token: string, audioHost: HTMLElement | null): Promise<void>;
  startAudio(): Promise<void>;
  setMicrophoneEnabled(enabled: boolean): Promise<void>;
  disconnect(): void;
  subscribe(events: BrowserVoiceRoomEvents): () => void;
}

declare global {
  interface Window {
    __GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__?: () => BrowserVoiceRoom;
  }
}

class LiveKitBrowserVoiceRoom implements BrowserVoiceRoom {
  private readonly room = new Room({
    adaptiveStream: true,
    dynacast: false,
  });

  private readonly listeners = new Set<BrowserVoiceRoomEvents>();
  private readonly audioElementsByTrack = new Map<Track, HTMLMediaElement>();
  private audioHost: HTMLElement | null = null;

  constructor() {
    this.room
      .on(RoomEvent.ConnectionStateChanged, (state) => {
        if (state === ConnectionState.Connected) {
          this.emitState("connected");
        } else if (state === ConnectionState.Reconnecting) {
          this.emitState("reconnecting");
        } else if (state === ConnectionState.Disconnected) {
          this.emitState("disconnected");
        }
      })
      .on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind !== Track.Kind.Audio) {
          return;
        }
        this.detachAudioTrack(track);
        const element = track.attach();
        element.autoplay = true;
        element.className = "sr-only";
        this.audioElementsByTrack.set(track, element);
        this.audioHost?.append(element);
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        this.detachAudioTrack(track);
      })
      .on(RoomEvent.AudioPlaybackStatusChanged, () => {
        if (!this.room.canPlaybackAudio) {
          for (const listener of this.listeners) {
            listener.onPlaybackBlocked?.();
          }
        }
      })
      .on(RoomEvent.MediaDevicesError, (error) => {
        const message = error instanceof Error ? error.message : "Microphone access failed.";
        for (const listener of this.listeners) {
          listener.onError?.(message);
        }
      })
      .on(RoomEvent.Disconnected, (reason) => {
        this.clearAudioTracks();
        const detail = typeof reason === "string" ? reason : undefined;
        for (const listener of this.listeners) {
          listener.onDisconnected?.(detail);
        }
      });
  }

  get name(): string | null {
    return this.room.name || null;
  }

  get canPlaybackAudio(): boolean {
    return this.room.canPlaybackAudio;
  }

  async connect(url: string, token: string, audioHost: HTMLElement | null): Promise<void> {
    this.audioHost = audioHost;
    await this.room.connect(url, token);
  }

  async startAudio(): Promise<void> {
    await this.room.startAudio();
  }

  async setMicrophoneEnabled(enabled: boolean): Promise<void> {
    await this.room.localParticipant.setMicrophoneEnabled(enabled);
  }

  disconnect(): void {
    this.clearAudioTracks();
    this.room.disconnect();
  }

  subscribe(events: BrowserVoiceRoomEvents): () => void {
    this.listeners.add(events);
    return () => {
      this.listeners.delete(events);
    };
  }

  private emitState(state: BrowserVoiceRoomState): void {
    for (const listener of this.listeners) {
      listener.onStateChange?.(state);
    }
  }

  private detachAudioTrack(track: Track): void {
    const element = this.audioElementsByTrack.get(track);
    if (!element) {
      return;
    }
    track.detach(element);
    element.remove();
    this.audioElementsByTrack.delete(track);
  }

  private clearAudioTracks(): void {
    for (const [track, element] of this.audioElementsByTrack.entries()) {
      track.detach(element);
      element.remove();
    }
    this.audioElementsByTrack.clear();
    this.audioHost?.replaceChildren();
  }
}

export function createBrowserVoiceRoom(): BrowserVoiceRoom {
  if (typeof window !== "undefined" && typeof window.__GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__ === "function") {
    return window.__GROVE_TEST_CREATE_BROWSER_VOICE_ROOM__();
  }
  return new LiveKitBrowserVoiceRoom();
}
