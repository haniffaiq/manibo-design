import { afterEach, describe, expect, it, vi } from "vitest";

import { getAdminCallObservabilitySummary, getAdminCallsReport } from "@/lib/api/admin-operations";
import { getPlatformHealth } from "@/lib/api/admin-health";

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

describe("admin health api client", () => {
  it("gets platform health without filters", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        checked_at: "2026-03-05T06:00:00Z",
        call_error_rate: 0.25,
        average_call_duration_seconds: 60,
        active_calls: { voice_call: 2, inbound_call: 1, total: 3 },
        worker_status: {
          platform_api: "healthy",
          temporal: "healthy",
          temporal_error: null,
        },
      }),
    ) as typeof fetch;

    const response = await getPlatformHealth();
    expect(response.active_calls.total).toBe(3);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/reports/platform-health",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("gets platform health with query filters", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        checked_at: "2026-03-05T06:00:00Z",
        call_error_rate: 0,
        average_call_duration_seconds: 50,
        active_calls: { voice_call: 0, inbound_call: 0, total: 0 },
        worker_status: {
          platform_api: "healthy",
          temporal: "degraded",
          temporal_error: "temporal unavailable",
        },
      }),
    ) as typeof fetch;

    await getPlatformHealth({
      start: "2026-03-01T00:00:00Z",
      end: "2026-03-05T00:00:00Z",
      bucket: "hour",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/reports/platform-health?start=2026-03-01T00%3A00%3A00Z&end=2026-03-05T00%3A00%3A00Z&bucket=hour",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("gets deployment calls report", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        buckets: [],
      }),
    ) as typeof fetch;

    await getAdminCallsReport({
      start: "2026-03-01T00:00:00Z",
      end: "2026-03-05T00:00:00Z",
      bucket: "day",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/reports/calls?start=2026-03-01T00%3A00%3A00Z&end=2026-03-05T00%3A00%3A00Z&bucket=day",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("gets deployment call observability summary", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        sampled_calls: 14,
        window_start: "2026-03-01T00:00:00Z",
        window_end: "2026-03-05T00:00:00Z",
        stack_comparisons: [],
        route_hotspots: [],
      }),
    ) as typeof fetch;

    await getAdminCallObservabilitySummary({
      start: "2026-03-01T00:00:00Z",
      end: "2026-03-05T00:00:00Z",
      limit: 200,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/calls/observability-summary?start=2026-03-01T00%3A00%3A00Z&end=2026-03-05T00%3A00%3A00Z&limit=200",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
