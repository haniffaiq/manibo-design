import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getAdminCallTrace,
  getCallLatency,
  getCallObservabilitySummary,
  getCallTrace,
} from "@/lib/api/call-observability";

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

describe("call observability api client", () => {
  it("loads call latency detail", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        call_id: "call-1",
        source: "persisted_metadata",
        has_latency_data: true,
        turns: [],
        summaries: {},
        stack: null,
      }),
    ) as typeof fetch;

    const response = await getCallLatency("call-1");
    expect(response.call_id).toBe("call-1");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/calls/call-1/latency",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads call trace detail", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        call_id: "call-1",
        has_trace_context: true,
        trace_context: {
          source: "call_metadata",
          correlation_id: "corr-1",
          traceparent: "00-abc-def-01",
          trace_id: "abc",
          parent_span_id: "def",
          tracestate: null,
        },
        event_count: 4,
        first_event_at_ms: 100,
        last_event_at_ms: 1200,
        stack: null,
        nodes: [],
        routes: [],
      }),
    ) as typeof fetch;

    const response = await getCallTrace("call-1");
    expect(response.trace_context.trace_id).toBe("abc");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/calls/call-1/trace",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads observability summary with query params", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        sampled_calls: 12,
        window_start: "2026-03-01T00:00:00Z",
        window_end: "2026-03-07T00:00:00Z",
        stack_comparisons: [],
        route_hotspots: [],
      }),
    ) as typeof fetch;

    const response = await getCallObservabilitySummary({
      start: "2026-03-01T00:00:00Z",
      end: "2026-03-07T00:00:00Z",
      limit: 50,
    });

    expect(response.sampled_calls).toBe(12);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/calls/observability-summary?start=2026-03-01T00%3A00%3A00Z&end=2026-03-07T00%3A00%3A00Z&limit=50",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("includes tool payloads on the admin trace route when requested", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        call_id: "call-1",
        has_trace_context: false,
        trace_context: {
          source: "none",
          correlation_id: null,
          traceparent: null,
          trace_id: null,
          parent_span_id: null,
          tracestate: null,
        },
        event_count: 1,
        first_event_at_ms: 100,
        last_event_at_ms: 200,
        stack: null,
        nodes: [],
        routes: [],
      }),
    ) as typeof fetch;

    await getAdminCallTrace("tenant-1", "call-1", { includeToolPayloads: true });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/calls/call-1/trace?include_tool_payloads=true",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
