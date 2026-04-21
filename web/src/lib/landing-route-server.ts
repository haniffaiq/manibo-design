import { SessionRole } from "@/lib/auth_types";
import { resolveLandingRoute } from "@/lib/landing-route";
import { getEnabledTenantSolutionNamesServer } from "@/lib/server-platform-api";

export async function resolveCurrentTenantLandingRoute(
  role: SessionRole,
  options?: { bearerToken?: string | null },
): Promise<string | null> {
  if (role === SessionRole.SuperAdmin) {
    return resolveLandingRoute(role);
  }
  const enabledSolutionNames = await getEnabledTenantSolutionNamesServer(options);
  return enabledSolutionNames ? resolveLandingRoute(role, enabledSolutionNames) : null;
}

export async function resolveServerLandingRoute(
  role: SessionRole,
  options?: { bearerToken?: string | null },
): Promise<string> {
  return (await resolveCurrentTenantLandingRoute(role, options)) ?? resolveLandingRoute(role);
}
