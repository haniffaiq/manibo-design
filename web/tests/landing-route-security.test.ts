import { afterEach, describe, expect, it, vi } from "vitest";

import { SessionRole } from "@/lib/auth_types";

const { getManifestByIdMock, getManifestDefaultTenantRouteMock } = vi.hoisted(() => ({
  getManifestByIdMock: vi.fn(),
  getManifestDefaultTenantRouteMock: vi.fn(),
}));

vi.mock("@/solutions/registry", () => ({
  getManifestById: getManifestByIdMock,
  getManifestDefaultTenantRoute: getManifestDefaultTenantRouteMock,
}));

import { resolveLandingRoute } from "@/lib/landing-route";

describe("landing route safety", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("ignores unsafe manifest tenant routes that would become external redirects", () => {
    getManifestByIdMock.mockReturnValue({ id: "appointment_booking" });
    getManifestDefaultTenantRouteMock.mockReturnValue("//evil.example");

    expect(resolveLandingRoute(SessionRole.ClientAdmin, ["appointment_booking"])).toBe("/dashboard");
  });
});
