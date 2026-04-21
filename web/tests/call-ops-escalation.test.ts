import { describe, expect, it } from "vitest";

import type { ActiveCallEvent } from "@grove/web-shared/types/call-events";
import {
  deriveEscalationState,
  sortByEscalationPriority,
  type CallEscalationState,
} from "@/lib/call-ops-escalation";

function makeEvent(overrides: Partial<ActiveCallEvent> & { event_type: string }): ActiveCallEvent {
  return {
    seq: 1,
    occurred_at_ms: Date.now(),
    summary: "test",
    payload: {},
    ...overrides,
  };
}

describe("deriveEscalationState", () => {
  it("returns null when no escalation events exist", () => {
    const events = [makeEvent({ event_type: "call.started" }), makeEvent({ event_type: "call.ended" })];
    expect(deriveEscalationState(events)).toBeNull();
  });

  it("returns null for empty events array", () => {
    expect(deriveEscalationState([])).toBeNull();
  });

  it("returns escalated for call.escalated event", () => {
    const events = [makeEvent({ event_type: "call.escalated", payload: { reason: "insurance_compensated_visit" } })];
    const result = deriveEscalationState(events);
    expect(result).toEqual({
      status: "escalated",
      reason: "insurance_compensated_visit",
      priority: null,
    });
  });

  it("returns transfer_requested for call.escalation.transfer_requested event", () => {
    const events = [makeEvent({ event_type: "call.escalation.transfer_requested", payload: { reason: "urgent_medical_need" } })];
    expect(deriveEscalationState(events)?.status).toBe("transfer_requested");
  });

  it("elevates to transfer_requested when transfer_immediately is true", () => {
    const events = [
      makeEvent({
        event_type: "call.escalated",
        payload: { transfer_immediately: true, reason: "urgent_medical_need" },
      }),
    ];
    const result = deriveEscalationState(events);
    expect(result?.status).toBe("transfer_requested");
    expect(result?.reason).toBe("urgent_medical_need");
  });

  it("elevates to transfer_requested when priority is URGENT", () => {
    const events = [
      makeEvent({
        event_type: "call.escalated",
        payload: { priority: "URGENT", reason: "medical_question_out_of_scope" },
      }),
    ];
    const result = deriveEscalationState(events);
    expect(result?.status).toBe("transfer_requested");
    expect(result?.priority).toBe("URGENT");
  });

  it("elevates to transfer_requested when priority is lowercase urgent", () => {
    const events = [
      makeEvent({
        event_type: "call.escalated",
        payload: { priority: "urgent", reason: "urgent_medical_need" },
      }),
    ];
    const result = deriveEscalationState(events);
    expect(result?.status).toBe("transfer_requested");
  });

  it("keeps transfer_requested even if later event is only escalated", () => {
    const events = [
      makeEvent({ event_type: "call.escalation.transfer_requested", payload: { reason: "urgent" } }),
      makeEvent({ event_type: "call.escalation.operator_notify", payload: { reason: "notified" } }),
    ];
    expect(deriveEscalationState(events)?.status).toBe("transfer_requested");
  });

  it("accumulates reason and priority across multiple events", () => {
    const events = [
      makeEvent({ event_type: "call.escalated", payload: { reason: "insurance_compensated_visit" } }),
      makeEvent({ event_type: "call.escalation.operator_notify", payload: { priority: "STANDARD" } }),
    ];
    const result = deriveEscalationState(events);
    expect(result?.reason).toBe("insurance_compensated_visit");
    expect(result?.priority).toBe("STANDARD");
  });

  it("ignores non-string reason and priority values", () => {
    const events = [makeEvent({ event_type: "call.escalated", payload: { reason: 42, priority: true } })];
    const result = deriveEscalationState(events);
    expect(result?.reason).toBeNull();
    expect(result?.priority).toBeNull();
  });
});

describe("sortByEscalationPriority", () => {
  const urgent: CallEscalationState = { status: "transfer_requested", reason: null, priority: "URGENT" };
  const standard: CallEscalationState = { status: "escalated", reason: null, priority: "STANDARD" };

  it("sorts urgent before escalated before normal", () => {
    const calls = [
      { id: "normal", escalation: null },
      { id: "urgent", escalation: urgent },
      { id: "standard", escalation: standard },
    ];
    const sorted = sortByEscalationPriority(calls);
    expect(sorted.map((c) => c.id)).toEqual(["urgent", "standard", "normal"]);
  });

  it("preserves order within the same tier (stable sort)", () => {
    const calls = [
      { id: "normal-a", escalation: null },
      { id: "normal-b", escalation: null },
      { id: "normal-c", escalation: null },
    ];
    const sorted = sortByEscalationPriority(calls);
    expect(sorted.map((c) => c.id)).toEqual(["normal-a", "normal-b", "normal-c"]);
  });

  it("does not mutate the input array", () => {
    const calls = [
      { id: "normal", escalation: null },
      { id: "urgent", escalation: urgent },
    ];
    const original = [...calls];
    sortByEscalationPriority(calls);
    expect(calls.map((c) => c.id)).toEqual(original.map((c) => c.id));
  });

  it("handles calls without escalation field", () => {
    const calls = [{ id: "no-field" }, { id: "urgent", escalation: urgent }];
    const sorted = sortByEscalationPriority(calls);
    expect(sorted.map((c) => c.id)).toEqual(["urgent", "no-field"]);
  });

  it("handles empty array", () => {
    expect(sortByEscalationPriority([])).toEqual([]);
  });
});
