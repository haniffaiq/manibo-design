"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { Button } from "@grove/ui/button";
import { Skeleton } from "@grove/ui/skeleton";
import { SessionInsightsFeed, type SessionInsightItem } from "@/components/session-insights-feed";
import type { CallLatencyResponse, CallTraceSummaryResponse } from "@/lib/api/call-observability";
import type { CallDetailResponse, CallEventsResponse } from "@/lib/api/call-history";
import { observabilitySelectionHref } from "@/lib/observability-routes";
import {
  eventCategoryLabel,
  eventFacts,
  eventHeadline,
  formatElapsedTime,
} from "@/lib/call-observability-presenters";
import { TechnicalDrawer } from "./technical-drawer";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

function transcriptPreview(text: string | null | undefined): string | null {
  const trimmed = text?.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.length > 220 ? `${trimmed.slice(0, 217)}...` : trimmed;
}

// ---------------------------------------------------------------------------
// Session insight item builder — shared between detail panel and drawer
// ---------------------------------------------------------------------------

function buildSessionInsightItems(
  detail: CallDetailResponse | undefined,
  events: CallEventsResponse | undefined,
  trace: CallTraceSummaryResponse | undefined,
  recordingAction: (recordingId: string) => ReactNode,
): SessionInsightItem[] {
  const items: SessionInsightItem[] = [];
  const transcriptSnippet = transcriptPreview(detail?.transcript?.full_text);

  if (detail && transcriptSnippet) {
    items.push({
      id: "transcript",
      category: "Transcript",
      categoryVariant: "neutral",
      headline: "Saved conversation transcript",
      meta: detail.transcript?.language
        ? `Language: ${detail.transcript.language}`
        : "Transcript language not saved",
      detail: transcriptSnippet,
    });
  }

  for (const event of events?.events ?? []) {
    items.push({
      id: `event-${event.seq}`,
      category: eventCategoryLabel(event.event_type),
      categoryVariant:
        event.event_type === "call.escalation.transfer_failed" || event.event_type === "call.manual_takeover.failed" || event.event_type === "call.manual_takeover.requested"
          ? "warning"
          : event.event_type === "call.manual_takeover"
            ? "success"
            : "neutral",
      headline: eventHeadline(event),
      meta: formatElapsedTime(event.occurred_at_ms),
      facts: eventFacts(event),
    });
  }

  for (const route of trace?.routes ?? []) {
    items.push({
      id: `route-${route.seq}`,
      category: "Route",
      categoryVariant: "warning",
      headline: `Route selected: ${route.route}`,
      meta: formatElapsedTime(route.occurred_at_ms),
      detail: `${route.node_name ?? "Unknown node"}${route.next_node_name ? ` -> ${route.next_node_name}` : ""}`,
      facts: route.graph_type ? [route.graph_type] : [],
    });
  }

  for (const recording of detail?.recordings ?? []) {
    items.push({
      id: `recording-${recording.id}`,
      category: "Recording",
      categoryVariant: "success",
      headline: "Call recording ready",
      meta: `${recording.status} · ${formatDateTime(recording.created_at)}`,
      detail: "Playback opens in a separate tab with a signed URL.",
      action: recordingAction(recording.id),
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Main detail panel (right side of master-detail split)
// ---------------------------------------------------------------------------

export interface CallHistoryDetailPanelProps {
  selectedCallId: string | null;
  detail: CallDetailResponse | undefined;
  events: CallEventsResponse | undefined;
  trace: CallTraceSummaryResponse | undefined;
  latency: CallLatencyResponse | undefined;
  detailLoading: boolean;
  detailError: string | null;
  eventsError: string | null;
  recordingError: string | null;
  recordingActionBusyId: string | null;
  onOpenRecording: (recordingId: string) => void;
  technicalOpen: boolean;
  onOpenTechnical: () => void;
  onCloseTechnical: () => void;
  technicalLoading: boolean;
  technicalError: string | null;
  bookingsEnabled: boolean;
}

export function CallHistoryDetailPanel({
  selectedCallId,
  detail,
  events,
  trace,
  latency,
  detailLoading,
  detailError,
  eventsError,
  recordingError,
  recordingActionBusyId,
  onOpenRecording,
  technicalOpen,
  onOpenTechnical,
  onCloseTechnical,
  technicalLoading,
  technicalError,
  bookingsEnabled,
}: CallHistoryDetailPanelProps) {
  const recordingAction = (recordingId: string): ReactNode => (
    <Button
      data-testid={`call-history-recording-open-${recordingId}`}
      size="sm"
      variant="outline"
      disabled={recordingActionBusyId === recordingId}
      onClick={() => void onOpenRecording(recordingId)}
    >
      {recordingActionBusyId === recordingId ? "Opening..." : "Open"}
    </Button>
  );

  const sessionInsightItems = buildSessionInsightItems(detail, events, trace, recordingAction);

  if (!selectedCallId) {
    return (
      <div className="flex h-full items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-12">
        <p className="text-sm text-[var(--color-neutral-500)]">Select a call from the list to inspect details.</p>
      </div>
    );
  }

  if (detailLoading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <>
      <div data-testid="call-history-detail" className="grid gap-4">
        {/* Header row with call ID and action links */}
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Call Detail</h2>
            <p className="text-sm text-[var(--color-neutral-500)]">
              {detail ? `Call ID: ${detail.call.id}` : "Loading call details..."}
            </p>
          </div>
          {detail ? (
            <div className="flex flex-wrap gap-2">
              <Link href={observabilitySelectionHref("tenant", { kind: "call_session", subjectId: detail.call.id, callId: detail.call.id })} data-testid="call-history-open-observability" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]">
                Open in observability
              </Link>
              {bookingsEnabled && detail.call.outcome === "escalated" ? (
                <Link href={`/bookings?call_id=${encodeURIComponent(detail.call.id)}&source=live-support`} data-testid="call-history-open-follow-up" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]">
                  View follow-up
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {detailError ? (
          <p data-testid="call-history-detail-error" className="text-sm text-[var(--color-error-700)]">
            {detailError}
          </p>
        ) : null}
        {recordingError ? (
          <p data-testid="call-history-recording-error" className="text-sm text-[var(--color-error-700)]">
            {recordingError}
          </p>
        ) : null}

        {detail ? (
          <>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <p>
                <span className="font-medium">Direction:</span> {detail.call.direction}
              </p>
              <p>
                <span className="font-medium">State:</span> {detail.call.state}
              </p>
              <p>
                <span className="font-medium">Outcome:</span> {detail.call.outcome ?? "—"}
              </p>
              <p>
                <span className="font-medium">Duration:</span>{" "}
                {detail.call.duration_seconds !== null ? `${detail.call.duration_seconds}s` : "—"}
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">Transcript</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-950)]">
                  {detail.transcript?.full_text?.trim() ? "Saved" : "Missing"}
                </p>
                <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                  {detail.transcript?.language ? `Language ${detail.transcript.language}` : "Language not saved"}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">Activity markers</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-950)]">
                  {events?.events.length ?? 0}
                </p>
                <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                  {eventsError ? "Saved timeline not available right now." : "Plain-language milestones from the saved call."}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">Route decisions</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-950)]">
                  {trace?.routes.length ?? 0}
                </p>
                <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                  {trace ? "Recovered from the saved call trace." : "Open technical details if this stays empty."}
                </p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">Recordings</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-950)]">
                  {detail.recordings.length}
                </p>
                <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                  {detail.has_more.recordings ? "List truncated at the API limit." : "Signed playback stays role-gated."}
                </p>
              </div>
            </div>

            {eventsError ? (
              <p data-testid="call-history-events-error" className="text-sm text-[var(--color-error-700)]">
                We could not load the saved call timeline right now.
              </p>
            ) : null}

            <SessionInsightsFeed
              title="Session insights"
              description="One place to review transcript evidence, saved milestones, route decisions, and recordings."
              items={sessionInsightItems}
              emptyState="No saved session evidence was available for this conversation yet."
              testIdPrefix="call-history-session"
            />

            <details className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--color-neutral-950)]">
                Full transcript
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-neutral-700)]">
                {detail.transcript?.full_text?.trim() || "Transcript not available."}
              </p>
              {detail.has_more.transcript ? (
                <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
                  Transcript truncated at API response limit.
                </p>
              ) : null}
            </details>

            <div>
              <Button
                data-testid="call-history-open-technical-details"
                variant="outline"
                onClick={() => onOpenTechnical()}
              >
                View technical details
              </Button>
            </div>
          </>
        ) : null}
      </div>

      <TechnicalDrawer
        open={technicalOpen}
        onClose={onCloseTechnical}
        loading={technicalLoading}
        error={technicalError}
        latency={latency}
        trace={trace}
      />
    </>
  );
}
