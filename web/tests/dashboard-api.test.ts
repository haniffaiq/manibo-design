import { afterEach, describe, expect, it, vi } from "vitest";

import { getCallsReport, getTenantActiveCalls, getTenantUsageSummary } from "@/lib/api/dashboard";

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

describe("dashboard api client", () => {
  it("loads active calls", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ calls: [] })) as typeof fetch;

    await getTenantActiveCalls();

    expect(global.fetch).toHaveBeenCalledWith("/api/platform/calls/active", expect.objectContaining({ method: "GET" }));
  });

  it("loads tenant billing usage summary", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ total_cents: 1200 })) as typeof fetch;

    await getTenantUsageSummary("2026-03");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/billing/usage?period=2026-03",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads calls report with query params", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ buckets: [] })) as typeof fetch;

    await getCallsReport({
      start: "2026-03-01T00:00:00Z",
      end: "2026-03-07T00:00:00Z",
      bucket: "day",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/reports/calls?start=2026-03-01T00%3A00%3A00Z&end=2026-03-07T00%3A00%3A00Z&bucket=day",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
