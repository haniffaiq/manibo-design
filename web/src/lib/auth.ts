import { SessionRole } from "@/lib/auth_types";
import { resolveLandingRoute } from "@/lib/landing-route";
import { resolveCurrentTenantLandingRoute } from "@/lib/landing-route-server";
import { PLATFORM_API_TOKEN_COOKIE, safeDecodeCookieValue } from "@/lib/platform_auth";
import { isExplicitTestAuthEnabled } from "@/lib/dev-auth-flags";
import { decodeSessionCookie, sanitizeSessionLandingPath } from "@/lib/session_cookie";

/**
 * Auth session helpers.
 * Uses the signed web session cookie issued after backend validation via GET /auth/session.
 */

export interface Session {
  userId: string;
  tenantId: string;
  role: SessionRole;
  exp: number;
  landingPath?: string;
  email?: string;
  tenantName?: string;
}

function isTestAuthEnabled(): boolean {
  return isExplicitTestAuthEnabled();
}

async function decodeSession(cookieValue: string): Promise<Session | null> {
  return await decodeSessionCookie(cookieValue, { allowUnsignedTestSession: isTestAuthEnabled() });
}

async function getSessionBearerToken(): Promise<string | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return safeDecodeCookieValue(cookieStore.get(PLATFORM_API_TOKEN_COOKIE)?.value);
}

export async function resolveSessionLandingRoute(
  session: Pick<Session, "role" | "landingPath">,
  options?: { bearerToken?: string | null },
): Promise<string> {
  const fallbackLandingPath = sanitizeSessionLandingPath(session.landingPath) ?? resolveLandingRoute(session.role);
  const bearerToken = options?.bearerToken !== undefined ? options.bearerToken : await getSessionBearerToken();
  const currentLandingPath = await resolveCurrentTenantLandingRoute(session.role, { bearerToken });
  return currentLandingPath ?? fallbackLandingPath;
}

/**
 * Get session from cookie (server-side).
 * Uses next/headers — must be called from Server Components or Route Handlers.
 */
export async function getSession(): Promise<Session | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("grove_session");
  if (!sessionCookie?.value) {
    return null;
  }
  return await decodeSession(sessionCookie.value);
}

/**
 * Require session or redirect to login.
 * Use in Server Components for protected pages.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
    // redirect() throws internally — unreachable, satisfies strict return type
    throw new Error("unreachable");
  }
  return session;
}

export async function requireSuperAdmin(): Promise<Session> {
  const session = await requireSession();
  if (session.role !== SessionRole.SuperAdmin) {
    const { redirect } = await import("next/navigation");
    redirect(await resolveSessionLandingRoute(session));
    throw new Error("unreachable");
  }
  return session;
}
