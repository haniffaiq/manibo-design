import { Card, CardContent, CardHeader } from "@grove/ui/card";
import type { CallOpsRouteHotspot } from "@/lib/api/call-observability";
import { formatDurationMs, routeDisplayName } from "@/lib/call-observability-presenters";

interface RouteHotspotsTableProps {
  hotspots: CallOpsRouteHotspot[];
}

export function RouteHotspotsTable({ hotspots }: RouteHotspotsTableProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Where calls slowed down</h2>
        <p className="text-sm text-[var(--color-neutral-500)]">
          Recent conversation paths with the highest latency.
        </p>
      </CardHeader>
      <CardContent>
        {hotspots.length === 0 ? (
          <p className="text-sm text-[var(--color-neutral-500)]">
            No route hotspot data yet. Once more calls complete, this table will show where delays cluster.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] table-fixed border-collapse text-left text-sm">
              <thead className="bg-[var(--color-bg-subtle)] text-[var(--color-neutral-600)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Conversation path</th>
                  <th className="px-3 py-2 font-medium">Average delay</th>
                  <th className="px-3 py-2 font-medium">p95 delay</th>
                  <th className="px-3 py-2 font-medium">Worst case</th>
                  <th className="px-3 py-2 font-medium">Calls</th>
                </tr>
              </thead>
              <tbody>
                {hotspots.map((hotspot, index) => (
                  <tr key={`${hotspot.node_name}-${hotspot.route ?? index}`} data-testid={`call-ops-hotspot-${index}`} className="border-t border-[var(--color-border)] align-top">
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-[var(--color-neutral-950)]">{routeDisplayName(hotspot)}</span>
                        <span className="text-xs text-[var(--color-neutral-500)]">{hotspot.graph_type ?? "\u2014"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-[var(--color-neutral-700)]">{formatDurationMs(hotspot.average_latency_ms)}</td>
                    <td className="px-3 py-3 text-[var(--color-neutral-700)]">{formatDurationMs(hotspot.p95_latency_ms)}</td>
                    <td className="px-3 py-3 text-[var(--color-neutral-700)]">{formatDurationMs(hotspot.max_latency_ms)}</td>
                    <td className="px-3 py-3 text-[var(--color-neutral-700)]">{hotspot.sample_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
