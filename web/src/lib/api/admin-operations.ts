import { platformApiRequest } from "@/lib/api/platform";
import type { CallObservabilitySummaryResponse, CallObservabilitySummaryQuery } from "@/lib/api/call-observability";

export interface CallsBucket {
  bucket_start: string;
  completed: number;
  escalated: number;
  total_calls: number;
  average_duration_seconds: number | null;
  outcome_distribution: Record<string, number>;
  escalation_rate: number | null;
}

export interface CallsResponse {
  buckets: CallsBucket[];
}

export interface AdminCallsReportQuery {
  start?: string;
  end?: string;
  bucket?: "hour" | "day" | "week" | "month";
}

function buildQueryString(
  query: AdminCallsReportQuery | CallObservabilitySummaryQuery,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    params.set(key, String(value));
  }
  const suffix = params.toString();
  return suffix ? `?${suffix}` : "";
}

export function getAdminCallsReport(query: AdminCallsReportQuery = {}): Promise<CallsResponse> {
  return platformApiRequest<CallsResponse>(`/admin/reports/calls${buildQueryString(query)}`, {
    method: "GET",
  });
}

export function getAdminCallObservabilitySummary(
  query: CallObservabilitySummaryQuery = {},
): Promise<CallObservabilitySummaryResponse> {
  return platformApiRequest<CallObservabilitySummaryResponse>(
    `/admin/calls/observability-summary${buildQueryString(query)}`,
    {
      method: "GET",
    },
  );
}
