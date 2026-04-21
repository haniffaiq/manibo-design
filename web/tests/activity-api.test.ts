import { afterEach, describe, expect, it, vi } from "vitest";

import { listTenantAuditEvents } from "@/lib/api/activity";

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

describe("tenant activity api client", () => {
  it("lists tenant audit events with default query", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        events: [
          {
            id: "evt_1",
            tenant_id: "tenant-1",
            actor_user_id: "user-1",
            action: "team_user.invited",
            resource_type: "membership",
            resource_id: "user-2",
            metadata: { outcome: "success" },
            outcome: "success",
            created_at: "2026-03-06T10:00:00Z",
          },
        ],
      }),
    ) as typeof fetch;

    const response = await listTenantAuditEvents();

    expect(response).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith("/api/platform/audit/events", expect.objectContaining({ method: "GET" }));
  });

  it("lists tenant audit events with filters", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ events: [] })) as typeof fetch;

    await listTenantAuditEvents({
      action: "team_user.invited",
      resource_type: "membership",
      resource_id: "user-2",
      since: "2026-03-01T00:00:00Z",
      until: "2026-03-06T00:00:00Z",
      limit: 50,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/audit/events?action=team_user.invited&resource_type=membership&resource_id=user-2&since=2026-03-01T00%3A00%3A00Z&until=2026-03-06T00%3A00%3A00Z&limit=50",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
