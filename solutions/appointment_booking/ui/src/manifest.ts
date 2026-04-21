import { SessionRole } from "@grove/web-shared/types/auth";
import type { SolutionUIManifest } from "@grove/web-shared/types/solution-manifest";

export const manifest: SolutionUIManifest = {
  id: "appointment_booking",
  name: "Appointment booking",
  navLabel: "Bookings",
  defaultTenantRoute: "/bookings",
  routes: [
    {
      path: "/bookings",
      label: "Bookings",
      section: "tenant",
      icon: "Calendar",
      navCopyKey: "bookings",
      navGroup: "operations",
      navPriority: 10,
    },
    {
      path: "/clinic/knowledge-base",
      label: "Clinic Knowledge Base",
      section: "tenant",
      icon: "BookOpen",
      navCopyKey: "knowledgeBase",
      navGroup: "operations",
      navPriority: 11,
      roles: [SessionRole.ClientAdmin],
    },
  ],
  observability: [
    {
      key: "appointment_booking",
      label: "Booking outcomes",
      detail:
        "Booking extraction, ownership, and callback state belong inside the shared evidence rail instead of a separate clinic-only observability screen.",
      state: "partial",
    },
  ],
};
