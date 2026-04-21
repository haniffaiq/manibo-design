"use client";

import { useMemo } from "react";

type FlowNode = {
  id: string;
  hasTools: boolean;
  requiresToolCall: boolean;
};

type FlowEdge = {
  source: string;
  target: string;
  label?: string;
};

type ParsedFlow = {
  nodes: FlowNode[];
  edges: FlowEdge[];
  entryPoint: string | null;
};

function parseFlowFromYaml(yaml: string): ParsedFlow | null {
  const flowMatch = yaml.match(/^flow_definition:\s*$/m);
  if (!flowMatch) {
    return null;
  }

  const entryMatch = yaml.match(/entry_point:\s*(\S+)/);
  const entryPoint = entryMatch?.[1] ?? null;

  const nodes: FlowNode[] = [];
  const nodesMatch = yaml.match(/^\s{2}nodes:\s*$/m);
  if (nodesMatch) {
    const nodesSection = yaml.slice(nodesMatch.index! + nodesMatch[0].length);
    const nodeIdRegex = /^\s{4}(\w+):\s*$/gm;
    let match;
    while ((match = nodeIdRegex.exec(nodesSection)) !== null) {
      const nodeId = match[1];
      if (nodeId === "edges" || nodeId === "conditional_edges") break;

      const nextNodeMatch = nodesSection.slice(match.index + match[0].length).match(/^\s{4}\w+:\s*$/m);
      const nodeBlock = nextNodeMatch
        ? nodesSection.slice(match.index, match.index + match[0].length + nextNodeMatch.index!)
        : nodesSection.slice(match.index);

      const hasTools = /tools:\s*\n\s+-\s+\w/.test(nodeBlock);
      const requiresToolCall = /require_tool_call:\s*true/.test(nodeBlock);

      nodes.push({ id: nodeId, hasTools, requiresToolCall });
    }
  }

  const edges: FlowEdge[] = [];

  const edgesSection = yaml.match(/^\s{2}edges:\s*$/m);
  if (edgesSection) {
    const section = yaml.slice(edgesSection.index!);
    let edgeMatch;
    const plainEdgeRegex = /^\s{4}-\s+source:\s+(\S+)\s*\n\s+target:\s+(\S+)/gm;
    while ((edgeMatch = plainEdgeRegex.exec(section)) !== null) {
      if (edgeMatch[2] === "__end__") continue;
      edges.push({ source: edgeMatch[1], target: edgeMatch[2] });
    }
  }

  const condSection = yaml.match(/^\s{2}conditional_edges:\s*$/m);
  if (condSection) {
    const section = yaml.slice(condSection.index!);
    const condBlockRegex = /^\s{4}-\s+source:\s+(\S+)[\s\S]*?targets:\s*\n((?:\s+\w+:\s+\S+\n?)*)/gm;
    let condMatch;
    while ((condMatch = condBlockRegex.exec(section)) !== null) {
      const source = condMatch[1];
      const targetsBlock = condMatch[2];
      const targetRegex = /^\s+(\w+):\s+(\S+)/gm;
      let targetMatch;
      while ((targetMatch = targetRegex.exec(targetsBlock)) !== null) {
        const label = targetMatch[1];
        const target = targetMatch[2];
        if (target === "__end__") continue;
        edges.push({ source, target, label });
      }
    }
  }

  if (nodes.length === 0) {
    return null;
  }

  return { nodes, edges, entryPoint };
}

function nodeDisplayName(id: string): string {
  return id
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const NODE_COLORS: Record<string, string> = {
  greeting: "bg-[var(--color-primary-50)] border-[var(--color-primary-300)]",
  handoff: "bg-[var(--color-warning-50)] border-[var(--color-warning-400)]",
};

export function YamlFlowPreview({ yaml }: { yaml: string }) {
  const flow = useMemo(() => parseFlowFromYaml(yaml), [yaml]);

  if (!flow) {
    return null;
  }

  const orderedNodes = flow.entryPoint
    ? orderNodes(flow.nodes, flow.edges, flow.entryPoint)
    : flow.nodes;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--color-neutral-500)]">Conversation flow</p>
      <div className="relative flex flex-col items-center gap-0 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-6 py-4">
        {orderedNodes.map((node, index) => {
          const outEdges = flow.edges.filter((e) => e.source === node.id);
          const isLast = index === orderedNodes.length - 1;
          const colorClass = NODE_COLORS[node.id] ?? "bg-white border-[var(--color-border)]";

          return (
            <div key={node.id} className="flex flex-col items-center">
              <div
                className={`flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm shadow-[var(--shadow-sm)] ${colorClass}`}
              >
                <span className="font-medium text-[var(--color-neutral-900)]">{nodeDisplayName(node.id)}</span>
                {node.hasTools ? (
                  <span className="text-xs text-[var(--color-primary-600)]" title="Has tools">
                    ⚡
                  </span>
                ) : null}
                {node.requiresToolCall ? (
                  <span className="text-xs text-[var(--color-warning-600)]" title="Requires tool call">
                    ⬢
                  </span>
                ) : null}
              </div>

              {!isLast ? (
                <div className="flex flex-col items-center">
                  <div className="h-4 w-px bg-[var(--color-neutral-300)]" />
                  {outEdges.length > 1 ? (
                    <div className="flex flex-wrap justify-center gap-1 py-0.5">
                      {outEdges.map((edge) => (
                        <span
                          key={`${edge.source}-${edge.target}-${edge.label}`}
                          className="rounded-full bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-[10px] text-[var(--color-neutral-500)]"
                        >
                          {edge.label ?? "→"}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="h-4 w-px bg-[var(--color-neutral-300)]" />
                  <div className="h-0 w-0 border-x-[4px] border-t-[5px] border-x-transparent border-t-[var(--color-neutral-300)]" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-[var(--color-neutral-400)]">
        <span>⚡ Has tools</span>
        <span>⬢ Requires tool call</span>
        <span>{flow.nodes.length} steps</span>
      </div>
    </div>
  );
}

function orderNodes(nodes: FlowNode[], edges: FlowEdge[], entryPoint: string): FlowNode[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const visited = new Set<string>();
  const ordered: FlowNode[] = [];

  function walk(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodeMap.get(id);
    if (node) ordered.push(node);

    const continueEdge = edges.find((e) => e.source === id && e.label === "continue");
    const plainEdge = edges.find((e) => e.source === id && !e.label);
    const next = continueEdge ?? plainEdge;
    if (next) walk(next.target);
  }

  walk(entryPoint);

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      ordered.push(node);
    }
  }

  return ordered;
}
