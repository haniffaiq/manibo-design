import { afterEach, describe, expect, it, vi } from "vitest";

import {
  deactivateTeamUser,
  inviteTeamUser,
  listTeamUsers,
  removeTeamUser,
  updateTeamUserRole,
} from "@/lib/api/team";

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

describe("team api client", () => {
  it("lists team users", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        users: [
          {
            user_id: "u1",
            tenant_id: "t1",
            email: "admin@example.com",
            display_name: "Admin",
            role: "client_admin",
            user_created_at: "2026-01-01T00:00:00Z",
            membership_created_at: "2026-01-01T00:00:00Z",
          },
        ],
      }),
    ) as typeof fetch;

    const data = await listTeamUsers();
    expect(data.users).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/team/users",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("invites team user", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        user_id: "u2",
        tenant_id: "t1",
        email: "ops@example.com",
        display_name: "Ops",
        role: "client_operator",
        user_created_at: "2026-01-02T00:00:00Z",
        membership_created_at: "2026-01-02T00:00:00Z",
      }),
    ) as typeof fetch;

    await inviteTeamUser({ email: "ops@example.com", role: "client_operator", display_name: "Ops" });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/team/users/invite",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "ops@example.com", role: "client_operator", display_name: "Ops" }),
      }),
    );
  });

  it("updates role and deletes membership", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(mockJsonResponse({ user_id: "u2", role: "client_admin" }))
      .mockResolvedValueOnce(mockJsonResponse({ user_id: "u2", removed: true, tenant_id: "t1" }))
      .mockResolvedValueOnce(mockJsonResponse({ user_id: "u2", removed: true, tenant_id: "t1" })) as typeof fetch;

    await updateTeamUserRole("u2", { role: "client_admin" });
    await deactivateTeamUser("u2");
    await removeTeamUser("u2");

    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/platform/team/users/u2/role",
      expect.objectContaining({ method: "PATCH" }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/platform/team/users/u2/deactivate",
      expect.objectContaining({ method: "POST" }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      "/api/platform/team/users/u2",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});

