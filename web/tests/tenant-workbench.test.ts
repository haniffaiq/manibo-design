import { describe, expect, it } from "vitest";

import { SessionRole } from "@/lib/auth_types";
import type { SolutionUIManifest } from "@/lib/solution-manifest-types";
import { buildTenantWorkbenchSections } from "@/lib/tenant-workbench";
import { getTenantCopy } from "@/lib/tenant-locale";
import { getManifestDefaultTenantRoute, getSolutionNavItems } from "@/solutions/registry";

describe("tenant workbench composition", () => {
  const copy = getTenantCopy("en");
  const buildEnabled = new Set(["appointment_booking", "driver_verification"]);

  it("keeps operator shells focused on daily work", () => {
    const sections = buildTenantWorkbenchSections(
      copy,
      SessionRole.ClientOperator,
      getSolutionNavItems(buildEnabled, SessionRole.ClientOperator),
    );

    expect(sections).toHaveLength(5);
    expect(sections[0]?.items.map((item) => item.href)).toEqual(["/dashboard"]);
    expect(sections[1]?.title).toBe("Live Support");
    expect(sections[1]?.items.map((item) => item.href)).toEqual(["/call-ops", "/call-ops/alerts"]);
    expect(sections[2]?.title).toBe("Review");
    expect(sections[2]?.items.map((item) => item.href)).toEqual(["/call-ops/history", "/observability"]);
    expect(sections[3]?.title).toBe("Clinic");
    expect(sections[3]?.items.map((item) => item.href)).toEqual(["/bookings"]);
    expect(sections[4]?.title).toBe("Logistics");
    expect(sections[4]?.items.map((item) => item.href)).toEqual(["/driver-verification/drivers"]);
  });

  it("keeps admin-only setup routes out of operator manifests", () => {
    const operatorRoutes = getSolutionNavItems(buildEnabled, SessionRole.ClientOperator)
      .flatMap((manifest) => manifest.routes)
      .map((route) => route.path);

    expect(operatorRoutes).not.toContain("/clinic/knowledge-base");
  });

  it("includes manage surfaces for client admins", () => {
    const sections = buildTenantWorkbenchSections(
      copy,
      SessionRole.ClientAdmin,
      getSolutionNavItems(buildEnabled, SessionRole.ClientAdmin),
    );

    expect(sections).toHaveLength(6);
    expect(sections[1]?.title).toBe("Live Support");
    expect(sections[1]?.items.map((item) => item.href)).toEqual(["/call-ops", "/call-ops/alerts"]);
    expect(sections[2]?.title).toBe("Review");
    expect(sections[2]?.items.map((item) => item.href)).toContain("/automations");
    expect(sections[3]?.title).toBe("Clinic");
    expect(sections[3]?.items.map((item) => item.href)).toEqual(["/bookings", "/clinic/knowledge-base"]);
    expect(sections[4]?.title).toBe("Logistics");
    expect(sections[4]?.items.map((item) => item.href)).toEqual(["/driver-verification/drivers"]);
    expect(sections[5]?.title).toBe("Manage");
    expect(sections[5]?.items.map((item) => item.href)).toEqual([
      "/team",
      "/activity",
      "/integrations",
      "/settings/recordings",
    ]);
  });

  it("prefers an explicit manifest-owned default tenant route over nav order", () => {
    const manifest: SolutionUIManifest = {
      id: "custom_solution",
      name: "Custom solution",
      defaultTenantRoute: "/custom/queue",
      routes: [
        {
          path: "/custom/history",
          label: "History",
          section: "tenant",
          icon: "clock",
          navPriority: 10,
        },
        {
          path: "/custom/queue",
          label: "Queue",
          section: "tenant",
          icon: "list",
          navPriority: 50,
        },
      ],
    };

    expect(getManifestDefaultTenantRoute(manifest, SessionRole.ClientAdmin)).toBe("/custom/queue");
  });

  it("falls back to the lowest-priority visible tenant route when no explicit default exists", () => {
    const manifest: SolutionUIManifest = {
      id: "custom_solution",
      name: "Custom solution",
      routes: [
        {
          path: "/custom/history",
          label: "History",
          section: "tenant",
          icon: "clock",
          navPriority: 30,
        },
        {
          path: "/custom/queue",
          label: "Queue",
          section: "tenant",
          icon: "list",
          navPriority: 10,
        },
      ],
    };

    expect(getManifestDefaultTenantRoute(manifest, SessionRole.ClientAdmin)).toBe("/custom/queue");
  });
});
