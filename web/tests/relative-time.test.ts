import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { formatRelativeTime } from "@/lib/relative-time";

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns 'just now' for dates less than 60 seconds ago", () => {
    const thirtySecondsAgo = new Date("2026-03-26T11:59:30Z");
    expect(formatRelativeTime(thirtySecondsAgo)).toBe("just now");
  });

  it("returns 'just now' for exact current time", () => {
    expect(formatRelativeTime(new Date("2026-03-26T12:00:00Z"))).toBe("just now");
  });

  it("returns 'just now' for future dates", () => {
    const future = new Date("2026-03-26T13:00:00Z");
    expect(formatRelativeTime(future)).toBe("just now");
  });

  it("returns minutes for 1-59 minutes ago", () => {
    expect(formatRelativeTime(new Date("2026-03-26T11:59:00Z"))).toBe("1m ago");
    expect(formatRelativeTime(new Date("2026-03-26T11:30:00Z"))).toBe("30m ago");
    expect(formatRelativeTime(new Date("2026-03-26T11:01:00Z"))).toBe("59m ago");
  });

  it("returns hours for 1-23 hours ago", () => {
    expect(formatRelativeTime(new Date("2026-03-26T11:00:00Z"))).toBe("1h ago");
    expect(formatRelativeTime(new Date("2026-03-26T00:00:00Z"))).toBe("12h ago");
    expect(formatRelativeTime(new Date("2026-03-25T13:00:00Z"))).toBe("23h ago");
  });

  it("returns days for 1-29 days ago", () => {
    expect(formatRelativeTime(new Date("2026-03-25T12:00:00Z"))).toBe("1d ago");
    expect(formatRelativeTime(new Date("2026-03-19T12:00:00Z"))).toBe("7d ago");
    expect(formatRelativeTime(new Date("2026-02-25T12:00:00Z"))).toBe("29d ago");
  });

  it("returns months for 30-364 days ago", () => {
    expect(formatRelativeTime(new Date("2026-02-24T12:00:00Z"))).toBe("1mo ago");
    expect(formatRelativeTime(new Date("2025-09-26T12:00:00Z"))).toBe("6mo ago");
    expect(formatRelativeTime(new Date("2025-04-01T12:00:00Z"))).toBe("11mo ago");
  });

  it("returns years for 365+ days ago", () => {
    expect(formatRelativeTime(new Date("2025-03-26T12:00:00Z"))).toBe("1y ago");
    expect(formatRelativeTime(new Date("2024-03-26T12:00:00Z"))).toBe("2y ago");
  });

  it("accepts string and number inputs", () => {
    expect(formatRelativeTime("2026-03-26T11:00:00Z")).toBe("1h ago");
    expect(formatRelativeTime(new Date("2026-03-26T11:00:00Z").getTime())).toBe("1h ago");
  });
});
