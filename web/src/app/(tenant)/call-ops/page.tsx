"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { ActiveCallsTable } from "@/components/call-ops/active-calls-table";
import { EscalationModal, type ActiveCall, type EscalationAction, type EscalationDraft } from "@/components/call-ops/escalation-modal";
import { StatusMessage } from "@/components/status-message";
import { LiveTranscript } from "@/components/call-ops/live-transcript";
import { RouteHotspotsTable } from "@/components/call-ops/route-hotspots-table";
import { SlowdownSummary } from "@/components/call-ops/slowdown-summary";
import { SupportDrawer } from "@/components/call-ops/support-drawer";
import { UrgentCallBanner } from "@/components/call-ops/urgent-banner";
import { PageFrame } from "@/components/page-frame";
import { PageHeader } from "@/components/page-header";
import { useTenantCopy } from "@/components/tenant-locale-provider";
import { useNotice } from "@/hooks/use-notice";
import {
  getCallOpsDashboardData,
  mintLiveKitToken,
  type CallOpsDashboardData,
} from "@/lib/call-ops-dashboard";
import { enrichCallsWithEscalation, sortByEscalationPriority } from "@/lib/call-ops-escalation";
import { bookingsGuidanceDetail, bookingsUnavailableNote } from "@/lib/call-ops-presenters";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import { useTenantSolutionState } from "@/lib/solutions";
import * as swrKeys from "@/lib/swr-keys";

const EMPTY_CALLS: ActiveCall[] = [];

export default function CallOpsPage() {
  const copy = useTenantCopy();
  const bookingsSolution = useTenantSolutionState("appointment_booking");
  const bookingsWorkspaceAvailable = bookingsSolution.enabled;
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { notice, showNotice } = useNotice();
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  const [supportOpen, setSupportOpen] = useState(false);
  const [supportCall, setSupportCall] = useState<ActiveCall | null>(null);
  const [escalationDraft, setEscalationDraft] = useState<EscalationDraft | null>(null);

  const { data: dashboardData, isLoading: dashboardLoading } = useSWR(
    swrKeys.callOpsDashboard(),
    getCallOpsDashboardData,
    { revalidateOnFocus: false, refreshInterval: 10_000 },
  );

  const callsUnavailable = dashboardData?.calls.status === "error";
  const performanceUnavailable = dashboardData?.summary.status === "error";
  const callsDataNotice =
    callsUnavailable && performanceUnavailable
      ? { message: copy.callOps.dataUnavailable, variant: "error" as const }
      : callsUnavailable || performanceUnavailable
        ? { message: copy.callOps.partialDataWarning, variant: "warning" as const }
        : null;

  const baseCalls = dashboardData?.calls.status === "success" ? dashboardData.calls.data : EMPTY_CALLS;

  // Escalation enrichment runs as a dependent SWR so the table renders immediately,
  // then badges appear once per-call event fetches resolve.
  const { data: enrichedCalls } = useSWR(
    baseCalls.length > 0 ? ["call-ops-escalation", [...baseCalls].map((c) => c.call_id).sort().join(",")] : null,
    () => enrichCallsWithEscalation(baseCalls),
    { revalidateOnFocus: false },
  );

  const calls = useMemo<ActiveCall[]>(
    () => sortByEscalationPriority<ActiveCall>(enrichedCalls ?? baseCalls),
    [enrichedCalls, baseCalls],
  );
  const summary = dashboardData?.summary.status === "success" ? dashboardData.summary.data : null;
  const error = actionError;

  async function copyToken(callId: string, mode: "listen" | "join") {
    setActionBusy(true);
    setActionError(null);
    try {
      const data = await mintLiveKitToken(callId, mode);
      await navigator.clipboard.writeText(data.token);
      showNotice(`${mode === "listen" ? "Listen-in" : "Join-call"} token copied for room ${data.room_name}.`);
    } catch (e) {
      setActionError(toErrorMessage(e));
    } finally {
      setActionBusy(false);
    }
  }

  function openEscalationModal(call: ActiveCall, action: EscalationAction): void {
    setEscalationDraft({ call, action });
  }

  function closeEscalationModal(): void {
    setEscalationDraft(null);
  }

  function openSupportDrawer(call: ActiveCall): void {
    setSupportOpen(true);
    setSupportCall(call);
  }

  function closeSupportDrawer(): void {
    setSupportOpen(false);
    setSupportCall(null);
  }

  function startTranscript(callId: string) {
    setSelectedCallId(callId);
  }

  function stopTranscript() {
    setSelectedCallId(null);
  }

  const topHotspots = useMemo(
    () =>
      [...(summary?.route_hotspots ?? [])].sort((left, right) => {
        const leftMetric = left.p95_latency_ms ?? left.average_latency_ms ?? 0;
        const rightMetric = right.p95_latency_ms ?? right.average_latency_ms ?? 0;
        return rightMetric - leftMetric;
      }),
    [summary],
  );

  const bookingsFlags = { buildEnabled: bookingsSolution.buildEnabled, isLoading: bookingsSolution.isLoading, error: bookingsSolution.error, tenantEnabled: bookingsSolution.tenantEnabled };
  const bookingsGuidance = bookingsGuidanceDetail(bookingsFlags);
  const bookingsUnavailable = bookingsUnavailableNote(bookingsFlags);

  return (
    <>
      <PageFrame width="workspace" className="px-6 py-8">
        <div className="flex flex-col gap-2">
          <PageHeader compact title={copy.callOps.title} description={copy.callOps.description} />
          {notice ? <StatusMessage variant={notice.variant} inline data-testid="call-ops-notice">{notice.message}</StatusMessage> : null}
          {error ? <StatusMessage variant="error" inline data-testid="call-ops-error">{error}</StatusMessage> : null}
          {callsDataNotice ? (
            <StatusMessage data-testid="call-ops-data-notice" variant={callsDataNotice.variant}>
              {callsDataNotice.message}
            </StatusMessage>
          ) : null}
        </div>

        {callsUnavailable ? null : (
          <UrgentCallBanner
            calls={calls}
            disabled={actionBusy}
            onTransfer={(call) => openEscalationModal(call, "terminate-transfer")}
            onJoin={(callId) => void copyToken(callId, "join")}
          />
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Current live calls</h2>
              <p className="text-sm text-[var(--color-neutral-500)]">
                Use these controls when you need to listen in, join, step in, or move the caller to a person urgently.
              </p>
            </CardHeader>
            <CardContent>
              {callsUnavailable ? (
                <StatusMessage data-testid="call-ops-live-calls-unavailable" variant="warning">
                  {copy.callOps.liveCallsUnavailable}
                </StatusMessage>
              ) : (
                <ActiveCallsTable
                  calls={calls}
                  loading={dashboardLoading}
                  disabled={actionBusy}
                  onSupport={(call) => openSupportDrawer(call)}
                  onListen={(callId) => void copyToken(callId, "listen")}
                  onJoin={(callId) => void copyToken(callId, "join")}
                  onTakeOver={(call) => openEscalationModal(call, "takeover")}
                  onTransfer={(call) => openEscalationModal(call, "terminate-transfer")}
                  onTranscript={(callId) => startTranscript(callId)}
                />
              )}
            </CardContent>
          </Card>

          <LiveTranscript callId={selectedCallId} onStop={stopTranscript} />
        </section>

        <details data-testid="call-ops-performance-section">
          <summary className="cursor-pointer text-sm font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]">
            Performance summary
          </summary>
          <div className="mt-3 space-y-4">
            {dashboardLoading && !dashboardData ? (
              <p className="text-sm text-[var(--color-neutral-500)]">Loading performance summary...</p>
            ) : performanceUnavailable ? (
              <StatusMessage data-testid="call-ops-performance-unavailable" variant="warning">
                {copy.callOps.performanceUnavailable}
              </StatusMessage>
            ) : (
              <>
                <SlowdownSummary summary={summary} />
                <RouteHotspotsTable hotspots={topHotspots} />
              </>
            )}
          </div>
        </details>
      </PageFrame>

      <SupportDrawer
        open={supportOpen}
        call={supportCall}
        onClose={closeSupportDrawer}
        onEscalate={openEscalationModal}
        onJoin={(callId) => void copyToken(callId, "join")}
        onTranscript={(callId) => startTranscript(callId)}
        actionBusy={actionBusy}
        bookingsAvailable={bookingsWorkspaceAvailable}
        bookingsGuidanceDetail={bookingsGuidance}
        bookingsUnavailableNote={bookingsUnavailable}
      />

      <EscalationModal
        draft={escalationDraft}
        onClose={closeEscalationModal}
        onSuccess={(message) => {
          showNotice(message);
          closeEscalationModal();
        }}
        onError={(message) => setActionError(message)}
      />
    </>
  );
}
