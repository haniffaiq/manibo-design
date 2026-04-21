import { describe, expect, it } from "vitest";

import { SessionRole } from "@/lib/auth_types";
import {
  BUILD_ENABLED_SOLUTIONS,
  formatSolutionLabel,
  formatSolutionNavLabel,
  intersectWithBuildEnabledSolutions,
  isBuildEnabledSolution,
  parseBuildEnabledSolutions,
} from "@/lib/solutions";
import { getSolutionNavItems, getSolutionObservabilityContributions } from "@/solutions/registry";

describe("solutions helpers", () => {
  it("formats known solution labels for business users", () => {
    expect(formatSolutionLabel("appointment_booking")).toBe("Appointment booking");
    expect(formatSolutionLabel("driver_verification")).toBe("Driver verification");
  });

  it("formats known navigation labels", () => {
    expect(formatSolutionNavLabel("appointment_booking")).toBe("Bookings");
    expect(formatSolutionNavLabel("driver_verification")).toBe("Drivers");
  });

  it("humanizes unknown solution names", () => {
    expect(formatSolutionLabel("custom_voice_agent")).toBe("Custom Voice Agent");
    expect(formatSolutionNavLabel("custom_voice_agent")).toBe("Custom Voice Agent");
  });

  it("parses build-enabled solutions from environment text", () => {
    expect(parseBuildEnabledSolutions(" appointment_booking,driver_verification,invalid-value! ")).toEqual(
      new Set(["appointment_booking", "driver_verification"]),
    );
  });

  it("defaults the full-platform build to every generated solution manifest when no env filter is set", () => {
    expect(BUILD_ENABLED_SOLUTIONS).toEqual(new Set(["appointment_booking", "driver_verification"]));
  });

  it("intersects tenant visibility with shipped solution routes", () => {
    const buildEnabled = new Set(["appointment_booking"]);

    expect(intersectWithBuildEnabledSolutions(["appointment_booking", "driver_verification"], buildEnabled)).toEqual([
      "appointment_booking",
    ]);
    expect(isBuildEnabledSolution("driver_verification", buildEnabled)).toBe(false);
  });

  it("filters solution nav routes by role", () => {
    const buildEnabled = new Set(["appointment_booking"]);

    const operatorRoutes = getSolutionNavItems(buildEnabled, SessionRole.ClientOperator)
      .flatMap((manifest) => manifest.routes)
      .map((route) => route.path);
    const adminRoutes = getSolutionNavItems(buildEnabled, SessionRole.ClientAdmin)
      .flatMap((manifest) => manifest.routes)
      .map((route) => route.path);

    expect(operatorRoutes).toEqual(["/bookings"]);
    expect(adminRoutes).toEqual(["/bookings", "/clinic/knowledge-base"]);
  });

  it("returns manifest-owned observability contributions for enabled solutions", () => {
    expect(getSolutionObservabilityContributions(new Set(["appointment_booking", "driver_verification"]))).toEqual([
      expect.objectContaining({ key: "appointment_booking" }),
      expect.objectContaining({ key: "driver_verification" }),
    ]);
  });

  it("identifies solutions not shipped in the deployment bundle as unshipped", () => {
    const narrowBundle = new Set(["appointment_booking"]);

    expect(isBuildEnabledSolution("appointment_booking", narrowBundle)).toBe(true);
    expect(isBuildEnabledSolution("driver_verification", narrowBundle)).toBe(false);
    expect(isBuildEnabledSolution("telematics_ingestion", narrowBundle)).toBe(false);
  });

  it("excludes tenant-enabled but unshipped solutions from visible set", () => {
    const narrowBundle = new Set(["appointment_booking"]);
    const tenantEnabled = ["appointment_booking", "driver_verification", "telematics_ingestion"];

    const visible = intersectWithBuildEnabledSolutions(tenantEnabled, narrowBundle);
    expect(visible).toEqual(["appointment_booking"]);
  });

  it("returns empty visible set when no solutions are shipped", () => {
    const emptyBundle = new Set<string>();
    const tenantEnabled = ["appointment_booking", "driver_verification"];

    expect(intersectWithBuildEnabledSolutions(tenantEnabled, emptyBundle)).toEqual([]);
  });
});
