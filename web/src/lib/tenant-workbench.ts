import { SessionRole } from "@/lib/auth_types";
import type { SolutionUIManifest } from "@/lib/solution-manifest-types";
import type { TenantCopy } from "@/lib/tenant-locale";

export type TenantWorkbenchIcon =
  | "dashboard"
  | "phone"
  | "activity"
  | "users"
  | "shield"
  | "layers"
  | "settings"
  | string;

export interface TenantWorkbenchNavItem {
  label: string;
  href: string;
  icon: TenantWorkbenchIcon;
  navPriority?: number;
  badge?: string | number | null;
}

export interface TenantWorkbenchSection {
  title?: string;
  items: TenantWorkbenchNavItem[];
}

const SOLUTION_SECTION_KEYS: Record<string, keyof TenantCopy["shell"]["sections"]> = {
  appointment_booking: "clinic",
  driver_verification: "logistics",
};

function buildSolutionDomainSections(
  copy: TenantCopy,
  manifests: SolutionUIManifest[],
): TenantWorkbenchSection[] {
  const navCopy = copy.shell.nav as Record<string, string>;
  return manifests
    .filter((manifest) => manifest.routes.some((route) => route.section === "tenant"))
    .map((manifest) => {
      const sectionKey = SOLUTION_SECTION_KEYS[manifest.id];
      const title = sectionKey ? copy.shell.sections[sectionKey] : manifest.name;
      const items = manifest.routes
        .filter((route) => route.section === "tenant")
        .map((route) => ({
          label: (route.navCopyKey && navCopy[route.navCopyKey]) || route.label,
          href: route.path,
          icon: route.icon,
          navPriority: route.navPriority ?? 99,
        }))
        .sort((left, right) => (left.navPriority ?? 99) - (right.navPriority ?? 99));
      return { title, items };
    })
    .filter((section) => section.items.length > 0);
}

export function buildTenantWorkbenchSections(
  copy: TenantCopy,
  role: SessionRole,
  manifests: SolutionUIManifest[],
): TenantWorkbenchSection[] {
  const sections: TenantWorkbenchSection[] = [
    {
      items: [{ label: copy.shell.nav.dashboard, href: "/dashboard", icon: "dashboard" }],
    },
    {
      title: copy.shell.sections.liveSupport,
      items: [
        { label: copy.shell.nav.callOps, href: "/call-ops", icon: "phone" },
        { label: copy.shell.nav.alerts, href: "/call-ops/alerts", icon: "phone" },
      ],
    },
  ];

  const reviewItems: TenantWorkbenchNavItem[] = [
    { label: copy.shell.nav.callHistory, href: "/call-ops/history", icon: "phone" },
  ];
  if (role !== SessionRole.ClientOperator) {
    reviewItems.push({ label: copy.shell.nav.automations, href: "/automations", icon: "activity" });
  }
  sections.push({ title: copy.shell.sections.review, items: reviewItems });

  sections.push(...buildSolutionDomainSections(copy, manifests));

  if (role !== SessionRole.ClientOperator) {
    sections.push({
      title: copy.shell.sections.manage,
      items: [
        { label: copy.shell.nav.team, href: "/team", icon: "users" },
        { label: copy.shell.nav.activity, href: "/activity", icon: "shield" },
        { label: copy.shell.nav.integrations, href: "/integrations", icon: "layers" },
      ],
    });
  }

  return sections;
}
