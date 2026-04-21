"use client";

import { useEffect, useRef } from "react";

import type { LiveCallTurnLatency } from "@/lib/api/call-observability";
import type { MergedConversationTurn } from "@/components/observability/domain-logic";
import { ToolCallDetail } from "@/components/observe/tool-call-detail";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ChatConversationProps {
  turns: MergedConversationTurn[];
  maxEotMs: number;
  expandedTurnIndex: number | null;
  onToggleExpand: (index: number) => void;
  isLive: boolean;
}

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
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return ts;
  }
}

const SEGMENT_COLORS = {
  stt: "bg-blue-500",
  llm: "bg-purple-500",
  tts: "bg-amber-500",
  speak: "bg-green-500",
} as const;

function speakSegmentMs(turn: LiveCallTurnLatency): number | null {
  const eot = turn.eot_to_agent_speak_ms;
  if (eot == null) return null;
  const stt = turn.stt_finalize_delay_ms ?? 0;
  const llm = turn.llm_ttft_ms ?? 0;
  const tts = turn.tts_ttfb_ms ?? 0;
  return Math.max(0, eot - stt - llm - tts);
}

function hasLatencyData(turn: LiveCallTurnLatency): boolean {
  return (
    turn.stt_finalize_delay_ms != null ||
    turn.llm_ttft_ms != null ||
    turn.tts_ttfb_ms != null ||
    turn.eot_to_agent_speak_ms != null
  );
}

/* ------------------------------------------------------------------ */
/*  Inline timing bar                                                  */
/* ------------------------------------------------------------------ */

function CompactTimingBar({
  turn,
  maxEotMs,
  isUser,
}: {
  turn: LiveCallTurnLatency;
  maxEotMs: number;
  isUser: boolean;
}) {
  if (!hasLatencyData(turn) || maxEotMs <= 0) return null;

  const stt = turn.stt_finalize_delay_ms ?? 0;
  const llm = turn.llm_ttft_ms ?? 0;
  const tts = turn.tts_ttfb_ms ?? 0;
  const speak = speakSegmentMs(turn) ?? 0;

  // T02: user turns show only STT
  const segments = isUser
    ? [{ key: "stt" as const, ms: stt, color: SEGMENT_COLORS.stt }]
    : [
        { key: "stt" as const, ms: stt, color: SEGMENT_COLORS.stt },
        { key: "llm" as const, ms: llm, color: SEGMENT_COLORS.llm },
        { key: "tts" as const, ms: tts, color: SEGMENT_COLORS.tts },
        { key: "speak" as const, ms: speak, color: SEGMENT_COLORS.speak },
      ];

  const total = segments.reduce((sum, s) => sum + s.ms, 0);
  if (total <= 0) return null;

  return (
    <div className="mt-1 flex h-2.5 items-center gap-px overflow-hidden rounded">
      {segments.filter((s) => s.ms > 0).map((seg) => (
        <div
          key={seg.key}
          className={`${seg.color} h-full rounded-sm`}
          style={{ width: `${Math.max((seg.ms / maxEotMs) * 100, 1.5)}%` }}
          title={`${seg.key.toUpperCase()}: ${formatMs(seg.ms)}`}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Expanded pipeline breakdown                                        */
/* ------------------------------------------------------------------ */

const PIPELINE_LABELS = ["STT finalize", "LLM first token", "LLM generation", "TTS first byte", "Pre-speech gap"] as const;
const PIPELINE_COLORS = ["bg-blue-500", "bg-purple-500", "bg-violet-400", "bg-amber-500", "bg-green-500"] as const;

function PipelineBreakdown({ turn, isUser }: { turn: LiveCallTurnLatency; isUser: boolean }) {
  // Compute LLM generation time: (total felt latency) minus known segments
  const eot = turn.eot_to_agent_speak_ms ?? 0;
  const stt = turn.stt_finalize_delay_ms ?? 0;
  const ttft = turn.llm_ttft_ms ?? 0;
  const ttsFirstByte = turn.tts_ttfb_ms ?? 0;
  const preSpeech = turn.tts_pre_speech_gap_ms ?? 0;
  const llmGeneration = Math.max(0, eot - stt - ttft - ttsFirstByte - preSpeech);

  const values = isUser
    ? [turn.stt_finalize_delay_ms]
    : [turn.stt_finalize_delay_ms, turn.llm_ttft_ms, llmGeneration > 0 ? llmGeneration : null, turn.tts_ttfb_ms, turn.tts_pre_speech_gap_ms];
  const labels = isUser ? [PIPELINE_LABELS[0]] : PIPELINE_LABELS;
  const colors = isUser ? [PIPELINE_COLORS[0]] : PIPELINE_COLORS;
  const maxVal = Math.max(...values.map((v) => v ?? 0), 1);

  return (
    <div className="mt-2 space-y-1">
      {labels.map((label, i) => {
        const val = values[i] ?? null;
        const pct = val != null ? (val / maxVal) * 100 : 0;
        return (
          <div key={label} className="flex items-center gap-2 text-[10px]">
            <span className="w-24 shrink-0 text-[var(--color-neutral-500)]">{label}</span>
            <div className="h-2 flex-1 overflow-hidden rounded bg-[var(--color-neutral-100)]">
              {pct > 0 ? <div className={`${colors[i]} h-full rounded`} style={{ width: `${pct}%` }} /> : null}
            </div>
            <span className="w-12 shrink-0 text-right font-medium text-[var(--color-neutral-600)]">
              {formatMs(val)}
            </span>
          </div>
        );
      })}
      {!isUser && turn.eot_to_agent_speak_ms != null ? (
        <div className="border-t border-[var(--color-neutral-200)] pt-1">
          <div className="flex items-center justify-between text-[10px] font-semibold">
            <span className="text-[var(--color-neutral-600)]">Felt latency</span>
            <span className="text-[var(--color-neutral-800)]">{formatMs(turn.eot_to_agent_speak_ms)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat bubble                                                        */
/* ------------------------------------------------------------------ */

function ChatBubble({
  merged,
  maxEotMs,
  expanded,
  onToggle,
  isLive,
}: {
  merged: MergedConversationTurn;
  maxEotMs: number;
  expanded: boolean;
  onToggle: () => void;
  isLive: boolean;
}) {
  const { turn, transcript, role } = merged;
  const isUser = role === "user";
  const eot = turn.eot_to_agent_speak_ms;
  const severity = !isUser && eot != null
    ? (eot < 3000 ? "ok" : eot < 8000 ? "slow" : "critical")
    : null;
  const isInterrupted = turn.user_interrupted_agent;
  const hasLatency = hasLatencyData(turn);

  return (
    <div
      data-testid={`chat-bubble-${turn.turn_index}-${role}`}
      className={`flex ${isUser ? "justify-start" : "justify-end"}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`max-w-[85%] rounded-2xl border px-4 py-2.5 text-left transition ${
          isUser
            ? `rounded-bl-md border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] ${isInterrupted ? "border-red-200 bg-red-50/40" : ""}`
            : `rounded-br-md border-[var(--color-border)] bg-white ${isInterrupted ? "border-red-200" : ""}`
        }`}
      >
        {/* Speaker + time + latency */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-[var(--color-neutral-500)]">
            {transcript ? `${transcript.speaker} \u00b7 ${formatTimestamp(transcript.timestamp)}` : `Turn ${turn.turn_index}`}
          </span>
          <div className="flex items-center gap-1.5">
            {isInterrupted ? <span className="text-red-500 text-[10px]" title="User interrupted agent">&#x26A1;</span> : null}
            {severity != null && eot != null ? (
              <span className={`rounded px-1 py-0.5 text-[10px] font-semibold ${
                severity === "ok" ? "text-green-700" :
                severity === "slow" ? "bg-amber-50 text-amber-700" :
                "bg-red-50 text-red-700"
              }`} title="Felt latency (user stops talking → agent starts speaking)">
                {severity === "critical" ? "\u{1F6A8} " : severity === "slow" ? "\u26A0 " : ""}{formatMs(eot)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Transcript text */}
        {transcript ? (
          <p className="mt-1 text-sm text-[var(--color-neutral-900)]">
            {transcript.text}
          </p>
        ) : null}

        {/* Tool calls — expandable detail on agent bubbles */}
        {!isUser && turn.tool_executions.length > 0 ? (
          <div className="mt-1.5">
            <ToolCallDetail tools={turn.tool_executions} />
          </div>
        ) : null}

        {/* Interruption (compact) — shown on user bubble since user interrupted */}
        {isUser && isInterrupted && turn.speech_overlap_duration_ms != null ? (
          <p className="mt-1 text-[10px] text-red-500">{formatMs(turn.speech_overlap_duration_ms)} overlap</p>
        ) : null}

        {/* Expanded breakdown — only meaningful on agent bubbles */}
        {!isUser && expanded && hasLatency ? (
          <div className="mt-2 border-t border-[var(--color-neutral-200)] pt-2">
            <PipelineBreakdown turn={turn} isUser={false} />
          </div>
        ) : null}

        {/* Live pulse — only on agent bubbles waiting for response */}
        {!isUser && isLive && hasLatency && turn.eot_to_agent_speak_ms == null ? (
          <div className="mt-1 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
            <span className="text-[9px] text-green-600">processing</span>
          </div>
        ) : null}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ChatConversation({
  turns,
  maxEotMs,
  expandedTurnIndex,
  onToggleExpand,
  isLive,
}: ChatConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom during live calls
  useEffect(() => {
    if (isLive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isLive, turns.length]);

  if (turns.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-[var(--color-neutral-400)]">
        {isLive ? "Waiting for conversation\u2026" : "No conversation turns captured."}
      </div>
    );
  }

  return (
    <div data-testid="chat-conversation" className="flex min-h-0 flex-1 flex-col">
      {/* Legend — pinned */}
      <div className="shrink-0 pb-2">
        <div className="flex items-center gap-3 text-[10px] text-[var(--color-neutral-500)]">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-blue-500" />STT</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-purple-500" />AI</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-amber-500" />TTS</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-green-500" />Speak</span>
        </div>
      </div>

      {/* Chat bubbles — scrollable */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto">
        {turns.map((merged, idx) => (
          <ChatBubble
            key={`${merged.turn.turn_index}-${merged.role}`}
            merged={merged}
            maxEotMs={maxEotMs}
            expanded={expandedTurnIndex === idx}
            onToggle={() => onToggleExpand(idx)}
            isLive={isLive}
          />
        ))}
      </div>
    </div>
  );
}
