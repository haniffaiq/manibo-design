"use client";

import { type HTMLAttributes, useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type VisualizerBarSize = "sm" | "md" | "lg";

export interface AgentAudioVisualizerBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of bars to display. */
  barCount?: number;
  /** Size preset controlling bar width, gap, and container height. */
  size?: VisualizerBarSize;
  /** MediaStream to analyze. When null, bars idle at minimum height. */
  mediaStream?: MediaStream | null;
}

/* ------------------------------------------------------------------ */
/*  Size presets                                                       */
/* ------------------------------------------------------------------ */

const containerClass: Record<VisualizerBarSize, string> = {
  sm: "h-6 gap-0.5",
  md: "h-10 gap-1",
  lg: "h-16 gap-1.5",
};

const barClass: Record<VisualizerBarSize, string> = {
  sm: "w-1 min-h-1",
  md: "w-1.5 min-h-1.5",
  lg: "w-2 min-h-2",
};

/* ------------------------------------------------------------------ */
/*  Hook: audio analyser → volume bands                                */
/* ------------------------------------------------------------------ */

function useAudioVolumeBands(mediaStream: MediaStream | null | undefined, bands: number): number[] {
  const [volumes, setVolumes] = useState<number[]>(() => new Array(bands).fill(0));
  const contextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!mediaStream || mediaStream.getAudioTracks().length === 0) {
      setVolumes(new Array(bands).fill(0));
      return;
    }

    const ctx = new AudioContext();
    contextRef.current = ctx;
    // Browser autoplay policy may suspend the context — resume to ensure analyser receives data
    void ctx.resume();
    const source = ctx.createMediaStreamSource(mediaStream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const bandSize = Math.max(1, Math.floor(analyser.frequencyBinCount / bands));

    function tick(): void {
      analyser.getByteFrequencyData(dataArray);
      const next: number[] = [];
      for (let i = 0; i < bands; i++) {
        let sum = 0;
        const start = i * bandSize;
        for (let j = start; j < start + bandSize && j < dataArray.length; j++) {
          sum += dataArray[j] ?? 0;
        }
        next.push(sum / bandSize / 255);
      }
      setVolumes(next);
      animFrameRef.current = requestAnimationFrame(tick);
    }

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      source.disconnect();
      void ctx.close();
      contextRef.current = null;
    };
  }, [mediaStream, bands]);

  return volumes;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function AgentAudioVisualizerBar({
  barCount = 5,
  size = "md",
  mediaStream = null,
  className,
  ...props
}: AgentAudioVisualizerBarProps) {
  const volumes = useAudioVolumeBands(mediaStream, barCount);

  return (
    <div
      data-testid="agent-audio-visualizer-bar"
      className={cn("relative flex items-center justify-center", containerClass[size], className)}
      {...props}
    >
      {volumes.map((vol, idx) => (
        <div
          key={idx}
          className={cn(
            "rounded-full bg-[var(--color-primary-500)] transition-all duration-100 ease-linear",
            barClass[size],
          )}
          style={{ height: `${Math.max(15, vol * 100)}%` }}
        />
      ))}
    </div>
  );
}
