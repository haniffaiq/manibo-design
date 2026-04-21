import { describe, expect, it } from "vitest";

import {
  defaultEnabledSolutions,
  enabledRouteConfigs,
  parseEnabledSolutions,
  SOLUTION_ROUTE_CONFIGS,
} from "../scripts/solution-route-config.mjs";

describe("solution route generation", () => {
  it("maps enabled solutions to generated tenant routes", () => {
    const enabled = parseEnabledSolutions("driver_verification");
    const routes = enabledRouteConfigs(enabled);

    expect(routes).toEqual([
      expect.objectContaining({
        solutionName: "driver_verification",
        routePath: "/driver-verification/drivers",
      }),
    ]);
  });

  it("does not generate routes for disabled solutions", () => {
    const enabled = parseEnabledSolutions("driver_verification");
    const routes = enabledRouteConfigs(enabled).map((route) => route.routePath);

    expect(routes).not.toContain("/bookings");
    expect(SOLUTION_ROUTE_CONFIGS.some((route) => route.routePath === "/bookings")).toBe(true);
  });

  it("ignores valid-but-unknown solution ids instead of breaking shared builds", () => {
    const enabled = parseEnabledSolutions("partner_custom_portal");

    expect(enabled).toEqual(new Set(["partner_custom_portal"]));
    expect(enabledRouteConfigs(enabled)).toEqual([]);
  });

  it("ships the current shared solution UI set when no build filter is provided", () => {
    const enabled = parseEnabledSolutions("");

    expect(enabledRouteConfigs(enabled).map((route) => route.routePath)).toEqual([
      "/bookings",
      "/driver-verification/drivers",
    ]);
  });

  it("derives the default build allowlist from installed solution UI packages", () => {
    // defaultEnabledSolutions now checks if solutions/{name}/ui/package.json exists
    // Both appointment_booking and driver_verification have UI packages installed
    const enabled = defaultEnabledSolutions();

    expect(enabled.has("appointment_booking")).toBe(true);
    expect(enabled.has("driver_verification")).toBe(true);
  });
});
