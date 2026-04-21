"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { PageFrame } from "@/components/page-frame";
import { PageHeader } from "@grove/web-shared/components/page-header";
import { useTenantLocale } from "@grove/web-shared/hooks/use-tenant-locale";
import { PlatformApiError } from "@grove/web-shared/api/platform";
import type { ClinicBookingStatus, ClinicFollowUpPriority } from "./api/clinic-bookings";
import { SolutionLoadErrorState } from "@grove/web-shared/components/solution-load-error-state";
import { SolutionUnavailableState } from "@grove/web-shared/components/solution-unavailable-state";
import type { SolutionState } from "@grove/web-shared/types/solution-state";
import { listTeamUsers, type TeamUser } from "@/lib/api/team";
import { observabilitySelectionHref } from "@/lib/observability-routes";
import { ClinicBrowserVoiceCard } from "./components/clinic-browser-voice-card";
import { IntegrationStatusCard } from "./components/integration-status-card";
import { ClinicConfigEditor } from "./components/clinic-config-editor";
import { FollowUpQueue } from "./components/follow-up-queue";
import { BookingOutcomesList } from "./components/booking-outcomes-list";
import { BookingDetail } from "./components/booking-detail";
import { useBookingResultsList } from "./hooks/use-booking-results";
import { useFollowUpList } from "./hooks/use-follow-ups";
import { useClinicIntegrations } from "./hooks/use-clinic-integrations";
import * as swrKeys from "./lib/swr-keys";

const EMPTY_TEAM_USERS: TeamUser[] = [];
function toErrorMessage(error: unknown): string {
  if (error instanceof PlatformApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}
function parsePriorityFilter(value: string | null): ClinicFollowUpPriority | "all" {
  return value === "urgent" || value === "normal" ? value : "all";
}
function parseBookingStatusFilter(value: string | null): ClinicBookingStatus | "all" {
  return value === "confirmed" || value === "pending" || value === "failed" || value === "handed_off"
    ? value
    : "all";
}
function bookingsSourceLabel(value: string | null): string | null {
  if (value === "live-support") {
    return "Live support sent this case here so staff can finish the handoff without rebuilding context.";
  }
  if (value === "dashboard") {
    return "Dashboard triage opened this workspace so staff can clear the queue from the highest-priority cases down.";
  }
  if (value === "integrations") {
    return "Integrations sent you here because clinic setup and patient follow-up have to be checked together.";
  }
  return null;
}
function integrationOverallVariant(status: "ready" | "attention_required"): "success" | "warning" {
  return status === "ready" ? "success" : "warning";
}
function integrationOverallLabel(status: "ready" | "attention_required"): string {
  return status === "ready" ? "Ready for live bookings" : "Needs setup attention";
}
function ClinicBookingsPageContent({ solutionState }: { solutionState: SolutionState }) {
  const { locale, copy } = useTenantLocale();
  const searchParams = useSearchParams();
  const requestedCallId = searchParams.get("call_id")?.trim() || null;
  const requestedPriority = parsePriorityFilter(searchParams.get("priority"));
  const requestedStatus = parseBookingStatusFilter(searchParams.get("status"));
  const requestedSource = searchParams.get("source")?.trim() || null;
  const { enabled, error: solutionError, isLoading: solutionLoading } = solutionState;

  const [searchPhone, setSearchPhone] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClinicBookingStatus | "all">(() => requestedStatus);
  const [priorityFilter, setPriorityFilter] = useState<ClinicFollowUpPriority | "all">(() => requestedPriority);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(() => requestedCallId);

  const { results, confirmedCount, error: bookingResultsError, isLoading: bookingResultsLoading } =
    useBookingResultsList({ enabled, statusFilter, searchPhone });

  const { followUpItems, followUpSummary, error: followUpsError, isLoading: followUpsLoading } =
    useFollowUpList({ enabled, priorityFilter, searchPhone });
  const { integrationStatusData } = useClinicIntegrations({ enabled });

  const { data: teamUsersData, error: teamUsersError } = useSWR(
    enabled ? swrKeys.clinicFollowUpTeamUsers() : null,
    listTeamUsers,
    { revalidateOnFocus: false },
  );
  const teamUsers = teamUsersData?.users ?? EMPTY_TEAM_USERS;

  const activeCallId = useMemo(() => {
    const availableCallIds = new Set([...followUpItems, ...results].map((item) => item.call_id));
    const fallbackCallId = followUpItems[0]?.call_id ?? results[0]?.call_id ?? null;
    if (!selectedCallId) {
      return fallbackCallId;
    }
    if (requestedCallId && selectedCallId === requestedCallId) {
      return selectedCallId;
    }
    return availableCallIds.has(selectedCallId) ? selectedCallId : fallbackCallId;
  }, [followUpItems, requestedCallId, results, selectedCallId]);

  const callHistoryHref = activeCallId ? `/call-ops/history?call_id=${encodeURIComponent(activeCallId)}` : null;
  const observabilityHref = activeCallId
    ? observabilitySelectionHref("tenant", {
        kind: "call_session",
        subjectId: activeCallId,
        callId: activeCallId,
      })
    : null;
  const clinicContextMessage = bookingsSourceLabel(requestedSource);
  useEffect(() => {
    if (requestedCallId) {
      setSelectedCallId((c) => (c === requestedCallId ? c : requestedCallId));
    }
  }, [requestedCallId]);

  useEffect(() => { setPriorityFilter(requestedPriority); }, [requestedPriority]);
  useEffect(() => { setStatusFilter(requestedStatus); }, [requestedStatus]);

  if (solutionLoading) {
    return (
      <Card id="clinic-booking-readiness">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-900)]">{copy.bookings.title}</h1>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-neutral-500)]">Checking whether this workspace is available...</p>
        </CardContent>
      </Card>
    );
  }

  if (solutionError) {
    return (
      <SolutionLoadErrorState
        title={copy.bookings.title}
        detail="We could not confirm whether appointment booking is available for this workspace."
        errorMessage={toErrorMessage(solutionError)}
        onRetry={() => window.location.reload()}
      />
    );
  }

  if (!enabled) {
    return (
      <SolutionUnavailableState
        title={copy.bookings.title}
        detail="Appointment booking is not turned on for your organization."
      />
    );
  }

  return (
    <PageFrame className="px-6 py-8">
      <PageHeader title={copy.bookings.title} description={copy.bookings.description} />

      {requestedCallId || clinicContextMessage ? (
        <div
          data-testid="clinic-bookings-context-banner"
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-4 text-sm text-[var(--color-neutral-700)]"
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              {requestedCallId ? (
                <p>
                  Continuing support for call <code>{requestedCallId}</code>. This keeps the live handoff context tied
                  to the booking workspace instead of forcing staff to reconstruct it manually.
                </p>
              ) : null}
              {clinicContextMessage ? <p>{clinicContextMessage}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {requestedCallId ? (
                <Link
                  href="/call-ops"
                  className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                  data-testid="clinic-bookings-back-to-call-ops"
                >
                  Back to live support
                </Link>
              ) : null}
              <a
                href="#clinic-follow-up-queue"
                className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                data-testid="clinic-bookings-jump-queue"
              >
                Open staff queue
              </a>
              <a
                href="#clinic-booking-readiness"
                className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                data-testid="clinic-bookings-jump-setup"
              >
                Review clinic setup
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <ClinicBrowserVoiceCard locale={locale} />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><p className="text-sm font-medium text-[var(--color-neutral-500)]">Calls reviewed</p></CardHeader>
          <CardContent><p className="text-3xl font-semibold text-[var(--color-neutral-900)]">{results.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><p className="text-sm font-medium text-[var(--color-neutral-500)]">Confirmed bookings</p></CardHeader>
          <CardContent><p className="text-3xl font-semibold text-[var(--color-neutral-900)]">{confirmedCount}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><p className="text-sm font-medium text-[var(--color-neutral-500)]">Needs staff action</p></CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-[var(--color-neutral-900)]">{followUpSummary.total}</p>
            <p className="mt-2 text-xs text-[var(--color-neutral-500)]">{followUpSummary.pending} still waiting for a manual callback or review.</p>
          </CardContent>
        </Card>
      </div>

      <Card id="clinic-follow-up-queue">
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Clinic setup and readiness</h2>
              <p className="text-sm text-[var(--color-neutral-500)]">
                Check connector health and reminder policy before telling staff the booking flow is ready for patients.
              </p>
            </div>
            {integrationStatusData ? (
              <Badge
                data-testid="clinic-integration-overall-status"
                variant={integrationOverallVariant(integrationStatusData.overall_status)}
              >
                {integrationOverallLabel(integrationStatusData.overall_status)}
              </Badge>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <IntegrationStatusCard enabled={enabled} />
          <ClinicConfigEditor enabled={enabled} />
        </CardContent>
      </Card>

      <FollowUpQueue
        followUpItems={followUpItems}
        followUpSummary={followUpSummary}
        priorityFilter={priorityFilter}
        onPriorityFilterChange={setPriorityFilter}
        activeCallId={activeCallId}
        onSelectCall={setSelectedCallId}
        isLoading={followUpsLoading}
        error={followUpsError}
      />

      <BookingOutcomesList
        results={results}
        activeCallId={activeCallId}
        onSelectCall={setSelectedCallId}
        searchPhone={searchPhone}
        onSearchPhoneChange={setSearchPhone}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        isLoading={bookingResultsLoading}
        error={bookingResultsError}
      />

      <BookingDetail
        key={activeCallId ?? "none"}
        activeCallId={activeCallId}
        callHistoryHref={callHistoryHref}
        observabilityHref={observabilityHref}
        requestedSource={requestedSource}
        teamUsers={teamUsers}
        teamUsersError={teamUsersError}
        queueFollowUpItem={followUpItems.find((item) => item.call_id === activeCallId) ?? null}
      />
    </PageFrame>
  );
}
function ClinicBookingsPageFallback() {
  return (
    <PageFrame className="items-center justify-center px-6 py-8">
      <p className="text-sm text-[var(--color-neutral-500)]">Loading clinic bookings...</p>
    </PageFrame>
  );
}

export default function ClinicBookingsPage({ solutionState }: { solutionState: SolutionState }) {
  return (
    <Suspense fallback={<ClinicBookingsPageFallback />}>
      <ClinicBookingsPageContent solutionState={solutionState} />
    </Suspense>
  );
}
