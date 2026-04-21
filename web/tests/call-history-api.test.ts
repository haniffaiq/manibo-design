import { afterEach, describe, expect, it, vi } from "vitest";

import { getCallDetail, getCallEvents, getRecordingSignedUrl, listHistoricalCalls } from "@/lib/api/call-history";

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

describe("call history api client", () => {
  it("lists historical calls with filters", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        calls: [],
        total: 0,
        limit: 50,
        offset: 0,
      }),
    ) as typeof fetch;

    await listHistoricalCalls({
      driver_id: "driver-1",
      phone: "+37060000001",
      outcome: "resolved",
      started_after: "2026-03-01T00:00:00.000Z",
      started_before: "2026-03-02T00:00:00.000Z",
      limit: 50,
      offset: 0,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/calls?started_after=2026-03-01T00%3A00%3A00.000Z&started_before=2026-03-02T00%3A00%3A00.000Z&outcome=resolved&driver_id=driver-1&phone=%2B37060000001&limit=50&offset=0",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads call detail by id", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        call: {
          id: "call-1",
          direction: "inbound",
          state: "completed",
          outcome: "resolved",
          caller_number: "+37060000001",
          callee_number: "+37060000002",
          started_at: "2026-03-01T00:00:00Z",
          ended_at: "2026-03-01T00:01:00Z",
          duration_seconds: 60,
          created_at: "2026-03-01T00:00:00Z",
          updated_at: "2026-03-01T00:01:00Z",
          metadata: {},
          quality_score: null,
          needs_human_review: null,
        },
        transcript: null,
        recordings: [],
        has_more: { transcript: false, recordings: false },
      }),
    ) as typeof fetch;

    const detail = await getCallDetail("call-1");
    expect(detail.call.id).toBe("call-1");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/calls/call-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads persisted call events by id", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        call_id: "call-1",
        events: [
          {
            seq: 1,
            event_type: "llm.started",
            occurred_at_ms: 130,
            summary: "Assistant started thinking",
            created_at: "2026-03-06T09:00:00Z",
            payload: { turn_index: 0 },
          },
        ],
      }),
    ) as typeof fetch;

    const response = await getCallEvents("call-1", { limit: 200 });
    expect(response.events).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/calls/call-1/events?limit=200",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("requests recording signed url", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        url: "https://storage.example/recording.wav",
        expires_in_seconds: 900,
      }),
    ) as typeof fetch;

    const response = await getRecordingSignedUrl("recording-1", 900);
    expect(response.expires_in_seconds).toBe(900);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/recordings/recording-1/signed-url?expires_in_seconds=900",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
