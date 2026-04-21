export type ClinicBookingStatus = "confirmed" | "pending" | "failed" | "handed_off";
export type ClinicFollowUpStatus = "open" | "claimed" | "resolved";
export type ClinicFollowUpPriority = "urgent" | "normal";
export type ClinicFollowUpCategory = "urgent_transfer" | "manual_review" | "callback_required" | "booking_failure";
export type ClinicIntegrationOverallStatus = "ready" | "attention_required";
export type ConnectorHealthStatus = "healthy" | "unhealthy";

export interface ClinicBookingResultListItem {
  call_id: string;
  booking_status: ClinicBookingStatus;
  handoff_reason: string | null;
  needs_follow_up: boolean;
  specialty: string | null;
  clinic_city: string | null;
  clinic_address: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  patient_full_name: string | null;
  patient_phone: string | null;
  price_eur: number | null;
  state: string;
  outcome: string | null;
  caller_number: string | null;
  callee_number: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicBookingResultsResponse {
  results: ClinicBookingResultListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ClinicFollowUpQueueItem {
  call_id: string;
  follow_up_status: ClinicFollowUpStatus;
  booking_status: ClinicBookingStatus;
  handoff_reason: string | null;
  follow_up_priority: ClinicFollowUpPriority;
  follow_up_category: ClinicFollowUpCategory;
  recommended_action: string;
  owner_user_id: string | null;
  owner_display_name: string | null;
  owner_email: string | null;
  owner_assigned_at: string | null;
  resolved_at: string | null;
  resolved_by_user_id: string | null;
  resolved_by_display_name: string | null;
  resolution_note: string | null;
  specialty: string | null;
  clinic_city: string | null;
  clinic_address: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  patient_full_name: string | null;
  patient_phone: string | null;
  price_eur: number | null;
  state: string;
  outcome: string | null;
  caller_number: string | null;
  callee_number: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicFollowUpQueueSummary {
  total: number;
  urgent: number;
  normal: number;
  open: number;
  claimed: number;
  resolved: number;
  handed_off: number;
  pending: number;
  failed: number;
}

export interface ClinicFollowUpQueueResponse {
  items: ClinicFollowUpQueueItem[];
  summary: ClinicFollowUpQueueSummary;
  limit: number;
  offset: number;
}

export interface ClinicIntegrationStatusItem {
  integration_id: string;
  label: string;
  connector_type: string;
  channel: string | null;
  configured_adapter: string | null;
  connector_id: string | null;
  connector_display_name: string | null;
  readiness_status: string;
  status_detail: string;
  configured_minutes_before_appointment: number | null;
  latest_health_status: ConnectorHealthStatus | null;
  latest_health_checked_at: string | null;
  latest_health_error: string | null;
}

export interface ClinicIntegrationStatusResponse {
  overall_status: ClinicIntegrationOverallStatus;
  integrations: ClinicIntegrationStatusItem[];
}
