import { describe, expect, it } from "vitest";

import { normalizeRoutesManifest } from "../scripts/assert-solution-artifacts.mjs";

describe("build artifact normalization", () => {
  it("backfills empty route collections required by next start", () => {
    const manifest = normalizeRoutesManifest({
      version: 3,
      caseSensitive: false,
      basePath: "",
    });

    expect(manifest.dataRoutes).toEqual([]);
    expect(manifest.dynamicRoutes).toEqual([]);
    expect(manifest.redirects).toEqual([]);
    expect(manifest.headers).toEqual([]);
    expect(manifest.rewrites).toEqual({
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    });
  });

  it("preserves existing rewrite buckets", () => {
    const manifest = normalizeRoutesManifest({
      rewrites: {
        beforeFiles: [{ source: "/before", destination: "/target" }],
        afterFiles: [{ source: "/after", destination: "/target" }],
        fallback: [{ source: "/fallback", destination: "/target" }],
      },
    });

    expect(manifest.rewrites).toEqual({
      beforeFiles: [{ source: "/before", destination: "/target" }],
      afterFiles: [{ source: "/after", destination: "/target" }],
      fallback: [{ source: "/fallback", destination: "/target" }],
    });
  });
});
