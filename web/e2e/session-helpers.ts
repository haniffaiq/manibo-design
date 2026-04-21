import type { Page } from "@playwright/test";

import { SessionRole } from "@/lib/auth_types";
import { SESSION_COOKIE } from "@/lib/platform_auth";
import { encodeSignedSession } from "@/lib/session_cookie";

export type TestSessionRole = "super_admin" | "client_admin" | "client_operator";

const PLAYWRIGHT_WEB_SESSION_SECRET = "playwright-web-session-secret";

const SESSION_ROLE_MAP: Record<TestSessionRole, SessionRole> = {
  super_admin: SessionRole.SuperAdmin,
  client_admin: SessionRole.ClientAdmin,
  client_operator: SessionRole.ClientOperator,
};

export async function encodeSessionCookie(role: TestSessionRole): Promise<string> {
  process.env.GROVE_WEB_SESSION_SECRET ??= PLAYWRIGHT_WEB_SESSION_SECRET;
  const sessionCookie = await encodeSignedSession({
    userId: "11111111-1111-1111-1111-111111111111",
    tenantId: "22222222-2222-2222-2222-222222222222",
    role: SESSION_ROLE_MAP[role],
    exp: Math.floor(Date.now() / 1000) + 900,
  });
  if (!sessionCookie) {
    throw new Error("Missing GROVE_WEB_SESSION_SECRET for Playwright session bootstrap.");
  }
  return sessionCookie;
}

export async function primeSessionCookie(page: Page, role: TestSessionRole): Promise<void> {
  const sessionCookie = await encodeSessionCookie(role);
  await page.context().addCookies([
    {
      name: SESSION_COOKIE,
      value: sessionCookie,
      url: "http://localhost/",
      expires: Math.floor(Date.now() / 1000) + 900,
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}
