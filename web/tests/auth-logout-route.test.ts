import { describe, expect, it } from "vitest";

import { POST as logoutHandler } from "@/app/api/auth/logout/route";

describe("/api/auth/logout", () => {
  it("returns ok and clears session cookies", async () => {
    const response = await logoutHandler();
    expect(response.status).toBe(200);

    const payload = (await response.json()) as { ok: boolean };
    expect(payload.ok).toBe(true);

    const cookies = response.cookies.getAll();
    const cookieNames = cookies.map((c) => c.name);
    expect(cookieNames).toContain("grove_session");
    expect(cookieNames).toContain("grove_api_token");
  });
});
