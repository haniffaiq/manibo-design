"use client";

import Link from "next/link";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { useTenantLocale } from "@grove/web-shared/hooks/use-tenant-locale";
import type { DriverVerificationJobSummary } from "../api/driver-verification";
import {
  listDrivers,
  listDriverVerificationJobs,
} from "../api/driver-verification";
import { formatTenantDateTime } from "@grove/web-shared/lib/tenant-locale-formatters";
import * as swrKeys from "../lib/swr-keys";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DriverDashboardWidgetProps {
  routeHotspotLabel: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
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

function jobNeedsAttention(job: DriverVerificationJobSummary): boolean {
  if (job.status !== "completed") {
    return true;
  }
  if (job.outcome === "discrepancy" || job.outcome === "unreachable") {
    return true;
  }
  if (job.last_error) {
    return true;
  }
  return Object.values(job.discrepancy_flags).some((value) => value === true);
}

/* ------------------------------------------------------------------ */
/*  Widget                                                             */
/* ------------------------------------------------------------------ */

export default function DriverDashboardWidget({ routeHotspotLabel: hotspotLabel }: DriverDashboardWidgetProps) {
  const { locale, copy } = useTenantLocale();

  const swrOptions = { revalidateOnFocus: false, refreshInterval: 30_000 };
  const { data: activeDrivers, error: activeDriversError } = useSWR(swrKeys.driverDashboardActive(), () => listDrivers({ active: true, limit: 1 }), swrOptions);
  const { data: pausedDrivers, error: pausedDriversError } = useSWR(swrKeys.driverDashboardPaused(), () => listDrivers({ active: false, limit: 1 }), swrOptions);
  const { data: recentJobs, error: recentJobsError } = useSWR(swrKeys.driverDashboardJobs(), () => listDriverVerificationJobs({ limit: 5 }), swrOptions);

  const isInitialLoad = !activeDrivers && !activeDriversError && !pausedDrivers && !pausedDriversError && !recentJobs && !recentJobsError;
  const hasError = !!(activeDriversError || pausedDriversError || recentJobsError);
  const driverRecentAttention = recentJobs?.jobs.filter(jobNeedsAttention).length ?? 0;
  const driverRecentConfirmed =
    recentJobs?.jobs.filter((job) => job.outcome === "confirmed").length ?? 0;

  return (
    <>
      {hasError ? (
        <Card className="border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-700)]">
          <CardContent className="p-4 text-sm" data-testid="tenant-dashboard-driver-error">
            Some driver data could not be loaded. Numbers below may be incomplete.
          </CardContent>
        </Card>
      ) : null}
      {isInitialLoad ? (
        <Card>
          <CardContent className="p-6 text-sm text-[var(--color-neutral-500)]" data-testid="tenant-dashboard-driver-loading">
            Loading driver data...
          </CardContent>
        </Card>
      ) : null}
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">{copy.dashboard.driverSectionTitle}</h2>
              <p className="text-sm text-[var(--color-neutral-500)]">
                {copy.dashboard.driverSectionDescription}
              </p>
            </div>
            <Link
              href="/driver-verification/drivers"
              className="text-sm font-medium text-[var(--color-neutral-900)] underline underline-offset-4"
            >
              {copy.dashboard.driverSectionLink}
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <SummaryCard
              label={copy.dashboard.driverActiveLabel}
              value={String(activeDrivers?.total ?? 0)}
              detail={copy.dashboard.driverActiveDetail}
              testId="tenant-dashboard-driver-active"
            />
            <SummaryCard
              label={copy.dashboard.driverPausedLabel}
              value={String(pausedDrivers?.total ?? 0)}
              detail={copy.dashboard.driverPausedDetail}
              testId="tenant-dashboard-driver-paused"
            />
            <SummaryCard
              label={copy.dashboard.driverAttentionLabel}
              value={String(driverRecentAttention)}
              detail={copy.dashboard.driverAttentionDetail}
              testId="tenant-dashboard-driver-attention"
            />
            <SummaryCard
              label={copy.dashboard.driverConfirmedLabel}
              value={String(driverRecentConfirmed)}
              detail={copy.dashboard.driverConfirmedDetail}
              testId="tenant-dashboard-driver-confirmed"
            />
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)]">
            <div className="border-b border-[var(--color-border)] px-4 py-3">
              <h3 className="text-sm font-semibold text-[var(--color-neutral-950)]">{copy.dashboard.latestDriverChecksTitle}</h3>
            </div>
            <ol className="divide-y divide-[var(--color-border)]">
              {(recentJobs?.jobs ?? []).slice(0, 5).map((job) => (
                <li key={job.job_id} data-testid={`tenant-dashboard-driver-job-${job.job_id}`} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--color-neutral-950)]">{job.driver_name ?? job.driver_id}</p>
                    <p className="text-xs text-[var(--color-neutral-500)]">
                      {job.status} · {formatTenantDateTime(locale, job.call_started_at ?? job.scheduled_at, copy.common.notRecorded)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={jobNeedsAttention(job) ? "warning" : "success"}>
                      {jobNeedsAttention(job) ? copy.dashboard.driverNeedsAttentionBadge : copy.dashboard.driverLooksGoodBadge}
                    </Badge>
                    <Badge variant="neutral">{job.outcome ?? copy.dashboard.driverNoOutcomeYet}</Badge>
                  </div>
                </li>
              ))}
              {(recentJobs?.jobs.length ?? 0) === 0 ? (
                <li className="px-4 py-6 text-sm text-[var(--color-neutral-500)]">{copy.dashboard.recentDriverChecksEmpty}</li>
              ) : null}
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{copy.dashboard.callQualityTitle}</h2>
          <p className="text-sm text-[var(--color-neutral-500)]">{copy.dashboard.callQualityDriverDescription}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
            <p className="text-sm text-[var(--color-neutral-500)]">{copy.dashboard.slowestPathLabel}</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-neutral-950)]">{hotspotLabel}</p>
            <p className="mt-2 text-sm text-[var(--color-neutral-500)]">
              {copy.dashboard.callQualityDriverHelp}
            </p>
          </div>
          <Link href="/call-ops" className="inline-flex text-sm font-medium text-[var(--color-neutral-900)] underline underline-offset-4">
            {copy.dashboard.openCallOps}
          </Link>
        </CardContent>
      </Card>
    </section>
    </>
  );
}
