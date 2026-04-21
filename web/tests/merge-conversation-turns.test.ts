import { describe, expect, it } from "vitest";

import { mergeConversationTurns, computeMaxEotMs } from "@/components/observability/domain-logic";
import type { LiveCallTurnLatency } from "@/lib/api/call-observability";
import type { ObservabilityTimelineItem } from "@/lib/api/observability";

/* ------------------------------------------------------------------ */
/*  Factories                                                          */
/* ------------------------------------------------------------------ */

function makeTurn(overrides: Partial<LiveCallTurnLatency> & { turn_index: number }): LiveCallTurnLatency {
  return {
    user_speech_started_at_ms: null,
    user_speech_ended_at_ms: null,
    user_final_transcript_at_ms: null,
    user_final_transcript_chars: null,
    stt_duration_ms: null,
    llm_start_at_ms: null,
    llm_ttft_at_ms: null,
    llm_duration_ms: null,
    agent_speaking_started_at_ms: null,
    agent_speaking_ended_at_ms: null,
    tts_ttfb_ms: null,
    tts_duration_ms: null,
    stt_finalize_delay_ms: null,
    eot_to_llm_start_ms: null,
    llm_ttft_ms: null,
    eot_to_agent_speak_ms: null,
    first_speech_latency_ms: null,
    tts_pre_speech_gap_ms: null,
    user_interrupted_agent: false,
    interruption_started_at_ms: null,
    agent_stop_after_interrupt_ms: null,
    speech_overlap_duration_ms: null,
    tool_executions: [],
    ...overrides,
  };
}

function makeTranscript(actor: string, text: string, ms: number): ObservabilityTimelineItem {
  return {
    id: `t-${ms}`,
    kind: "transcript",
    severity: "info",
    occurred_at: new Date(ms).toISOString(),
    occurred_at_ms: ms,
    label: text,
    detail: null,
    actor,
    duration_ms: null,
    correlation_id: null,
    payload: {},
  };
}

/* ------------------------------------------------------------------ */
/*  Tests                                                              */
/* ------------------------------------------------------------------ */

describe("mergeConversationTurns", () => {
  it("returns empty for no turns and no transcripts", () => {
    expect(mergeConversationTurns([], [])).toEqual([]);
  });

  it("produces user + agent entries for a 3-turn conversation", () => {
    const turns = [
      makeTurn({ turn_index: 0, user_speech_started_at_ms: 1000, eot_to_agent_speak_ms: 500 }),
      makeTurn({ turn_index: 1, user_speech_started_at_ms: 5000, eot_to_agent_speak_ms: 400 }),
      makeTurn({ turn_index: 2, user_speech_started_at_ms: 9000, eot_to_agent_speak_ms: 300 }),
    ];
    const transcripts = [
      makeTranscript("User", "Laba diena.", 1000),
      makeTranscript("Agent", "Sveiki! Kuo galiu padėti?", 1500),
      makeTranscript("User", "Man reikia kardiologo.", 5000),
      makeTranscript("Agent", "Supratau. Kokiame mieste?", 5400),
      makeTranscript("User", "Vilniuje.", 9000),
      makeTranscript("Agent", "Gerai, ieškau klinikų.", 9300),
    ];

    const merged = mergeConversationTurns(turns, transcripts);

    // 3 turns × 2 entries = 6 merged
    expect(merged).toHaveLength(6);

    // Alternating user/agent
    expect(merged[0].role).toBe("user");
    expect(merged[0].transcript?.text).toBe("Laba diena.");
    expect(merged[0].turn.turn_index).toBe(0);

    expect(merged[1].role).toBe("agent");
    expect(merged[1].transcript?.text).toBe("Sveiki! Kuo galiu padėti?");
    expect(merged[1].turn.turn_index).toBe(0);

    expect(merged[2].role).toBe("user");
    expect(merged[2].transcript?.text).toBe("Man reikia kardiologo.");
    expect(merged[2].turn.turn_index).toBe(1);

    expect(merged[3].role).toBe("agent");
    expect(merged[3].turn.turn_index).toBe(1);

    expect(merged[4].role).toBe("user");
    expect(merged[4].turn.turn_index).toBe(2);

    expect(merged[5].role).toBe("agent");
    expect(merged[5].turn.turn_index).toBe(2);
  });

  it("handles initial agent greeting without user speech", () => {
    const turns = [
      makeTurn({ turn_index: 0, agent_speaking_started_at_ms: 500, agent_speaking_ended_at_ms: 900 }),
      makeTurn({
        turn_index: 1,
        user_speech_started_at_ms: 2000,
        agent_speaking_started_at_ms: 2300,
        eot_to_agent_speak_ms: 300,
      }),
    ];
    const transcripts = [
      makeTranscript("Agent", "Sveiki! Kuo galiu padėti?", 500),
      makeTranscript("User", "Laba diena.", 2000),
      makeTranscript("Agent", "Kokio specialisto ieškote?", 2300),
    ];

    const merged = mergeConversationTurns(turns, transcripts);

    expect(merged).toHaveLength(3);
    expect(merged[0].role).toBe("agent");
    expect(merged[0].turn.turn_index).toBe(0);
    expect(merged[0].transcript?.text).toBe("Sveiki! Kuo galiu padėti?");
    expect(merged[1].role).toBe("user");
    expect(merged[1].turn.turn_index).toBe(1);
    expect(merged[1].transcript?.text).toBe("Laba diena.");
    expect(merged[2].role).toBe("agent");
    expect(merged[2].turn.turn_index).toBe(1);
    expect(merged[2].transcript?.text).toBe("Kokio specialisto ieškote?");
  });

  it("creates stub turns when transcripts exceed turns", () => {
    const turns = [
      makeTurn({ turn_index: 0, user_speech_started_at_ms: 1000 }),
    ];
    const transcripts = [
      makeTranscript("User", "First.", 1000),
      makeTranscript("Agent", "Response 1.", 1500),
      makeTranscript("User", "Second.", 3000),
      makeTranscript("Agent", "Response 2.", 3500),
    ];

    const merged = mergeConversationTurns(turns, transcripts);

    // Turn 0 pairs with user[0]+agent[0], orphan user[1]+agent[1] get stub turns
    expect(merged).toHaveLength(4);
    expect(merged[0].turn.turn_index).toBe(0);
    expect(merged[1].turn.turn_index).toBe(0);
    // Stub turns for excess transcripts
    expect(merged[2].role).toBe("user");
    expect(merged[2].transcript?.text).toBe("Second.");
    expect(merged[3].role).toBe("agent");
    expect(merged[3].transcript?.text).toBe("Response 2.");
  });

  it("handles turns without any transcripts", () => {
    const turns = [
      makeTurn({ turn_index: 0, user_speech_started_at_ms: 1000, eot_to_agent_speak_ms: 250 }),
    ];

    const merged = mergeConversationTurns(turns, []);

    // User speech exists → user entry (no transcript) + agent entry (no transcript)
    expect(merged).toHaveLength(2);
    expect(merged[0].role).toBe("user");
    expect(merged[0].transcript).toBeNull();
    expect(merged[1].role).toBe("agent");
    expect(merged[1].transcript).toBeNull();
  });

  it("eot_to_agent_speak_ms is on both entries but only relevant for agent", () => {
    const turns = [
      makeTurn({ turn_index: 0, user_speech_started_at_ms: 1000, eot_to_agent_speak_ms: 20400 }),
    ];
    const transcripts = [
      makeTranscript("User", "Laba diena.", 1000),
      makeTranscript("Agent", "Sveiki!", 21400),
    ];

    const merged = mergeConversationTurns(turns, transcripts);

    // Both entries reference the same turn object
    expect(merged[0].role).toBe("user");
    expect(merged[0].turn.eot_to_agent_speak_ms).toBe(20400);

    expect(merged[1].role).toBe("agent");
    expect(merged[1].turn.eot_to_agent_speak_ms).toBe(20400);

    // The UI uses role to decide display — 20400ms should NOT appear on user bubble
  });

  it("recognizes caller/human/customer as user actors", () => {
    const turns = [
      makeTurn({ turn_index: 0, user_speech_started_at_ms: 1000 }),
    ];
    const callerTranscripts = [
      makeTranscript("Caller", "Hello", 1000),
      makeTranscript("Assistant", "Hi!", 1200),
    ];

    const merged = mergeConversationTurns(turns, callerTranscripts);
    expect(merged[0].role).toBe("user");
    expect(merged[0].transcript?.speaker).toBe("Caller");
    expect(merged[1].role).toBe("agent");
  });

  it("sorts transcripts by occurred_at_ms regardless of input order", () => {
    const turns = [
      makeTurn({ turn_index: 0, user_speech_started_at_ms: 1000 }),
    ];
    // Out of order
    const transcripts = [
      makeTranscript("Agent", "Response", 2000),
      makeTranscript("User", "Question", 1000),
    ];

    const merged = mergeConversationTurns(turns, transcripts);
    expect(merged[0].role).toBe("user");
    expect(merged[0].transcript?.text).toBe("Question");
    expect(merged[1].role).toBe("agent");
    expect(merged[1].transcript?.text).toBe("Response");
  });

  it("filters out non-transcript timeline items", () => {
    const turns = [
      makeTurn({ turn_index: 0, user_speech_started_at_ms: 1000 }),
    ];
    const items: ObservabilityTimelineItem[] = [
      makeTranscript("User", "Hello", 1000),
      {
        id: "ev-1",
        kind: "system",
        severity: "info",
        occurred_at: null,
        occurred_at_ms: 500,
        label: "System event",
        detail: null,
        actor: null,
        duration_ms: null,
        correlation_id: null,
        payload: {},
      },
      makeTranscript("Agent", "Hi!", 1200),
    ];

    const merged = mergeConversationTurns(turns, items);
    // System event filtered out, only 2 transcript items used
    expect(merged).toHaveLength(2);
  });
});

describe("computeMaxEotMs", () => {
  it("returns 0 for empty turns", () => {
    expect(computeMaxEotMs([])).toBe(0);
  });

  it("returns the maximum eot_to_agent_speak_ms", () => {
    const turns = [
      makeTurn({ turn_index: 0, eot_to_agent_speak_ms: 300 }),
      makeTurn({ turn_index: 1, eot_to_agent_speak_ms: 800 }),
      makeTurn({ turn_index: 2, eot_to_agent_speak_ms: null }),
    ];
    expect(computeMaxEotMs(turns)).toBe(800);
  });
});
