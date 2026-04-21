"use client";

import { useCallback, useState } from "react";
import type { TraceSpan, TraceTree, SpanKind } from "./trace-tree-builder";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface TraceTreeViewProps {
  tree: TraceTree;
  selectedSpanId: string | null;
  onSelectSpan: (span: TraceSpan | null) => void;
  isLive: boolean;
}

/* ------------------------------------------------------------------ */
/*  Kind styling                                                       */
/* ------------------------------------------------------------------ */

const KIND_STYLES: Record<SpanKind, { icon: string; bg: string; text: string; label: string }> = {
  node: { icon: "\u25CF", bg: "bg-purple-100", text: "text-purple-700", label: "Node" },
  llm: { icon: "\u2726", bg: "bg-blue-100", text: "text-blue-700", label: "LLM" },
  tool: { icon: "\u2692", bg: "bg-orange-100", text: "text-orange-700", label: "Tool" },
  route: { icon: "\u2192", bg: "bg-green-100", text: "text-green-700", label: "Route" },
  stt: { icon: "\u{1F3A4}", bg: "bg-sky-100", text: "text-sky-700", label: "STT" },
  tts: { icon: "\u{1F50A}", bg: "bg-amber-100", text: "text-amber-700", label: "TTS" },
  log: { icon: "\u2022", bg: "bg-neutral-100", text: "text-neutral-500", label: "Log" },
};

function formatMs(value: number | null): string {
  if (value == null) return "";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function latencyColor(ms: number | null): string {
  if (ms == null) return "text-[var(--color-neutral-400)]";
  if (ms < 3000) return "text-green-600";
  if (ms < 8000) return "text-amber-600";
  return "text-red-600";
}

function countErrors(span: TraceSpan): number {
  let count = span.status === "error" ? 1 : 0;
  for (const child of span.children) count += countErrors(child);
  return count;
}

function hasError(span: TraceSpan): boolean {
  if (span.status === "error") return true;
  return span.children.some(hasError);
}

/* Token flow: prompt → completion (Σ total) */
function tokenFlow(span: TraceSpan): string | null {
  const node = span.nodeSummary;
  if (!node) return null;
  const p = node.prompt_tokens;
  const c = node.completion_tokens;
  if (p == null && c == null) return null;
  return `${p ?? 0}\u2192${c ?? 0} (\u03A3${(p ?? 0) + (c ?? 0)})`;
}

/* ------------------------------------------------------------------ */
/*  Span row                                                           */
/* ------------------------------------------------------------------ */

function SpanRow({
  span,
  depth,
  selectedId,
  onSelect,
  isLive,
  errorsOnly,
  expandedSet,
  onToggleExpand,
}: {
  span: TraceSpan;
  depth: number;
  selectedId: string | null;
  onSelect: (span: TraceSpan | null) => void;
  isLive: boolean;
  errorsOnly: boolean;
  expandedSet: Set<string>;
  onToggleExpand: (id: string) => void;
}) {
  const hasChildren = span.children.length > 0;
  const style = KIND_STYLES[span.kind];
  const isSelected = selectedId === span.id;
  const isRunning = span.endMs == null && span.startMs != null && isLive;
  const errorCount = countErrors(span);
  const open = expandedSet.has(span.id);
  const flow = tokenFlow(span);

  if (errorsOnly && !hasError(span) && span.kind !== "node") return null;

  const visibleChildren = errorsOnly
    ? span.children.filter((c) => hasError(c) || c.kind === "node")
    : span.children;

  return (
    <>
      <button
        type="button"
        data-testid={`trace-span-${span.id}`}
        data-node-name={span.kind === "node" ? span.label : undefined}
        onClick={() => {
          if (hasChildren) onToggleExpand(span.id);
          onSelect(isSelected ? null : span);
        }}
        className={`flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-xs transition hover:bg-[var(--color-neutral-50)] ${
          isSelected ? "bg-[var(--color-primary-50)] ring-1 ring-[var(--color-primary-200)]" : ""
        } ${span.status === "error" ? "bg-red-50/50" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 6}px` }}
      >
        {hasChildren ? (
          <span className="w-3 shrink-0 text-[9px] text-[var(--color-neutral-400)]">{open ? "\u25BC" : "\u25B6"}</span>
        ) : (
          <span className="w-3 shrink-0" />
        )}

        <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[9px] font-medium ${
          span.status === "error" ? "bg-red-100 text-red-700" : `${style.bg} ${style.text}`
        }`}>
          <span>{style.icon}</span>
          <span>{style.label}</span>
        </span>

        <span className="min-w-0 flex-1 truncate font-medium text-[var(--color-neutral-800)]">
          {span.label.replace(/_/g, " ")}
        </span>

        {!open && errorCount > 0 ? (
          <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700">
            {errorCount} err
          </span>
        ) : null}

        {span.status === "error" ? (
          <span className="text-[9px] font-medium text-red-600">{"\u2717"}</span>
        ) : null}

        {isRunning ? (
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
        ) : null}

        {span.latencyMs != null ? (
          <span className={`shrink-0 text-[10px] font-semibold ${latencyColor(span.latencyMs)}`}>
            {formatMs(span.latencyMs)}
          </span>
        ) : null}

        {flow ? <span className="shrink-0 text-[9px] text-[var(--color-neutral-400)]">{flow}</span> : null}
      </button>

      {open && hasChildren ? (
        <div>
          {visibleChildren.map((child) => (
            <SpanRow
              key={child.id}
              span={child}
              depth={depth + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              isLive={isLive}
              errorsOnly={errorsOnly}
              expandedSet={expandedSet}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function TraceTreeView({ tree, selectedSpanId, onSelectSpan, isLive }: TraceTreeViewProps) {
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [expandedSet, setExpandedSet] = useState<Set<string>>(() => new Set<string>());
  const totalErrors = tree.rootSpans.reduce((sum, s) => sum + countErrors(s), 0);

  const toggleExpand = useCallback((id: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const collapseAll = useCallback(() => setExpandedSet(new Set()), []);
  const expandAll = useCallback(() => {
    const ids = new Set<string>();
    function collect(span: TraceSpan): void {
      if (span.children.length > 0) ids.add(span.id);
      span.children.forEach(collect);
    }
    tree.rootSpans.forEach(collect);
    setExpandedSet(ids);
  }, [tree.rootSpans]);

  const anyExpanded = expandedSet.size > 0;

  if (tree.rootSpans.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-[var(--color-neutral-400)]">
        No trace data yet.
      </div>
    );
  }

  return (
    <div data-testid="trace-tree">
      {/* Stats */}
      <div className="mb-1 text-[10px] text-[var(--color-neutral-500)]">
        {tree.nodeCount} nodes &middot; {tree.totalTokens?.toLocaleString() ?? 0} tokens &middot; {formatMs(tree.totalLatencyMs)} total
      </div>

      {/* Toolbar */}
      <div className="mb-1 flex items-center gap-2">
        <button type="button" onClick={anyExpanded ? collapseAll : expandAll} className="rounded border border-[var(--color-border)] px-2 py-0.5 text-[10px] text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]">
          {anyExpanded ? "Collapse All" : "Expand All"}
        </button>
        {totalErrors > 0 ? (
          <button
            type="button"
            onClick={() => setErrorsOnly((p) => !p)}
            className={`rounded-full px-2 py-0.5 text-[9px] font-medium transition ${
              errorsOnly ? "bg-red-600 text-white" : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            {totalErrors} {totalErrors === 1 ? "error" : "errors"}
          </button>
        ) : (
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-medium text-green-700">0 errors</span>
        )}
      </div>

      {/* Tree */}
      <div className="rounded-lg border border-[var(--color-border)] bg-white">
        {tree.rootSpans.map((span) => (
          <SpanRow
            key={span.id}
            span={span}
            depth={0}
            selectedId={selectedSpanId}
            onSelect={onSelectSpan}
            isLive={isLive}
            errorsOnly={errorsOnly}
            expandedSet={expandedSet}
            onToggleExpand={toggleExpand}
          />
        ))}
      </div>
    </div>
  );
}
