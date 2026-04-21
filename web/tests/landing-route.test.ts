import { describe, expect, it } from "vitest";

import { SessionRole } from "@/lib/auth_types";
import { resolveLandingRoute } from "@/lib/landing-route";

describe("resolveLandingRoute", () => {
  it("sends super_admin to /admin", () => {
    expect(resolveLandingRoute(SessionRole.SuperAdmin)).toBe("/admin");
  });

  it("keeps the client_admin fallback when no enabled solutions are visible", () => {
    expect(resolveLandingRoute(SessionRole.ClientAdmin)).toBe("/dashboard");
  });

  it("keeps the client_operator fallback when multiple enabled solutions are visible", () => {
    expect(resolveLandingRoute(SessionRole.ClientOperator, ["appointment_booking", "driver_verification"])).toBe(
      "/call-ops",
    );
  });

  it("routes a single appointment_booking tenant to the manifest default route", () => {
    expect(resolveLandingRoute(SessionRole.ClientAdmin, ["appointment_booking"])).toBe("/bookings");
  });

  it("routes a single driver_verification tenant to the manifest default route", () => {
    expect(resolveLandingRoute(SessionRole.ClientOperator, ["driver_verification"])).toBe(
      "/driver-verification/drivers",
    );
  });

  it("ignores unknown solutions and falls back safely", () => {
    expect(resolveLandingRoute(SessionRole.ClientOperator, ["unknown_solution"])).toBe("/call-ops");
  });

  it("sends client_operator to /call-ops when no enabled solutions are visible", () => {
    expect(resolveLandingRoute(SessionRole.ClientOperator)).toBe("/call-ops");
  });
});
