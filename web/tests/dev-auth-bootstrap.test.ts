import { afterEach, describe, expect, it, vi } from "vitest";

import { DEV_AUTH_PRODUCTION_ERROR } from "@/lib/dev-auth-flags";

describe("dev auth bootstrap", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("fails web startup when NEXT_PUBLIC_ENABLE_TEST_AUTH is enabled in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");

    await expect(import("../next.config")).rejects.toThrow(DEV_AUTH_PRODUCTION_ERROR);
  });

  it("fails web startup when SKIP_AUTH is enabled in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SKIP_AUTH", "true");

    await expect(import("../next.config")).rejects.toThrow(DEV_AUTH_PRODUCTION_ERROR);
  });

  it("allows explicit test auth outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("NEXT_PUBLIC_ENABLE_TEST_AUTH", "true");

    const module = await import("../next.config");

    expect(module.default).toBeDefined();
  });
});
