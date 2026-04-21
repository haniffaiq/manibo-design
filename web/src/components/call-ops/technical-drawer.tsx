"use client";

import { Badge } from "@grove/ui/badge";
import { Drawer, DrawerBody } from "@grove/ui/drawer";
import { Skeleton } from "@grove/ui/skeleton";
import type {
  CallLatencyMetricSummary,
  CallLatencyStackComponent,
  CallLatencyResponse,
  CallTraceSummaryResponse,
  CallTraceNodeSummary,
  CallTraceRouteSelection,
} from "@/lib/api/call-observability";
import {
  formatDurationMs,
  formatElapsedTime,
  metricSummaryLabel,
  stackCardDescription,
  traceNodeBadgeVariant,
} from "@/lib/call-observability-presenters";

export interface TechnicalDrawerProps {
  open: boolean;
  onClose: () => void;
  loading: boolean;
  error: string | null;
  latency: CallLatencyResponse | undefined;
  trace: CallTraceSummaryResponse | undefined;
}

export function TechnicalDrawer({ open, onClose, loading, error, latency, trace }: TechnicalDrawerProps) {
  const summaryEntries: Array<[string, CallLatencyMetricSummary | undefined]> = latency
    ? [
        ["llm_ttft_ms", latency.summaries.llm_ttft_ms],
        ["tts_ttfb_ms", latency.summaries.tts_ttfb_ms],
        ["stt_finalize_delay_ms", latency.summaries.stt_finalize_delay_ms],
        ["eot_to_agent_speak_ms", latency.summaries.eot_to_agent_speak_ms],
      ]
    : [];

  const stackEntries: Array<[label: string, component: "llm" | "stt" | "tts", value: CallLatencyStackComponent | null]> =
    trace?.stack ?? latency?.stack
      ? [
          ["AI model", "llm", trace?.stack?.llm ?? latency?.stack?.llm ?? null],
          ["Speech understanding", "stt", trace?.stack?.stt ?? latency?.stack?.stt ?? null],
          ["Voice playback", "tts", trace?.stack?.tts ?? latency?.stack?.tts ?? null],
        ]
      : [];

  return (
    <Drawer
      open={open}
      onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}
      title="Technical details"
      description="Use this when a call felt slow or took the wrong path. The main review view stays plain-language on purpose."
      width="lg"
    >
      <DrawerBody>
        <div data-testid="call-history-technical-modal" className="grid gap-5">
          {loading ? (
            <div className="space-y-3" role="status" aria-label="Loading">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : null}
          {error ? (
            <p data-testid="call-history-technical-error" className="text-sm text-[var(--color-error-700)]">
              {error}
            </p>
          ) : null}

          {summaryEntries.length > 0 ? (
            <section className="grid gap-3 sm:grid-cols-2">
              {summaryEntries.map(([metricKey, summary]) => (
                <div
                  key={metricKey}
                  data-testid={`call-history-technical-summary-${metricKey}`}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
                >
                  <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{metricSummaryLabel(metricKey)}</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--color-neutral-950)]">
                    {formatDurationMs(summary?.latest_ms ?? summary?.average_ms ?? null)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-neutral-500)]">
                    <span>Average: {formatDurationMs(summary?.average_ms ?? null)}</span>
                    <span>Worst: {formatDurationMs(summary?.max_ms ?? null)}</span>
                    <span>Samples: {summary?.sample_count ?? 0}</span>
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          {stackEntries.length > 0 ? (
            <section className="grid gap-3 md:grid-cols-3">
              {stackEntries.map(([label, component, value]) => (
                <div
                  key={component}
                  data-testid={`call-history-technical-stack-${component}`}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
                >
                  <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{label}</p>
                  <div className="mt-3 flex flex-col gap-1.5 text-sm text-[var(--color-neutral-600)]">
                    {stackCardDescription(component, value).map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-neutral-950)]">Route path</h3>
                <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                  Which decision path the call followed through the graph.
                </p>
              </div>
              <Badge variant="neutral">{trace?.routes.length ?? 0} decisions</Badge>
            </div>
            {trace?.routes.length ? (
              <ol className="mt-4 flex flex-col gap-3">
                {trace.routes.map((route: CallTraceRouteSelection) => (
                  <li
                    key={`${route.seq}-${route.route}`}
                    data-testid={`call-history-trace-route-${route.seq}`}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="neutral">{formatElapsedTime(route.occurred_at_ms)}</Badge>
                      <p className="text-sm font-medium text-[var(--color-neutral-950)]">{route.route}</p>
                    </div>
                    <p className="mt-2 text-xs text-[var(--color-neutral-500)]">
                      {route.node_name ?? "Unknown node"}
                      {route.next_node_name ? ` \u2192 ${route.next_node_name}` : ""}
                      {route.graph_type ? ` \u2022 ${route.graph_type}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-sm text-[var(--color-neutral-500)]">
                No route decisions were persisted for this call.
              </p>
            )}
          </section>

          <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-[var(--color-neutral-950)]">Assistant path</h3>
                <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                  Node-by-node timing, retries, and tool usage for support review.
                </p>
              </div>
              <Badge variant="neutral">{trace?.nodes.length ?? 0} nodes</Badge>
            </div>
            {trace?.nodes.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
                  <thead className="bg-[var(--color-bg-subtle)] text-[var(--color-neutral-600)]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Node</th>
                      <th className="px-3 py-2 font-medium">Timing</th>
                      <th className="px-3 py-2 font-medium">Route</th>
                      <th className="px-3 py-2 font-medium">Retries</th>
                      <th className="px-3 py-2 font-medium">Tools</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trace.nodes.map((node: CallTraceNodeSummary, index) => (
                      <tr
                        key={`${node.node_name}-${index}`}
                        data-testid={`call-history-trace-node-${index}`}
                        className="border-t border-[var(--color-border)]"
                      >
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <p className="font-medium text-[var(--color-neutral-950)]">{node.node_name}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant={traceNodeBadgeVariant(node)}>
                                {node.latency_ms !== null ? formatDurationMs(node.latency_ms) : "No timing"}
                              </Badge>
                              {node.ttft_ms !== null ? (
                                <Badge variant="neutral">AI response time {formatDurationMs(node.ttft_ms)}</Badge>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-[var(--color-neutral-500)]">
                          <p>Start: {node.started_at_ms !== null ? formatElapsedTime(node.started_at_ms) : "—"}</p>
                          <p>End: {node.completed_at_ms !== null ? formatElapsedTime(node.completed_at_ms) : "—"}</p>
                          <p>
                            Tokens: {node.prompt_tokens ?? 0} / {node.completion_tokens ?? 0}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-xs text-[var(--color-neutral-500)]">
                          <p>{node.route ?? "—"}</p>
                          <p>{node.next_node_name ?? "No next node saved"}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-[var(--color-neutral-500)]">
                          <p>{node.retry_count ?? 0} retries</p>
                          <p>{node.llm_roundtrips ?? 0} AI turns</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-[var(--color-neutral-500)]">
                          {node.tools_called.length > 0 ? node.tools_called.join(", ") : "No tools called"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[var(--color-neutral-500)]">
                No node-level trace summary was available for this call.
              </p>
            )}
          </section>

          <details
            data-testid="call-history-trace-context"
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
          >
            <summary className="cursor-pointer text-sm font-semibold text-[var(--color-neutral-950)]">
              Support references
            </summary>
            <div className="mt-3 grid gap-2 text-sm text-[var(--color-neutral-600)]">
              <p>Trace ID: {trace?.trace_context.trace_id ?? "Not saved"}</p>
              <p>Correlation ID: {trace?.trace_context.correlation_id ?? "Not saved"}</p>
              <p>Trace parent: {trace?.trace_context.traceparent ?? "Not saved"}</p>
              <p>Saved events: {trace?.event_count ?? 0}</p>
              <p>
                Timeline window:{" "}
                {trace?.first_event_at_ms !== null && trace?.first_event_at_ms !== undefined
                  ? formatElapsedTime(trace.first_event_at_ms)
                  : "—"}
                {" to "}
                {trace?.last_event_at_ms !== null && trace?.last_event_at_ms !== undefined
                  ? formatElapsedTime(trace.last_event_at_ms)
                  : "—"}
              </p>
            </div>
          </details>
        </div>
      </DrawerBody>
    </Drawer>
  );
}
