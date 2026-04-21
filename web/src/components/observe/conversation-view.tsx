"use client";

import { useEffect, useRef } from "react";
import type { MergedConversationTurn } from "@/components/observability/domain-logic";
import type { LiveCallTurnLatency } from "@/lib/api/call-observability";
import { ToolCallDetail } from "./tool-call-detail";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ConversationViewProps {
  /** "chat" = test workbench bubbles. "evidence" = chronological evidence rail. */
  variant: "chat" | "evidence";
  turns: MergedConversationTurn[];
  maxEotMs: number;
  expandedIndex: number | null;
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
/*  Timing bar (shared between variants)                               */
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
/*  Chat variant — bubble layout                                       */
/* ------------------------------------------------------------------ */

function ChatEntry({
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
  const isSlow = !isUser && turn.eot_to_agent_speak_ms != null && turn.eot_to_agent_speak_ms > 500;
  const isInterrupted = turn.user_interrupted_agent;
  const hasLatency = hasLatencyData(turn);

  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <button
        type="button"
        onClick={onToggle}
        className={`max-w-[85%] rounded-2xl border px-4 py-2.5 text-left transition ${
          isUser
            ? `rounded-bl-md border-[var(--color-neutral-200)] bg-[var(--color-neutral-50)] ${isInterrupted ? "border-red-200 bg-red-50/40" : ""}`
            : `rounded-br-md border-[var(--color-border)] bg-white ${isInterrupted ? "border-red-200" : ""}`
        }`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] text-[var(--color-neutral-500)]">
            {transcript ? `${transcript.speaker} \u00b7 ${formatTimestamp(transcript.timestamp)}` : `Turn ${turn.turn_index}`}
          </span>
          <div className="flex items-center gap-1.5">
            {isSlow ? <span className="text-amber-500 text-[10px]" title="Slow">&#x26A0;</span> : null}
            {isInterrupted ? <span className="text-red-500 text-[10px]" title="Interrupted">&#x26A1;</span> : null}
            {!isUser && turn.eot_to_agent_speak_ms != null ? (
              <span className={`text-[10px] font-medium ${isSlow ? "text-amber-600" : "text-[var(--color-neutral-500)]"}`}>
                {formatMs(turn.eot_to_agent_speak_ms)}
              </span>
            ) : null}
          </div>
        </div>

        {transcript ? <p className="mt-1 text-sm text-[var(--color-neutral-900)]">{transcript.text}</p> : null}
        {hasLatency ? <CompactTimingBar turn={turn} maxEotMs={maxEotMs} isUser={isUser} /> : null}
        {!isUser && turn.tool_executions.length > 0 ? (
          <div className="mt-1.5"><ToolCallDetail tools={turn.tool_executions} /></div>
        ) : null}
        {isUser && isInterrupted && turn.speech_overlap_duration_ms != null ? (
          <p className="mt-1 text-[10px] text-red-500">{formatMs(turn.speech_overlap_duration_ms)} overlap</p>
        ) : null}
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
/*  Evidence variant — chronological rows                              */
/* ------------------------------------------------------------------ */

function EvidenceEntry({
  merged,
  maxEotMs,
  expanded,
  onToggle,
}: {
  merged: MergedConversationTurn;
  maxEotMs: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { turn, transcript, role } = merged;
  const isUser = role === "user";
  const isInterrupted = turn.user_interrupted_agent;
  const hasLatency = hasLatencyData(turn);

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full rounded-2xl border p-4 text-left transition ${
        isInterrupted
          ? "border-red-200 bg-red-50/40"
          : "border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.72)] hover:bg-white"
      } ${isUser ? "border-l-[3px] border-l-blue-300" : "border-l-[3px] border-l-purple-300"}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
          <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${isUser ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
            {role}
          </span>
          <span className="font-semibold text-[var(--color-neutral-950)]">Turn {turn.turn_index}</span>
          {transcript ? (
            <>
              <span>&middot;</span>
              <span>{formatTimestamp(transcript.timestamp)}</span>
            </>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {!isUser && turn.eot_to_agent_speak_ms != null ? (
            <span className="text-xs font-medium text-[var(--color-neutral-700)]">{formatMs(turn.eot_to_agent_speak_ms)}</span>
          ) : null}
        </div>
      </div>
      {transcript ? <p className="mt-1.5 text-sm text-[var(--color-neutral-700)]">&ldquo;{transcript.text}&rdquo;</p> : null}
      {hasLatency ? <CompactTimingBar turn={turn} maxEotMs={maxEotMs} isUser={isUser} /> : null}
      {!isUser && turn.tool_executions.length > 0 ? (
        <div className="mt-1.5"><ToolCallDetail tools={turn.tool_executions} /></div>
      ) : null}
      {expanded && hasLatency ? (
        <div className="mt-3 border-t border-[var(--color-neutral-200)] pt-2 text-xs text-[var(--color-neutral-600)]">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <span>STT finalize</span><span className="font-medium">{formatMs(turn.stt_finalize_delay_ms)}</span>
            <span>LLM first token</span><span className="font-medium">{formatMs(turn.llm_ttft_ms)}</span>
            <span>TTS first byte</span><span className="font-medium">{formatMs(turn.tts_ttfb_ms)}</span>
            <span>Felt latency</span><span className="font-semibold">{formatMs(turn.eot_to_agent_speak_ms)}</span>
          </div>
        </div>
      ) : null}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Legend                                                              */
/* ------------------------------------------------------------------ */

const LEGEND = (
  <div className="flex items-center gap-3 text-[10px] text-[var(--color-neutral-500)]">
    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-blue-500" />STT</span>
    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-purple-500" />AI</span>
    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-amber-500" />TTS</span>
    <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-green-500" />Speak</span>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ConversationView({
  variant,
  turns,
  maxEotMs,
  expandedIndex,
  onToggleExpand,
  isLive,
}: ConversationViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

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
    <div ref={scrollRef} className="space-y-2 overflow-y-auto">
      {LEGEND}
      {turns.map((merged, idx) =>
        variant === "chat" ? (
          <ChatEntry
            key={`${merged.turn.turn_index}-${merged.role}`}
            merged={merged}
            maxEotMs={maxEotMs}
            expanded={expandedIndex === idx}
            onToggle={() => onToggleExpand(idx)}
            isLive={isLive}
          />
        ) : (
          <EvidenceEntry
            key={`${merged.turn.turn_index}-${merged.role}`}
            merged={merged}
            maxEotMs={maxEotMs}
            expanded={expandedIndex === idx}
            onToggle={() => onToggleExpand(idx)}
          />
        ),
      )}
    </div>
  );
}
