"use client";

import { useCallback, useMemo } from "react";
import {
  ReactFlow,
  type Node,
  type Edge,
  type NodeTypes,
  type NodeProps,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  MiniMap,
} from "@xyflow/react";
import dagre from "dagre";
import YAML from "yaml";

import "@xyflow/react/dist/style.css";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FlowNodeData {
  [key: string]: unknown;
  name: string;
  tools: string[];
  hasRouteDecision: boolean;
  isEntry: boolean;
  state: NodeState;
}

interface FlowEdgeParsed {
  source: string;
  target: string;
  label: string | null;
}

interface ParsedFlow {
  entryPoint: string;
  nodes: Array<{ name: string; tools: string[]; hasRouteDecision: boolean }>;
  edges: FlowEdgeParsed[];
}

export interface FlowGraphDAGProps {
  sourceYaml: string | null;
  visitedNodes: string[];
  activeNodeName: string | null;
  selectedNodeName: string | null;
  onSelectNode?: (nodeName: string | null) => void;
}

/* ------------------------------------------------------------------ */
/*  YAML parser                                                        */
/* ------------------------------------------------------------------ */

export function parseFlowDefinition(sourceYaml: string): ParsedFlow | null {
  try {
    const doc = YAML.parse(sourceYaml) as Record<string, unknown>;
    const flow = doc.flow_definition as Record<string, unknown> | undefined;
    if (!flow) return null;

    const entryPoint = (flow.entry_point as string) ?? "";
    const rawNodes = (flow.nodes ?? {}) as Record<string, Record<string, unknown>>;
    const rawEdges = (flow.edges ?? []) as Array<{ source: string; target: string }>;
    const rawConditionalEdges = (flow.conditional_edges ?? []) as Array<{
      source: string;
      targets: Record<string, string>;
    }>;

    const nodes = Object.entries(rawNodes).map(([name, config]) => ({
      name,
      tools: Array.isArray(config.tools) ? (config.tools as string[]) : [],
      hasRouteDecision: config.route_decision != null,
    }));

    const edges: FlowEdgeParsed[] = [];
    for (const edge of rawEdges) {
      edges.push({ source: edge.source, target: edge.target, label: null });
    }
    for (const ce of rawConditionalEdges) {
      for (const [routeLabel, target] of Object.entries(ce.targets)) {
        edges.push({ source: ce.source, target, label: routeLabel });
      }
    }

    return { entryPoint, nodes, edges };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Dagre layout                                                       */
/* ------------------------------------------------------------------ */

const NODE_WIDTH = 140;
const NODE_HEIGHT = 52;

function layoutGraph(
  flowNodes: ParsedFlow["nodes"],
  flowEdges: FlowEdgeParsed[],
  entryPoint: string,
  visitedSet: Set<string>,
  activeNodeName: string | null,
  selectedNodeName: string | null,
): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", ranksep: 60, nodesep: 30, edgesep: 20 });
  g.setDefaultEdgeLabel(() => ({}));

  // Add __end__ as a virtual node
  const allNodeNames = new Set(flowNodes.map((n) => n.name));
  const needsEnd = flowEdges.some((e) => e.target === "__end__");
  if (needsEnd) allNodeNames.add("__end__");

  for (const name of allNodeNames) {
    g.setNode(name, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const edgeSet = new Set<string>();
  for (const edge of flowEdges) {
    if (!allNodeNames.has(edge.source) || !allNodeNames.has(edge.target)) continue;
    const key = `${edge.source}->${edge.target}`;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  const nodeMap = new Map(flowNodes.map((n) => [n.name, n]));

  const nodes: Node[] = [];
  for (const name of allNodeNames) {
    const pos = g.node(name);
    if (!pos) continue;
    const flowNode = nodeMap.get(name);
    const state = nodeState(name, visitedSet, activeNodeName, selectedNodeName);

    nodes.push({
      id: name,
      type: name === "__end__" ? "endNode" : "flowNode",
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
      data: {
        name,
        tools: flowNode?.tools ?? [],
        hasRouteDecision: flowNode?.hasRouteDecision ?? false,
        isEntry: name === entryPoint,
        state,
      } satisfies FlowNodeData,
    });
  }

  // Build edges with labels. Merge duplicate source→target edges (show combined label)
  const edgeLabelMap = new Map<string, string[]>();
  for (const edge of flowEdges) {
    if (!allNodeNames.has(edge.source) || !allNodeNames.has(edge.target)) continue;
    const key = `${edge.source}->${edge.target}`;
    const labels = edgeLabelMap.get(key) ?? [];
    if (edge.label) labels.push(edge.label);
    edgeLabelMap.set(key, labels);
  }

  const edges: Edge[] = [];
  for (const [key, labels] of edgeLabelMap) {
    const [source, target] = key.split("->");
    const isVisited = visitedSet.has(source) && visitedSet.has(target);
    const isRetry = source === target || labels.includes("retry");
    edges.push({
      id: key,
      source,
      target,
      label: labels.filter((l) => l !== "continue").join(", ") || undefined,
      animated: isRetry,
      style: {
        stroke: isVisited ? "var(--color-primary-400)" : "var(--color-neutral-300)",
        strokeWidth: isVisited ? 2 : 1,
      },
      labelStyle: { fontSize: 9, fill: "var(--color-neutral-500)" },
    });
  }

  return { nodes, edges };
}

/* ------------------------------------------------------------------ */
/*  Node state                                                         */
/* ------------------------------------------------------------------ */

type NodeState = "visited" | "active" | "selected" | "unvisited";

function nodeState(
  name: string,
  visitedSet: Set<string>,
  activeNodeName: string | null,
  selectedNodeName: string | null,
): NodeState {
  if (name === activeNodeName) return "active";
  if (name === selectedNodeName) return "selected";
  if (visitedSet.has(name)) return "visited";
  return "unvisited";
}

const STATE_BG: Record<NodeState, string> = {
  active: "#ecfdf5",
  selected: "var(--color-primary-50)",
  visited: "#ffffff",
  unvisited: "var(--color-neutral-50)",
};

const STATE_BORDER: Record<NodeState, string> = {
  active: "#22c55e",
  selected: "var(--color-primary-400)",
  visited: "var(--color-primary-300)",
  unvisited: "var(--color-neutral-200)",
};

const STATE_TEXT: Record<NodeState, string> = {
  active: "#166534",
  selected: "var(--color-primary-800)",
  visited: "var(--color-neutral-800)",
  unvisited: "var(--color-neutral-400)",
};

/* ------------------------------------------------------------------ */
/*  Custom nodes                                                       */
/* ------------------------------------------------------------------ */

function FlowNodeComponent({ data }: NodeProps<Node<FlowNodeData>>) {
  const state = data.state;
  return (
    <div
      style={{
        background: STATE_BG[state],
        border: `${state === "unvisited" ? "1px dashed" : "2px solid"} ${STATE_BORDER[state]}`,
        borderRadius: 8,
        padding: "6px 10px",
        minWidth: NODE_WIDTH,
        textAlign: "center",
        fontSize: 11,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div style={{ color: STATE_TEXT[state], fontWeight: state === "active" || state === "selected" ? 600 : 400 }}>
        {data.name.replace(/_/g, " ")}
      </div>
      <div style={{ display: "flex", gap: 3, justifyContent: "center", marginTop: 2 }}>
        {data.isEntry ? (
          <span style={{ fontSize: 8, background: "#e5e7eb", borderRadius: 3, padding: "0 3px", color: "#4b5563" }}>
            entry
          </span>
        ) : null}
        {data.tools.length > 0 ? (
          <span style={{ fontSize: 8, background: "#ffedd5", borderRadius: 3, padding: "0 3px", color: "#c2410c" }}>
            {data.tools.length} tool{data.tools.length > 1 ? "s" : ""}
          </span>
        ) : null}
        {data.hasRouteDecision ? (
          <span style={{ fontSize: 8, background: "#dbeafe", borderRadius: 3, padding: "0 3px", color: "#1d4ed8" }}>
            route
          </span>
        ) : null}
      </div>
      {state === "active" ? (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 3 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#22c55e",
              animation: "pulse 2s infinite",
            }}
          />
        </div>
      ) : null}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

function EndNodeComponent({ data }: NodeProps<Node<FlowNodeData>>) {
  const state = data.state;
  return (
    <div
      style={{
        background: STATE_BG[state],
        border: `2px solid ${STATE_BORDER[state]}`,
        borderRadius: "50%",
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        color: STATE_TEXT[state],
        fontWeight: 600,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      END
    </div>
  );
}

const nodeTypes: NodeTypes = {
  flowNode: FlowNodeComponent,
  endNode: EndNodeComponent,
};

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function FlowGraphDAG({
  sourceYaml,
  visitedNodes,
  activeNodeName,
  selectedNodeName,
  onSelectNode,
}: FlowGraphDAGProps) {
  const flow = useMemo(
    () => (sourceYaml ? parseFlowDefinition(sourceYaml) : null),
    [sourceYaml],
  );

  const visitedSet = useMemo(() => new Set(visitedNodes), [visitedNodes]);

  const layoutResult = useMemo(() => {
    if (!flow) return null;
    return layoutGraph(flow.nodes, flow.edges, flow.entryPoint, visitedSet, activeNodeName, selectedNodeName);
  }, [flow, visitedSet, activeNodeName, selectedNodeName]);

  const [nodes, , onNodesChange] = useNodesState(layoutResult?.nodes ?? []);
  const [edges, , onEdgesChange] = useEdgesState(layoutResult?.edges ?? []);

  // Sync layout changes when data updates
  // ReactFlow's useNodesState/useEdgesState only set initial values,
  // so we rely on key-based re-mount below

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id === "__end__") return;
      onSelectNode?.(selectedNodeName === node.id ? null : node.id);
    },
    [onSelectNode, selectedNodeName],
  );

  if (!flow || !layoutResult) {
    return (
      <div
        data-testid="flow-graph-dag-empty"
        className="flex h-16 items-center justify-center text-sm text-[var(--color-neutral-400)]"
      >
        No flow definition available.
      </div>
    );
  }

  // Key includes visited/active to force re-mount when layout changes
  const layoutKey = `${visitedNodes.join(",")}-${activeNodeName}-${selectedNodeName}`;

  return (
    <div data-testid="flow-graph-dag" style={{ height: 220 }}>
      <ReactFlow
        key={layoutKey}
        nodes={layoutResult.nodes}
        edges={layoutResult.edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        edgesFocusable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={0.5} color="var(--color-neutral-200)" />
        <MiniMap
          nodeStrokeWidth={2}
          nodeColor={(node) => {
            const data = node.data as FlowNodeData;
            return STATE_BG[data.state] ?? "#f8fafc";
          }}
          style={{ height: 50, width: 100 }}
        />
      </ReactFlow>
    </div>
  );
}
