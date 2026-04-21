"use client";

import { useState } from "react";

import { EventLog } from "../live-test/event-log";
import { LiveTranscript } from "../live-test/live-transcript";
import { RecordingPlayback } from "../live-test/recording-playback";
import { useMockTestStream } from "../live-test/use-mock-test-stream";
import { VoiceControls } from "../live-test/voice-controls";

export interface TestTabProps {
  providerLabel: string;
  voiceLabel: string;
}

/**
 * Full-page test tab. Layout:
 *   [ controls bar                               ]
 *   [ transcript (flex)  |  event log (320px)     ]
 *   [ recording playback bar                      ]
 */
export function TestTab({ providerLabel, voiceLabel }: TestTabProps) {
  const stream = useMockTestStream();
  const [micMuted, setMicMuted] = useState(false);

  const showRecording = stream.ended || stream.transcript.length > 0;

  return (
    <div className="flex h-full flex-col">
      <VoiceControls
        active={stream.active}
        ended={stream.ended}
        elapsedMs={stream.elapsedMs}
        providerLabel={providerLabel}
        voiceLabel={voiceLabel}
        micMuted={micMuted}
        onToggleMic={() => setMicMuted((v) => !v)}
        onStart={() => {
          stream.reset();
          stream.start();
        }}
        onStop={stream.stop}
        onClose={() => {
          stream.reset();
        }}
      />

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_320px] gap-3 px-4 py-3">
        <LiveTranscript turns={stream.transcript} active={stream.active} />
        <EventLog entries={stream.logs} active={stream.active} />
      </div>

      {showRecording ? <RecordingPlayback /> : null}
    </div>
  );
}
