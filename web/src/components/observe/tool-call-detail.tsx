"use client";

import { useState } from "react";
import type { LiveCallToolExecution } from "@/lib/api/call-observability";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface ToolCallDetailProps {
  tools: LiveCallToolExecution[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMs(value: number | null): string {
  if (value == null) return "--";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function statusColor(status: string): string {
  if (status === "success" || status === "ok") return "text-green-700 bg-green-50 border-green-200";
  return "text-red-700 bg-red-50 border-red-200";
}

function statusIcon(status: string): string {
  if (status === "success" || status === "ok") return "\u2713";
  return "\u2717";
}

/* ------------------------------------------------------------------ */
/*  Single tool detail row                                             */
/* ------------------------------------------------------------------ */

function ToolRow({ tool }: { tool: LiveCallToolExecution }) {
  const [expanded, setExpanded] = useState(false);
  const failed = tool.status !== "success" && tool.status !== "ok";

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-white">
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((p) => !p)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-[var(--color-neutral-50)]"
      >
        <span className="text-[var(--color-neutral-400)]">&#x1F527;</span>
        <span className="font-medium text-[var(--color-neutral-800)]">{tool.tool_name}</span>
        {tool.duration_ms != null ? (
          <span className="text-[var(--color-neutral-500)]">{formatMs(tool.duration_ms)}</span>
        ) : null}
        <span className={`ml-auto rounded border px-1.5 py-0.5 text-[10px] font-medium ${statusColor(tool.status)}`}>
          {statusIcon(tool.status)} {tool.status}
        </span>
        <span className="text-[10px] text-[var(--color-neutral-400)]">{expanded ? "\u25B2" : "\u25BC"}</span>
      </button>

      {/* Expanded detail */}
      {expanded ? (
        <div className="border-t border-[var(--color-border)] px-3 py-2 text-xs">
          <div className="space-y-1.5">
            <DetailRow label="Tool" value={tool.tool_name} />
            <DetailRow label="Duration" value={formatMs(tool.duration_ms)} />
            <DetailRow label="Status" value={tool.status} />
          </div>

          {/* Error detail */}
          {failed && tool.error_detail ? (
            <div className="mt-2">
              <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">Error</p>
              <pre className="mt-1 max-h-40 overflow-auto rounded bg-red-50 p-2 text-[10px] text-red-700">
                {tool.error_detail}
              </pre>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-neutral-500)]">{label}</span>
      <span className="font-medium text-[var(--color-neutral-700)]">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function ToolCallDetail({ tools }: ToolCallDetailProps) {
  if (tools.length === 0) return null;

  return (
    <div data-testid="tool-call-detail" className="space-y-1.5">
      {tools.map((tool, i) => (
        <ToolRow key={`${tool.tool_name}-${i}`} tool={tool} />
      ))}
    </div>
  );
}
