import type { SolutionUIManifest } from "@/lib/solution-manifest-types";
import type { SessionRole } from "@/lib/auth_types";
import { GENERATED_SOLUTION_MANIFESTS } from "@/lib/generated-solution-manifests";

export const SOLUTION_MANIFESTS: SolutionUIManifest[] = GENERATED_SOLUTION_MANIFESTS;

export function getManifestById(id: string): SolutionUIManifest | undefined {
  return SOLUTION_MANIFESTS.find((m) => m.id === id);
}

export function getSolutionNavItems(
  enabledSolutions: ReadonlySet<string>,
  role?: SessionRole,
): SolutionUIManifest[] {
  return SOLUTION_MANIFESTS.flatMap((manifest) => {
    if (!enabledSolutions.has(manifest.id)) {
      return [];
    }
    const routes = manifest.routes.filter((route) => !role || !route.roles || route.roles.includes(role));
    if (routes.length === 0) {
      return [];
    }
    return [{ ...manifest, routes }];
  });
}

export function getManifestDefaultTenantRoute(
  manifest: SolutionUIManifest,
  role?: SessionRole,
): string | null {
  const tenantRoutes = manifest.routes.filter(
    (route) => route.section === "tenant" && (!role || !route.roles || route.roles.includes(role)),
  );
  if (tenantRoutes.length === 0) {
    return null;
  }

  if (manifest.defaultTenantRoute) {
    const explicitRoute = tenantRoutes.find((route) => route.path === manifest.defaultTenantRoute);
    if (explicitRoute) {
      return explicitRoute.path;
    }
  }

  return tenantRoutes.toSorted((left, right) => (left.navPriority ?? 99) - (right.navPriority ?? 99))[0]?.path ?? null;
}

export function getSolutionObservabilityContributions(enabledSolutions: ReadonlySet<string>) {
  return SOLUTION_MANIFESTS.flatMap((manifest) =>
    enabledSolutions.has(manifest.id) ? manifest.observability ?? [] : [],
  );
}
