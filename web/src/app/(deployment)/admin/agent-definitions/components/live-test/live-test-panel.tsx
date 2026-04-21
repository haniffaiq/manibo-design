"use client";

import { useState } from "react";

import { EventLog } from "./event-log";
import { LiveTranscript } from "./live-transcript";
import { RecordingPlayback } from "./recording-playback";
import { useMockTestStream } from "./use-mock-test-stream";
import { VoiceControls } from "./voice-controls";
import { WaveformPair } from "./waveform-pair";

export interface LiveTestPanelProps {
  open: boolean;
  onClose: () => void;
  providerLabel: string;
  voiceLabel: string;
}

/**
 * Slide-down live test panel. Sticky under the detail header.
 * Layout (desktop):
 *   [ controls bar                                                   ]
 *   [ waveforms 25% | transcript flex | event log 30%                ]
 *   [ recording playback (when ended or after first call)            ]
 */
export function LiveTestPanel({ open, onClose, providerLabel, voiceLabel }: LiveTestPanelProps) {
  const stream = useMockTestStream();
  const [micMuted, setMicMuted] = useState(false);

  if (!open) return null;

  const showRecording = stream.ended || stream.transcript.length > 0;

  return (
    <section
      aria-label="Live test panel"
      className="sticky top-0 z-20 border-b border-[var(--color-border)] bg-[var(--color-neutral-50)] shadow-sm"
    >
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
          onClose();
        }}
      />

      <div className="grid h-[260px] grid-cols-[260px_1fr_300px] gap-3 px-4 py-3">
        <div className="flex flex-col justify-center rounded-md border border-[var(--color-border)] bg-white px-3 py-2">
          <WaveformPair micLevel={stream.micLevel} agentLevel={stream.agentLevel} active={stream.active} />
        </div>
        <LiveTranscript turns={stream.transcript} active={stream.active} />
        <EventLog entries={stream.logs} active={stream.active} />
      </div>

      {showRecording ? <RecordingPlayback /> : null}
    </section>
  );
}
