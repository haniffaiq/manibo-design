import { Badge } from "@grove/ui/badge";
import type { CallTraceNodeSummary } from "@/lib/api/call-observability";
import { formatDurationMs, traceNodeBadgeVariant } from "@/lib/call-observability-presenters";

export interface SupportAssistantPathProps {
  nodes: CallTraceNodeSummary[];
}

export function SupportAssistantPath({ nodes }: SupportAssistantPathProps) {
  return (
    <section className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-neutral-950)]">Assistant path</h3>
          <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
            Node-by-node timing so you can see where the call slowed down.
          </p>
        </div>
        <Badge variant="neutral">{nodes.length} nodes</Badge>
      </div>
      {nodes.length > 0 ? (
        <div className="mt-4 grid gap-3">
          {nodes.map((node, index) => (
            <div
              key={`${node.node_name}-${index}`}
              data-testid={`call-ops-support-node-${index}`}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-[var(--color-neutral-950)]">{node.node_name}</p>
                  <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                    {node.graph_type ?? "graph"}
                    {node.route ? ` \u2022 route ${node.route}` : ""}
                    {node.next_node_name ? ` \u2022 next ${node.next_node_name}` : ""}
                  </p>
                </div>
                <Badge variant={traceNodeBadgeVariant(node)}>
                  {node.retry_count ? `${node.retry_count} retries` : formatDurationMs(node.latency_ms)}
                </Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-neutral-500)]">
                <span>Delay: {formatDurationMs(node.latency_ms)}</span>
                <span>AI response time: {formatDurationMs(node.ttft_ms)}</span>
                <span>AI turns: {node.llm_roundtrips ?? 0}</span>
                {node.tools_called.length > 0 ? <span>Tools: {node.tools_called.join(", ")}</span> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-neutral-500)]">
          Assistant path details have not been recorded yet for this call.
        </p>
      )}
    </section>
  );
}
