import { afterEach, describe, expect, it, vi } from "vitest";

describe("auth page runtime config", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("forces /login to render dynamically so runtime OIDC env is visible", async () => {
    const module = await import("@/app/(auth)/login/page");

    expect(module.dynamic).toBe("force-dynamic");
    expect(module.revalidate).toBe(0);
  });

  it("forces /admin-login to render dynamically so runtime OIDC env is visible", async () => {
    const module = await import("@/app/(auth)/admin-login/page");

    expect(module.dynamic).toBe("force-dynamic");
    expect(module.revalidate).toBe(0);
  });
});
