"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@grove/ui/badge";
import { Drawer, DrawerBody } from "@grove/ui/drawer";
import type { ActiveCall, EscalationAction } from "@/components/call-ops/escalation-modal";
import { SupportAssistantPath } from "@/components/call-ops/support-assistant-path";
import { SupportGuidanceSection, type SupportGuidance } from "@/components/call-ops/support-guidance-section";
import { SupportLatencyMetrics } from "@/components/call-ops/support-latency-metrics";
import { SupportReferences } from "@/components/call-ops/support-references";
import { SupportStackCards } from "@/components/call-ops/support-stack-cards";
import { SessionInsightsFeed, type SessionInsightItem } from "@/components/session-insights-feed";
import {
  getCallLatency,
  getCallTrace,
  type CallLatencyMetricSummary,
  type CallLatencyResponse,
  type CallLatencyStackComponent,
  type CallTraceSummaryResponse,
} from "@/lib/api/call-observability";
import type { CallRuntimeEvent } from "@/lib/api/call-history";
import { eventCategoryLabel, eventFacts, eventHeadline, formatElapsedTime } from "@/lib/call-observability-presenters";
import { useVoiceCallRuntimeFeed } from "@/lib/realtime/use-voice-call-runtime-feed";
import { useVoiceCallTranscriptFeed, type TranscriptSegment } from "@/lib/realtime/use-voice-call-transcript-feed";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import { formatDateTime, normalizeWorkflowLabel } from "@/lib/call-ops-presenters";

const EMPTY_RUNTIME_EVENTS: CallRuntimeEvent[] = [];
const EMPTY_SEGMENTS: TranscriptSegment[] = [];

function computeSupportGuidance(events: CallRuntimeEvent[]): SupportGuidance {
  const newestFirst = [...events].sort((left, right) => right.seq - left.seq);
  const latestSignal = newestFirst.find((e) => ["call.manual_takeover.requested", "call.manual_takeover", "call.manual_takeover.failed", "call.escalation.transfer_failed", "call.escalation.transfer_requested", "call.escalated"].includes(e.event_type));
  if (!latestSignal) return { title: "No live handoff markers yet", detail: "Stay in listen-in mode unless the transcript or the operator queue shows a clear need for staff action.", variant: "neutral" };
  if (latestSignal.event_type === "call.manual_takeover.requested") return { title: "A teammate is trying to join this call", detail: "Give the join a moment to finish. Retry only if this stalls or the handoff fails.", variant: "warning" };
  if (latestSignal.event_type === "call.manual_takeover") return { title: "A teammate is already handling this call", detail: "Use the transcript and route path below as backup context. Do not duplicate the intervention unless the current handler asks for help.", variant: "success" };
  if (latestSignal.event_type === "call.escalation.transfer_requested") return { title: "Urgent transfer is already in flight", detail: "Join the call now. The system already marked this as urgent, so waiting for a later callback would be the wrong move.", variant: "warning" };
  if (latestSignal.event_type === "call.escalation.transfer_failed") return { title: "Urgent transfer failed", detail: "Join manually now. The platform asked for immediate takeover and failed, so this needs a person immediately, not another passive check.", variant: "warning" };
  if (latestSignal.event_type === "call.manual_takeover.failed") return { title: "A teammate tried to join and failed", detail: "Retry the join or transfer path now. The escalation exists, but the first human handoff did not stick.", variant: "warning" };
  return { title: "The caller needs a human", detail: "Review the staff note and reason below, then either join live or prepare the follow-up workspace so the case does not die after the call.", variant: "warning" };
}

export interface SupportDrawerProps {
  open: boolean;
  call: ActiveCall | null;
  onClose: () => void;
  onEscalate: (call: ActiveCall, action: EscalationAction) => void;
  onJoin: (callId: string) => void;
  onTranscript: (callId: string) => void;
  actionBusy: boolean;
  bookingsAvailable: boolean;
  bookingsGuidanceDetail: string;
  bookingsUnavailableNote: string | null;
}

export function SupportDrawer({ open, call, onClose, onEscalate, onJoin, onTranscript, actionBusy, bookingsAvailable, bookingsGuidanceDetail, bookingsUnavailableNote }: SupportDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<CallLatencyResponse | null>(null);
  const [trace, setTrace] = useState<CallTraceSummaryResponse | null>(null);
  const [streamStartSeq, setStreamStartSeq] = useState<number | null>(null);

  useEffect(() => {
    if (!open || !call) return;
    setLoading(true); setError(null); setLatency(null); setTrace(null);
    setStreamStartSeq(null);
    async function fetchData() {
      const [latencyResult, traceResult] = await Promise.allSettled([getCallLatency(call!.call_id), getCallTrace(call!.call_id)]);
      const failures: string[] = [];
      if (latencyResult.status === "fulfilled") { setLatency(latencyResult.value); } else { failures.push(`timing summary: ${toErrorMessage(latencyResult.reason)}`); }
      if (traceResult.status === "fulfilled") { setTrace(traceResult.value); } else { failures.push(`route details: ${toErrorMessage(traceResult.reason)}`); }
      if (failures.length > 0) { setError(`We could not load ${failures.join(" and ")}.`); }
      setStreamStartSeq(0); setLoading(false);
    }
    void fetchData();
  }, [open, call]);

  const liveCallId = open ? call?.call_id ?? null : null;
  const { events, streaming: opsStreaming, error: opsSseError } = useVoiceCallRuntimeFeed(liveCallId, {
    enabled: open && call !== null && streamStartSeq !== null,
    idleTimeoutSeconds: 5,
    limit: 50,
  });
  const { segments, streaming: transcriptStreaming, error: transcriptSseError } = useVoiceCallTranscriptFeed(liveCallId, {
    enabled: open && call !== null,
    idleTimeoutSeconds: 5,
    limit: 8,
  });

  const sseError = opsSseError || transcriptSseError ? `Live stream interrupted: ${[opsSseError, transcriptSseError].filter(Boolean).join("; ")}` : null;

  // Derived data
  const summaryEntries: Array<[string, CallLatencyMetricSummary | undefined]> = latency
    ? [["llm_ttft_ms", latency.summaries.llm_ttft_ms], ["tts_ttfb_ms", latency.summaries.tts_ttfb_ms], ["stt_finalize_delay_ms", latency.summaries.stt_finalize_delay_ms], ["eot_to_agent_speak_ms", latency.summaries.eot_to_agent_speak_ms]]
    : [];
  const stackEntries: Array<[label: string, component: "llm" | "stt" | "tts", value: CallLatencyStackComponent | null]> =
    trace?.stack ?? latency?.stack
      ? [["AI model", "llm", trace?.stack?.llm ?? latency?.stack?.llm ?? null], ["Speech understanding", "stt", trace?.stack?.stt ?? latency?.stack?.stt ?? null], ["Voice playback", "tts", trace?.stack?.tts ?? latency?.stack?.tts ?? null]]
      : [];
  const eventsNewestFirst = useMemo(() => [...events].sort((left, right) => right.seq - left.seq), [events]);
  const insightItems = useMemo<SessionInsightItem[]>(() => {
    const items: SessionInsightItem[] = [];
    for (const segment of [...segments].reverse()) {
      items.push({ id: `segment-${segment.seq}`, category: "Transcript", categoryVariant: segment.speaker.toLowerCase() === "agent" ? "success" : "neutral", headline: `${segment.speaker} spoke`, meta: formatDateTime(segment.timestamp), detail: segment.text });
    }
    for (const event of eventsNewestFirst) {
      items.push({ id: `event-${event.seq}`, category: eventCategoryLabel(event.event_type), categoryVariant: event.event_type === "call.escalation.transfer_requested" || event.event_type === "call.escalation.transfer_failed" || event.event_type === "call.manual_takeover.requested" ? "warning" : event.event_type === "call.manual_takeover" ? "success" : "neutral", headline: eventHeadline(event), meta: formatElapsedTime(event.occurred_at_ms), facts: eventFacts(event) });
    }
    for (const route of [...(trace?.routes ?? [])].reverse()) {
      items.push({ id: `route-${route.seq}`, category: "Route", categoryVariant: "warning", headline: `Route selected: ${route.route}`, meta: formatElapsedTime(route.occurred_at_ms), detail: `${route.node_name ?? "Unknown node"}${route.next_node_name ? ` -> ${route.next_node_name}` : ""}`, facts: route.graph_type ? [route.graph_type] : [] });
    }
    return items;
  }, [eventsNewestFirst, segments, trace]);
  const guidance = useMemo(() => computeSupportGuidance(events), [events]);
  const isStreaming = opsStreaming || transcriptStreaming;

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}
      title="Support details"
      description="Use this when the caller is still on the line and you need fast context before you join or take over."
      width="lg"
    >
      <DrawerBody>
        <div data-testid="call-ops-support-modal" className="grid gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
              <div>
                <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{call?.call_id ?? "No call selected"}</p>
                <p className="mt-1 text-xs text-[var(--color-neutral-500)]">{call ? `${normalizeWorkflowLabel(call.workflow_type)} \u00b7 Run ${call.run_id}` : "Select a call from the live table."}</p>
              </div>
              <Badge variant={isStreaming ? "success" : "neutral"} data-testid="call-ops-support-streaming-status">{isStreaming ? "Updating live" : "Waiting for updates"}</Badge>
            </div>

            {loading ? <p className="text-sm text-[var(--color-neutral-500)]">Loading timing and route details...</p> : null}
            {error ? <p data-testid="call-ops-support-error" className="text-sm text-[var(--color-error-700)]">{error}</p> : null}
            {sseError ? <p data-testid="call-ops-support-sse-error" className="text-sm text-[var(--color-error-700)]">{sseError}</p> : null}

            {/* Tier 1: Always visible — guidance + session insights */}
            {call ? <SupportGuidanceSection call={call} guidance={guidance} bookingsAvailable={bookingsAvailable} bookingsGuidanceDetail={bookingsGuidanceDetail} bookingsUnavailableNote={bookingsUnavailableNote} actionBusy={actionBusy} onEscalate={onEscalate} onJoin={onJoin} onTranscript={onTranscript} /> : null}

            <SessionInsightsFeed
              title="Live session insights"
              description={isStreaming ? "Transcript, runtime markers, and route choices are updating live." : "One place to review transcript evidence, runtime markers, and route choices."}
              items={insightItems}
              emptyState={isStreaming ? "Waiting for live transcript or runtime markers..." : "No live session evidence has arrived for this call yet."}
              testIdPrefix="call-ops-support"
            />

            {/* Tier 2: Collapsed — performance metrics */}
            <details data-testid="call-ops-support-performance-tier">
              <summary className="cursor-pointer text-sm font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]">
                Performance metrics
              </summary>
              <div className="mt-3 space-y-4">
                <SupportLatencyMetrics entries={summaryEntries} />
                <SupportStackCards entries={stackEntries} />
              </div>
            </details>

            {/* Tier 3: Collapsed — technical trace */}
            <details data-testid="call-ops-support-technical-tier">
              <summary className="cursor-pointer text-sm font-medium text-[var(--color-neutral-600)] hover:text-[var(--color-neutral-900)]">
                Technical trace
              </summary>
              <div className="mt-3 space-y-4">
                <SupportAssistantPath nodes={trace?.nodes ?? []} />
                <SupportReferences call={call} traceContext={trace?.trace_context ?? null} />
              </div>
            </details>
          </div>
      </DrawerBody>
    </Drawer>
  );
}
