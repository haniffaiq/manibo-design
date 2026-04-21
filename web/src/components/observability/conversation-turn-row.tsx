"use client";

import type { LiveCallTurnLatency, LiveCallToolExecution } from "@/lib/api/call-observability";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface TurnTranscript {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface ConversationTurnRowProps {
  turn: LiveCallTurnLatency;
  transcript: TurnTranscript | null;
  maxEotMs: number;
  expanded: boolean;
  onToggleExpand: () => void;
  isLive?: boolean;
  slowThresholdMs?: number;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DEFAULT_SLOW_THRESHOLD_MS = 500;

const SEGMENT_COLORS = {
  stt: "bg-blue-500",
  llm: "bg-purple-500",
  tts: "bg-amber-500",
  speak: "bg-green-500",
} as const;

const PIPELINE_LABELS = ["STT finalize", "LLM first token", "TTS first byte", "Pre-speech gap"] as const;

const PIPELINE_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-green-500",
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMs(value: number | null): string {
  if (value == null) return "--";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function formatTimestamp(ts: string): string {
  try {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}

/** Compute the "speak" segment: total felt latency minus the three pipeline segments. */
function speakSegmentMs(turn: LiveCallTurnLatency): number | null {
  const eot = turn.eot_to_agent_speak_ms;
  if (eot == null) return null;
  const stt = turn.stt_finalize_delay_ms ?? 0;
  const llm = turn.llm_ttft_ms ?? 0;
  const tts = turn.tts_ttfb_ms ?? 0;
  const remaining = eot - stt - llm - tts;
  return Math.max(0, remaining);
}

/** Whether the turn has any latency data at all. */
function hasLatencyData(turn: LiveCallTurnLatency): boolean {
  return (
    turn.stt_finalize_delay_ms != null ||
    turn.llm_ttft_ms != null ||
    turn.tts_ttfb_ms != null ||
    turn.eot_to_agent_speak_ms != null
  );
}

/** Whether the turn is partial (live, only some segments filled). */
function isPartialTurn(turn: LiveCallTurnLatency): boolean {
  if (!hasLatencyData(turn)) return false;
  // Partial: has STT but missing downstream
  return turn.stt_finalize_delay_ms != null && turn.eot_to_agent_speak_ms == null;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ToolExecutionItem({ tool }: { tool: LiveCallToolExecution }) {
  const failed = tool.status !== "success" && tool.status !== "ok";
  return (
    <div
      data-testid={`tool-execution-${tool.tool_name}`}
      className="ml-4 flex items-center gap-2 text-xs text-[var(--color-neutral-600)]"
    >
      <span className="text-[var(--color-neutral-400)]">&#x1F527;</span>
      <span className="font-medium">{tool.tool_name}</span>
      {tool.duration_ms != null ? <span>{formatMs(tool.duration_ms)}</span> : null}
      {failed ? (
        <>
          <span className="font-medium text-red-500" data-testid={`tool-failed-${tool.tool_name}`}>&#x2717;</span>
          {tool.error_detail ? (
            <span className="text-red-500">&quot;{tool.error_detail}&quot;</span>
          ) : null}
        </>
      ) : (
        <span className="text-green-600">&#x2713;</span>
      )}
    </div>
  );
}

function InlineLatencyBar({
  turn,
  maxEotMs,
  isLive,
}: {
  turn: LiveCallTurnLatency;
  maxEotMs: number;
  isLive: boolean;
}) {
  if (!hasLatencyData(turn)) return null;
  if (maxEotMs <= 0) return null;

  const stt = turn.stt_finalize_delay_ms ?? 0;
  const llm = turn.llm_ttft_ms ?? 0;
  const tts = turn.tts_ttfb_ms ?? 0;
  const speak = speakSegmentMs(turn) ?? 0;

  const partial = isPartialTurn(turn);

  // Proportional widths relative to maxEotMs
  const sttPct = (stt / maxEotMs) * 100;
  const llmPct = (llm / maxEotMs) * 100;
  const ttsPct = (tts / maxEotMs) * 100;
  const speakPct = (speak / maxEotMs) * 100;

  const segments = [
    { key: "stt", pct: sttPct, color: SEGMENT_COLORS.stt, label: "STT" },
    { key: "llm", pct: llmPct, color: SEGMENT_COLORS.llm, label: "LLM" },
    { key: "tts", pct: ttsPct, color: SEGMENT_COLORS.tts, label: "TTS" },
    { key: "speak", pct: speakPct, color: SEGMENT_COLORS.speak, label: "spk" },
  ];

  // For partial turns, only show segments that have data
  const visibleSegments = partial
    ? segments.filter((s) => {
        if (s.key === "stt") return turn.stt_finalize_delay_ms != null;
        if (s.key === "llm") return turn.llm_ttft_ms != null;
        if (s.key === "tts") return turn.tts_ttfb_ms != null;
        return turn.eot_to_agent_speak_ms != null;
      })
    : segments.filter((s) => s.pct > 0);

  return (
    <div data-testid="latency-bar" className="mt-1.5 flex h-4 items-center gap-px overflow-hidden rounded">
      {visibleSegments.map((seg) => (
        <div
          key={seg.key}
          data-testid={`latency-segment-${seg.key}`}
          className={`${seg.color} flex h-full items-center justify-center overflow-hidden rounded-sm text-[9px] font-medium text-white`}
          style={{ width: `${Math.max(seg.pct, 1.5)}%` }}
          title={`${seg.label}: ${seg.key === "speak" ? formatMs(speakSegmentMs(turn)) : formatMs(turn[`${seg.key === "speak" ? "eot_to_agent_speak_ms" : seg.key === "stt" ? "stt_finalize_delay_ms" : seg.key === "llm" ? "llm_ttft_ms" : "tts_ttfb_ms"}` as keyof LiveCallTurnLatency] as number | null)}`}
        >
          {seg.pct > 8 ? seg.label : ""}
        </div>
      ))}
      {partial && isLive ? (
        <div
          data-testid="latency-bar-pulse"
          className="h-full w-1.5 animate-pulse rounded-sm bg-[var(--color-neutral-400)]"
        />
      ) : null}
    </div>
  );
}

function PipelineBreakdown({ turn }: { turn: LiveCallTurnLatency }) {
  const values = [
    turn.stt_finalize_delay_ms,
    turn.llm_ttft_ms,
    turn.tts_ttfb_ms,
    turn.tts_pre_speech_gap_ms,
  ];
  const maxVal = Math.max(...values.map((v) => v ?? 0), 1);

  return (
    <div data-testid="pipeline-breakdown" className="mt-3 space-y-1.5">
      <div className="flex items-center justify-between text-xs font-medium text-[var(--color-neutral-700)]">
        <span>Pipeline</span>
        <span>ms</span>
      </div>
      {PIPELINE_LABELS.map((label, i) => {
        const val = values[i];
        const pct = val != null ? (val / maxVal) * 100 : 0;
        return (
          <div key={label} className="flex items-center gap-2 text-xs">
            <span className="w-28 shrink-0 text-[var(--color-neutral-600)]">{label}</span>
            <div className="h-3 flex-1 overflow-hidden rounded bg-[var(--color-neutral-100)]">
              {pct > 0 ? (
                <div
                  className={`${PIPELINE_COLORS[i]} h-full rounded`}
                  style={{ width: `${pct}%` }}
                />
              ) : null}
            </div>
            <span className="w-14 shrink-0 text-right font-medium text-[var(--color-neutral-700)]">
              {formatMs(val)}
            </span>
          </div>
        );
      })}
      <div className="mt-1 border-t border-[var(--color-neutral-200)] pt-1">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-[var(--color-neutral-700)]">Felt latency (eot → agent speak)</span>
          <span className="text-[var(--color-neutral-900)]">{formatMs(turn.eot_to_agent_speak_ms)}</span>
        </div>
      </div>
    </div>
  );
}

function TimingMilestones({ turn }: { turn: LiveCallTurnLatency }) {
  const rows: Array<{ label: string; value: string }> = [];

  if (turn.user_speech_started_at_ms != null && turn.user_speech_ended_at_ms != null) {
    rows.push({
      label: "User spoke",
      value: `${formatMs(turn.user_speech_started_at_ms)} → ${formatMs(turn.user_speech_ended_at_ms)}`,
    });
  }
  if (turn.user_final_transcript_at_ms != null) {
    rows.push({ label: "STT finalized", value: formatMs(turn.user_final_transcript_at_ms) });
  }
  if (turn.llm_start_at_ms != null) {
    rows.push({ label: "LLM started", value: formatMs(turn.llm_start_at_ms) });
  }
  if (turn.llm_ttft_at_ms != null) {
    rows.push({ label: "LLM first token", value: formatMs(turn.llm_ttft_at_ms) });
  }
  if (turn.tts_ttfb_ms != null) {
    rows.push({ label: "TTS first byte", value: formatMs(turn.tts_ttfb_ms) });
  }
  if (turn.agent_speaking_started_at_ms != null && turn.agent_speaking_ended_at_ms != null) {
    rows.push({
      label: "Agent spoke",
      value: `${formatMs(turn.agent_speaking_started_at_ms)} → ${formatMs(turn.agent_speaking_ended_at_ms)}`,
    });
  }

  if (rows.length === 0) return null;

  return (
    <div data-testid="timing-milestones" className="mt-3">
      <p className="text-xs font-medium text-[var(--color-neutral-700)]">Timeline</p>
      <div className="mt-1 space-y-0.5">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-neutral-600)]">{row.label}</span>
            <span className="font-medium text-[var(--color-neutral-700)]">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InterruptionSection({ turn }: { turn: LiveCallTurnLatency }) {
  if (!turn.user_interrupted_agent) return null;

  return (
    <div data-testid="interruption-section" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
      <p className="text-xs font-medium text-red-700">Interruption</p>
      <div className="mt-1 space-y-0.5 text-xs text-red-600">
        {turn.agent_stop_after_interrupt_ms != null ? (
          <div className="flex justify-between">
            <span>Agent stop delay</span>
            <span className="font-medium">{formatMs(turn.agent_stop_after_interrupt_ms)}</span>
          </div>
        ) : null}
        {turn.speech_overlap_duration_ms != null ? (
          <div className="flex justify-between">
            <span>Speech overlap</span>
            <span className="font-medium">{formatMs(turn.speech_overlap_duration_ms)}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ExpandedToolDetails({ tools }: { tools: LiveCallToolExecution[] }) {
  if (tools.length === 0) return null;

  return (
    <div data-testid="expanded-tool-details" className="mt-3">
      <p className="text-xs font-medium text-[var(--color-neutral-700)]">Tool executions</p>
      <div className="mt-1 space-y-1">
        {tools.map((tool, i) => (
          <ToolExecutionItem key={`${tool.tool_name}-${i}`} tool={tool} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ConversationTurnRow({
  turn,
  transcript,
  maxEotMs,
  expanded,
  onToggleExpand,
  isLive = false,
  slowThresholdMs = DEFAULT_SLOW_THRESHOLD_MS,
}: ConversationTurnRowProps) {
  const isSlow =
    turn.eot_to_agent_speak_ms != null && turn.eot_to_agent_speak_ms > slowThresholdMs;
  const isInterrupted = turn.user_interrupted_agent === true;
  const partial = isPartialTurn(turn);
  const hasLatency = hasLatencyData(turn);

  return (
    <button
      type="button"
      data-testid={`conversation-turn-${turn.turn_index}`}
      onClick={onToggleExpand}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        isInterrupted
          ? "border-red-200 bg-red-50/40"
          : "border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.72)] hover:bg-white"
      }`}
    >
      {/* ---- Header row ---- */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
          <span className="font-semibold text-[var(--color-neutral-950)]">
            Turn {turn.turn_index}
          </span>
          {transcript ? (
            <>
              <span>&middot;</span>
              <span>{formatTimestamp(transcript.timestamp)}</span>
              <span>&middot;</span>
              <span>{transcript.speaker}</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {isSlow ? (
            <span data-testid="slow-warning" className="text-amber-500" title="Slow turn">
              &#x26A0;
            </span>
          ) : null}
          {isInterrupted ? (
            <span data-testid="interrupted-marker" className="text-red-500" title="User interrupted">
              &#x26A1;
            </span>
          ) : null}
          {isLive && partial ? (
            <span
              data-testid="live-indicator"
              className="inline-block h-2 w-2 animate-pulse rounded-full bg-green-500"
              title="In progress"
            />
          ) : null}
          {turn.eot_to_agent_speak_ms != null ? (
            <span
              data-testid="felt-latency"
              className={`text-xs font-medium ${isSlow ? "text-amber-600" : "text-[var(--color-neutral-700)]"}`}
            >
              {formatMs(turn.eot_to_agent_speak_ms)}
            </span>
          ) : null}
        </div>
      </div>

      {/* ---- Transcript ---- */}
      {transcript ? (
        <p data-testid="turn-transcript" className="mt-1.5 text-sm text-[var(--color-neutral-700)]">
          &ldquo;{transcript.text}&rdquo;
        </p>
      ) : null}

      {/* ---- Inline latency bar ---- */}
      {hasLatency ? (
        <InlineLatencyBar turn={turn} maxEotMs={maxEotMs} isLive={isLive && partial} />
      ) : null}

      {/* ---- Interruption overlap (collapsed) ---- */}
      {isInterrupted && turn.speech_overlap_duration_ms != null ? (
        <p data-testid="overlap-duration" className="mt-1 text-xs text-red-500">
          {formatMs(turn.speech_overlap_duration_ms)} overlap
        </p>
      ) : null}

      {/* ---- Tool executions (collapsed) ---- */}
      {turn.tool_executions.length > 0 ? (
        <div className="mt-1.5 space-y-0.5">
          {turn.tool_executions.map((tool, i) => (
            <ToolExecutionItem key={`${tool.tool_name}-${i}`} tool={tool} />
          ))}
        </div>
      ) : null}

      {/* ---- Expanded section ---- */}
      {expanded && hasLatency ? (
        <div className="mt-3 border-t border-[var(--color-neutral-200)] pt-3">
          <PipelineBreakdown turn={turn} />
          <TimingMilestones turn={turn} />
          <InterruptionSection turn={turn} />
          <ExpandedToolDetails tools={turn.tool_executions} />
        </div>
      ) : null}
    </button>
  );
}
