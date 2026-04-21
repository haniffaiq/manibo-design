import { describe, expect, it } from "vitest";

import { decodeSessionCookie, encodeSignedSession, SessionRole } from "@/lib/session_cookie";

function encodeUnsignedSession(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), "utf-8").toString("base64");
}

describe("session cookie decoding", () => {
  it("rejects unsigned test sessions that do not include tenant identity", async () => {
    const cookieValue = encodeUnsignedSession({
      userId: "user_test",
      role: SessionRole.ClientAdmin,
      exp: Math.floor(Date.now() / 1000) + 300,
    });

    await expect(decodeSessionCookie(cookieValue, { allowUnsignedTestSession: true })).resolves.toBeNull();
  });

  it("rejects expired signed sessions before they can be reused as bearer tokens", async () => {
    const cookieValue = await encodeSignedSession({
      userId: "11111111-1111-1111-1111-111111111111",
      tenantId: "22222222-2222-2222-2222-222222222222",
      role: SessionRole.ClientAdmin,
      exp: Math.floor(Date.now() / 1000) - 1,
    });

    expect(cookieValue).toBeTruthy();
    await expect(decodeSessionCookie(cookieValue ?? "", { allowUnsignedTestSession: true })).resolves.toBeNull();
  });

  it("accepts a valid unsigned test session only when the full shape is present", async () => {
    const cookieValue = encodeUnsignedSession({
      userId: "user_test",
      tenantId: "tenant_test",
      role: SessionRole.ClientOperator,
      exp: Math.floor(Date.now() / 1000) + 300,
    });

    await expect(decodeSessionCookie(cookieValue, { allowUnsignedTestSession: true })).resolves.toMatchObject({
      userId: "user_test",
      tenantId: "tenant_test",
      role: SessionRole.ClientOperator,
    });
  });

  it("roundtrips email and tenantName through signed session", async () => {
    const payload = {
      userId: "11111111-1111-1111-1111-111111111111",
      tenantId: "22222222-2222-2222-2222-222222222222",
      role: SessionRole.ClientAdmin as const,
      exp: Math.floor(Date.now() / 1000) + 300,
      email: "admin@example.com",
      tenantName: "Demo Clinic",
    };

    const cookieValue = await encodeSignedSession(payload);
    expect(cookieValue).toBeTruthy();

    const decoded = await decodeSessionCookie(cookieValue ?? "");
    expect(decoded).toMatchObject({
      userId: payload.userId,
      tenantId: payload.tenantId,
      email: "admin@example.com",
      tenantName: "Demo Clinic",
    });
  });

  it("accepts sessions without optional email and tenantName fields", async () => {
    const payload = {
      userId: "11111111-1111-1111-1111-111111111111",
      tenantId: "22222222-2222-2222-2222-222222222222",
      role: SessionRole.ClientAdmin as const,
      exp: Math.floor(Date.now() / 1000) + 300,
    };

    const cookieValue = await encodeSignedSession(payload);
    expect(cookieValue).toBeTruthy();

    const decoded = await decodeSessionCookie(cookieValue ?? "");
    expect(decoded).toMatchObject({
      userId: payload.userId,
      tenantId: payload.tenantId,
    });
    expect(decoded?.email).toBeUndefined();
    expect(decoded?.tenantName).toBeUndefined();
  });
});
