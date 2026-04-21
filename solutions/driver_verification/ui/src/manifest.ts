import type { SolutionUIManifest } from "@grove/web-shared/types/solution-manifest";

export const manifest: SolutionUIManifest = {
  id: "driver_verification",
  name: "Driver verification",
  navLabel: "Drivers",
  defaultTenantRoute: "/driver-verification/drivers",
  routes: [
    {
      path: "/driver-verification/drivers",
      label: "Drivers",
      section: "tenant",
      icon: "Truck",
      navCopyKey: "drivers",
      navGroup: "operations",
      navPriority: 20,
    },
  ],
  observability: [
    {
      key: "driver_verification",
      label: "Driver review evidence",
      detail:
        "Pre-call enrichment, discrepancy review, and outbound follow-up outcomes enrich the same case workspace instead of creating a separate logistics-only evidence lane.",
      state: "partial",
    },
  ],
};
