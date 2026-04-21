import { platformApiRequest } from "@grove/web-shared/api/platform";

import type {
  ClinicBookingStatus,
  ClinicFollowUpStatus,
  ClinicFollowUpPriority,
  ClinicFollowUpCategory,
  ClinicIntegrationOverallStatus,
  ConnectorHealthStatus,
  ClinicBookingResultListItem,
  ClinicBookingResultsResponse,
  ClinicFollowUpQueueItem,
  ClinicFollowUpQueueSummary,
  ClinicFollowUpQueueResponse,
  ClinicIntegrationStatusItem,
  ClinicIntegrationStatusResponse,
} from "@grove/web-shared/types/clinic";

export type {
  ClinicBookingStatus,
  ClinicFollowUpStatus,
  ClinicFollowUpPriority,
  ClinicFollowUpCategory,
  ClinicIntegrationOverallStatus,
  ConnectorHealthStatus,
  ClinicBookingResultListItem,
  ClinicBookingResultsResponse,
  ClinicFollowUpQueueItem,
  ClinicFollowUpQueueSummary,
  ClinicFollowUpQueueResponse,
  ClinicIntegrationStatusItem,
  ClinicIntegrationStatusResponse,
} from "@grove/web-shared/types/clinic";

export type AutomationReadinessStatus = "ready" | "not_configured" | "unhealthy";
export type AutomationExecutionStatus = "planned" | "scheduled" | "blocked" | "not_required" | "completed" | "failed";
export type AutomationExecutionMode = "manual" | "system";
export type AutomationOverallStatus = "ready_to_run" | "attention_required" | "not_required";
export type ClinicIntegrationId = "patient_record_sync" | "confirmation_sms" | "appointment_reminder";
export type ClinicAutomationConnectorType = "crm" | "notifications";
export type ClinicAutomationChannel = "sms";
export type AppointmentBookingConfigFieldName =
  | "crm_adapter"
  | "notification_adapter"
  | "reminder_minutes_before_appointment";
export type AppointmentBookingConfigFieldType = "choice" | "integer";
export type AppointmentBookingConfigFieldSection = "integrations" | "follow_up";

export interface ClinicBookingAppointment {
  specialty: string | null;
  doctor_name: string | null;
  clinic_city: string | null;
  clinic_address: string | null;
  date: string | null;
  time: string | null;
  price_eur: number | null;
}

export interface ClinicBookingPatient {
  personal_code: string | null;
  full_name: string | null;
  phone: string | null;
  email: string | null;
}

export interface ClinicBookingExtraction {
  appointment: ClinicBookingAppointment;
  patient: ClinicBookingPatient;
  booking_status: ClinicBookingStatus;
  handoff_reason: string | null;
}

export interface ClinicBookingCallSummary {
  call_id: string;
  direction: string;
  state: string;
  outcome: string | null;
  caller_number: string | null;
  callee_number: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClinicBookingResultDetailResponse {
  call: ClinicBookingCallSummary;
  result: ClinicBookingExtraction;
  needs_follow_up: boolean;
}

export interface ClinicFollowUpResponse {
  item: ClinicFollowUpQueueItem;
}

export interface ClinicAutomationActionStatus {
  action_id: string;
  label: string;
  action_type: "system_sync" | "notification";
  connector_type: "crm" | "notifications";
  channel: "sms" | null;
  configured_adapter: string | null;
  connector_id: string | null;
  connector_display_name: string | null;
  readiness_status: string;
  execution_status: string;
  execution_mode: AutomationExecutionMode | null;
  status_detail: string;
  provider_id: string | null;
  recorded_at: string | null;
  recorded_by_user_id: string | null;
  recorded_by_display_name: string | null;
  latest_health_status: "healthy" | "unhealthy" | null;
  latest_health_checked_at: string | null;
  latest_health_error: string | null;
}

export interface ClinicPostCallAutomationStatusResponse {
  call_id: string;
  booking_status: ClinicBookingStatus;
  overall_status: string;
  actions: ClinicAutomationActionStatus[];
}

export interface AppointmentBookingConfig {
  crm_adapter: string | null;
  notification_adapter: string | null;
  reminder_minutes_before_appointment: number | null;
  custom_fields: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AppointmentBookingConfigResponse {
  solution_name: "appointment_booking";
  config: AppointmentBookingConfig;
}

export interface AppointmentBookingConfigOption {
  value: string;
  label: string;
}

export interface AppointmentBookingConfigField {
  name: string;
  label: string;
  description: string;
  field_type: AppointmentBookingConfigFieldType;
  section: AppointmentBookingConfigFieldSection;
  nullable: boolean;
  minimum: number | null;
  maximum: number | null;
  options: AppointmentBookingConfigOption[];
}

export interface AppointmentBookingConfigSchemaResponse {
  solution_name: "appointment_booking";
  title: string;
  description: string;
  fields: AppointmentBookingConfigField[];
}

export interface ClinicBrowserSessionResponse {
  room_name: string;
  participant_identity: string;
  token: string;
  connect_url: string;
  profile: string;
  expires_at: string;
}

export interface RecordClinicAutomationActionRequest {
  status_detail?: string;
  provider_id?: string;
}

export interface UpdateAppointmentBookingConfigRequest {
  crm_adapter?: string | null;
  notification_adapter?: string | null;
  reminder_minutes_before_appointment?: number | null;
  custom_fields?: Record<string, unknown>;
  [key: string]: unknown;
}

function normalizeAppointmentBookingConfigPayload(payload: UpdateAppointmentBookingConfigRequest): Record<string, unknown> {
  const normalized: Record<string, unknown> = { ...payload };

  if ("crm_adapter" in payload) {
    normalized.crm_adapter = typeof payload.crm_adapter === "string" ? payload.crm_adapter.trim() || null : payload.crm_adapter ?? null;
  }
  if ("notification_adapter" in payload) {
    normalized.notification_adapter =
      typeof payload.notification_adapter === "string" ? payload.notification_adapter.trim() || null : payload.notification_adapter ?? null;
  }
  if ("reminder_minutes_before_appointment" in payload) {
    normalized.reminder_minutes_before_appointment = payload.reminder_minutes_before_appointment ?? null;
  }
  if ("custom_fields" in payload) {
    normalized.custom_fields = payload.custom_fields ?? {};
  }

  return normalized;
}

export interface ListClinicBookingResultsParams {
  bookingStatus?: ClinicBookingStatus;
  phone?: string;
  limit?: number;
  offset?: number;
}

export interface ListClinicFollowUpsParams {
  followUpPriority?: ClinicFollowUpPriority;
  status?: ClinicFollowUpStatus;
  handoffReason?: string;
  phone?: string;
}

export function listClinicBookingResults(
  params: ListClinicBookingResultsParams = {},
): Promise<ClinicBookingResultsResponse> {
  const searchParams = new URLSearchParams();
  if (params.bookingStatus) {
    searchParams.set("booking_status", params.bookingStatus);
  }
  if (params.phone) {
    searchParams.set("phone", params.phone);
  }
  if (typeof params.limit === "number") {
    searchParams.set("limit", String(params.limit));
  }
  if (typeof params.offset === "number") {
    searchParams.set("offset", String(params.offset));
  }
  const query = searchParams.toString();
  return platformApiRequest<ClinicBookingResultsResponse>(`/clinic/booking-results${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

export function getClinicBookingResult(callId: string): Promise<ClinicBookingResultDetailResponse> {
  return platformApiRequest<ClinicBookingResultDetailResponse>(
    `/clinic/booking-results/${encodeURIComponent(callId)}`,
    { method: "GET" },
  );
}

export function getClinicBookingAutomationStatus(callId: string): Promise<ClinicPostCallAutomationStatusResponse> {
  return platformApiRequest<ClinicPostCallAutomationStatusResponse>(
    `/clinic/booking-results/${encodeURIComponent(callId)}/automation-status`,
    { method: "GET" },
  );
}

export function getClinicIntegrationStatus(): Promise<ClinicIntegrationStatusResponse> {
  return platformApiRequest<ClinicIntegrationStatusResponse>("/clinic/integration-status", {
    method: "GET",
  });
}

export function createClinicBrowserSession(): Promise<ClinicBrowserSessionResponse> {
  return platformApiRequest<ClinicBrowserSessionResponse>("/clinic/browser-session", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function getAppointmentBookingConfig(): Promise<AppointmentBookingConfigResponse> {
  return platformApiRequest<AppointmentBookingConfigResponse>("/solutions/appointment_booking/config", {
    method: "GET",
  });
}

export function getAppointmentBookingConfigSchema(): Promise<AppointmentBookingConfigSchemaResponse> {
  return platformApiRequest<AppointmentBookingConfigSchemaResponse>("/solutions/appointment_booking/config/schema", {
    method: "GET",
  });
}

export function updateAppointmentBookingConfig(
  payload: UpdateAppointmentBookingConfigRequest,
): Promise<AppointmentBookingConfigResponse> {
  return platformApiRequest<AppointmentBookingConfigResponse>("/solutions/appointment_booking/config", {
    method: "PUT",
    body: JSON.stringify(normalizeAppointmentBookingConfigPayload(payload)),
  });
}

export function completeClinicAutomationAction(
  callId: string,
  actionId: string,
  payload: RecordClinicAutomationActionRequest = {},
): Promise<ClinicPostCallAutomationStatusResponse> {
  return platformApiRequest<ClinicPostCallAutomationStatusResponse>(
    `/clinic/booking-results/${encodeURIComponent(callId)}/automation-actions/${encodeURIComponent(actionId)}/complete`,
    {
      method: "POST",
      body: JSON.stringify({
        status_detail: payload.status_detail?.trim() || undefined,
        provider_id: payload.provider_id?.trim() || undefined,
      }),
    },
  );
}

export function failClinicAutomationAction(
  callId: string,
  actionId: string,
  payload: RecordClinicAutomationActionRequest = {},
): Promise<ClinicPostCallAutomationStatusResponse> {
  return platformApiRequest<ClinicPostCallAutomationStatusResponse>(
    `/clinic/booking-results/${encodeURIComponent(callId)}/automation-actions/${encodeURIComponent(actionId)}/fail`,
    {
      method: "POST",
      body: JSON.stringify({
        status_detail: payload.status_detail?.trim() || undefined,
        provider_id: payload.provider_id?.trim() || undefined,
      }),
    },
  );
}

export function listClinicFollowUps(
  params: ListClinicFollowUpsParams = {},
): Promise<ClinicFollowUpQueueResponse> {
  const searchParams = new URLSearchParams();
  if (params.followUpPriority) {
    searchParams.set("follow_up_priority", params.followUpPriority);
  }
  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.handoffReason) {
    searchParams.set("handoff_reason", params.handoffReason);
  }
  if (params.phone) {
    searchParams.set("phone", params.phone);
  }
  const query = searchParams.toString();
  return platformApiRequest<ClinicFollowUpQueueResponse>(`/clinic/follow-ups${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}

export function getClinicFollowUp(callId: string): Promise<ClinicFollowUpResponse> {
  return platformApiRequest<ClinicFollowUpResponse>(`/clinic/follow-ups/${encodeURIComponent(callId)}`, {
    method: "GET",
  });
}

export function claimClinicFollowUp(callId: string): Promise<ClinicFollowUpResponse> {
  return platformApiRequest<ClinicFollowUpResponse>(`/clinic/follow-ups/${encodeURIComponent(callId)}/claim`, {
    method: "POST",
  });
}

export function assignClinicFollowUp(callId: string, userId: string): Promise<ClinicFollowUpResponse> {
  return platformApiRequest<ClinicFollowUpResponse>(`/clinic/follow-ups/${encodeURIComponent(callId)}/assign`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId }),
  });
}

export function resolveClinicFollowUp(callId: string, resolutionNote?: string): Promise<ClinicFollowUpResponse> {
  return platformApiRequest<ClinicFollowUpResponse>(`/clinic/follow-ups/${encodeURIComponent(callId)}/resolve`, {
    method: "POST",
    body: JSON.stringify({ resolution_note: resolutionNote?.trim() || undefined }),
  });
}
