import { platformApiRequest } from "@/lib/api/platform";

export interface TenantActiveCallSummary {
  call_id: string;
  workflow_id: string;
  run_id: string;
  workflow_type: string;
}

export interface TenantActiveCallsResponse {
  calls: TenantActiveCallSummary[];
}

export interface TenantUsageSummary {
  tenant_id: string;
  period_start: string;
  period_end: string;
  currency: string;
  voice_seconds: number;
  voice_minutes: number;
  production_voice_seconds: number;
  production_voice_minutes: number;
  test_voice_seconds: number;
  test_voice_minutes: number;
  llm_tokens: number;
  stt_characters: number;
  tts_characters: number;
  platform_fee_cents: number;
  telephony_fee_cents: number;
  llm_fee_cents: number;
  stt_fee_cents: number;
  tts_fee_cents: number;
  discount_cents: number;
  subtotal_cents: number;
  total_cents: number;
  budget_mode: "none" | "soft" | "hard";
  monthly_budget_cents: number | null;
  over_budget: boolean;
  utilization_percent: number | null;
}

export interface CallsReportBucket {
  bucket_start: string;
  completed: number;
  escalated: number;
  total_calls: number;
  average_duration_seconds: number | null;
  outcome_distribution: Record<string, number>;
  escalation_rate: number | null;
}

export interface CallsReportResponse {
  buckets: CallsReportBucket[];
}

export interface CallsReportQuery {
  start?: string;
  end?: string;
  bucket?: "hour" | "day" | "week" | "month";
}

function buildQuery(query: CallsReportQuery): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    searchParams.set(key, String(value));
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

export function getTenantActiveCalls(): Promise<TenantActiveCallsResponse> {
  return platformApiRequest<TenantActiveCallsResponse>("/calls/active", {
    method: "GET",
  });
}

export function getTenantUsageSummary(period?: string): Promise<TenantUsageSummary> {
  return platformApiRequest<TenantUsageSummary>(`/billing/usage${period ? `?period=${encodeURIComponent(period)}` : ""}`, {
    method: "GET",
  });
}

export function getCallsReport(query: CallsReportQuery = {}): Promise<CallsReportResponse> {
  return platformApiRequest<CallsReportResponse>(`/reports/calls${buildQuery(query)}`, {
    method: "GET",
  });
}
