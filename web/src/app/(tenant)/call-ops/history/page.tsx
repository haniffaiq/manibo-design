"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { Input } from "@grove/ui/input";
import { PageFrame } from "@/components/page-frame";
import { PageHeader } from "@/components/page-header";
import { CallHistoryDetailPanel } from "@/components/call-ops/call-history-detail-panel";
import { useTenantCopy } from "@/components/tenant-locale-provider";
import { useCallDetail } from "@/hooks/use-call-detail";
import { useTenantSolutionState } from "@/lib/solutions";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import {
  getRecordingSignedUrl,
  listHistoricalCalls,
  type CallListItem,
  type CallsListResponse,
} from "@/lib/api/call-history";

const EMPTY_CALLS: CallListItem[] = [];

function formatDateTime(value: string | null): string {
  if (!value) {
    return "\u2014";
  }
  return new Date(value).toLocaleString();
}

function parseDateTimeFilter(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}

export default function CallHistoryPage() {
  const copy = useTenantCopy();
  const bookingsSolution = useTenantSolutionState("appointment_booking");
  const searchParams = useSearchParams();
  const [driverId, setDriverId] = useState("");
  const [phone, setPhone] = useState("");
  const [outcome, setOutcome] = useState("");
  const [startedAfter, setStartedAfter] = useState("");
  const [startedBefore, setStartedBefore] = useState("");
  const autoOpenedSelectionRef = useRef<string | null>(null);

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyResult, setHistoryResult] = useState<CallsListResponse | null>(null);

  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [technicalOpen, setTechnicalOpen] = useState(false);

  const {
    detail: selectedCallDetail,
    events: selectedCallEvents,
    trace: selectedCallTrace,
    latency: selectedCallLatency,
    isLoading: callDetailLoading,
    detailError: rawDetailError,
    eventsError: rawEventsError,
    traceError: rawTraceError,
    latencyError: rawLatencyError,
  } = useCallDetail(selectedCallId, { fetchLatency: technicalOpen });

  const detailLoading = callDetailLoading && !selectedCallDetail;
  const detailError = rawDetailError ? toErrorMessage(rawDetailError) : null;
  const eventsError = rawEventsError ? toErrorMessage(rawEventsError) : null;
  const technicalLoading = technicalOpen && ((!selectedCallLatency && !rawLatencyError) || (!selectedCallTrace && !rawTraceError));
  const technicalErrors: string[] = [];
  if (rawLatencyError) technicalErrors.push(`timing summary: ${toErrorMessage(rawLatencyError)}`);
  if (rawTraceError) technicalErrors.push(`route details: ${toErrorMessage(rawTraceError)}`);
  const technicalError = technicalErrors.length > 0
    ? `We could not load ${technicalErrors.join(" and ")}.`
    : null;

  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [recordingActionBusyId, setRecordingActionBusyId] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const deepLinkedCallId = searchParams.get("call_id")?.trim() ?? "";
  const deepLinkedTechnical = searchParams.get("technical") === "1";
  const deepLinkSelectionKey = deepLinkedCallId ? `${deepLinkedCallId}:${deepLinkedTechnical ? "technical" : "detail"}` : "";

  async function searchCalls(): Promise<void> {
    setHistoryLoading(true);
    setHistoryError(null);
    setActionNotice(null);
    try {
      const response = await listHistoricalCalls({
        driver_id: driverId.trim() || undefined,
        phone: phone.trim() || undefined,
        outcome: outcome || undefined,
        started_after: parseDateTimeFilter(startedAfter),
        started_before: parseDateTimeFilter(startedBefore),
        limit: 50,
        offset: 0,
      });
      setHistoryResult(response);
      setSelectedCallId(null);
      setTechnicalOpen(false);
    } catch (error) {
      setHistoryError(toErrorMessage(error));
    } finally {
      setHistoryLoading(false);
    }
  }

  function openCallDetail(callId: string): void {
    setActionNotice(null);
    setRecordingError(null);
    setSelectedCallId(callId);
  }

  async function openRecording(recordingId: string): Promise<void> {
    setRecordingActionBusyId(recordingId);
    setActionNotice(null);
    setRecordingError(null);
    try {
      const signed = await getRecordingSignedUrl(recordingId, 3600);
      window.open(signed.url, "_blank", "noopener,noreferrer");
      setActionNotice(`Recording URL opened for ${recordingId}.`);
    } catch (error) {
      setRecordingError(toErrorMessage(error));
    } finally {
      setRecordingActionBusyId(null);
    }
  }

  useEffect(() => {
    if (!deepLinkedCallId || autoOpenedSelectionRef.current === deepLinkSelectionKey) {
      return;
    }
    autoOpenedSelectionRef.current = deepLinkSelectionKey;
    openCallDetail(deepLinkedCallId);
    if (deepLinkedTechnical) {
      setTechnicalOpen(true);
    }
  }, [deepLinkedCallId, deepLinkedTechnical, deepLinkSelectionKey]);

  const calls = historyResult?.calls ?? EMPTY_CALLS;

  return (
    <PageFrame className="px-6 py-8">
      <PageHeader title={copy.callHistory.title} description={copy.callHistory.description} />

      {/* Filters */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Filters</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              id="call-history-filter-driver-id"
              data-testid="call-history-filter-driver-id"
              label="Driver ID"
              value={driverId}
              onChange={(event) => setDriverId(event.currentTarget.value)}
              placeholder="contact_id from call metadata"
            />
            <Input
              id="call-history-filter-phone"
              data-testid="call-history-filter-phone"
              label="Phone"
              value={phone}
              onChange={(event) => setPhone(event.currentTarget.value)}
              placeholder="+37060000001"
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="call-history-filter-outcome" className="text-sm font-medium text-[var(--color-neutral-700)]">
                Outcome
              </label>
              <select
                id="call-history-filter-outcome"
                data-testid="call-history-filter-outcome"
                value={outcome}
                onChange={(event) => setOutcome(event.currentTarget.value)}
                className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]"
              >
                <option value="">Any</option>
                <option value="resolved">resolved</option>
                <option value="escalated">escalated</option>
                <option value="failed">failed</option>
              </select>
            </div>
            <Input
              id="call-history-filter-started-after"
              data-testid="call-history-filter-started-after"
              label="Started After"
              type="datetime-local"
              value={startedAfter}
              onChange={(event) => setStartedAfter(event.currentTarget.value)}
            />
            <Input
              id="call-history-filter-started-before"
              data-testid="call-history-filter-started-before"
              label="Started Before"
              type="datetime-local"
              value={startedBefore}
              onChange={(event) => setStartedBefore(event.currentTarget.value)}
            />
          </div>
          <div className="mt-4">
            <Button data-testid="call-history-search-submit" onClick={() => void searchCalls()} disabled={historyLoading}>
              {historyLoading ? "Searching..." : "Search Calls"}
            </Button>
          </div>
          {historyError ? (
            <p data-testid="call-history-error" className="mt-3 text-sm text-[var(--color-error-700)]">
              {historyError}
            </p>
          ) : null}
          {actionNotice ? (
            <p data-testid="call-history-notice" className="mt-3 text-sm text-[var(--color-success-700)]">
              {actionNotice}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Master-detail split: compact call list (left) + detail panel (right) */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        {/* Left panel: compact results list */}
        <Card className="self-start">
          <CardHeader>
            <h2 className="text-lg font-semibold">Results</h2>
            <p className="text-sm text-[var(--color-neutral-500)]">
              {historyResult ? `${historyResult.total} total calls` : "Run a search to view historical calls."}
            </p>
          </CardHeader>
          <CardContent>
            <div data-testid="call-history-table">
              {historyLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 animate-pulse rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)]" />
                  ))}
                </div>
              ) : calls.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--color-neutral-500)]">
                  No calls found for the current filters.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {calls.map((call) => (
                    <li key={call.id}>
                      <button
                        type="button"
                        data-testid={`call-history-detail-open-${call.id}`}
                        onClick={() => openCallDetail(call.id)}
                        className={`w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors ${
                          selectedCallId === call.id
                            ? "border-[var(--color-primary-600)] bg-[var(--color-primary-50)]"
                            : "border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-primary-300)] hover:bg-[var(--color-bg-subtle)]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-medium text-[var(--color-neutral-900)]">
                            {call.id}
                          </span>
                          <Badge variant={call.outcome === "resolved" ? "success" : call.outcome === "failed" ? "warning" : "neutral"}>
                            {call.outcome ?? call.state}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
                          <Badge variant={call.direction === "inbound" ? "neutral" : "success"} className="text-[10px]">
                            {call.direction}
                          </Badge>
                          <span>{formatDateTime(call.started_at)}</span>
                          {call.duration_seconds !== null ? <span>{call.duration_seconds}s</span> : null}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right panel: call detail */}
        <div className="min-h-[24rem]">
          <CallHistoryDetailPanel
            selectedCallId={selectedCallId}
            detail={selectedCallDetail}
            events={selectedCallEvents}
            trace={selectedCallTrace}
            latency={selectedCallLatency}
            detailLoading={detailLoading}
            detailError={detailError}
            eventsError={eventsError}
            recordingError={recordingError}
            recordingActionBusyId={recordingActionBusyId}
            onOpenRecording={(id) => void openRecording(id)}
            technicalOpen={technicalOpen}
            onOpenTechnical={() => setTechnicalOpen(true)}
            onCloseTechnical={() => setTechnicalOpen(false)}
            technicalLoading={technicalLoading}
            technicalError={technicalError}
            bookingsEnabled={bookingsSolution.enabled}
          />
        </div>
      </div>
    </PageFrame>
  );
}
