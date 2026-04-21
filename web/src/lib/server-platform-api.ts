import { cookies } from "next/headers";

import { extractEnabledTenantSolutionNames, type TenantSolutionsResponse } from "@/lib/api/solutions";
import type { TenantUiLocale } from "@/lib/api/tenant-settings";
import { PLATFORM_API_TOKEN_COOKIE, resolveServerApiBaseUrl, safeDecodeCookieValue } from "@/lib/platform_auth";
import { isExplicitTestAuthEnabled } from "@/lib/dev-auth-flags";
import { decodeSessionCookie } from "@/lib/session_cookie";
import { getManifestById } from "@/solutions/registry";

function isTestAuthEnabled(): boolean {
  return isExplicitTestAuthEnabled();
}

async function resolveBearerToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookieToken = safeDecodeCookieValue(cookieStore.get(PLATFORM_API_TOKEN_COOKIE)?.value);
  if (cookieToken) {
    return cookieToken;
  }

  if (!isTestAuthEnabled()) {
    return null;
  }

  const sessionCookie = cookieStore.get("grove_session")?.value;
  if (!sessionCookie) {
    return null;
  }
  const session = await decodeSessionCookie(sessionCookie, { allowUnsignedTestSession: isTestAuthEnabled() });
  if (!session) {
    return null;
  }
  return `dev:${session.userId}`;
}

async function fetchPlatformJsonServer<T>(
  path: string,
  options?: { bearerToken?: string | null },
): Promise<T | null> {
  const bearerToken = options?.bearerToken ?? (await resolveBearerToken());
  if (!bearerToken) {
    return null;
  }

  try {
    const response = await fetch(`${resolveServerApiBaseUrl().replace(/\/$/, "")}${path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${bearerToken}` },
      cache: "no-store",
    });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getTenantLocaleServer(): Promise<TenantUiLocale> {
  const payload = await fetchPlatformJsonServer<{ ui_locale?: unknown }>("/tenant/settings/locale");
  if (!payload) {
    return "en";
  }
  return payload.ui_locale === "lt" ? "lt" : "en";
}

export async function getEnabledTenantSolutionNamesServer(
  options?: { bearerToken?: string | null },
): Promise<string[] | null> {
  const payload = await fetchPlatformJsonServer<TenantSolutionsResponse>("/solutions", options);
  if (!payload || !Array.isArray(payload.solutions)) {
    return null;
  }
  return extractEnabledTenantSolutionNames(payload).filter((solutionName) => getManifestById(solutionName) !== undefined);
}
