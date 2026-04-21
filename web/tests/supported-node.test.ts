import { describe, expect, it } from "vitest";

import {
  assertSupportedNodeVersion,
  getUnsupportedNodeMessage,
  isSupportedNodeVersion,
  parseNodeVersion,
} from "../scripts/assert-supported-node.mjs";

describe("supported node runtime guard", () => {
  it("parses semver strings with or without a v prefix", () => {
    expect(parseNodeVersion("v20.19.0")).toEqual({ major: 20, minor: 19, patch: 0 });
    expect(parseNodeVersion("22.21.1")).toEqual({ major: 22, minor: 21, patch: 1 });
  });

  it("accepts the supported Node.js ranges and rejects unsupported runtimes", () => {
    expect(isSupportedNodeVersion("20.19.0")).toBe(true);
    expect(isSupportedNodeVersion("22.12.0")).toBe(true);
    expect(isSupportedNodeVersion("20.12.1")).toBe(false);
    expect(isSupportedNodeVersion("22.11.0")).toBe(false);
    expect(isSupportedNodeVersion("25.6.1")).toBe(false);
  });

  it("returns an operator-readable failure message", () => {
    expect(getUnsupportedNodeMessage("25.6.1")).toContain("Unsupported Node.js runtime: 25.6.1.");
    expect(getUnsupportedNodeMessage("25.6.1")).toContain("requires Node.js 20.19+ or 22.12+.");
  });

  it("throws when the current runtime is unsupported", () => {
    expect(() => assertSupportedNodeVersion("20.12.1")).toThrow(/Unsupported Node\.js runtime/);
  });
});
