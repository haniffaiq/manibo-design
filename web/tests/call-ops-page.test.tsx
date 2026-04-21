import { render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";

const callOpsMocks = vi.hoisted(() => ({
  platformApiRequest: vi.fn(),
  getCallObservabilitySummary: vi.fn(),
}));

vi.mock("@/components/tenant-locale-provider", () => ({
  useTenantCopy: () => ({
    common: { loading: "Loading…" },
    callOps: {
      title: "Call Operations",
      description: "Watch calls",
      dataUnavailable: "Call Ops could not load live calls or performance data. Refresh before you trust this page.",
      partialDataWarning: "Some Call Ops data could not be loaded. Sections marked unavailable are hidden until the feed recovers.",
      liveCallsUnavailable: "Live calls are unavailable right now. Do not treat an empty table as no traffic.",
      performanceUnavailable:
        "Performance summary is unavailable right now. Live-call actions still work, but slowdown metrics are hidden until the feed recovers.",
    },
  }),
}));

vi.mock("@grove/web-shared/api/platform", () => ({
  platformApiRequest: callOpsMocks.platformApiRequest,
}));

vi.mock("@/lib/api/call-observability", () => ({
  getCallObservabilitySummary: callOpsMocks.getCallObservabilitySummary,
}));

vi.mock("@/lib/solutions", () => ({
  useTenantSolutionState: () => ({
    enabled: true,
    tenantEnabled: true,
    buildEnabled: true,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@/components/call-ops/live-transcript", () => ({
  LiveTranscript: () => <div data-testid="live-transcript" />,
}));

vi.mock("@/components/call-ops/support-drawer", () => ({
  SupportDrawer: () => null,
}));

vi.mock("@/components/call-ops/escalation-modal", () => ({
  EscalationModal: () => null,
}));

vi.mock("@/components/call-ops/urgent-banner", () => ({
  UrgentCallBanner: () => <div data-testid="urgent-call-banner" />,
}));

vi.mock("@/components/call-ops/slowdown-summary", () => ({
  SlowdownSummary: () => <div data-testid="slowdown-summary" />,
}));

vi.mock("@/components/call-ops/route-hotspots-table", () => ({
  RouteHotspotsTable: () => <div data-testid="route-hotspots-table" />,
}));

import CallOpsPage from "@/app/(tenant)/call-ops/page";

function renderPage() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0, errorRetryCount: 0 }}>
      <CallOpsPage />
    </SWRConfig>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("CallOpsPage", () => {
  it("shows a warning instead of an empty live-calls table when the active-call feed fails", async () => {
    callOpsMocks.platformApiRequest.mockRejectedValueOnce(new Error("calls down"));
    callOpsMocks.getCallObservabilitySummary.mockResolvedValueOnce({
      sampled_calls: 3,
      window_start: "2026-03-01T00:00:00Z",
      window_end: "2026-03-01T01:00:00Z",
      stack_comparisons: [],
      route_hotspots: [],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByTestId("call-ops-data-notice").textContent).toContain("Some Call Ops data could not be loaded");
    });

    expect(screen.getByTestId("call-ops-live-calls-unavailable").textContent).toContain("Live calls are unavailable right now");
    expect(screen.queryByText("No live calls right now.")).toBeNull();
    expect(screen.queryByTestId("urgent-call-banner")).toBeNull();
    expect(screen.queryByTestId("call-ops-performance-unavailable")).toBeNull();
  });
});
