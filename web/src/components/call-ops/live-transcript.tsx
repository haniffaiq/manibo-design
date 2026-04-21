"use client";

import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { useVoiceCallTranscriptFeed } from "@/lib/realtime/use-voice-call-transcript-feed";

export interface LiveTranscriptProps {
  callId: string | null;
  onStop: () => void;
}

export function LiveTranscript({ callId, onStop }: LiveTranscriptProps) {
  const { segments, streaming, error } = useVoiceCallTranscriptFeed(callId);

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Live transcript</h2>
        <p className="text-sm text-[var(--color-neutral-500)]">
          Watch the current conversation without opening a separate tooling screen.
        </p>
      </CardHeader>
      <CardContent>
        {error ? (
          <p data-testid="call-ops-transcript-sse-error" className="mb-3 text-sm text-[var(--color-error-700)]">
            Transcript stream interrupted: {error}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-neutral-500)]">
          <span>{callId ? `Call: ${callId}` : "No call selected"}</span>
          {callId ? (
            <Button size="sm" variant="outline" onClick={onStop}>
              Stop
            </Button>
          ) : null}
        </div>
        <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
          {callId ? (
            segments.length === 0 ? (
              <div className="text-sm text-[var(--color-neutral-500)]">
                {streaming ? "Waiting for transcript updates..." : "No transcript updates yet."}
              </div>
            ) : (
              <div className="flex max-h-96 flex-col gap-2 overflow-auto">
                {segments.map((segment) => (
                  <div
                    key={segment.seq}
                    data-testid={`call-ops-segment-${segment.seq}`}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-neutral-500)]">
                      <span className="font-mono">#{segment.seq}</span>
                      <span>{segment.speaker}</span>
                      <span className="font-mono">{segment.timestamp}</span>
                    </div>
                    <p className="mt-2 text-sm text-[var(--color-neutral-950)]">{segment.text}</p>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="text-sm text-[var(--color-neutral-500)]">
              Choose a live call and press <span className="font-medium">Watch transcript</span>.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
