import type { SolutionUIManifest } from "@/lib/solution-manifest-types";

export interface DeploymentWorkbenchNavItem {
  label: string;
  href: string;
  icon: string;
  navPriority?: number;
}

export interface DeploymentWorkbenchSection {
  title?: string;
  items: DeploymentWorkbenchNavItem[];
}

const PLATFORM_SECTIONS: DeploymentWorkbenchSection[] = [
  {
    items: [{ label: "Dashboard", href: "/admin", icon: "dashboard" }],
  },
  {
    title: "Tenants & Access",
    items: [
      { label: "Tenants", href: "/admin/tenants", icon: "Building" },
      { label: "Solutions", href: "/admin/solutions", icon: "layers" },
      { label: "Users", href: "/admin/users", icon: "users" },
    ],
  },
  {
    title: "Agents",
    items: [
      { label: "Agent Definitions", href: "/admin/agent-definitions", icon: "Code" },
      { label: "Telephony", href: "/admin/telephony", icon: "phone" },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Audit", href: "/admin/audit", icon: "shield" },
      { label: "Calls", href: "/admin/calls", icon: "phone" },
    ],
  },
];

function buildSolutionDeploymentSections(manifests: SolutionUIManifest[]): DeploymentWorkbenchSection[] {
  return manifests
    .filter((manifest) => manifest.routes.some((route) => route.section === "deployment"))
    .map((manifest) => {
      const items = manifest.routes
        .filter((route) => route.section === "deployment")
        .map((route) => ({
          label: route.label,
          href: route.path,
          icon: route.icon,
          navPriority: route.navPriority ?? 99,
        }))
        .sort((a, b) => (a.navPriority ?? 99) - (b.navPriority ?? 99));
      return { title: manifest.name, items };
    })
    .filter((section) => section.items.length > 0);
}

/** Build deployment console nav sections from platform defaults + solution manifests. */
export function buildDeploymentWorkbenchSections(
  manifests: SolutionUIManifest[],
): DeploymentWorkbenchSection[] {
  const sections = PLATFORM_SECTIONS.map((s) => ({ ...s, items: [...s.items] }));

  const solutionSections = buildSolutionDeploymentSections(manifests);
  if (solutionSections.length > 0) {
    // Insert solution sections before the final "Platform" section
    const platformSection = sections.pop()!;
    sections.push(...solutionSections, platformSection);
  }

  return sections;
}
