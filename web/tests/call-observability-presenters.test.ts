import { describe, expect, it } from "vitest";

import { eventFacts, eventHeadline } from "@/lib/call-observability-presenters";
import type { CallRuntimeEvent } from "@/lib/api/call-history";

function makeEvent(overrides: Partial<CallRuntimeEvent>): CallRuntimeEvent {
  return {
    seq: 1,
    event_type: "llm.started",
    occurred_at_ms: 120,
    summary: "Assistant started thinking",
    created_at: "2026-03-06T09:00:00Z",
    payload: {},
    ...overrides,
  };
}

describe("call observability presenters", () => {
  it("maps clinic escalation events to plain-language titles", () => {
    expect(eventHeadline(makeEvent({ event_type: "call.escalated", summary: "Agent requested human help" }))).toBe(
      "Needs human help",
    );
    expect(
      eventHeadline(
        makeEvent({
          event_type: "call.manual_takeover.requested",
          summary: "Operator is joining the call",
        }),
      ),
    ).toBe("Teammate is joining the call");
    expect(
      eventHeadline(
        makeEvent({
          event_type: "call.escalation.transfer_requested",
          summary: "Agent requested immediate transfer to a human",
        }),
      ),
    ).toBe("Urgent transfer requested");
    expect(
      eventHeadline(
        makeEvent({
          event_type: "call.escalation.transfer_failed",
          summary: "Immediate transfer failed; operator still needs to join manually",
        }),
      ),
    ).toBe("Urgent transfer failed; join manually");
  });

  it("formats handoff facts without exposing raw codes as the primary label", () => {
    const facts = eventFacts(
      makeEvent({
        event_type: "call.escalation.transfer_requested",
        payload: {
          reason: "urgent_medical_need",
          reason_summary: "Caller reported chest pain.",
          priority: "urgent",
          transfer_immediately: true,
        },
      }),
    );

    expect(facts).toContain("Reason: Urgent medical need");
    expect(facts).toContain("Staff note: Caller reported chest pain.");
    expect(facts).toContain("Urgency: Urgent");
    expect(facts).toContain("Immediate transfer requested");
    expect(facts).not.toContain("Reason: urgent_medical_need");
  });
});
