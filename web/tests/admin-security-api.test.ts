import { afterEach, describe, expect, it, vi } from "vitest";

import { listAdminTenantAuditEvents } from "@/lib/api/admin-security";

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

describe("admin security api client", () => {
  it("lists tenant audit events with default query", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        events: [
          {
            id: "evt_1",
            tenant_id: "tenant-1",
            actor_user_id: "user-1",
            action: "tenant.plan.updated",
            resource_type: "tenant",
            resource_id: "tenant-1",
            metadata: { outcome: "success" },
            outcome: "success",
            created_at: "2026-03-05T08:00:00Z",
          },
        ],
      }),
    ) as typeof fetch;

    const response = await listAdminTenantAuditEvents("tenant-1");
    expect(response).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/audit-events",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lists tenant audit events with filters", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        events: [],
      }),
    ) as typeof fetch;

    await listAdminTenantAuditEvents("tenant-1", {
      action: "tenant.plan.updated",
      resource_type: "tenant",
      resource_id: "tenant-1",
      since: "2026-03-01T00:00:00Z",
      until: "2026-03-05T00:00:00Z",
      limit: 50,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/audit-events?action=tenant.plan.updated&resource_type=tenant&resource_id=tenant-1&since=2026-03-01T00%3A00%3A00Z&until=2026-03-05T00%3A00%3A00Z&limit=50",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
