import { describe, expect, it } from "vitest";

import { buildDeploymentWorkbenchSections } from "@/lib/deployment-workbench";
import type { SolutionUIManifest } from "@/lib/solution-manifest-types";

describe("deployment workbench composition", () => {
  it("returns platform sections when no solution manifests are provided", () => {
    const sections = buildDeploymentWorkbenchSections([]);

    expect(sections.map((s) => s.title)).toEqual([
      undefined,
      "Tenants & Access",
      "Agents",
      "Operations",
      "Platform",
    ]);
    expect(sections[0]?.items.map((i) => i.href)).toEqual(["/admin"]);
    expect(sections[1]?.items.map((i) => i.href)).toEqual(["/admin/tenants", "/admin/solutions", "/admin/users"]);
    expect(sections[2]?.items.map((i) => i.href)).toEqual(["/admin/agent-definitions", "/admin/telephony"]);
  });

  it("appends solution deployment sections before Platform", () => {
    const manifests: SolutionUIManifest[] = [
      {
        id: "custom_solution",
        name: "Custom Solution",
        routes: [
          { path: "/admin/custom/overview", label: "Overview", section: "deployment", icon: "dashboard" },
          { path: "/admin/custom/config", label: "Config", section: "deployment", icon: "settings", navPriority: 5 },
        ],
      },
    ];

    const sections = buildDeploymentWorkbenchSections(manifests);

    expect(sections.map((s) => s.title)).toEqual([
      undefined,
      "Tenants & Access",
      "Agents",
      "Operations",
      "Custom Solution",
      "Platform",
    ]);
    // Solution items sorted by navPriority
    const customSection = sections.find((s) => s.title === "Custom Solution");
    expect(customSection?.items.map((i) => i.href)).toEqual(["/admin/custom/config", "/admin/custom/overview"]);
  });

  it("returns independent arrays on repeated calls (no shared mutation)", () => {
    const first = buildDeploymentWorkbenchSections([]);
    first[0]!.items.push({ label: "Injected", href: "/injected", icon: "dashboard" });

    const second = buildDeploymentWorkbenchSections([]);
    expect(second[0]!.items.map((i) => i.href)).toEqual(["/admin"]);
  });

  it("ignores manifests that only have tenant or admin routes", () => {
    const manifests: SolutionUIManifest[] = [
      {
        id: "tenant_only",
        name: "Tenant Only",
        routes: [{ path: "/bookings", label: "Bookings", section: "tenant", icon: "Calendar" }],
      },
    ];

    const sections = buildDeploymentWorkbenchSections(manifests);

    expect(sections.map((s) => s.title)).toEqual([
      undefined,
      "Tenants & Access",
      "Agents",
      "Operations",
      "Platform",
    ]);
  });
});
