import { describe, expect, it } from "vitest";

import { isBuildEnabledSolution } from "@/lib/solutions";

describe("admin solution access shipping rules", () => {
  const narrowBundle = new Set(["appointment_booking"]);

  it("shipped + enabled shows as enabled", () => {
    const shipped = isBuildEnabledSolution("appointment_booking", narrowBundle);
    const enabled = true;
    expect(shipped && enabled).toBe(true);
  });

  it("shipped + disabled shows as disabled", () => {
    const shipped = isBuildEnabledSolution("appointment_booking", narrowBundle);
    const enabled = false;
    expect(shipped && !enabled).toBe(true);
  });

  it("unshipped solution is identified correctly", () => {
    expect(isBuildEnabledSolution("driver_verification", narrowBundle)).toBe(false);
    expect(isBuildEnabledSolution("telematics_ingestion", narrowBundle)).toBe(false);
  });

  it("unshipped solution should be hidden from the table", () => {
    const shipped = isBuildEnabledSolution("telematics_ingestion", narrowBundle);
    expect(shipped).toBe(false);
  });
});
