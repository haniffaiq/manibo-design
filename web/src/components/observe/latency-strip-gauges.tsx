"use client";

import type { CallLatencyMetricSummary, LiveCallTurnLatency } from "@/lib/api/call-observability";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface LatencyStripGaugesProps {
  summaries: Record<string, CallLatencyMetricSummary>;
  turns: LiveCallTurnLatency[];
  isLive: boolean;
}

/* ------------------------------------------------------------------ */
/*  Metric definitions                                                 */
/* ------------------------------------------------------------------ */

interface GaugeDefinition {
  key: string;
  label: string;
  /** Extract per-turn value for sparkline. */
  extract: (turn: LiveCallTurnLatency) => number | null;
  warnThresholdMs: number;
}

const GAUGES: GaugeDefinition[] = [
  {
    key: "stt_finalize_delay_ms",
    label: "STT",
    extract: (t) => t.stt_finalize_delay_ms,
    warnThresholdMs: 500,
  },
  {
    key: "llm_ttft_ms",
    label: "AI",
    extract: (t) => t.llm_ttft_ms,
    warnThresholdMs: 500,
  },
  {
    key: "tts_ttfb_ms",
    label: "TTS",
    extract: (t) => t.tts_ttfb_ms,
    warnThresholdMs: 300,
  },
  {
    key: "eot_to_agent_speak_ms",
    label: "Turn",
    extract: (t) => t.eot_to_agent_speak_ms,
    warnThresholdMs: 1200,
  },
];

const GAUGE_TOOLTIPS: Record<string, string> = {
  stt_finalize_delay_ms: "Speech-to-text: time for STT to finalize the user\u2019s utterance",
  llm_ttft_ms: "AI thinking: time from prompt sent to first token returned by the model",
  tts_ttfb_ms: "Text-to-speech: time for TTS to produce the first audio byte",
  eot_to_agent_speak_ms: "Felt latency: total time from user stops talking to agent starts speaking",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMs(value: number | null): string {
  if (value == null) return "--";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

/* ------------------------------------------------------------------ */
/*  Sparkline                                                          */
/* ------------------------------------------------------------------ */

function Sparkline({ values, warnThreshold }: { values: (number | null)[]; warnThreshold: number }) {
  const nums = values.filter((v): v is number => v != null);
  if (nums.length < 2) return null;

  const max = Math.max(...nums, warnThreshold);
  const width = 64;
  const height = 16;
  const step = width / (nums.length - 1);

  const points = nums.map((v, i) => `${i * step},${height - (v / max) * height}`).join(" ");

  return (
    <svg
      data-testid="sparkline"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--color-neutral-400)]"
      />
      {/* Threshold line */}
      <line
        x1="0"
        y1={height - (warnThreshold / max) * height}
        x2={width}
        y2={height - (warnThreshold / max) * height}
        stroke="currentColor"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        className="text-amber-400"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function LatencyStripGauges({ summaries, turns, isLive }: LatencyStripGaugesProps) {
  const hasData = Object.keys(summaries).length > 0;

  if (!hasData) {
    return (
      <div
        data-testid="latency-strip-empty"
        className="flex h-14 items-center justify-center text-sm text-[var(--color-neutral-400)]"
      >
        {isLive ? "Waiting for latency data\u2026" : "No latency data captured."}
      </div>
    );
  }

  return (
    <div data-testid="latency-strip-gauges" className="flex items-center gap-4">
      {GAUGES.map((gauge) => {
        const summary = summaries[gauge.key];
        const avg = summary?.average_ms ?? null;
        const isWarn = avg != null && avg > gauge.warnThresholdMs;
        const sparkValues = turns.map(gauge.extract);

        return (
          <div
            key={gauge.key}
            data-testid={`gauge-${gauge.key}`}
            title={GAUGE_TOOLTIPS[gauge.key]}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2"
          >
            <div>
              <p className="text-[10px] font-medium text-[var(--color-neutral-500)]">
                {gauge.label}
                {isWarn ? (
                  <span className="ml-1 text-amber-500" title="Above threshold">&#x26A0;</span>
                ) : null}
              </p>
              <p
                className={`text-base font-semibold ${
                  isWarn ? "text-amber-600" : "text-[var(--color-neutral-900)]"
                }`}
              >
                {formatMs(avg)}
              </p>
            </div>
            <Sparkline values={sparkValues} warnThreshold={gauge.warnThresholdMs} />
          </div>
        );
      })}
    </div>
  );
}
