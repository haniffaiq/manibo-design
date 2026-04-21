"use client";

import { useMemo } from "react";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { PageFrame } from "@/components/page-frame";
import { PageHeader } from "@/components/page-header";
import { StatusMessage, type StatusVariant } from "@/components/status-message";
import { useTenantLocale } from "@/components/tenant-locale-provider";
import { getCallObservabilitySummary } from "@/lib/api/call-observability";
import {
  getCallsReport,
  getTenantActiveCalls,
  getTenantUsageSummary,
  type CallsReportResponse,
  type TenantActiveCallsResponse,
  type TenantUsageSummary,
} from "@/lib/api/dashboard";
import {
  ClinicDashboardWidget,
  DriverDashboardWidget,
} from "@/lib/generated-solution-dashboard-widgets";
import {
  formatTenantCurrencyFromCents,
  formatTenantDurationSeconds,
  formatTenantPercent,
} from "@/lib/tenant-locale";
import { formatSolutionLabel, intersectWithBuildEnabledSolutions, useTenantSolutions } from "@/lib/solutions";
import * as swrKeys from "@/lib/swr-keys";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type DashboardSnapshot = {
  activeCalls: DashboardResource<TenantActiveCallsResponse>;
  usage: DashboardResource<TenantUsageSummary>;
  callsReport: DashboardResource<CallsReportResponse>;
  observability: DashboardResource<Awaited<ReturnType<typeof getCallObservabilitySummary>>>;
};

type DashboardResource<T> =
  | {
      status: "success";
      data: T;
    }
  | {
      status: "error";
    };

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function routeHotspotLabel(copy: ReturnType<typeof useTenantLocale>["copy"], snapshot: DashboardSnapshot | undefined): string {
  if (!snapshot) {
    return copy.dashboard.noRecentSlowPath;
  }
  if (snapshot.observability.status === "error") {
    return copy.dashboard.slowPathUnavailable;
  }
  const busiestRoute = snapshot.observability.data.route_hotspots?.[0] ?? null;
  if (!busiestRoute) {
    return copy.dashboard.noRecentSlowPath;
  }
  return [busiestRoute.node_name, busiestRoute.route].filter(Boolean).join(" · ");
}

function toDashboardResource<T>(result: PromiseSettledResult<T>): DashboardResource<T> {
  if (result.status === "fulfilled") {
    return { status: "success", data: result.value };
  }
  return { status: "error" };
}

function isDashboardResourceLoaded<T>(
  resource: DashboardResource<T> | undefined,
): resource is Extract<DashboardResource<T>, { status: "success" }> {
  return resource?.status === "success";
}

function dashboardNotice(
  copy: ReturnType<typeof useTenantLocale>["copy"],
  snapshot: DashboardSnapshot | undefined,
): { message: string; variant: StatusVariant } | null {
  if (!snapshot) {
    return null;
  }
  const failures = [
    snapshot.activeCalls,
    snapshot.usage,
    snapshot.callsReport,
    snapshot.observability,
  ].filter((resource) => resource.status === "error").length;
  if (failures === 0) {
    return null;
  }
  if (failures === 4) {
    return { message: copy.dashboard.dataUnavailable, variant: "error" };
  }
  return { message: copy.dashboard.partialDataWarning, variant: "warning" };
}

function sumCallsReport(report: CallsReportResponse | null): {
  totalCalls: number;
  completedCalls: number;
  escalatedCalls: number;
  averageDurationSeconds: number | null;
  escalationRate: number | null;
} {
  if (!report || report.buckets.length === 0) {
    return {
      totalCalls: 0,
      completedCalls: 0,
      escalatedCalls: 0,
      averageDurationSeconds: null,
      escalationRate: null,
    };
  }

  let totalCalls = 0;
  let completedCalls = 0;
  let escalatedCalls = 0;
  let weightedDuration = 0;
  let weightedDurationCalls = 0;

  for (const bucket of report.buckets) {
    totalCalls += bucket.total_calls;
    completedCalls += bucket.completed;
    escalatedCalls += bucket.escalated;
    if (typeof bucket.average_duration_seconds === "number" && bucket.total_calls > 0) {
      weightedDuration += bucket.average_duration_seconds * bucket.total_calls;
      weightedDurationCalls += bucket.total_calls;
    }
  }

  return {
    totalCalls,
    completedCalls,
    escalatedCalls,
    averageDurationSeconds: weightedDurationCalls > 0 ? weightedDuration / weightedDurationCalls : null,
    escalationRate: totalCalls > 0 ? escalatedCalls / totalCalls : null,
  };
}

/* ------------------------------------------------------------------ */
/*  Data loading                                                       */
/* ------------------------------------------------------------------ */

async function loadDashboard(): Promise<DashboardSnapshot> {
  const requests = await Promise.allSettled([
    getTenantActiveCalls(),
    getTenantUsageSummary(),
    getCallsReport(),
    getCallObservabilitySummary({ limit: 50 }),
  ]);

  const [activeCallsResult, usageResult, callsReportResult, observabilityResult] = requests;

  return {
    activeCalls: toDashboardResource(activeCallsResult),
    usage: toDashboardResource(usageResult),
    callsReport: toDashboardResource(callsReportResult),
    observability: toDashboardResource(observabilityResult),
  };
}

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function SummaryCard({
  label,
  value,
  detail,
  testId,
}: {
  label: string;
  value: string;
  detail: string;
  testId: string;
}) {
  return (
    <Card>
      <CardHeader className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
        {label}
      </CardHeader>
      <CardContent className="text-2xl font-semibold">
        <p data-testid={testId}>{value}</p>
        <p className="mt-2 text-sm font-normal text-[var(--color-neutral-500)]">{detail}</p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TenantDashboardPage() {
  const { locale, copy } = useTenantLocale();
  const { states, isLoading: solutionsLoading, error: solutionsError } = useTenantSolutions();
  const enabledSolutions = useMemo(
    () =>
      intersectWithBuildEnabledSolutions(
        states
          .filter((solution) => solution.enabled)
          .map((solution) => solution.solution_name),
      ).sort(),
    [states],
  );

  const {
    data: snapshot,
  } = useSWR(
    solutionsLoading ? null : swrKeys.tenantDashboard(),
    () => loadDashboard(),
    { revalidateOnFocus: false, refreshInterval: 30_000 },
  );

  const callsSummary = useMemo(() => {
    if (!isDashboardResourceLoaded(snapshot?.callsReport)) {
      return null;
    }
    return sumCallsReport(snapshot.callsReport.data);
  }, [snapshot?.callsReport]);
  const dashboardDataNotice = dashboardNotice(copy, snapshot);
  const activeCallsCount = isDashboardResourceLoaded(snapshot?.activeCalls) ? snapshot.activeCalls.data.calls.length : null;
  const usageSummary = isDashboardResourceLoaded(snapshot?.usage) ? snapshot.usage.data : null;
  const clinicWorkspaceVisible = enabledSolutions.includes("appointment_booking");
  const driverWorkspaceVisible = enabledSolutions.includes("driver_verification");
  const hotspotLabel = routeHotspotLabel(copy, snapshot);

  return (
    <PageFrame className="px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <PageHeader compact title={copy.dashboard.title} description={copy.dashboard.description} />
          {enabledSolutions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {enabledSolutions.map((solutionName) => (
                <Badge key={solutionName} variant="neutral">
                  {formatSolutionLabel(solutionName)}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {solutionsError ? (
        <StatusMessage data-testid="tenant-dashboard-visibility-error">{copy.dashboard.visibilityError}</StatusMessage>
      ) : null}
      {dashboardDataNotice ? (
        <StatusMessage data-testid="tenant-dashboard-data-notice" variant={dashboardDataNotice.variant}>
          {dashboardDataNotice.message}
        </StatusMessage>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={copy.dashboard.liveCallsLabel}
          value={activeCallsCount == null ? "—" : String(activeCallsCount)}
          detail={
            activeCallsCount == null
              ? copy.dashboard.liveCallsUnavailableDetail
              : activeCallsCount > 0
                ? copy.dashboard.liveCallsDetailActive
                : copy.dashboard.liveCallsDetailIdle
          }
          testId="tenant-dashboard-live-calls"
        />
        <SummaryCard
          label={copy.dashboard.monthlySpendLabel}
          value={usageSummary ? formatTenantCurrencyFromCents(locale, usageSummary.total_cents, usageSummary.currency, "—") : "—"}
          detail={
            usageSummary == null
              ? copy.dashboard.monthlySpendUnavailableDetail
              : usageSummary.monthly_budget_cents
              ? copy.dashboard.monthlySpendDetail(
                  formatTenantPercent(locale, (usageSummary.utilization_percent ?? 0) / 100, "0%"),
                  formatTenantCurrencyFromCents(locale, usageSummary.monthly_budget_cents, usageSummary.currency, "—"),
                )
              : copy.dashboard.monthlySpendNoBudget
          }
          testId="tenant-dashboard-monthly-spend"
        />
        <SummaryCard
          label={copy.dashboard.completedCallsLabel}
          value={callsSummary ? String(callsSummary.completedCalls) : "—"}
          detail={
            callsSummary
              ? copy.dashboard.completedCallsDetail(
                  String(callsSummary.totalCalls),
                  formatTenantDurationSeconds(locale, callsSummary.averageDurationSeconds),
                )
              : copy.dashboard.callsReportUnavailableDetail
          }
          testId="tenant-dashboard-completed-calls"
        />
        <SummaryCard
          label={copy.dashboard.escalatedCallsLabel}
          value={callsSummary ? String(callsSummary.escalatedCalls) : "—"}
          detail={
            callsSummary
              ? copy.dashboard.escalatedCallsDetail(formatTenantPercent(locale, callsSummary.escalationRate))
              : copy.dashboard.callsReportUnavailableDetail
          }
          testId="tenant-dashboard-escalated-calls"
        />
      </section>

      {clinicWorkspaceVisible ? (
        <ClinicDashboardWidget
          activeCalls={isDashboardResourceLoaded(snapshot?.activeCalls) ? snapshot.activeCalls.data : null}
          activeCallsAvailable={isDashboardResourceLoaded(snapshot?.activeCalls)}
          routeHotspotLabel={hotspotLabel}
        />
      ) : null}

      {driverWorkspaceVisible ? (
        <DriverDashboardWidget
          routeHotspotLabel={hotspotLabel}
        />
      ) : null}

      {!solutionsLoading && enabledSolutions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm font-medium text-[var(--color-neutral-700)]">{copy.dashboard.noWorkspaceTitle}</p>
            <p className="text-sm text-[var(--color-neutral-500)]">{copy.dashboard.noWorkspaceDescription}</p>
          </CardContent>
        </Card>
      ) : null}
    </PageFrame>
  );
}
