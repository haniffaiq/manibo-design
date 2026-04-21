import { SessionRole } from "@/lib/auth_types";
import { sanitizeSessionLandingPath } from "@/lib/session_cookie";
import { getManifestById, getManifestDefaultTenantRoute } from "@/solutions/registry";

const LANDING_ROUTES: Record<SessionRole, string> = {
  [SessionRole.SuperAdmin]: "/admin",
  [SessionRole.ClientAdmin]: "/dashboard",
  [SessionRole.ClientOperator]: "/call-ops",
};

/** Resolve the default landing route for a given role and visible tenant solutions. */
export function resolveLandingRoute(role: SessionRole, enabledSolutionNames: readonly string[] = []): string {
  if (role !== SessionRole.SuperAdmin) {
    const visibleSolutionNames = Array.from(
      new Set(enabledSolutionNames.filter((solutionName) => getManifestById(solutionName) !== undefined)),
    );
    if (visibleSolutionNames.length === 1) {
      const manifest = getManifestById(visibleSolutionNames[0]);
      const defaultTenantRoute = manifest ? getManifestDefaultTenantRoute(manifest, role) : null;
      const safeDefaultTenantRoute = sanitizeSessionLandingPath(defaultTenantRoute);
      if (safeDefaultTenantRoute) {
        return safeDefaultTenantRoute;
      }
    }
  }
  return LANDING_ROUTES[role];
}
