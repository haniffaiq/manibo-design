import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";

const dashboardMocks = vi.hoisted(() => ({
  getTenantActiveCalls: vi.fn(),
  getTenantUsageSummary: vi.fn(),
  getCallsReport: vi.fn(),
  getCallObservabilitySummary: vi.fn(),
}));

vi.mock("@/components/tenant-locale-provider", () => ({
  useTenantLocale: () => ({
    locale: "en-US",
    copy: {
      dashboard: {
        title: "Dashboard",
        description: "Overview",
        visibilityError: "Visibility failed",
        dataUnavailable: "Dashboard data is unavailable right now. Refresh before you trust these numbers.",
        partialDataWarning: "Some dashboard data could not be loaded. Cards showing — are unavailable until the feed recovers.",
        liveCallsLabel: "Calls live now",
        liveCallsDetailActive: "Operators can join or listen in from Call Ops.",
        liveCallsDetailIdle: "No one is on a live call right now.",
        liveCallsUnavailableDetail: "Live call data is unavailable right now.",
        monthlySpendLabel: "This month's spend",
        monthlySpendDetail: (utilization: string, budget: string) => `${utilization} of ${budget}`,
        monthlySpendNoBudget: "No monthly budget cap is configured.",
        monthlySpendUnavailableDetail: "Billing data is unavailable right now.",
        completedCallsLabel: "Calls completed this week",
        completedCallsDetail: (total: string, averageDuration: string) => `${total} total calls · average ${averageDuration}`,
        escalatedCallsLabel: "Calls needing staff help",
        escalatedCallsDetail: (rate: string) => `Escalation rate ${rate} over the last 7 days`,
        callsReportUnavailableDetail: "Call report data is unavailable right now.",
        noRecentSlowPath: "No recent slow path recorded",
        slowPathUnavailable: "Slowdown summary unavailable right now",
        noWorkspaceTitle: "No solutions enabled",
        noWorkspaceDescription: "Ask your platform admin to enable a solution for this workspace.",
      },
    },
  }),
}));

vi.mock("@/lib/api/dashboard", () => ({
  getTenantActiveCalls: dashboardMocks.getTenantActiveCalls,
  getTenantUsageSummary: dashboardMocks.getTenantUsageSummary,
  getCallsReport: dashboardMocks.getCallsReport,
}));

vi.mock("@/lib/api/call-observability", () => ({
  getCallObservabilitySummary: dashboardMocks.getCallObservabilitySummary,
}));

vi.mock("@/lib/generated-solution-dashboard-widgets", () => ({
  ClinicDashboardWidget: ({
    activeCallsAvailable,
    routeHotspotLabel,
  }: {
    activeCallsAvailable: boolean;
    routeHotspotLabel: string;
  }) => (
    <div data-testid="clinic-dashboard-widget">
      <span data-testid="clinic-dashboard-widget-active-calls">{String(activeCallsAvailable)}</span>
      <span data-testid="clinic-dashboard-widget-hotspot">{routeHotspotLabel}</span>
    </div>
  ),
  DriverDashboardWidget: () => <div data-testid="driver-dashboard-widget">driver</div>,
}));

vi.mock("@/lib/solutions", () => ({
  formatSolutionLabel: (solutionName: string) => solutionName,
  intersectWithBuildEnabledSolutions: (solutionNames: readonly string[]) => [...solutionNames],
  useTenantSolutions: () => ({
    states: [{ solution_name: "appointment_booking", enabled: true }],
    isLoading: false,
    error: null,
  }),
}));

import TenantDashboardPage from "@/app/(tenant)/dashboard/page";

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>
      <TenantDashboardPage />
    </SWRConfig>,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("TenantDashboardPage", () => {
  it("does not show a slowdown error before the first dashboard snapshot resolves", () => {
    const unresolved = new Promise<never>(() => {});
    dashboardMocks.getTenantActiveCalls.mockReturnValueOnce(unresolved);
    dashboardMocks.getTenantUsageSummary.mockReturnValueOnce(unresolved);
    dashboardMocks.getCallsReport.mockReturnValueOnce(unresolved);
    dashboardMocks.getCallObservabilitySummary.mockReturnValueOnce(unresolved);

    renderPage();

    expect(screen.queryByTestId("tenant-dashboard-data-notice")).toBeNull();
    expect(screen.getByTestId("clinic-dashboard-widget-hotspot").textContent).toBe("No recent slow path recorded");
    expect(screen.queryByText("Slowdown summary unavailable right now")).toBeNull();
  });

  it("shows a partial warning and placeholders when call feeds fail", async () => {
    dashboardMocks.getTenantActiveCalls.mockRejectedValueOnce(new Error("calls down"));
    dashboardMocks.getTenantUsageSummary.mockResolvedValueOnce({
      tenant_id: "tenant-1",
      period_start: "2026-03-01",
      period_end: "2026-03-31",
      currency: "EUR",
      voice_seconds: 0,
      voice_minutes: 0,
      production_voice_seconds: 0,
      production_voice_minutes: 0,
      test_voice_seconds: 0,
      test_voice_minutes: 0,
      llm_tokens: 0,
      stt_characters: 0,
      tts_characters: 0,
      platform_fee_cents: 0,
      telephony_fee_cents: 0,
      llm_fee_cents: 0,
      stt_fee_cents: 0,
      tts_fee_cents: 0,
      discount_cents: 0,
      subtotal_cents: 0,
      total_cents: 1200,
      budget_mode: "soft",
      monthly_budget_cents: 2400,
      over_budget: false,
      utilization_percent: 50,
    });
    dashboardMocks.getCallsReport.mockRejectedValueOnce(new Error("report down"));
    dashboardMocks.getCallObservabilitySummary.mockResolvedValueOnce({
      sampled_calls: 4,
      window_start: "2026-03-01T00:00:00Z",
      window_end: "2026-03-02T00:00:00Z",
      stack_comparisons: [],
      route_hotspots: [],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("tenant-dashboard-data-notice").textContent).toContain("Some dashboard data could not be loaded");
    });

    expect(screen.getByTestId("tenant-dashboard-live-calls").textContent).toBe("—");
    expect(screen.getByTestId("tenant-dashboard-completed-calls").textContent).toBe("—");
    expect(screen.getByTestId("tenant-dashboard-escalated-calls").textContent).toBe("—");
    expect(screen.getByTestId("tenant-dashboard-monthly-spend").textContent).not.toBe("—");
    expect(screen.getByTestId("clinic-dashboard-widget-active-calls").textContent).toBe("false");
  });
});
