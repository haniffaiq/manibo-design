import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ConversationTurnRow,
  type ConversationTurnRowProps,
} from "@/components/observability/conversation-turn-row";
import type { LiveCallTurnLatency } from "@/lib/api/call-observability";

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

function makeTurn(overrides: Partial<LiveCallTurnLatency> = {}): LiveCallTurnLatency {
  return {
    turn_index: 3,
    user_speech_started_at_ms: 0,
    user_speech_ended_at_ms: 1200,
    user_final_transcript_at_ms: 1268,
    user_final_transcript_chars: 42,
    stt_duration_ms: 1200,
    llm_start_at_ms: 1280,
    llm_ttft_at_ms: 1605,
    llm_duration_ms: 800,
    agent_speaking_started_at_ms: 1680,
    agent_speaking_ended_at_ms: 2400,
    tts_ttfb_ms: 52,
    tts_duration_ms: 720,
    stt_finalize_delay_ms: 68,
    eot_to_llm_start_ms: 12,
    llm_ttft_ms: 325,
    eot_to_agent_speak_ms: 480,
    first_speech_latency_ms: 1680,
    tts_pre_speech_gap_ms: 35,
    user_interrupted_agent: false,
    interruption_started_at_ms: null,
    agent_stop_after_interrupt_ms: null,
    speech_overlap_duration_ms: null,
    tool_executions: [],
    ...overrides,
  };
}

const DEFAULT_TRANSCRIPT = {
  speaker: "agent",
  text: "I can help you reschedule. Let me check available times.",
  timestamp: "2026-03-29T12:04:33.000Z",
};

function renderRow(overrides: Partial<ConversationTurnRowProps> = {}) {
  const props: ConversationTurnRowProps = {
    turn: makeTurn(),
    transcript: DEFAULT_TRANSCRIPT,
    maxEotMs: 600,
    expanded: false,
    onToggleExpand: vi.fn(),
    ...overrides,
  };
  return { ...render(<ConversationTurnRow {...props} />), props };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

afterEach(() => {
  cleanup();
});

describe("ConversationTurnRow", () => {
  it("renders collapsed state with full data", () => {
    renderRow();

    expect(screen.getByTestId("conversation-turn-3")).toBeTruthy();
    expect(screen.getByText("Turn 3")).toBeTruthy();
    expect(screen.getByTestId("turn-transcript")).toBeTruthy();
    expect(screen.getByTestId("latency-bar")).toBeTruthy();
    expect(screen.getByTestId("felt-latency").textContent).toBe("480ms");

    // Pipeline breakdown should NOT be visible when collapsed
    expect(screen.queryByTestId("pipeline-breakdown")).toBeNull();
    expect(screen.queryByTestId("timing-milestones")).toBeNull();
  });

  it("renders expanded state with pipeline breakdown and milestones", () => {
    renderRow({ expanded: true });

    expect(screen.getByTestId("pipeline-breakdown")).toBeTruthy();
    expect(screen.getByTestId("timing-milestones")).toBeTruthy();

    // Should show felt latency summary in breakdown
    expect(screen.getByText("Felt latency (eot → agent speak)")).toBeTruthy();
  });

  it("renders partial turn with only STT filled", () => {
    const partialTurn = makeTurn({
      stt_finalize_delay_ms: 68,
      llm_ttft_ms: null,
      tts_ttfb_ms: null,
      eot_to_agent_speak_ms: null,
      llm_start_at_ms: null,
      llm_ttft_at_ms: null,
      agent_speaking_started_at_ms: null,
      agent_speaking_ended_at_ms: null,
      tts_pre_speech_gap_ms: null,
    });

    renderRow({ turn: partialTurn, isLive: true });

    expect(screen.getByTestId("latency-bar")).toBeTruthy();
    expect(screen.getByTestId("latency-segment-stt")).toBeTruthy();
    // LLM, TTS, speak segments should not render
    expect(screen.queryByTestId("latency-segment-llm")).toBeNull();
    expect(screen.queryByTestId("latency-segment-tts")).toBeNull();
    expect(screen.queryByTestId("latency-segment-speak")).toBeNull();
    // Pulse indicator for live partial
    expect(screen.getByTestId("latency-bar-pulse")).toBeTruthy();
    // No felt latency yet
    expect(screen.queryByTestId("felt-latency")).toBeNull();
  });

  it("renders transcript only when latency data is null", () => {
    const noLatencyTurn = makeTurn({
      stt_finalize_delay_ms: null,
      llm_ttft_ms: null,
      tts_ttfb_ms: null,
      eot_to_agent_speak_ms: null,
    });

    renderRow({ turn: noLatencyTurn });

    expect(screen.getByTestId("turn-transcript")).toBeTruthy();
    expect(screen.queryByTestId("latency-bar")).toBeNull();
    expect(screen.queryByTestId("felt-latency")).toBeNull();
  });

  it("shows slow turn warning when eot exceeds threshold", () => {
    const slowTurn = makeTurn({ eot_to_agent_speak_ms: 520 });

    renderRow({ turn: slowTurn });

    expect(screen.getByTestId("slow-warning")).toBeTruthy();
    expect(screen.getByTestId("felt-latency").textContent).toBe("520ms");
  });

  it("uses custom slowThresholdMs", () => {
    const turn = makeTurn({ eot_to_agent_speak_ms: 300 });

    renderRow({ turn, slowThresholdMs: 200 });

    expect(screen.getByTestId("slow-warning")).toBeTruthy();
  });

  it("shows interrupted turn marker with overlap duration", () => {
    const interruptedTurn = makeTurn({
      user_interrupted_agent: true,
      interruption_started_at_ms: 1800,
      agent_stop_after_interrupt_ms: 45,
      speech_overlap_duration_ms: 120,
    });

    renderRow({ turn: interruptedTurn });

    expect(screen.getByTestId("interrupted-marker")).toBeTruthy();
    expect(screen.getByTestId("overlap-duration").textContent).toContain("120ms");
  });

  it("renders expanded interruption section with details", () => {
    const interruptedTurn = makeTurn({
      user_interrupted_agent: true,
      agent_stop_after_interrupt_ms: 45,
      speech_overlap_duration_ms: 120,
    });

    renderRow({ turn: interruptedTurn, expanded: true });

    expect(screen.getByTestId("interruption-section")).toBeTruthy();
    expect(screen.getByText("Agent stop delay")).toBeTruthy();
    expect(screen.getByText("Speech overlap")).toBeTruthy();
  });

  it("renders tool executions with status", () => {
    const turn = makeTurn({
      tool_executions: [
        { tool_name: "check_availability", duration_ms: 340, status: "success", error_detail: null },
      ],
    });

    renderRow({ turn });

    const toolEl = screen.getByTestId("tool-execution-check_availability");
    expect(toolEl).toBeTruthy();
    expect(toolEl.textContent).toContain("check_availability");
    expect(toolEl.textContent).toContain("340ms");
  });

  it("renders failed tool with error detail", () => {
    const turn = makeTurn({
      tool_executions: [
        { tool_name: "book_appointment", duration_ms: 450, status: "error", error_detail: "timeout" },
      ],
    });

    renderRow({ turn });

    const failedMarker = screen.getByTestId("tool-failed-book_appointment");
    expect(failedMarker).toBeTruthy();
    expect(screen.getByTestId("tool-execution-book_appointment").textContent).toContain("timeout");
  });

  it("shows live pulsing indicator on partial turn", () => {
    const partialTurn = makeTurn({
      stt_finalize_delay_ms: 50,
      llm_ttft_ms: null,
      tts_ttfb_ms: null,
      eot_to_agent_speak_ms: null,
    });

    renderRow({ turn: partialTurn, isLive: true });

    expect(screen.getByTestId("live-indicator")).toBeTruthy();
  });

  it("does not show live indicator when not live or not partial", () => {
    // Full data, isLive=true -> not partial -> no indicator
    renderRow({ isLive: true });

    expect(screen.queryByTestId("live-indicator")).toBeNull();
  });

  it("calls onToggleExpand when clicked", () => {
    const onToggle = vi.fn();
    renderRow({ onToggleExpand: onToggle });

    fireEvent.click(screen.getByTestId("conversation-turn-3"));

    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("renders without transcript (latency only)", () => {
    renderRow({ transcript: null });

    expect(screen.queryByTestId("turn-transcript")).toBeNull();
    expect(screen.getByTestId("latency-bar")).toBeTruthy();
    expect(screen.getByTestId("felt-latency")).toBeTruthy();
  });

  it("renders expanded tool details section", () => {
    const turn = makeTurn({
      tool_executions: [
        { tool_name: "search_records", duration_ms: 200, status: "success", error_detail: null },
        { tool_name: "update_booking", duration_ms: 150, status: "error", error_detail: "not found" },
      ],
    });

    renderRow({ turn, expanded: true });

    expect(screen.getByTestId("expanded-tool-details")).toBeTruthy();
  });

  it("renders all four latency bar segments for complete turn", () => {
    renderRow();

    expect(screen.getByTestId("latency-segment-stt")).toBeTruthy();
    expect(screen.getByTestId("latency-segment-llm")).toBeTruthy();
    expect(screen.getByTestId("latency-segment-tts")).toBeTruthy();
    expect(screen.getByTestId("latency-segment-speak")).toBeTruthy();
  });
});
