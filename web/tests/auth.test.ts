import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionRole } from "@/lib/auth_types";
import { resolveSessionLandingRoute } from "@/lib/auth";

const { resolveCurrentTenantLandingRouteMock } = vi.hoisted(() => ({
  resolveCurrentTenantLandingRouteMock: vi.fn(),
}));

vi.mock("@/lib/landing-route-server", () => ({
  resolveCurrentTenantLandingRoute: resolveCurrentTenantLandingRouteMock,
}));

describe("auth session landing routes", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("revalidates the tenant landing path when current solution state is available", async () => {
    resolveCurrentTenantLandingRouteMock.mockResolvedValue("/dashboard");

    await expect(
      resolveSessionLandingRoute({
        role: SessionRole.ClientAdmin,
        landingPath: "/bookings",
      }, { bearerToken: "jwt-token" }),
    ).resolves.toBe("/dashboard");

    expect(resolveCurrentTenantLandingRouteMock).toHaveBeenCalledWith(SessionRole.ClientAdmin, { bearerToken: "jwt-token" });
  });

  it("falls back to the stored session landing path when revalidation is unavailable", async () => {
    resolveCurrentTenantLandingRouteMock.mockResolvedValue(null);

    await expect(
      resolveSessionLandingRoute({
        role: SessionRole.ClientAdmin,
        landingPath: "/bookings",
      }, { bearerToken: null }),
    ).resolves.toBe("/bookings");

    expect(resolveCurrentTenantLandingRouteMock).toHaveBeenCalledWith(SessionRole.ClientAdmin, { bearerToken: null });
  });

  it("ignores unsafe stored landing paths and falls back to the role-safe route when revalidation is unavailable", async () => {
    resolveCurrentTenantLandingRouteMock.mockResolvedValue(null);

    await expect(
      resolveSessionLandingRoute({
        role: SessionRole.ClientOperator,
        landingPath: "https://evil.invalid",
      }, { bearerToken: null }),
    ).resolves.toBe("/call-ops");

    expect(resolveCurrentTenantLandingRouteMock).toHaveBeenCalledWith(SessionRole.ClientOperator, { bearerToken: null });
  });
});
