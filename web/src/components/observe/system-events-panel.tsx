"use client";

import { useMemo, useState } from "react";

import type { ObservabilityTimelineItem, ObservabilityTimelineKind } from "@/lib/api/observability";
import { timelineKindBadgeStyle } from "@/components/observability/formatters";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SystemEventsPanelProps {
  events: ObservabilityTimelineItem[];
  /** First event timestamp for computing relative offsets. */
  callStartedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(eventAt: string | null, callStart: string | null): string {
  if (!eventAt || !callStart) return "";
  const delta = new Date(eventAt).getTime() - new Date(callStart).getTime();
  if (delta < 0) return "T+0s";
  if (delta < 1000) return `T+${Math.round(delta)}ms`;
  return `T+${(delta / 1000).toFixed(1)}s`;
}

/** Collapse speech start/stop pairs into summary entries. */
interface SpeechPair {
  speaker: string;
  startAt: string | null;
  endAt: string | null;
}

function isSpeechEvent(eventType: string | null): boolean {
  if (!eventType) return false;
  return eventType === "caller.started_speaking" || eventType === "caller.stopped_speaking" ||
         eventType === "agent.started_speaking" || eventType === "agent.stopped_speaking";
}

function speakerFromEventType(eventType: string): string {
  if (eventType.startsWith("caller")) return "Caller";
  if (eventType.startsWith("agent")) return "Agent";
  return "Unknown";
}

/* ------------------------------------------------------------------ */
/*  Grouped events                                                     */
/* ------------------------------------------------------------------ */

interface EventGroup {
  label: string;
  events: ObservabilityTimelineItem[];
  startAt: string | null;
  endAt: string | null;
}

function groupEventsByNode(events: ObservabilityTimelineItem[]): { nodeGroups: EventGroup[]; speechPairs: SpeechPair[] } {
  const nodeGroups: EventGroup[] = [];
  const speechPairs: SpeechPair[] = [];
  const openSpeech = new Map<string, string>(); // speaker -> start timestamp
  let currentGroup: EventGroup | null = null;

  for (const event of events) {
    const detail = event.detail ?? "";

    // Handle speech pairs
    if (isSpeechEvent(detail)) {
      const speaker = speakerFromEventType(detail);
      if (detail.includes("started")) {
        openSpeech.set(speaker, event.occurred_at ?? "");
      } else if (detail.includes("stopped")) {
        const startAt = openSpeech.get(speaker) ?? null;
        openSpeech.delete(speaker);
        speechPairs.push({ speaker, startAt, endAt: event.occurred_at });
      }
      continue;
    }

    // Node boundary events create groups
    if (event.kind === "node" && detail.includes(".started")) {
      // Start new group
      currentGroup = {
        label: event.label ?? detail,
        events: [event],
        startAt: event.occurred_at,
        endAt: null,
      };
      nodeGroups.push(currentGroup);
      continue;
    }

    if (event.kind === "node" && detail.includes(".completed")) {
      if (currentGroup) {
        currentGroup.events.push(event);
        currentGroup.endAt = event.occurred_at;
        currentGroup = null;
      } else {
        // Orphan completed event
        nodeGroups.push({
          label: event.label ?? detail,
          events: [event],
          startAt: event.occurred_at,
          endAt: event.occurred_at,
        });
      }
      continue;
    }

    // Regular event goes into current group or creates an ungrouped entry
    if (currentGroup) {
      currentGroup.events.push(event);
    } else {
      // Create a standalone group
      const last = nodeGroups[nodeGroups.length - 1];
      if (last && last.endAt == null) {
        last.events.push(event);
      } else {
        nodeGroups.push({
          label: "Ungrouped",
          events: [event],
          startAt: event.occurred_at,
          endAt: null,
        });
      }
    }
  }

  return { nodeGroups, speechPairs };
}

/* ------------------------------------------------------------------ */
/*  Filter types                                                       */
/* ------------------------------------------------------------------ */

const FILTERABLE_KINDS: ObservabilityTimelineKind[] = ["node", "tool", "route", "log", "metric", "workflow_step", "recording"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SystemEventsPanel({ events, callStartedAt }: SystemEventsPanelProps) {
  const [activeFilters, setActiveFilters] = useState<Set<ObservabilityTimelineKind>>(() => new Set(["node", "tool", "route", "log", "metric", "workflow_step", "recording"]));

  // Count per kind
  const kindCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const event of events) {
      counts.set(event.kind, (counts.get(event.kind) ?? 0) + 1);
    }
    return counts;
  }, [events]);

  // Group events
  const { nodeGroups, speechPairs } = useMemo(() => groupEventsByNode(events), [events]);

  const toggleFilter = (kind: ObservabilityTimelineKind) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) {
        next.delete(kind);
      } else {
        next.add(kind);
      }
      return next;
    });
  };

  if (events.length === 0) {
    return (
      <div className="py-3 text-center text-xs text-[var(--color-neutral-400)]">
        No system events yet.
      </div>
    );
  }

  return (
    <div data-testid="system-events-panel" className="space-y-2">
      {/* Filter chips */}
      <div className="flex flex-wrap gap-1">
        {FILTERABLE_KINDS.map((kind) => {
          const count = kindCounts.get(kind) ?? 0;
          if (count === 0) return null;
          const style = timelineKindBadgeStyle(kind);
          const isActive = activeFilters.has(kind);
          return (
            <button
              key={kind}
              type="button"
              onClick={() => toggleFilter(kind)}
              className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                isActive
                  ? `${style.bg} ${style.text} border-transparent`
                  : "border-[var(--color-border)] bg-white text-[var(--color-neutral-400)]"
              }`}
            >
              {style.label} {count}
            </button>
          );
        })}
      </div>

      {/* Grouped events */}
      <div className="max-h-[40vh] space-y-1 overflow-y-auto">
        {nodeGroups.map((group, gi) => {
          const filteredEvents = group.events.filter((e) => activeFilters.has(e.kind));
          if (filteredEvents.length === 0) return null;

          return (
            <details key={`group-${gi}`} open={gi < 3}>
              <summary className="cursor-pointer rounded px-1 py-0.5 text-[10px] font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]">
                {group.label}
                <span className="ml-1 text-[var(--color-neutral-400)]">
                  ({relativeTime(group.startAt, callStartedAt)}
                  {group.endAt ? ` → ${relativeTime(group.endAt, callStartedAt)}` : ""})
                </span>
              </summary>
              <div className="ml-2 border-l border-[var(--color-neutral-200)] pl-2">
                {filteredEvents.map((event) => {
                  const style = timelineKindBadgeStyle(event.kind);
                  return (
                    <div key={event.id} className="flex items-start gap-2 py-0.5">
                      <span className={`shrink-0 rounded px-1 py-px text-[9px] font-medium ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                      <span className="flex-1 truncate text-[10px] text-[var(--color-neutral-700)]">
                        {event.label}
                      </span>
                      <span className="shrink-0 text-[9px] text-[var(--color-neutral-400)]">
                        {relativeTime(event.occurred_at, callStartedAt)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}

        {/* Speech pairs (collapsed) */}
        {speechPairs.length > 0 ? (
          <details>
            <summary className="cursor-pointer rounded px-1 py-0.5 text-[10px] font-medium text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-50)]">
              Speech pairs
              <span className="ml-1 text-[var(--color-neutral-400)]">({speechPairs.length})</span>
            </summary>
            <div className="ml-2 space-y-0.5 border-l border-[var(--color-neutral-200)] pl-2">
              {speechPairs.map((pair, i) => (
                <div key={`speech-${i}`} className="text-[10px] text-[var(--color-neutral-500)]">
                  {pair.speaker} {relativeTime(pair.startAt, callStartedAt)} → {relativeTime(pair.endAt, callStartedAt)}
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>
    </div>
  );
}
