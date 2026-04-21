import { describe, expect, it } from "vitest";

import {
  TENANT_LOCALES,
  formatTenantCurrencyFromCents,
  formatTenantDate,
  formatTenantDurationSeconds,
  formatTenantPercent,
  getTenantCopy,
} from "@/lib/tenant-locale";

describe("tenant locale copy and formatting", () => {
  it("defines shell copy for every supported locale", () => {
    expect(TENANT_LOCALES).toEqual(["en", "lt"]);
    for (const locale of TENANT_LOCALES) {
      const copy = getTenantCopy(locale);
      expect(copy.shell.title.length).toBeGreaterThan(0);
      expect(copy.common.unexpectedError.length).toBeGreaterThan(0);
      expect(copy.dashboard.liveCallsLabel.length).toBeGreaterThan(0);
      expect(copy.alerts.queueTitle.length).toBeGreaterThan(0);
      expect(copy.settings.languageTitle.length).toBeGreaterThan(0);
      expect(copy.knowledgeBase.title.length).toBeGreaterThan(0);
    }
  });

  it("formats locale-aware values", () => {
    expect(formatTenantCurrencyFromCents("en", 12345, "EUR")).toContain("123");
    expect(formatTenantCurrencyFromCents("lt", 12345, "EUR")).toContain("123");
    expect(formatTenantDate("en", "2026-03-09")).not.toEqual(formatTenantDate("lt", "2026-03-09"));
    expect(formatTenantPercent("en", 0.42)).toContain("42");
    expect(formatTenantPercent("lt", 0.42)).toContain("42");
    expect(formatTenantDurationSeconds("en", 59)).toContain("sec");
    expect(formatTenantDurationSeconds("lt", 59)).toContain("sek.");
  });

  it("provides shell signOut copy for every locale", () => {
    for (const locale of TENANT_LOCALES) {
      const copy = getTenantCopy(locale);
      expect(copy.shell.footer.signOut.length).toBeGreaterThan(0);
    }
  });

  it("provides team adminOnly copy for every locale", () => {
    for (const locale of TENANT_LOCALES) {
      const copy = getTenantCopy(locale);
      expect(copy.team.adminOnlyTitle.length).toBeGreaterThan(0);
      expect(copy.team.adminOnlyMessage.length).toBeGreaterThan(0);
    }
  });
});
