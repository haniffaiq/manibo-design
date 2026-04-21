import { describe, expect, it } from "vitest";

import * as swrKeys from "@/lib/swr-keys";

describe("operatorAlerts SWR key factory", () => {
  it("produces a stable key for the same filter values", () => {
    const a = swrKeys.operatorAlerts("critical", "open", "2026-03-01");
    const b = swrKeys.operatorAlerts("critical", "open", "2026-03-01");
    expect(a).toEqual(b);
  });

  it("produces different keys when severity changes", () => {
    const a = swrKeys.operatorAlerts("critical", "open", "");
    const b = swrKeys.operatorAlerts("warning", "open", "");
    expect(a).not.toEqual(b);
  });

  it("produces different keys when status changes", () => {
    const a = swrKeys.operatorAlerts("", "open", "");
    const b = swrKeys.operatorAlerts("", "resolved", "");
    expect(a).not.toEqual(b);
  });

  it("produces different keys when since changes", () => {
    const a = swrKeys.operatorAlerts("", "", "2026-03-01");
    const b = swrKeys.operatorAlerts("", "", "2026-03-05");
    expect(a).not.toEqual(b);
  });

  it("includes all filter dimensions in the key", () => {
    const key = swrKeys.operatorAlerts("critical", "open", "2026-03-01");
    expect(key).toEqual(["operator-alerts", "critical", "open", "2026-03-01"]);
  });

  it("uses empty strings for unset filters (not undefined)", () => {
    const key = swrKeys.operatorAlerts("", "", "");
    expect(key).toEqual(["operator-alerts", "", "", ""]);
    // All elements are strings — SWR will treat this as a valid key, not skip fetching
    expect(key.every((v) => typeof v === "string")).toBe(true);
  });
});
