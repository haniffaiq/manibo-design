import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createAdminTenantPhoneChannel,
  deleteAdminTenantPhoneChannel,
  listAdminTenantPhoneChannels,
  updateAdminTenantPhoneChannel,
} from "@/lib/api/phone-numbers";

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

describe("phone channels api client", () => {
  it("lists phone channels for a tenant", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ phone_channels: [] })) as typeof fetch;

    await listAdminTenantPhoneChannels("tenant-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/phone-channels",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lists phone channels filtered by agent_definition_id", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ phone_channels: [] })) as typeof fetch;

    await listAdminTenantPhoneChannels("tenant-1", "agent-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/phone-channels?agent_definition_id=agent-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("creates a tenant phone channel record", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        id: "pn-1",
        tenant_id: "tenant-1",
        phone_number: "+37061234567",
        sip_trunk_id: "trunk-a",
        active: true,
        agent_definition_id: "agent-1",
        agent_name: "Appointment Intake",
        agent_status: "published",
        published_version: 3,
        routing_ready: true,
        created_at: "2026-03-06T10:00:00Z",
      }),
    ) as typeof fetch;

    await createAdminTenantPhoneChannel("tenant-1", {
      phone_number: "+37061234567",
      sip_trunk_id: "trunk-a",
      agent_definition_id: "agent-1",
      active: true,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/phone-channels",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          phone_number: "+37061234567",
          sip_trunk_id: "trunk-a",
          agent_definition_id: "agent-1",
          active: true,
        }),
      }),
    );
  });

  it("updates a tenant phone channel record", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        id: "pn-1",
        tenant_id: "tenant-1",
        phone_number: "+37061234567",
        sip_trunk_id: "trunk-b",
        active: false,
        agent_definition_id: "agent-1",
        agent_name: "Appointment Intake",
        agent_status: "published",
        published_version: 3,
        routing_ready: false,
        created_at: "2026-03-06T10:00:00Z",
      }),
    ) as typeof fetch;

    await updateAdminTenantPhoneChannel("tenant-1", "pn-1", {
      sip_trunk_id: "trunk-b",
      active: false,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/phone-channels/pn-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({
          sip_trunk_id: "trunk-b",
          active: false,
        }),
      }),
    );
  });

  it("deletes a tenant phone channel record", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(new Response(null, { status: 204 })) as typeof fetch;

    await deleteAdminTenantPhoneChannel("tenant-1", "pn-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/phone-channels/pn-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
