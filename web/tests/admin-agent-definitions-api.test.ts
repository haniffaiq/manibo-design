import { afterEach, describe, expect, it, vi } from "vitest";

import {
  archiveAdminTenantAgentDefinitionVersion,
  createAdminTenantAgentDefinition,
  createAdminTenantAgentDefinitionVersion,
  getAdminTenantAgentDefinition,
  getAdminTenantAgentDefinitionByName,
  getAdminTenantAgentDefinitionArtifactByName,
  listAdminTenantAgentDefinitions,
  listAdminTenantAgentDefinitionVersions,
  publishAdminTenantAgentDefinitionVersion,
  retireAdminTenantAgentDefinition,
  reviewAdminTenantAgentDefinitionVersion,
  submitAdminTenantAgentDefinitionVersion,
  updateAdminTenantAgentDefinitionVersion,
} from "@/lib/api/admin-agent-definitions";

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

describe("admin agent definitions api client", () => {
  it("lists tenant agent definitions", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse([
        {
          id: "def-1",
          tenant_id: "tenant-1",
          name: "sales",
          status: "draft",
          published_version: null,
          created_at: "2026-03-05T00:00:00Z",
          updated_at: "2026-03-05T00:00:00Z",
        },
      ]),
    ) as typeof fetch;

    const response = await listAdminTenantAgentDefinitions("tenant-1", 50, 10);
    expect(response).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/agent-definitions?limit=50&offset=10",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("creates agent definition", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        id: "def-1",
        tenant_id: "tenant-1",
        name: "sales",
        status: "draft",
        published_version: null,
      }),
    ) as typeof fetch;

    const response = await createAdminTenantAgentDefinition("tenant-1", { name: "sales" });
    expect(response.id).toBe("def-1");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/agent-definitions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "sales" }),
      }),
    );
  });

  it("loads a single tenant agent definition", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        id: "def-1",
        tenant_id: "tenant-1",
        name: "sales",
        status: "draft",
        published_version: null,
        created_at: "2026-03-05T00:00:00Z",
        updated_at: "2026-03-05T00:00:00Z",
      }),
    ) as typeof fetch;

    const response = await getAdminTenantAgentDefinition("tenant-1", "def-1");
    expect(response.id).toBe("def-1");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/agent-definitions/def-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads a single tenant agent definition by name", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        id: "def-1",
        tenant_id: "tenant-1",
        name: "sales",
        status: "draft",
        published_version: null,
        created_at: "2026-03-05T00:00:00Z",
        updated_at: "2026-03-05T00:00:00Z",
      }),
    ) as typeof fetch;

    const response = await getAdminTenantAgentDefinitionByName("tenant-1", "sales");
    expect(response.id).toBe("def-1");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/agent-definitions/by-name/sales",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lists definition versions", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse([
        {
          id: "ver-1",
          agent_definition_id: "def-1",
          tenant_id: "tenant-1",
          version: 1,
          status: "draft",
          source_yaml: "name: sales",
          source_yaml_hash: "hash",
          compiled_hash: "compiled",
          model_policy_snapshot_ref: null,
          platform_defaults_version: null,
          created_at: "2026-03-05T00:00:00Z",
          submitted_at: null,
          published_at: null,
          review_decision: null,
          review_reason: null,
          review_submitted_at: null,
          review_decided_at: null,
        },
      ]),
    ) as typeof fetch;

    const response = await listAdminTenantAgentDefinitionVersions("tenant-1", "def-1");
    expect(response[0].version).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/agent-definitions/def-1/versions",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("creates definition version", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        id: "ver-1",
        agent_definition_id: "def-1",
        tenant_id: "tenant-1",
        version: 1,
        status: "draft",
        source_yaml_hash: "hash",
        compiled_hash: "compiled",
      }),
    ) as typeof fetch;

    const response = await createAdminTenantAgentDefinitionVersion("tenant-1", "def-1", {
      source_yaml: "name: sales",
      platform_defaults_version: "pd_v1",
      model_policy_snapshot_ref: "model_v1",
    });
    expect(response.version).toBe(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/agent-definitions/def-1/versions",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          source_yaml: "name: sales",
          platform_defaults_version: "pd_v1",
          model_policy_snapshot_ref: "model_v1",
        }),
      }),
    );
  });

  it("updates definition version with an optimistic concurrency hash", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        id: "ver-1",
        agent_definition_id: "def-1",
        tenant_id: "tenant-1",
        version: 1,
        status: "draft",
        source_yaml_hash: "hash-updated",
        compiled_hash: "compiled-updated",
      }),
    ) as typeof fetch;

    const response = await updateAdminTenantAgentDefinitionVersion("tenant-1", "def-1", 1, {
      source_yaml: "name: sales\nmission: updated",
      expected_source_yaml_hash: "hash-current",
    });

    expect(response.source_yaml_hash).toBe("hash-updated");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/agent-definitions/def-1/versions/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          source_yaml: "name: sales\nmission: updated",
          expected_source_yaml_hash: "hash-current",
        }),
      }),
    );
  });

  it("submits, reviews, and publishes a version", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse({ status: "submitted" }))
      .mockResolvedValueOnce(mockJsonResponse({ status: "approved" }))
      .mockResolvedValueOnce(mockJsonResponse({ status: "published" })) as typeof fetch;

    const submitted = await submitAdminTenantAgentDefinitionVersion("tenant-1", "def-1", 1);
    const reviewed = await reviewAdminTenantAgentDefinitionVersion("tenant-1", "def-1", 1, { decision: "approved" });
    const published = await publishAdminTenantAgentDefinitionVersion("tenant-1", "def-1", 1);

    expect(submitted.status).toBe("submitted");
    expect(reviewed.status).toBe("approved");
    expect(published.status).toBe("published");
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/platform/admin/tenants/tenant-1/agent-definitions/def-1/versions/1/submit",
      expect.objectContaining({ method: "POST" }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/platform/admin/tenants/tenant-1/agent-definitions/def-1/versions/1/review",
      expect.objectContaining({ method: "POST", body: JSON.stringify({ decision: "approved" }) }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "/api/platform/admin/tenants/tenant-1/agent-definitions/def-1/versions/1/publish",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("archives a non-live version", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ status: "archived" })) as typeof fetch;

    const archived = await archiveAdminTenantAgentDefinitionVersion("tenant-1", "def-1", 2);

    expect(archived.status).toBe("archived");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/agent-definitions/def-1/versions/2/archive",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("retires definition", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ status: "retired" })) as typeof fetch;

    const response = await retireAdminTenantAgentDefinition("tenant-1", "def-1");
    expect(response.status).toBe("retired");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/agent-definitions/def-1/retire",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("loads published artifact by name", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        agent_definition_id: "def-1",
        tenant_id: "tenant-1",
        name: "sales",
        version: 2,
        compiled_config: { mission: "provider mission" },
        compiled_hash: "compiled_hash",
      }),
    ) as typeof fetch;

    const response = await getAdminTenantAgentDefinitionArtifactByName("tenant-1", "sales");
    expect(response.version).toBe(2);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/agent-definitions/by-name/sales/artifact",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
