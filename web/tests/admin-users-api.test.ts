import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deactivateAdminTenantUser,
  inviteAdminTenantUser,
  listAdminTenantUsers,
  removeAdminTenantUser,
  updateAdminTenantUserRole,
} from "@/lib/api/admin-users";

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

describe("admin users api client", () => {
  it("lists tenant users", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        users: [
          {
            user_id: "user-1",
            tenant_id: "tenant-1",
            email: "admin@example.com",
            display_name: "Admin",
            role: "client_admin",
            user_created_at: "2026-03-05T00:00:00Z",
            membership_created_at: "2026-03-05T00:00:00Z",
          },
        ],
      }),
    ) as typeof fetch;

    const response = await listAdminTenantUsers("tenant-1");
    expect(response.users).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/users",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("invites tenant user", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        user_id: "user-2",
        tenant_id: "tenant-1",
        email: "operator@example.com",
        display_name: "Operator",
        role: "client_operator",
        user_created_at: "2026-03-05T00:00:00Z",
        membership_created_at: "2026-03-05T00:00:00Z",
      }),
    ) as typeof fetch;

    const response = await inviteAdminTenantUser("tenant-1", {
      email: "operator@example.com",
      role: "client_operator",
      display_name: "Operator",
      subject: "google-oauth2|operator",
    });
    expect(response.user_id).toBe("user-2");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/users/invite",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          email: "operator@example.com",
          role: "client_operator",
          display_name: "Operator",
          subject: "google-oauth2|operator",
        }),
      }),
    );
  });

  it("updates tenant user role", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        user_id: "user-2",
        tenant_id: "tenant-1",
        email: "operator@example.com",
        display_name: "Operator",
        role: "client_admin",
        user_created_at: "2026-03-05T00:00:00Z",
        membership_created_at: "2026-03-05T00:00:00Z",
      }),
    ) as typeof fetch;

    const response = await updateAdminTenantUserRole("tenant-1", "user-2", { role: "client_admin" });
    expect(response.role).toBe("client_admin");
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/users/user-2/role",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ role: "client_admin" }),
      }),
    );
  });

  it("deactivates tenant user", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        user_id: "user-2",
        tenant_id: "tenant-1",
        removed: true,
      }),
    ) as typeof fetch;

    const response = await deactivateAdminTenantUser("tenant-1", "user-2");
    expect(response.removed).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/users/user-2/deactivate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("removes tenant user", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        user_id: "user-2",
        tenant_id: "tenant-1",
        removed: true,
      }),
    ) as typeof fetch;

    const response = await removeAdminTenantUser("tenant-1", "user-2");
    expect(response.removed).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/tenants/tenant-1/users/user-2",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
