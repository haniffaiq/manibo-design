"use client";

import { useMemo, useState } from "react";
import YAML from "yaml";

import { Badge } from "@grove/ui/badge";
import type { CallTraceNodeSummary, CallTraceToolIO } from "@/lib/api/call-observability";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface NodeInspectorProps {
  node: CallTraceNodeSummary | null;
  /** Raw YAML source — used to extract node instructions and route config. */
  sourceYaml?: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatMs(value: number | null): string {
  if (value == null) return "--";
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
}

function formatTokens(value: number | null): string {
  if (value == null) return "--";
  return value.toLocaleString();
}

/* ------------------------------------------------------------------ */
/*  YAML node config extraction                                        */
/* ------------------------------------------------------------------ */

interface NodeConfig {
  instructions: string | null;
  tools: string[];
  allowedRoutes: string[];
}

function extractNodeConfig(sourceYaml: string, nodeName: string): NodeConfig | null {
  try {
    const doc = YAML.parse(sourceYaml) as Record<string, unknown>;
    const flow = doc.flow_definition as Record<string, unknown> | undefined;
    if (!flow) return null;
    const nodes = (flow.nodes ?? {}) as Record<string, Record<string, unknown>>;
    const config = nodes[nodeName];
    if (!config) return null;

    const instructions = typeof config.instructions === "string" ? config.instructions.trim() : null;
    const tools = Array.isArray(config.tools) ? (config.tools as string[]) : [];

    const routeDecision = config.route_decision as Record<string, unknown> | undefined;
    const allowedRoutes = routeDecision && Array.isArray(routeDecision.allowed_routes)
      ? (routeDecision.allowed_routes as string[])
      : [];

    return { instructions, tools, allowedRoutes };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function NodeInspector({ node, sourceYaml }: NodeInspectorProps) {
  const nodeConfig = useMemo(
    () => (sourceYaml && node ? extractNodeConfig(sourceYaml, node.node_name) : null),
    [sourceYaml, node],
  );

  if (!node) {
    return (
      <div
        data-testid="node-inspector-empty"
        className="flex h-32 items-center justify-center text-sm text-[var(--color-neutral-400)]"
      >
        Click a node in the graph to inspect.
      </div>
    );
  }

  const isCompleted = node.completed_at_ms != null;

  return (
    <div data-testid="node-inspector" className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--color-neutral-900)]">
          {node.node_name}
        </h3>
        <div className="flex items-center gap-1.5">
          {node.graph_type ? (
            <Badge variant="neutral">{node.graph_type}</Badge>
          ) : null}
          <Badge variant={isCompleted ? "success" : "warning"}>
            {isCompleted ? "completed" : "running"}
          </Badge>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-2">
        <MetricCell label="Latency" value={formatMs(node.latency_ms)} highlight={node.latency_ms != null && node.latency_ms > 500} />
        <MetricCell label="TTFT" value={formatMs(node.ttft_ms)} />
        <MetricCell label="LLM rounds" value={node.llm_roundtrips != null ? String(node.llm_roundtrips) : "--"} />
        <MetricCell label="Retries" value={node.retry_count != null ? String(node.retry_count) : "0"} highlight={node.retry_count != null && node.retry_count > 0} />
        <MetricCell label="Prompt tok" value={formatTokens(node.prompt_tokens)} />
        <MetricCell label="Compl tok" value={formatTokens(node.completion_tokens)} />
      </div>

      {/* Route decision */}
      {node.route ? (
        <div className="rounded-lg border border-[var(--color-border)] p-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
            Route decision
          </p>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="neutral">{node.route}</Badge>
            {node.next_node_name ? (
              <>
                <span className="text-xs text-[var(--color-neutral-400)]">&rarr;</span>
                <span className="text-xs font-medium text-[var(--color-neutral-700)]">
                  {node.next_node_name}
                </span>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Tools called */}
      {node.tools_called.length > 0 ? (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
            Tools called
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {node.tools_called.map((tool) => (
              <Badge key={tool} variant="neutral">
                {tool}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {/* Tool I/O detail (from runtime events) */}
      {node.tool_io && node.tool_io.length > 0 ? (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
            Tool I/O
          </p>
          <div className="mt-1 space-y-1.5">
            {node.tool_io.map((tool, i) => (
              <ToolIORow key={`${tool.tool_name}-${i}`} tool={tool} />
            ))}
          </div>
        </div>
      ) : null}

      {/* YAML-sourced: allowed routes */}
      {nodeConfig && nodeConfig.allowedRoutes.length > 0 ? (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
            Allowed routes
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {nodeConfig.allowedRoutes.map((route) => (
              <Badge
                key={route}
                variant={node.route === route ? "success" : "neutral"}
              >
                {route}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {/* YAML-sourced: node instructions */}
      {nodeConfig?.instructions ? (
        <CollapsibleInstructions instructions={nodeConfig.instructions} />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function ToolIORow({ tool }: { tool: CallTraceToolIO }) {
  const [open, setOpen] = useState(false);
  const failed = tool.status !== "success" && tool.status !== "ok";
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-white">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[10px] hover:bg-[var(--color-neutral-50)]"
      >
        <span className="text-[var(--color-neutral-400)]">&#x1F527;</span>
        <span className="font-medium text-[var(--color-neutral-800)]">{tool.tool_name}</span>
        {tool.duration_ms != null ? <span className="text-[var(--color-neutral-500)]">{formatMs(tool.duration_ms)}</span> : null}
        <span className={`ml-auto rounded px-1 py-0.5 text-[9px] font-medium ${failed ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {failed ? "\u2717" : "\u2713"} {tool.status}
        </span>
        <span className="text-[9px] text-[var(--color-neutral-400)]">{open ? "\u25B2" : "\u25BC"}</span>
      </button>
      {open ? (
        <div className="border-t border-[var(--color-border)] px-2 py-1.5 text-[10px]">
          {tool.tool_args != null ? (
            <div className="mb-1">
              <p className="font-medium text-[var(--color-neutral-500)]">Input</p>
              <pre className="mt-0.5 max-h-28 overflow-auto rounded bg-[var(--color-neutral-50)] p-1.5 text-[9px] text-[var(--color-neutral-700)]">
                {typeof tool.tool_args === "string" ? tool.tool_args : JSON.stringify(tool.tool_args, null, 2)}
              </pre>
            </div>
          ) : null}
          {tool.tool_result != null ? (
            <div>
              <p className="font-medium text-[var(--color-neutral-500)]">Output</p>
              <pre className={`mt-0.5 max-h-28 overflow-auto rounded p-1.5 text-[9px] ${failed ? "bg-red-50 text-red-700" : "bg-[var(--color-neutral-50)] text-[var(--color-neutral-700)]"}`}>
                {typeof tool.tool_result === "string" ? tool.tool_result : JSON.stringify(tool.tool_result, null, 2)}
              </pre>
            </div>
          ) : null}
          {tool.error_detail ? (
            <p className="mt-1 text-[9px] text-red-600">{tool.error_detail}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CollapsibleInstructions({ instructions }: { instructions: string }) {
  const [open, setOpen] = useState(false);
  const isLong = instructions.length > 200;

  return (
    <div className="rounded-lg border border-[var(--color-border)] p-2.5">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between"
      >
        <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
          Node instructions
        </p>
        {isLong ? (
          <span className="text-[10px] text-[var(--color-neutral-400)]">{open ? "\u25B2" : "\u25BC"}</span>
        ) : null}
      </button>
      <p
        className={`mt-1 text-xs leading-relaxed text-[var(--color-neutral-600)] ${
          !open && isLong ? "line-clamp-3" : ""
        }`}
      >
        {instructions}
      </p>
    </div>
  );
}

function MetricCell({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-md bg-[var(--color-neutral-50)] px-2.5 py-1.5">
      <p className="text-[10px] text-[var(--color-neutral-500)]">{label}</p>
      <p
        className={`text-sm font-semibold ${
          highlight ? "text-red-600" : "text-[var(--color-neutral-900)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
