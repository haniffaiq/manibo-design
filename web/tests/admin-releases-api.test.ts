import { afterEach, describe, expect, it, vi } from "vitest";

import {
  applyAdminTenantRelease,
  createAdminRelease,
  getAdminReleaseComponents,
  getAdminTenantReleaseAssignment,
  listAdminReleases,
} from "@/lib/api/admin-releases";

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

describe("admin releases api client", () => {
  it("lists releases", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse([
        {
          id: "release-1",
          name: "wave-9-hardened",
          created_by: "user-1",
          created_at: "2026-03-05T00:00:00Z",
          notes: "notes",
          component_count: 2,
        },
      ]),
    ) as typeof fetch;

    const response = await listAdminReleases(50, 10);
    expect(response).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/releases?limit=50&offset=10",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("gets release components", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse([
        {
          id: "component-1",
          release_id: "release-1",
          component_type: "solution",
          name: "appointment_booking",
          version: "v2",
          metadata: { track: "stable" },
        },
      ]),
    ) as typeof fetch;

    const response = await getAdminReleaseComponents("release-1");
    expect(response[0].name).toBe("appointment_booking");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/releases/release-1/components",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("creates release", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ release_id: "release-1" })) as typeof fetch;

    const response = await createAdminRelease({
      name: "wave-9-hardened",
      notes: "notes",
      solution_versions: {},
      model_policy_version: "policy_v2",
      platform_defaults_version: "pd_v2",
      agent_definition_versions: { assistant: "2" },
    });

    expect(response.release_id).toBe("release-1");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/releases",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "wave-9-hardened",
          notes: "notes",
          solution_versions: {},
          model_policy_version: "policy_v2",
          platform_defaults_version: "pd_v2",
          agent_definition_versions: { assistant: "2" },
        }),
      }),
    );
  });

  it("reads tenant release assignment", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        tenant_id: "tenant-1",
        desired_release_id: "release-1",
        active_release_id: null,
        status: "pending",
        attempt_count: 0,
        last_error: null,
        rollout_started_at: null,
        rollout_completed_at: null,
        updated_at: "2026-03-05T00:00:00Z",
      }),
    ) as typeof fetch;

    const response = await getAdminTenantReleaseAssignment("tenant-1");
    expect(response.status).toBe("pending");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/release",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("applies tenant release", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        tenant_id: "tenant-1",
        desired_release_id: "release-1",
        active_release_id: null,
        status: "running",
        attempt_count: 1,
        last_error: null,
        rollout_started_at: "2026-03-05T00:00:00Z",
        rollout_completed_at: null,
        updated_at: "2026-03-05T00:00:00Z",
      }),
    ) as typeof fetch;

    const response = await applyAdminTenantRelease("tenant-1", {
      release_id: "release-1",
      wait: false,
    });

    expect(response.status).toBe("running");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/release",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ release_id: "release-1", wait: false }),
      }),
    );
  });
});
