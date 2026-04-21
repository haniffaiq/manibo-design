import { afterEach, describe, expect, it, vi } from "vitest";

import {
  listAdminTenantSolutions,
  listTenantSolutions,
  updateAdminTenantSolution,
} from "@/lib/api/solutions";

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

describe("solutions api client", () => {
  it("lists tenant solutions", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        solutions: [
          {
            solution_name: "appointment_booking",
            enabled: true,
            version: "1.0.0",
            description: "Clinic appointment booking.",
            requires_enabled: [],
            optional_enabled: [],
            desired_revision: "latest",
            active_revision: "2026-03-01",
          },
        ],
      }),
    ) as typeof fetch;

    const response = await listTenantSolutions();
    expect(response.solutions).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/solutions",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lists admin tenant solutions", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        solutions: [],
      }),
    ) as typeof fetch;

    await listAdminTenantSolutions("tenant-1");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/solutions",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("updates tenant solution visibility", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        solution_name: "appointment_booking",
        enabled: false,
        version: "1.0.0",
        description: "Clinic appointment booking.",
        requires_enabled: [],
        optional_enabled: [],
        desired_revision: "latest",
        active_revision: "2026-03-01",
      }),
    ) as typeof fetch;

    await updateAdminTenantSolution("tenant-1", "appointment_booking", { enabled: false });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/solutions/appointment_booking",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ enabled: false }),
      }),
    );
  });
});
