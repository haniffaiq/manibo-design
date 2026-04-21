"use client";

import Link from "next/link";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { useTenantLocale } from "@grove/web-shared/hooks/use-tenant-locale";
import type { ClinicBookingResultListItem } from "../api/clinic-bookings";
import {
  listClinicBookingResults,
  listClinicFollowUps,
  getClinicIntegrationStatus,
} from "../api/clinic-bookings";
import { formatTenantDateTime } from "@grove/web-shared/lib/tenant-locale-formatters";
import * as swrKeys from "../lib/swr-keys";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface ClinicDashboardWidgetProps {
  activeCalls: { calls: unknown[] } | null;
  activeCallsAvailable?: boolean;
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

function bookingStatusLabel(
  copy: ReturnType<typeof useTenantLocale>["copy"],
  status: ClinicBookingResultListItem["booking_status"],
): string {
  switch (status) {
    case "confirmed":
      return copy.dashboard.bookingStatuses.confirmed;
    case "pending":
      return copy.dashboard.bookingStatuses.pending;
    case "failed":
      return copy.dashboard.bookingStatuses.failed;
    case "handed_off":
      return copy.dashboard.bookingStatuses.handed_off;
  }
}

function bookingStatusVariant(
  status: ClinicBookingResultListItem["booking_status"],
): "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case "confirmed":
      return "success";
    case "pending":
      return "warning";
    case "failed":
      return "error";
    case "handed_off":
      return "neutral";
  }
}

/* ------------------------------------------------------------------ */
/*  Widget                                                             */
/* ------------------------------------------------------------------ */

export default function ClinicDashboardWidget({
  activeCalls,
  activeCallsAvailable = true,
  routeHotspotLabel: hotspotLabel,
}: ClinicDashboardWidgetProps) {
  const { locale, copy } = useTenantLocale();

  const swrOptions = { revalidateOnFocus: false, refreshInterval: 30_000 };
  const { data: recentBookings, error: recentBookingsError } = useSWR(swrKeys.clinicDashboardBookings(), () => listClinicBookingResults({ limit: 5 }), swrOptions);
  const { data: confirmedBookings, error: confirmedBookingsError } = useSWR(swrKeys.clinicDashboardConfirmed(), () => listClinicBookingResults({ bookingStatus: "confirmed", limit: 1 }), swrOptions);
  const { data: followUps, error: followUpsError } = useSWR(swrKeys.clinicDashboardFollowUps(), () => listClinicFollowUps(), swrOptions);
  const { data: integrationStatus, error: integrationStatusError } = useSWR(swrKeys.clinicDashboardIntegration(), () => getClinicIntegrationStatus(), swrOptions);

  const isInitialLoad = !recentBookings && !recentBookingsError && !confirmedBookings && !confirmedBookingsError && !followUps && !followUpsError && !integrationStatus && !integrationStatusError;
  const hasError = !!(recentBookingsError || confirmedBookingsError || followUpsError || integrationStatusError);
  const clinicNeedsStaff = (followUps?.summary.open ?? 0) + (followUps?.summary.claimed ?? 0);
  const clinicUrgentFollowUps = followUps?.summary.urgent ?? 0;
  const clinicSetupStatus = integrationStatus?.overall_status ?? null;
  const clinicSetupLabel = clinicSetupStatus === "ready" ? "Ready for live bookings" : "Needs setup attention";
  const clinicSetupDetail =
    clinicSetupStatus === "ready"
      ? "Patient record sync, confirmation messages, and reminder timing are ready."
      : "Finish connector and reminder setup before you promise a fully automated follow-up.";
  const liveCallCount = activeCalls?.calls.length ?? 0;
  const liveCallBadgeLabel = !activeCallsAvailable ? "Unavailable" : liveCallCount > 0 ? "Watch now" : "Quiet";
  const liveCallValue = activeCallsAvailable ? String(liveCallCount) : "—";
  const liveCallDetail = !activeCallsAvailable
    ? "Live call data is unavailable right now."
    : liveCallCount > 0
      ? "Operators should stay close to live support before moving into callbacks."
      : "No live patient calls are active, so the callback queue is the next best use of time.";

  return (
    <>
      {hasError ? (
        <Card className="border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-700)]">
          <CardContent className="p-4 text-sm" data-testid="tenant-dashboard-clinic-error">
            Some clinic data could not be loaded. Numbers below may be incomplete.
          </CardContent>
        </Card>
      ) : null}
      {isInitialLoad ? (
        <Card>
          <CardContent className="p-6 text-sm text-[var(--color-neutral-500)]" data-testid="tenant-dashboard-clinic-loading">
            Loading clinic data...
          </CardContent>
        </Card>
      ) : null}
      <Card data-testid="tenant-dashboard-clinic-work-now">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Clinic work right now</h2>
              <p className="text-sm text-[var(--color-neutral-500)]">
                Start with patient cases that need a person, then watch live calls, then clear setup blockers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/bookings?priority=urgent#clinic-follow-up-queue"
                className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                data-testid="tenant-dashboard-clinic-open-urgent"
              >
                Open urgent queue
              </Link>
              <Link
                href="/call-ops"
                className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-primary-600)] bg-[var(--color-primary-600)] px-4 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]"
                data-testid="tenant-dashboard-clinic-open-live-calls"
              >
                Open live support
              </Link>
              <Link
                href="/integrations#clinic-booking-ops-map"
                className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                data-testid="tenant-dashboard-clinic-open-setup"
              >
                Review setup
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-3">
          <div
            data-testid="tenant-dashboard-clinic-task-follow-ups"
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Urgent follow-ups</p>
              <Badge variant={clinicUrgentFollowUps > 0 ? "error" : "success"}>
                {clinicUrgentFollowUps > 0 ? "Handle now" : "Clear"}
              </Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-neutral-950)]">{clinicUrgentFollowUps}</p>
            <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
              {clinicUrgentFollowUps > 0
                ? `${clinicUrgentFollowUps} clinic cases still need same-day staff action.`
                : "No urgent callbacks or manual handoffs are waiting right now."}
            </p>
          </div>

          <div
            data-testid="tenant-dashboard-clinic-task-live"
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Live call load</p>
              <Badge variant={!activeCallsAvailable || liveCallCount > 0 ? "warning" : "neutral"}>
                {liveCallBadgeLabel}
              </Badge>
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-neutral-950)]">{liveCallValue}</p>
            <p className="mt-2 text-sm text-[var(--color-neutral-600)]">{liveCallDetail}</p>
          </div>

          <div
            data-testid="tenant-dashboard-clinic-task-setup"
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Booking setup</p>
              <Badge variant={clinicSetupStatus === "ready" ? "success" : "warning"}>{clinicSetupLabel}</Badge>
            </div>
            <p className="mt-3 text-sm font-medium text-[var(--color-neutral-950)]">{clinicSetupLabel}</p>
            <p className="mt-2 text-sm text-[var(--color-neutral-600)]">{clinicSetupDetail}</p>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{copy.dashboard.clinicSectionTitle}</h2>
                <p className="text-sm text-[var(--color-neutral-500)]">
                  {copy.dashboard.clinicSectionDescription}
                </p>
              </div>
              <Link
                href="/bookings#clinic-follow-up-queue"
                className="text-sm font-medium text-[var(--color-neutral-900)] underline underline-offset-4"
              >
                {copy.dashboard.clinicSectionLink}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-4">
              <SummaryCard
                label={copy.dashboard.clinicConfirmedLabel}
                value={String(confirmedBookings?.total ?? 0)}
                detail={copy.dashboard.clinicConfirmedDetail}
                testId="tenant-dashboard-clinic-confirmed"
              />
              <SummaryCard
                label={copy.dashboard.clinicFollowUpLabel}
                value={String(clinicNeedsStaff)}
                detail={copy.dashboard.clinicFollowUpDetail}
                testId="tenant-dashboard-clinic-follow-up"
              />
              <SummaryCard
                label={copy.dashboard.clinicUrgentLabel}
                value={String(followUps?.summary.urgent ?? 0)}
                detail={copy.dashboard.clinicUrgentDetail}
                testId="tenant-dashboard-clinic-urgent"
              />
              <SummaryCard
                label={copy.dashboard.clinicHandedOffLabel}
                value={String(followUps?.summary.handed_off ?? 0)}
                detail={copy.dashboard.clinicHandedOffDetail}
                testId="tenant-dashboard-clinic-handed-off"
              />
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)]">
              <div className="border-b border-[var(--color-border)] px-4 py-3">
                <h3 className="text-sm font-semibold text-[var(--color-neutral-950)]">{copy.dashboard.latestBookingOutcomesTitle}</h3>
              </div>
              <ol className="divide-y divide-[var(--color-border)]">
                {(recentBookings?.results ?? []).slice(0, 5).map((booking) => (
                  <li key={booking.call_id} data-testid={`tenant-dashboard-booking-${booking.call_id}`} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-[var(--color-neutral-950)]">
                        {booking.patient_full_name ?? booking.patient_phone ?? copy.dashboard.unknownCaller}
                      </p>
                      <p className="text-xs text-[var(--color-neutral-500)]">
                        {booking.specialty ?? copy.dashboard.generalRequest} · {booking.clinic_city ?? copy.dashboard.cityNotCaptured} ·{" "}
                        {formatTenantDateTime(locale, booking.started_at, copy.common.notRecorded)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={bookingStatusVariant(booking.booking_status)}>
                        {bookingStatusLabel(copy, booking.booking_status)}
                      </Badge>
                      {booking.needs_follow_up ? <Badge variant="warning">{copy.dashboard.needsFollowUpBadge}</Badge> : null}
                    </div>
                  </li>
                ))}
                {(recentBookings?.results.length ?? 0) === 0 ? (
                  <li className="px-4 py-6 text-sm text-[var(--color-neutral-500)]">{copy.dashboard.recentClinicOutcomesEmpty}</li>
                ) : null}
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{copy.dashboard.callQualityTitle}</h2>
            <p className="text-sm text-[var(--color-neutral-500)]">
              {copy.dashboard.callQualityClinicDescription}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <p className="text-sm text-[var(--color-neutral-500)]">{copy.dashboard.slowestPathLabel}</p>
              <p className="mt-2 text-lg font-semibold text-[var(--color-neutral-950)]">{hotspotLabel}</p>
              <p className="mt-2 text-sm text-[var(--color-neutral-500)]">
                {copy.dashboard.callQualityClinicHelp}
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
