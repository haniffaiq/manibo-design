import { describe, expect, it } from "vitest";

import { SessionRole } from "@/lib/auth_types";
import { getTenantCopy } from "@/lib/tenant-locale";

function canManageTeam(role: SessionRole): boolean {
  return role === SessionRole.ClientAdmin || role === SessionRole.SuperAdmin;
}

describe("team page role gating", () => {
  it("client admin can manage team", () => {
    expect(canManageTeam(SessionRole.ClientAdmin)).toBe(true);
  });

  it("client operator cannot manage team", () => {
    expect(canManageTeam(SessionRole.ClientOperator)).toBe(false);
  });

  it("super admin can manage team", () => {
    expect(canManageTeam(SessionRole.SuperAdmin)).toBe(true);
  });

  it("team copy uses explicit client role language", () => {
    const copy = getTenantCopy("en");
    expect(copy.team.adminOnlyTitle).toContain("Client Admin");
    expect(copy.team.adminOnlyMessage).toContain("Client Admin");
  });

  it("team copy exists in Lithuanian", () => {
    const ltCopy = getTenantCopy("lt");
    expect(ltCopy.team.adminOnlyTitle).toBeTruthy();
    expect(ltCopy.team.adminOnlyMessage).toBeTruthy();
  });
});
