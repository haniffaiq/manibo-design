import { afterEach, describe, expect, it, vi } from "vitest";

import { ackOperatorEvent, listOperatorEvents, resolveOperatorEvent } from "@/lib/api/operator-events";

const originalFetch = global.fetch;

function mockJsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("operator events api client", () => {
  it("lists operator events with filters", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        events: [],
      }),
    ) as typeof fetch;

    await listOperatorEvents({
      severity: "critical",
      status: "open",
      since: "2026-03-05T09:00:00.000Z",
      limit: 150,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/operator-events?severity=critical&status=open&since=2026-03-05T09%3A00%3A00.000Z&limit=150",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("acks an operator event", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        event: {
          id: "event-1",
          event_type: "ops.workflow_execution_failed",
          severity: "critical",
          status: "acked",
          entity_type: "call",
          entity_id: "call-1",
          message: "failed",
          metadata: {},
          created_at: "2026-03-05T09:00:00Z",
          updated_at: "2026-03-05T09:01:00Z",
          acked_at: "2026-03-05T09:01:00Z",
          acked_by: "11111111-1111-1111-1111-111111111111",
          resolved_at: null,
          resolved_by: null,
        },
      }),
    ) as typeof fetch;

    await ackOperatorEvent("event-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/operator-events/event-1/ack",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("resolves an operator event", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        event: {
          id: "event-1",
          event_type: "ops.workflow_execution_failed",
          severity: "critical",
          status: "resolved",
          entity_type: "call",
          entity_id: "call-1",
          message: "failed",
          metadata: {},
          created_at: "2026-03-05T09:00:00Z",
          updated_at: "2026-03-05T09:02:00Z",
          acked_at: "2026-03-05T09:01:00Z",
          acked_by: "11111111-1111-1111-1111-111111111111",
          resolved_at: "2026-03-05T09:02:00Z",
          resolved_by: "11111111-1111-1111-1111-111111111111",
        },
      }),
    ) as typeof fetch;

    await resolveOperatorEvent("event-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/operator-events/event-1/resolve",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
