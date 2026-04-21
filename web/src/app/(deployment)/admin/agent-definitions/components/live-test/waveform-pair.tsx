"use client";

import { useEffect, useRef } from "react";

export interface WaveformPairProps {
  micLevel: number;
  agentLevel: number;
  active: boolean;
}

const BAR_COUNT = 32;
const HISTORY_SIZE = 64;

/**
 * Two stacked simulated waveforms (mic + agent). Renders to a small canvas
 * driven by the latest level samples. Pure visual — no audio decoding.
 */
export function WaveformPair({ micLevel, agentLevel, active }: WaveformPairProps) {
  const micCanvas = useRef<HTMLCanvasElement | null>(null);
  const agentCanvas = useRef<HTMLCanvasElement | null>(null);
  const micHistory = useRef<number[]>(new Array(HISTORY_SIZE).fill(0));
  const agentHistory = useRef<number[]>(new Array(HISTORY_SIZE).fill(0));

  // Push the latest sample on each update.
  useEffect(() => {
    micHistory.current = [...micHistory.current.slice(1), micLevel];
    drawCanvas(micCanvas.current, micHistory.current, "#10b981", active);
  }, [micLevel, active]);

  useEffect(() => {
    agentHistory.current = [...agentHistory.current.slice(1), agentLevel];
    drawCanvas(agentCanvas.current, agentHistory.current, "#6366f1", active);
  }, [agentLevel, active]);

  return (
    <div className="flex flex-col gap-3">
      <Block label="Mic" level={micLevel} canvasRef={micCanvas} accent="text-emerald-500" />
      <Block label="Agent" level={agentLevel} canvasRef={agentCanvas} accent="text-indigo-500" />
    </div>
  );
}

function Block({
  label,
  level,
  canvasRef,
  accent,
}: {
  label: string;
  level: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  accent: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className={["text-[10px] font-semibold uppercase tracking-wide", accent].join(" ")}>{label}</span>
        <span className="font-mono text-[10px] text-[var(--color-neutral-500)]">
          {(level * 100).toFixed(0)}%
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={220}
        height={56}
        className="block w-full rounded bg-[var(--color-neutral-900)]"
      />
    </div>
  );
}

function drawCanvas(canvas: HTMLCanvasElement | null, history: number[], color: string, active: boolean) {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width;
  const h = canvas.height;
  // High-DPI canvas alignment: only resize backing buffer when needed.
  if (canvas.width !== Math.round(220 * dpr)) {
    canvas.width = Math.round(220 * dpr);
    canvas.height = Math.round(56 * dpr);
    ctx.scale(dpr, dpr);
  }
  const cssW = 220;
  const cssH = 56;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, cssW, cssH);

  const samples = history.slice(-BAR_COUNT);
  const barWidth = cssW / BAR_COUNT;
  const gap = 1.5;
  for (let i = 0; i < samples.length; i++) {
    const v = active ? samples[i] : 0.02;
    const barH = Math.max(2, v * (cssH - 4));
    const x = i * barWidth + gap / 2;
    const y = (cssH - barH) / 2;
    ctx.fillStyle = color;
    ctx.globalAlpha = active ? 0.85 : 0.3;
    ctx.fillRect(x, y, barWidth - gap, barH);
  }
  ctx.globalAlpha = 1;
}
