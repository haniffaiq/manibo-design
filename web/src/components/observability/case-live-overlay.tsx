"use client";

import type { ObservabilityRunKind } from "@/lib/api/observability";
import type { LiveKitObserverResult } from "./use-livekit-observer";
import { OperatorActionBar } from "./operator-action-bar";
import { LiveAudioPlayer } from "./live-audio-player";

export interface CaseLiveOverlayProps {
  callId: string;
  channelKind: ObservabilityRunKind;
  isVoiceCase: boolean;
  liveKit: LiveKitObserverResult;
}

export function CaseLiveOverlay({ callId, channelKind, isVoiceCase, liveKit }: CaseLiveOverlayProps) {
  const showAudio = isVoiceCase && liveKit.connectionState !== "disconnected";
  return (
    <>
      <div className="px-6 pt-4">
        <OperatorActionBar
          callId={callId}
          channelKind={channelKind}
          liveKitState={liveKit.connectionState}
          onJoinCall={liveKit.join}
          onLeaveCall={liveKit.leave}
        />
      </div>
      {showAudio ? (
        <div className="px-6 pt-2">
          <LiveAudioPlayer
            connectionState={liveKit.connectionState}
            error={liveKit.error}
            audioHostRef={liveKit.audioHostRef}
            mediaStream={liveKit.mediaStream}
            micEnabled={liveKit.micEnabled}
            onMicToggle={liveKit.setMicEnabled}
          />
        </div>
      ) : null}
    </>
  );
}
