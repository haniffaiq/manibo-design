"use client";

import { useState } from "react";
import { Badge } from "@grove/ui/badge";
import type { TraceSpan, SpanKind } from "./trace-tree-builder";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface SpanDetailProps {
  span: TraceSpan | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMs(value: number | null): string {
  if (value == null) return "--";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function formatTokenFlow(prompt: number | null, completion: number | null): string {
  if (prompt == null && completion == null) return "--";
  const p = prompt ?? 0;
  const c = completion ?? 0;
  return `${p.toLocaleString()} \u2192 ${c.toLocaleString()} (\u03A3 ${(p + c).toLocaleString()})`;
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* clipboard unavailable */
  }
}

const KIND_ICONS: Record<SpanKind, string> = {
  node: "\u25CF", llm: "\u2726", tool: "\u2692", route: "\u2192",
  stt: "\u{1F3A4}", tts: "\u{1F50A}", log: "\u2022",
};

/* ------------------------------------------------------------------ */
/*  Collapsible section with copy button (Langfuse pattern)            */
/* ------------------------------------------------------------------ */

function CollapsibleSection({ label, data, variant }: { label: string; data: unknown; variant?: "error" }) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);

  if (data == null) return null;
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const isLong = text.length > 500;
  const displayText = isLong && !expanded ? text.slice(0, 300) : text;

  return (
    <div className="border-t border-[var(--color-border)] pt-2">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setOpen((p) => !p)} className="flex items-center gap-1 text-xs font-medium text-[var(--color-neutral-700)]">
          <span className="text-[9px] text-[var(--color-neutral-400)]">{open ? "\u25BC" : "\u25B6"}</span>
          {label}
        </button>
        <button type="button" onClick={() => void copyText(text)} title="Copy to clipboard" className="rounded px-1.5 py-0.5 text-[9px] font-medium text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-600)]">
          Copy
        </button>
      </div>
      {open ? (
        <div className="mt-1">
          <pre className={`max-h-80 overflow-auto rounded-lg p-3 text-[11px] leading-relaxed ${
            variant === "error" ? "bg-red-50 text-red-700" : "bg-[var(--color-neutral-50)] text-[var(--color-neutral-700)]"
          }`}>
            {displayText}
          </pre>
          {isLong && !expanded ? (
            <button type="button" onClick={() => setExpanded(true)} className="mt-1 text-[10px] text-[var(--color-primary-600)] hover:underline">
              ...expand ({(text.length - 300).toLocaleString()} more characters)
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Metadata badge row (Langfuse-style)                                */
/* ------------------------------------------------------------------ */

function MetadataBadges({ span }: { span: TraceSpan }) {
  const node = span.nodeSummary;
  return (
    <div className="flex flex-wrap gap-1.5">
      {span.latencyMs != null ? (
        <span className="rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-neutral-600)]">
          {formatMs(span.latencyMs)}
        </span>
      ) : null}
      {node?.ttft_ms != null ? (
        <span className="rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700">
          TTFT {formatMs(node.ttft_ms)}
        </span>
      ) : null}
      {node && (node.prompt_tokens != null || node.completion_tokens != null) ? (
        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
          {formatTokenFlow(node.prompt_tokens, node.completion_tokens)}
        </span>
      ) : null}
      {span.status === "error" ? (
        <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">{"\u2717"} error</span>
      ) : span.status === "success" ? (
        <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">{"\u2713"} success</span>
      ) : null}
      {node && (node.retry_count ?? 0) > 0 ? (
        <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
          {node.retry_count} {node.retry_count === 1 ? "retry" : "retries"}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function SpanDetail({ span }: SpanDetailProps) {
  if (!span) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[var(--color-neutral-400)]">
        Select a span in the trace tree.
      </div>
    );
  }

  const node = span.nodeSummary;
  const tool = span.toolIO;
  const failed = span.status === "error";

  return (
    <div data-testid="span-detail" className="space-y-3">
      {/* Header: icon + name + badges */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-base">{KIND_ICONS[span.kind]}</span>
          <h3 className="text-base font-semibold text-[var(--color-neutral-900)]">
            {span.label.replace(/_/g, " ")}
          </h3>
          <div className="ml-auto flex items-center gap-1.5">
            <Badge variant="neutral">{span.kind}</Badge>
            {failed ? <Badge variant="error">error</Badge> : null}
            {span.status === "success" && span.kind === "node" ? <Badge variant="success">completed</Badge> : null}
          </div>
        </div>

        {/* Metadata badge row */}
        <div className="mt-2">
          <MetadataBadges span={span} />
        </div>
      </div>

      {/* Node: metrics grid */}
      {node ? (
        <div className="grid grid-cols-3 gap-2">
          <MetricCell label="Latency" value={formatMs(node.latency_ms)} highlight={node.latency_ms != null && node.latency_ms > 8000} />
          <MetricCell label="TTFT" value={formatMs(node.ttft_ms)} />
          <MetricCell label="LLM rounds" value={node.llm_roundtrips != null ? String(node.llm_roundtrips) : "--"} />
          <MetricCell label="Prompt tok" value={node.prompt_tokens?.toLocaleString() ?? "--"} />
          <MetricCell label="Compl tok" value={node.completion_tokens?.toLocaleString() ?? "--"} />
          <MetricCell label="Retries" value={String(node.retry_count ?? 0)} highlight={(node.retry_count ?? 0) > 0} />
        </div>
      ) : null}

      {/* Node: route decision */}
      {node?.route ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] p-2">
          <span className="text-[10px] font-medium uppercase text-[var(--color-neutral-500)]">Route</span>
          <Badge variant="neutral">{node.route}</Badge>
          {node.next_node_name ? (
            <>
              <span className="text-xs text-[var(--color-neutral-400)]">&rarr;</span>
              <span className="text-xs font-medium text-[var(--color-neutral-700)]">{node.next_node_name}</span>
            </>
          ) : null}
        </div>
      ) : null}

      {/* Node: tools called */}
      {node && node.tools_called.length > 0 ? (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase text-[var(--color-neutral-500)]">Tools</span>
          {node.tools_called.map((t) => <Badge key={t} variant="neutral">{t}</Badge>)}
        </div>
      ) : null}

      {/* Tool: metrics */}
      {tool ? (
        <div className="grid grid-cols-2 gap-2">
          <MetricCell label="Duration" value={formatMs(tool.duration_ms)} />
          <MetricCell label="Status" value={tool.status} highlight={failed} />
        </div>
      ) : null}

      {/* I/O sections (Langfuse-style collapsible with copy) */}
      {tool?.tool_args != null ? <CollapsibleSection label="Input (Arguments)" data={tool.tool_args} /> : null}
      {tool?.tool_result != null ? <CollapsibleSection label="Output (Result)" data={tool.tool_result} variant={failed ? "error" : undefined} /> : null}
      {!tool && Object.keys(span.payload).length > 0 ? <CollapsibleSection label="Payload" data={span.payload} /> : null}

      {/* Error block */}
      {(span.errorDetail || tool?.error_detail) ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-[10px] font-semibold uppercase text-red-700">Error</p>
          <p className="mt-1 text-xs text-red-600">{span.errorDetail ?? tool?.error_detail}</p>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function MetricCell({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-md bg-[var(--color-neutral-50)] px-2.5 py-1.5">
      <p className="text-[10px] text-[var(--color-neutral-500)]">{label}</p>
      <p className={`text-sm font-semibold ${highlight ? "text-red-600" : "text-[var(--color-neutral-900)]"}`}>{value}</p>
    </div>
  );
}
