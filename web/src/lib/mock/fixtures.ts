/**
 * Mock fixtures derived from frontend-web-app-design-pack.md (section 7).
 *
 * Each export is a plain JSON-shaped object that matches the response contract
 * of the corresponding endpoint declared in src/lib/api/*.ts. Used by
 * src/lib/mock/dispatcher.ts when GROVE_USE_MOCK_API=true.
 */

const NOW = "2026-04-16T05:30:00Z";
const TENANT_ID = "ten_01JTNORTHSTAR0001";
const TENANT_NAME = "Northstar Mobility";

/* ---------------------------------------------------------------- */
/*  Tenant: dashboard / call-ops summary                             */
/* ---------------------------------------------------------------- */

export const tenantActiveCalls = {
  calls: [
    {
      call_id: "call_01JCALL0001",
      workflow_id: "wf_driver_verification_0001",
      run_id: "run_01JCALL0001",
      workflow_type: "driver_verification.outbound_call",
    },
    {
      call_id: "call_01JCALL0002",
      workflow_id: "wf_appointment_booking_0101",
      run_id: "run_01JCALL0002",
      workflow_type: "appointment_booking.inbound_call",
    },
  ],
};

export const tenantUsageSummary = {
  tenant_id: TENANT_ID,
  period_start: "2026-04-01T00:00:00Z",
  period_end: "2026-04-30T23:59:59Z",
  currency: "USD",
  voice_seconds: 19840,
  voice_minutes: 330.67,
  production_voice_seconds: 16520,
  production_voice_minutes: 275.33,
  test_voice_seconds: 3320,
  test_voice_minutes: 55.33,
  llm_tokens: 621000,
  stt_characters: 382000,
  tts_characters: 191000,
  platform_fee_cents: 420000,
  telephony_fee_cents: 168000,
  llm_fee_cents: 93000,
  stt_fee_cents: 41000,
  tts_fee_cents: 26000,
  discount_cents: 15000,
  subtotal_cents: 748000,
  total_cents: 733000,
  budget_mode: "soft" as const,
  monthly_budget_cents: 1000000,
  over_budget: false,
  utilization_percent: 73.3,
};

export const tenantCallsReport = {
  buckets: [
    {
      bucket_start: "2026-04-16T00:00:00Z",
      completed: 41,
      escalated: 4,
      total_calls: 49,
      average_duration_seconds: 284,
      outcome_distribution: { verified: 22, booked: 11, no_answer: 7, escalated: 4, other: 5 },
      escalation_rate: 0.082,
    },
    {
      bucket_start: "2026-04-15T00:00:00Z",
      completed: 36,
      escalated: 2,
      total_calls: 40,
      average_duration_seconds: 251,
      outcome_distribution: { verified: 18, booked: 9, no_answer: 8, escalated: 2, other: 3 },
      escalation_rate: 0.05,
    },
  ],
};

export const callObservabilitySummary = {
  sampled_calls: 50,
  window_start: "2026-04-15T05:30:00Z",
  window_end: NOW,
  stack_comparisons: [
    { component: "llm" as const, provider: "openai", model: "gpt-4o", language: "id-ID", voice_id: null, voice_name: null, sample_count: 50, average_ms: 980, p95_ms: 1820, max_ms: 2640 },
    { component: "stt" as const, provider: "deepgram", model: "nova-2", language: "id-ID", voice_id: null, voice_name: null, sample_count: 50, average_ms: 320, p95_ms: 540, max_ms: 720 },
    { component: "tts" as const, provider: "azure", model: "neural", language: "id-ID", voice_id: "id-ID-ArdiNeural", voice_name: "Ardi", sample_count: 50, average_ms: 410, p95_ms: 670, max_ms: 880 },
  ],
  route_hotspots: [
    { graph_type: "appointment_booking", node_name: "lookup_slots", route: "appointment_booking.lookup_slots", sample_count: 18, average_latency_ms: 1120, p95_latency_ms: 1640, max_latency_ms: 2410 },
    { graph_type: "driver_verification", node_name: "identity_check", route: "driver_verification.identity_check", sample_count: 22, average_latency_ms: 740, p95_latency_ms: 1180, max_latency_ms: 1810 },
  ],
};

/* ---------------------------------------------------------------- */
/*  Tenant: solutions                                                */
/* ---------------------------------------------------------------- */

export const tenantSolutions = {
  solutions: [
    { solution_name: "driver_verification", enabled: true, version: "1.0.0", description: "Voice-based driver identity verification.", requires_enabled: [], optional_enabled: [], desired_revision: "rev_001", active_revision: "rev_001" },
    { solution_name: "appointment_booking", enabled: true, version: "1.2.0", description: "Clinic appointment scheduling assistant.", requires_enabled: [], optional_enabled: [], desired_revision: "rev_004", active_revision: "rev_004" },
    { solution_name: "lead_capture", enabled: true, version: "0.9.1", description: "Inbound lead intake.", requires_enabled: [], optional_enabled: [], desired_revision: "rev_002", active_revision: "rev_002" },
  ],
};

/* ---------------------------------------------------------------- */
/*  Tenant: activity / audit feed                                    */
/* ---------------------------------------------------------------- */

export const tenantAuditEvents = {
  events: [
    { id: "evt_tenant_001", tenant_id: TENANT_ID, actor_user_id: "user_001", action: "agent_definition.published", resource_type: "agent_definition", resource_id: "agent_001", metadata: { actor_name: "Raka Pratama", target_label: "Northstar Driver Verifier", summary: "Published version 8 to production." }, outcome: "success", created_at: "2026-04-16T05:21:00Z" },
    { id: "evt_tenant_002", tenant_id: TENANT_ID, actor_user_id: "user_002", action: "operator_event.acked", resource_type: "operator_event", resource_id: "op_evt_001", metadata: { actor_name: "Sinta Maharani", target_label: "Latency spike on live call", summary: "Acknowledged critical call alert." }, outcome: "success", created_at: "2026-04-16T05:12:00Z" },
    { id: "evt_tenant_003", tenant_id: TENANT_ID, actor_user_id: null, action: "connector.updated", resource_type: "connector", resource_id: "conn_001", metadata: { actor_name: "System", target_label: "Salesforce CRM", summary: "Connector health recovered after credential refresh." }, outcome: "success", created_at: "2026-04-16T04:58:00Z" },
  ],
};

/* ---------------------------------------------------------------- */
/*  Tenant: automations / workflow executions                        */
/* ---------------------------------------------------------------- */

export const workflowExecutions = {
  executions: [
    { workflow_id: "wf_driver_verification_0001", run_id: "run_01JWF0001", workflow_type: "driver_verification.outbound_call", execution_status: "Running" as const, started_at: "2026-04-16T05:18:00Z", closed_at: null },
    { workflow_id: "wf_booking_0009", run_id: "run_01JWF0009", workflow_type: "appointment_booking.confirmation", execution_status: "Failed" as const, started_at: "2026-04-16T04:42:00Z", closed_at: "2026-04-16T04:48:00Z" },
    { workflow_id: "wf_booking_0010", run_id: "run_01JWF0010", workflow_type: "appointment_booking.confirmation", execution_status: "Completed" as const, started_at: "2026-04-16T03:42:00Z", closed_at: "2026-04-16T03:46:08Z" },
  ],
  limit: 25,
};

export const workflowExecutionDetail = {
  workflow_id: "wf_booking_0009",
  run_id: "run_01JWF0009",
  workflow_type: "appointment_booking.confirmation",
  execution_status: "Failed" as const,
  started_at: "2026-04-16T04:42:00Z",
  closed_at: "2026-04-16T04:48:00Z",
  current_step: null,
  failed_step: "Send confirmation",
  error_summary: "Notification handoff returned a 504 timeout.",
  total_steps: 3,
  completed_steps: 2,
  retry_summary: { steps_with_retries: 1, total_retry_attempts: 2, max_attempt: 2 },
};

export const workflowExecutionSteps = {
  workflow_id: "wf_booking_0009",
  run_id: "run_01JWF0009",
  steps: [
    { sequence: 1, step_id: "step_01", action: "Load patient request", status: "Completed" as const, attempt: 1, started_at: "2026-04-16T04:42:00Z", ended_at: "2026-04-16T04:42:02Z", duration_ms: 2000, error_detail: null, retry_state: null },
    { sequence: 2, step_id: "step_02", action: "Find slot candidates", status: "Completed" as const, attempt: 1, started_at: "2026-04-16T04:42:02Z", ended_at: "2026-04-16T04:42:04Z", duration_ms: 2000, error_detail: null, retry_state: null },
    { sequence: 3, step_id: "step_03", action: "Send confirmation", status: "Failed" as const, attempt: 2, started_at: "2026-04-16T04:42:04Z", ended_at: "2026-04-16T04:42:05Z", duration_ms: 1000, error_detail: "504 Gateway Timeout", retry_state: "exhausted" },
  ],
};

/* ---------------------------------------------------------------- */
/*  Tenant: operator events / call-ops alerts                        */
/* ---------------------------------------------------------------- */

export const operatorEvents = {
  events: [
    {
      id: "op_evt_001", event_type: "call.latency.spike", severity: "critical" as const, status: "open" as const,
      entity_type: "call", entity_id: "call_01JCALL0004",
      message: "Live call latency spike — turn latency exceeded 3.2 seconds for 3 consecutive turns.",
      metadata: { call_id: "call_01JCALL0004", title: "Live call latency spike" },
      created_at: "2026-04-16T05:22:14Z", updated_at: "2026-04-16T05:22:14Z",
      acked_at: null, acked_by: null, resolved_at: null, resolved_by: null,
    },
    {
      id: "op_evt_002", event_type: "telephony.fallback.used", severity: "warning" as const, status: "acked" as const,
      entity_type: "call", entity_id: "call_01JCALL0008",
      message: "STT traffic switched to fallback provider for one session.",
      metadata: { call_id: "call_01JCALL0008", title: "Fallback provider used" },
      created_at: "2026-04-16T05:05:09Z", updated_at: "2026-04-16T05:08:00Z",
      acked_at: "2026-04-16T05:08:00Z", acked_by: "user_002", resolved_at: null, resolved_by: null,
    },
    {
      id: "op_evt_003", event_type: "connector.recovered", severity: "info" as const, status: "resolved" as const,
      entity_type: "connector", entity_id: "conn_001",
      message: "Salesforce delivery resumed after token refresh.",
      metadata: { title: "Recovered connector health" },
      created_at: "2026-04-16T04:58:04Z", updated_at: "2026-04-16T05:01:00Z",
      acked_at: "2026-04-16T05:00:00Z", acked_by: "user_001",
      resolved_at: "2026-04-16T05:01:00Z", resolved_by: "user_001",
    },
  ],
};

/* ---------------------------------------------------------------- */
/*  Tenant: call history                                             */
/* ---------------------------------------------------------------- */

export const callsList = {
  calls: [
    {
      id: "call_hist_001", direction: "outbound" as const, state: "completed", outcome: "verified",
      caller_number: "+12065550101", callee_number: "+6281230001001",
      started_at: "2026-04-16T03:12:00Z", ended_at: "2026-04-16T03:17:04Z", duration_seconds: 304,
      created_at: "2026-04-16T03:11:58Z", updated_at: "2026-04-16T03:17:04Z",
      metadata: { driver_id: "drv_001", campaign: "morning-verification" },
      quality_score: { overall: 0.91, clarity: 0.93, resolution: 0.9, sentiment: 0.86 },
      needs_human_review: false,
    },
    {
      id: "call_hist_002", direction: "inbound" as const, state: "completed", outcome: "escalated",
      caller_number: "+6281230001009", callee_number: "+12065550105",
      started_at: "2026-04-16T02:42:00Z", ended_at: "2026-04-16T02:51:45Z", duration_seconds: 585,
      created_at: "2026-04-16T02:41:55Z", updated_at: "2026-04-16T02:51:45Z",
      metadata: { booking_request_id: "book_req_001" },
      quality_score: { overall: 0.67, clarity: 0.82, resolution: 0.48, sentiment: 0.63 },
      needs_human_review: true,
    },
  ],
  total: 248,
  limit: 25,
  offset: 0,
};

export const callDetail = {
  call: {
    id: "call_hist_002", direction: "inbound" as const, state: "completed", outcome: "escalated",
    caller_number: "+6281230001009", callee_number: "+12065550105",
    started_at: "2026-04-16T02:42:00Z", ended_at: "2026-04-16T02:51:45Z", duration_seconds: 585,
    created_at: "2026-04-16T02:41:55Z", updated_at: "2026-04-16T02:51:45Z",
    metadata: { booking_request_id: "book_req_001", assistant_name: "Clinic Booking Assistant" },
    quality_score: { overall: 0.67, clarity: 0.82, resolution: 0.48, sentiment: 0.63 },
    needs_human_review: true,
  },
  transcript: { language: "id-ID", full_text: "Halo, saya mau ubah jadwal kontrol saya ke hari Jumat sore kalau masih ada slot." },
  recordings: [
    { id: "rec_001", status: "available", created_at: "2026-04-16T02:51:45Z", signed_url_path: "/recordings/rec_001/signed" },
  ],
  has_more: { transcript: false, recordings: false },
};

export const callEvents = {
  call_id: "call_hist_002",
  events: [
    { seq: 1, event_type: "call.started", occurred_at_ms: 0, summary: "Inbound call started.", created_at: "2026-04-16T02:42:00Z", payload: {} },
    { seq: 2, event_type: "tool.schedule_lookup.started", occurred_at_ms: 98000, summary: "Schedule connector lookup started.", created_at: "2026-04-16T02:43:38Z", payload: { connector: "medix_schedule" } },
    { seq: 3, event_type: "call.escalated", occurred_at_ms: 540000, summary: "Call escalated to human operator.", created_at: "2026-04-16T02:51:00Z", payload: { reason: "No matching Friday slot confirmed" } },
  ],
};

/* ---------------------------------------------------------------- */
/*  Tenant: connectors / integrations                                */
/* ---------------------------------------------------------------- */

export const connectorCatalog = [
  {
    connector_type: "crm" as const,
    adapters: [
      { adapter_name: "salesforce", title: "Salesforce", description: "Sync contacts and lead status to Salesforce.", config_schema: {}, ui_hints: { secret_fields: ["api_token"], documentation_url: null, setup_summary: "Connect Salesforce CRM.", supports_health_check: true, supports_http_invoke: true }, source_kind: "first_party" },
    ],
  },
  {
    connector_type: "scheduling" as const,
    adapters: [
      { adapter_name: "medix_schedule", title: "Medix Schedule", description: "Look up clinic slots from Medix.", config_schema: {}, ui_hints: { secret_fields: ["api_key"], documentation_url: null, setup_summary: "Connect Medix scheduling.", supports_health_check: true, supports_http_invoke: true }, source_kind: "first_party" },
    ],
  },
  {
    connector_type: "notifications" as const,
    adapters: [
      { adapter_name: "twilio_sms", title: "Twilio SMS", description: "Send confirmation SMS via Twilio.", config_schema: {}, ui_hints: { secret_fields: ["auth_token"], documentation_url: null, setup_summary: "Connect Twilio SMS.", supports_health_check: false, supports_http_invoke: true }, source_kind: "first_party" },
    ],
  },
];

export const connectors = [
  {
    id: "conn_001", tenant_id: TENANT_ID, connector_type: "crm" as const, adapter_name: "salesforce",
    adapter_source_kind: "first_party", adapter_internal_only: false,
    display_name: "Salesforce CRM", status: "active" as const, config: {},
    created_by: "user_001", created_at: "2026-02-01T08:00:00Z", updated_at: "2026-04-16T04:58:00Z",
    latest_health: { id: "h_001", connector_id: "conn_001", checked_at: "2026-04-16T05:28:00Z", status: "healthy", error_code: null, error_message: null, details: {}, latency_ms: 220 },
  },
  {
    id: "conn_002", tenant_id: TENANT_ID, connector_type: "scheduling" as const, adapter_name: "medix_schedule",
    adapter_source_kind: "first_party", adapter_internal_only: false,
    display_name: "Medix Schedule", status: "active" as const, config: {},
    created_by: "user_001", created_at: "2026-02-01T08:00:00Z", updated_at: "2026-04-16T05:00:00Z",
    latest_health: { id: "h_002", connector_id: "conn_002", checked_at: "2026-04-16T05:25:00Z", status: "degraded", error_code: "timeout", error_message: "Slot lookup timeout increased in the last hour.", details: {}, latency_ms: 1820 },
  },
  {
    id: "conn_003", tenant_id: TENANT_ID, connector_type: "notifications" as const, adapter_name: "twilio_sms",
    adapter_source_kind: "first_party", adapter_internal_only: false,
    display_name: "Twilio SMS", status: "disabled" as const, config: {},
    created_by: "user_001", created_at: "2026-02-10T08:00:00Z", updated_at: "2026-04-12T08:00:00Z",
    latest_health: null,
  },
];

/* ---------------------------------------------------------------- */
/*  Tenant: team                                                     */
/* ---------------------------------------------------------------- */

export const teamUsers = {
  users: [
    { user_id: "user_001", tenant_id: TENANT_ID, email: "raka@northstar.example", display_name: "Raka Pratama", role: "client_admin" as const, user_created_at: "2026-01-05T08:00:00Z", membership_created_at: "2026-01-05T08:05:00Z" },
    { user_id: "user_002", tenant_id: TENANT_ID, email: "sinta@northstar.example", display_name: "Sinta Maharani", role: "client_operator" as const, user_created_at: "2026-02-12T08:00:00Z", membership_created_at: "2026-02-12T08:05:00Z" },
    { user_id: "user_003", tenant_id: TENANT_ID, email: "dimas@northstar.example", display_name: "Dimas Kurniawan", role: "client_operator" as const, user_created_at: "2026-04-15T03:00:00Z", membership_created_at: "2026-04-15T03:00:00Z" },
  ],
};

/* ---------------------------------------------------------------- */
/*  Tenant: settings                                                 */
/* ---------------------------------------------------------------- */

export const recordingsSettings = {
  retention_days: 45,
  inherits_default: false,
  updated_at: "2026-04-10T02:00:00Z",
};

export const localeSettings = {
  ui_locale: "id-ID",
  updated_at: "2026-04-03T02:00:00Z",
};

/* ---------------------------------------------------------------- */
/*  Tenant: clinic knowledge base                                    */
/* ---------------------------------------------------------------- */

export const clinicKnowledgeBase = {
  specialties: [
    { id: "spec_derm", name: "Dermatology" },
    { id: "spec_ent", name: "ENT" },
  ],
  cities: [
    { id: "city_jkt", name: "Jakarta" },
    { id: "city_bdg", name: "Bandung" },
  ],
  locations: [
    { id: "loc_001", name: "Northstar Clinic Sudirman", city_id: "city_jkt", address: "Jl. Sudirman No. 88, Jakarta", phone: "+62215550100" },
  ],
  doctors: [
    { id: "doc_001", name: "dr. Maya Kurnia, Sp.KK", specialty_id: "spec_derm", location_id: "loc_001", schedule_summary: "Mon-Fri 09:00-15:00" },
  ],
  price_cards: [
    { id: "price_001", service_name: "Dermatology Consultation", currency: "IDR", amount: 350000, location_id: "loc_001" },
  ],
};

/* ---------------------------------------------------------------- */
/*  Tenant: observability                                            */
/* ---------------------------------------------------------------- */

const OBS_FACETS = {
  kinds: [
    { value: "call_session", label: "Call session", count: 42 },
    { value: "workflow_run", label: "Workflow run", count: 18 },
    { value: "control_plane_incident", label: "Incident", count: 3 },
    { value: "channel_runtime", label: "Channel runtime", count: 5 },
  ],
  statuses: [
    { value: "healthy", label: "Healthy", count: 37 },
    { value: "degraded", label: "Degraded", count: 16 },
    { value: "failed", label: "Failed", count: 7 },
    { value: "active", label: "Active", count: 8 },
  ],
  tenants: [
    { value: TENANT_ID, label: TENANT_NAME, count: 52 },
    { value: "ten_01JTCLINIC000002", label: "Satelit Clinic Group", count: 12 },
    { value: "ten_01JTTERRA000003", label: "Terra Logistics", count: 4 },
  ],
  solutions: [
    { value: "appointment_booking", label: "Appointment Booking", count: 26 },
    { value: "driver_verification", label: "Driver Verification", count: 34 },
    { value: "lead_capture", label: "Lead Capture", count: 8 },
  ],
  assistants: [
    { value: "Clinic Booking Assistant", label: "Clinic Booking Assistant", count: 21 },
    { value: "Northstar Driver Verifier", label: "Northstar Driver Verifier", count: 31 },
    { value: "Lead Intake Agent", label: "Lead Intake Agent", count: 8 },
  ],
};

const OBS_RUN_CALL_SESSION = {
  kind: "call_session" as const,
  subject_id: "call_01JCALL0004",
  title: "Booking call for Rina Putri",
  subtitle: "Clinic Booking Assistant",
  status: "degraded",
  started_at: "2026-04-16T05:20:02Z",
  ended_at: null,
  duration_ms: 221000,
  call_id: "call_01JCALL0004",
  workflow_id: "wf_booking_0112",
  run_id: "run_obs_001",
  channel_session_id: null,
  conversation_id: "conv_001",
  correlation_id: "corr_001",
  composition_version: "cmp_2026_04_15.3",
  artifact_hash: "hash_artifact_001",
  tenant_id: TENANT_ID,
  tenant_name: TENANT_NAME,
  solution_name: "appointment_booking",
  assistant_name: "Clinic Booking Assistant",
  trace_available: true,
  recording_available: true,
  warning_count: 2,
  error_count: 1,
};

const OBS_RUN_WORKFLOW = {
  kind: "workflow_run" as const,
  subject_id: "wf_booking_0009",
  title: "Booking confirmation workflow",
  subtitle: "appointment_booking.confirmation",
  status: "failed",
  started_at: "2026-04-16T04:42:00Z",
  ended_at: "2026-04-16T04:48:00Z",
  duration_ms: 360000,
  call_id: null,
  workflow_id: "wf_booking_0009",
  run_id: "run_01JWF0009",
  channel_session_id: null,
  conversation_id: null,
  correlation_id: "corr_002",
  composition_version: "cmp_2026_04_15.3",
  artifact_hash: "hash_artifact_001",
  tenant_id: TENANT_ID,
  tenant_name: TENANT_NAME,
  solution_name: "appointment_booking",
  assistant_name: null,
  trace_available: true,
  recording_available: false,
  warning_count: 1,
  error_count: 2,
};

const OBS_RUN_CALL_HEALTHY = {
  kind: "call_session" as const,
  subject_id: "call_01JCALL0010",
  title: "Driver verification — Budi Santoso",
  subtitle: "Northstar Driver Verifier",
  status: "healthy",
  started_at: "2026-04-16T05:05:00Z",
  ended_at: "2026-04-16T05:09:48Z",
  duration_ms: 288000,
  call_id: "call_01JCALL0010",
  workflow_id: "wf_driver_verification_0042",
  run_id: "run_obs_010",
  channel_session_id: null,
  conversation_id: "conv_010",
  correlation_id: "corr_010",
  composition_version: "cmp_2026_04_15.3",
  artifact_hash: "hash_artifact_001",
  tenant_id: TENANT_ID,
  tenant_name: TENANT_NAME,
  solution_name: "driver_verification",
  assistant_name: "Northstar Driver Verifier",
  trace_available: true,
  recording_available: true,
  warning_count: 0,
  error_count: 0,
};

const OBS_RUN_CALL_FAILED = {
  kind: "call_session" as const,
  subject_id: "call_01JCALL0015",
  title: "Booking call — no answer",
  subtitle: "Clinic Booking Assistant",
  status: "failed",
  started_at: "2026-04-16T04:30:00Z",
  ended_at: "2026-04-16T04:30:42Z",
  duration_ms: 42000,
  call_id: "call_01JCALL0015",
  workflow_id: "wf_booking_0108",
  run_id: "run_obs_015",
  channel_session_id: null,
  conversation_id: null,
  correlation_id: "corr_015",
  composition_version: "cmp_2026_04_15.3",
  artifact_hash: "hash_artifact_001",
  tenant_id: TENANT_ID,
  tenant_name: TENANT_NAME,
  solution_name: "appointment_booking",
  assistant_name: "Clinic Booking Assistant",
  trace_available: true,
  recording_available: false,
  warning_count: 0,
  error_count: 1,
};

const OBS_RUN_CALL_ACTIVE = {
  kind: "call_session" as const,
  subject_id: "call_01JCALL0020",
  title: "Live call — Andi Wijaya verification",
  subtitle: "Northstar Driver Verifier",
  status: "active" as string,
  started_at: "2026-04-16T05:28:00Z",
  ended_at: null,
  duration_ms: 0,
  call_id: "call_01JCALL0020",
  workflow_id: "wf_driver_verification_0051",
  run_id: "run_obs_020",
  channel_session_id: null,
  conversation_id: "conv_020",
  correlation_id: "corr_020",
  composition_version: "cmp_2026_04_15.3",
  artifact_hash: "hash_artifact_001",
  tenant_id: TENANT_ID,
  tenant_name: TENANT_NAME,
  solution_name: "driver_verification",
  assistant_name: "Northstar Driver Verifier",
  trace_available: false,
  recording_available: false,
  warning_count: 0,
  error_count: 0,
};

const OBS_RUN_CALL_ESCALATED = {
  kind: "call_session" as const,
  subject_id: "call_01JCALL0012",
  title: "Reschedule request — Dewi Kusuma",
  subtitle: "Clinic Booking Assistant",
  status: "degraded",
  started_at: "2026-04-16T03:45:00Z",
  ended_at: "2026-04-16T03:54:22Z",
  duration_ms: 562000,
  call_id: "call_01JCALL0012",
  workflow_id: "wf_booking_0095",
  run_id: "run_obs_012",
  channel_session_id: null,
  conversation_id: "conv_012",
  correlation_id: "corr_012",
  composition_version: "cmp_2026_04_15.3",
  artifact_hash: "hash_artifact_001",
  tenant_id: TENANT_ID,
  tenant_name: TENANT_NAME,
  solution_name: "appointment_booking",
  assistant_name: "Clinic Booking Assistant",
  trace_available: true,
  recording_available: true,
  warning_count: 1,
  error_count: 0,
};

const OBS_RUN_WORKFLOW_HEALTHY = {
  kind: "workflow_run" as const,
  subject_id: "wf_booking_0010",
  title: "SMS reminder dispatched",
  subtitle: "appointment_booking.reminder",
  status: "healthy",
  started_at: "2026-04-16T05:00:00Z",
  ended_at: "2026-04-16T05:00:04Z",
  duration_ms: 4000,
  call_id: null,
  workflow_id: "wf_booking_0010",
  run_id: "run_01JWF0010",
  channel_session_id: null,
  conversation_id: null,
  correlation_id: "corr_025",
  composition_version: "cmp_2026_04_15.3",
  artifact_hash: "hash_artifact_001",
  tenant_id: TENANT_ID,
  tenant_name: TENANT_NAME,
  solution_name: "appointment_booking",
  assistant_name: null,
  trace_available: true,
  recording_available: false,
  warning_count: 0,
  error_count: 0,
};

const OBS_RUN_INCIDENT = {
  kind: "control_plane_incident" as const,
  subject_id: "inc_001",
  title: "Telephony provider sync degraded",
  subtitle: "TELNYX-PROD-01",
  status: "degraded",
  started_at: "2026-04-16T04:30:00Z",
  ended_at: null,
  duration_ms: 3240000,
  call_id: null,
  workflow_id: null,
  run_id: null,
  channel_session_id: null,
  conversation_id: null,
  correlation_id: "corr_inc_001",
  composition_version: null,
  artifact_hash: null,
  tenant_id: null,
  tenant_name: null,
  solution_name: null,
  assistant_name: null,
  trace_available: true,
  recording_available: false,
  warning_count: 1,
  error_count: 2,
};

const OBS_RUN_CHANNEL_RUNTIME = {
  kind: "channel_runtime" as const,
  subject_id: "chrt_001",
  title: "WhatsApp channel runtime #1",
  subtitle: "wa.northstar.production",
  status: "healthy",
  started_at: "2026-04-16T00:00:00Z",
  ended_at: null,
  duration_ms: 19800000,
  call_id: null,
  workflow_id: null,
  run_id: null,
  channel_session_id: null,
  conversation_id: null,
  correlation_id: "corr_chrt_001",
  composition_version: null,
  artifact_hash: null,
  tenant_id: TENANT_ID,
  tenant_name: TENANT_NAME,
  solution_name: null,
  assistant_name: null,
  trace_available: false,
  recording_available: false,
  warning_count: 0,
  error_count: 0,
};

const OBS_RUN_LEAD_CAPTURE = {
  kind: "call_session" as const,
  subject_id: "call_01JCALL0030",
  title: "Inbound lead — Sarah Johnson",
  subtitle: "Lead Intake Agent",
  status: "healthy",
  started_at: "2026-04-16T02:12:00Z",
  ended_at: "2026-04-16T02:17:33Z",
  duration_ms: 333000,
  call_id: "call_01JCALL0030",
  workflow_id: "wf_lead_capture_0008",
  run_id: "run_obs_030",
  channel_session_id: null,
  conversation_id: "conv_030",
  correlation_id: "corr_030",
  composition_version: "cmp_2026_04_15.3",
  artifact_hash: "hash_artifact_001",
  tenant_id: TENANT_ID,
  tenant_name: TENANT_NAME,
  solution_name: "lead_capture",
  assistant_name: "Lead Intake Agent",
  trace_available: true,
  recording_available: true,
  warning_count: 0,
  error_count: 0,
};

export const observabilityRuns = {
  runs: [
    OBS_RUN_CALL_ACTIVE,
    OBS_RUN_CALL_SESSION,
    OBS_RUN_INCIDENT,
    OBS_RUN_CALL_HEALTHY,
    OBS_RUN_WORKFLOW,
    OBS_RUN_CALL_ESCALATED,
    OBS_RUN_WORKFLOW_HEALTHY,
    OBS_RUN_CALL_FAILED,
    OBS_RUN_CHANNEL_RUNTIME,
    OBS_RUN_LEAD_CAPTURE,
  ],
  facets: OBS_FACETS,
};

const COMMON_AVAILABILITY = { recording_unavailable: false, timeline_partial: false, logs_unavailable: false, trace_unavailable: false };
const NO_RECORDING_AVAIL = { ...COMMON_AVAILABILITY, recording_unavailable: true };

export const observabilityCallSessionDetail = {
  summary: OBS_RUN_CALL_SESSION,
  availability: COMMON_AVAILABILITY,
  metrics: [
    { key: "duration", label: "Duration", value: "3m 41s", value_ms: 221000 },
    { key: "turn_latency_p50", label: "P50 turn latency", value: "1.8s", value_ms: 1800 },
    { key: "turn_latency_p95", label: "P95 turn latency", value: "3.19s", value_ms: 3190 },
    { key: "turns", label: "Turns", value: "6", value_ms: null },
    { key: "tool_calls", label: "Tool calls", value: "3", value_ms: null },
    { key: "tokens", label: "Tokens used", value: "4,280", value_ms: null },
    { key: "interruptions", label: "Interruptions", value: "1", value_ms: null },
  ],
  summary_insights: [
    { key: "latency_spike", label: "Latency spike on slot lookup", detail: "Schedule connector lookup produced elevated latency (>2s) on turns 3-4. This caused audible silence for the caller.", severity: "warning" as const },
    { key: "escalation", label: "Escalated to human", detail: "After 3 failed slot lookups, the agent escalated to operator queue 'clinic-front-desk'.", severity: "info" as const },
  ],
  recommended_actions: [
    { key: "open_connector", label: "Inspect scheduling connector", detail: "Connector latency is the main outlier — check Medix Schedule health.", href: "/integrations", cta_label: "Open integrations", severity: "warning" as const },
    { key: "review_transcript", label: "Review escalation decision", detail: "Agent escalated after 3 retries. Consider increasing retry budget or adding fallback slot source.", href: null, cta_label: null, severity: "info" as const },
  ],
  integrity_gaps: [
    { key: "recording_partial", label: "Recording partial", detail: "First 8 seconds of the recording are missing due to late media handshake.", severity: "warning" as const },
  ],
  recordings: [
    { id: "rec_obs_001", status: "available", created_at: "2026-04-16T05:24:00Z", signed_url_path: "/recordings/rec_obs_001/signed" },
  ],
  context_fields: [
    { key: "tenant", label: "Tenant", value: TENANT_NAME },
    { key: "assistant", label: "Assistant", value: "Clinic Booking Assistant" },
    { key: "solution", label: "Solution", value: "Appointment Booking" },
    { key: "caller", label: "Caller", value: "+6281230001012" },
    { key: "language", label: "Language", value: "id-ID" },
    { key: "composition", label: "Composition", value: "cmp_2026_04_15.3" },
  ],
  trace_context: { route: "appointment_booking.lookup_slots", tool_calls: 3 },
  transcript_text: "User: Halo, saya mau buat janji kontrol untuk hari Jumat sore.\nAgent: Tentu, saya cek slot yang tersedia ya.\nAgent: Maaf, saya kesulitan mencari jadwal saat ini. Saya coba sekali lagi.\nAgent: Mohon maaf, sepertinya sistem penjadwalan sedang lambat. Saya sambungkan ke petugas klinik ya.\nUser: Ya sudah, terima kasih.\nAgent: Sama-sama. Sebentar ya, saya sambungkan sekarang.",
  related_entities: [
    { label: "Workflow wf_booking_0112", href: "/observability/workflow-runs/appointment_booking/wf_booking_0112" },
    { label: "Connector: Medix Schedule (degraded)", href: "/integrations" },
  ],
  solution_enrichers: [
    {
      solution_name: "appointment_booking",
      label: "Appointment Booking",
      case_detail_fields: [
        { key: "requested_date", label: "Requested date", detail: "Jumat sore", severity: "info" as const, occurred_at: "2026-04-16T05:20:30Z" },
        { key: "outcome", label: "Outcome", detail: "Escalated — no slot confirmed", severity: "warning" as const, occurred_at: "2026-04-16T05:23:50Z" },
      ],
      evidence_items: [
        { key: "slot_lookup_slow", label: "Slot lookup slow", detail: "3 attempts, all >1.5s", severity: "warning" as const, occurred_at: "2026-04-16T05:21:00Z" },
      ],
      timeline_decorators: [],
      related_actions: [],
    },
  ],
};

export const observabilityCallSessionTimeline = {
  summary: OBS_RUN_CALL_SESSION,
  availability: COMMON_AVAILABILITY,
  items: [
    { id: "tl_001", kind: "system" as const, severity: "info" as const, occurred_at: "2026-04-16T05:20:02Z", occurred_at_ms: 0, label: "Call connected", detail: "Inbound booking call connected. Caller: +6281230001012.", actor: "telephony", duration_ms: null, correlation_id: "corr_001", payload: {} },
    { id: "tl_002", kind: "transcript" as const, severity: "info" as const, occurred_at: "2026-04-16T05:20:05Z", occurred_at_ms: 3000, label: "Agent greeting", detail: "Halo, terima kasih sudah menelepon. Saya asisten penjadwalan, ingin membuat janji untuk kapan?", actor: "agent", duration_ms: 2200, correlation_id: "corr_001", payload: { speaker: "agent", turn: 1 } },
    { id: "tl_003", kind: "transcript" as const, severity: "info" as const, occurred_at: "2026-04-16T05:20:12Z", occurred_at_ms: 10000, label: "User request", detail: "Saya mau buat janji kontrol untuk hari Jumat sore kalau masih ada slot.", actor: "user", duration_ms: 4100, correlation_id: "corr_001", payload: { speaker: "user", turn: 2 } },
    { id: "tl_004", kind: "tool" as const, severity: "info" as const, occurred_at: "2026-04-16T05:20:16Z", occurred_at_ms: 14000, label: "lookup_slots (attempt 1)", detail: "specialty=dermatology, from_date=2026-04-18, to_date=2026-04-18", actor: "schedule_connector", duration_ms: 980, correlation_id: "corr_001", payload: { tool: "lookup_slots", attempt: 1, result: "ok", slots_found: 3 } },
    { id: "tl_005", kind: "transcript" as const, severity: "info" as const, occurred_at: "2026-04-16T05:20:19Z", occurred_at_ms: 17000, label: "Agent offers slots", detail: "Hari Jumat ada slot jam sepuluh pagi, dua siang, atau empat sore. Mana yang cocok?", actor: "agent", duration_ms: 3200, correlation_id: "corr_001", payload: { speaker: "agent", turn: 3 } },
    { id: "tl_006", kind: "transcript" as const, severity: "info" as const, occurred_at: "2026-04-16T05:20:26Z", occurred_at_ms: 24000, label: "User picks slot", detail: "Yang dua siang saja.", actor: "user", duration_ms: 1800, correlation_id: "corr_001", payload: { speaker: "user", turn: 4 } },
    { id: "tl_007", kind: "tool" as const, severity: "warning" as const, occurred_at: "2026-04-16T05:20:30Z", occurred_at_ms: 28000, label: "lookup_slots (attempt 2 — retry)", detail: "Second slot confirmation attempt: latency exceeded threshold (2.1s).", actor: "schedule_connector", duration_ms: 2100, correlation_id: "corr_001", payload: { tool: "lookup_slots", attempt: 2, result: "slow" } },
    { id: "tl_008", kind: "tool" as const, severity: "warning" as const, occurred_at: "2026-04-16T05:20:38Z", occurred_at_ms: 36000, label: "lookup_slots (attempt 3 — retry)", detail: "Third attempt: latency 2.4s. Connector health degraded.", actor: "schedule_connector", duration_ms: 2400, correlation_id: "corr_001", payload: { tool: "lookup_slots", attempt: 3, result: "slow" } },
    { id: "tl_009", kind: "metric" as const, severity: "warning" as const, occurred_at: "2026-04-16T05:20:42Z", occurred_at_ms: 40000, label: "Turn latency spike", detail: "P95 latency reached 3.19s across last 3 turns. Above 2s threshold.", actor: "platform", duration_ms: null, correlation_id: "corr_001", payload: { p95_ms: 3190, threshold_ms: 2000 } },
    { id: "tl_010", kind: "transcript" as const, severity: "warning" as const, occurred_at: "2026-04-16T05:20:45Z", occurred_at_ms: 43000, label: "Agent apologizes", detail: "Mohon maaf, sepertinya sistem penjadwalan sedang lambat. Saya sambungkan ke petugas klinik ya.", actor: "agent", duration_ms: 4500, correlation_id: "corr_001", payload: { speaker: "agent", turn: 5 } },
    { id: "tl_011", kind: "node" as const, severity: "info" as const, occurred_at: "2026-04-16T05:20:52Z", occurred_at_ms: 50000, label: "Escalation decision", detail: "Agent decided to escalate after 3 failed retries. Queue: clinic-front-desk.", actor: "llm", duration_ms: 220, correlation_id: "corr_001", payload: { decision: "escalate", queue: "clinic-front-desk" } },
    { id: "tl_012", kind: "tool" as const, severity: "info" as const, occurred_at: "2026-04-16T05:20:55Z", occurred_at_ms: 53000, label: "transfer_to_human", detail: "Handoff to clinic-front-desk queue.", actor: "platform", duration_ms: 1200, correlation_id: "corr_001", payload: { tool: "transfer_to_human", queue: "clinic-front-desk" } },
    { id: "tl_013", kind: "transcript" as const, severity: "info" as const, occurred_at: "2026-04-16T05:21:00Z", occurred_at_ms: 58000, label: "User confirms", detail: "Ya sudah, terima kasih.", actor: "user", duration_ms: 1500, correlation_id: "corr_001", payload: { speaker: "user", turn: 6 } },
    { id: "tl_014", kind: "system" as const, severity: "info" as const, occurred_at: "2026-04-16T05:21:05Z", occurred_at_ms: 63000, label: "Call transferred", detail: "Call transferred to operator queue. Agent session ended.", actor: "telephony", duration_ms: null, correlation_id: "corr_001", payload: {} },
  ],
  next_cursor: null,
  returned: 14,
  total_items: 14,
};

export const observabilityWorkflowRunDetail = {
  summary: OBS_RUN_WORKFLOW,
  availability: NO_RECORDING_AVAIL,
  metrics: [
    { key: "duration", label: "Duration", value: "6m 0s", value_ms: 360000 },
    { key: "attempts", label: "Attempts", value: "2", value_ms: null },
    { key: "steps_total", label: "Steps", value: "3", value_ms: null },
    { key: "steps_completed", label: "Completed", value: "2/3", value_ms: null },
  ],
  summary_insights: [
    { key: "failed_step", label: "Send confirmation failed", detail: "Step 3 'Send confirmation' failed after 2 attempts. Notification handoff returned a 504 Gateway Timeout from the downstream SMS provider.", severity: "critical" as const },
    { key: "retries_exhausted", label: "Retry budget exhausted", detail: "Maximum retry attempts (2) reached. Workflow terminated without delivering the booking confirmation.", severity: "warning" as const },
  ],
  recommended_actions: [
    { key: "retry_workflow", label: "Retry this workflow", detail: "The 504 was likely transient — a manual retry should succeed now that Twilio has recovered.", href: "/automations", cta_label: "Open automations", severity: "warning" as const },
    { key: "check_twilio", label: "Check Twilio connector health", detail: "Verify that Twilio SMS connector is back to healthy status before retrying.", href: "/integrations", cta_label: "Open integrations", severity: "info" as const },
  ],
  integrity_gaps: [],
  recordings: [],
  context_fields: [
    { key: "workflow_type", label: "Workflow type", value: "appointment_booking.confirmation" },
    { key: "tenant", label: "Tenant", value: TENANT_NAME },
    { key: "booking_id", label: "Booking ID", value: "book_req_001" },
    { key: "patient_phone", label: "Patient phone", value: "+6281230001009" },
  ],
  trace_context: {},
  transcript_text: null,
  related_entities: [
    { label: "Booking book_req_001", href: "/bookings" },
    { label: "Connector: Twilio SMS", href: "/integrations" },
  ],
  solution_enrichers: [],
};

export const observabilityWorkflowRunTimeline = {
  summary: OBS_RUN_WORKFLOW,
  availability: NO_RECORDING_AVAIL,
  items: [
    { id: "tl_w_001", kind: "workflow_step" as const, severity: "info" as const, occurred_at: "2026-04-16T04:42:00Z", occurred_at_ms: 0, label: "Workflow started", detail: "appointment_booking.confirmation triggered for book_req_001.", actor: "temporal", duration_ms: null, correlation_id: "corr_002", payload: {} },
    { id: "tl_w_002", kind: "workflow_step" as const, severity: "info" as const, occurred_at: "2026-04-16T04:42:02Z", occurred_at_ms: 2000, label: "Step 1: Load patient request", detail: "Fetched booking request data from platform. Patient: Rina Putri.", actor: "temporal", duration_ms: 1800, correlation_id: "corr_002", payload: { step: 1, action: "Load patient request" } },
    { id: "tl_w_003", kind: "workflow_step" as const, severity: "info" as const, occurred_at: "2026-04-16T04:42:04Z", occurred_at_ms: 4000, label: "Step 2: Find slot candidates", detail: "Queried Medix Schedule for slot availability. Found 2 matching slots.", actor: "temporal", duration_ms: 2000, correlation_id: "corr_002", payload: { step: 2, action: "Find slot candidates", slots_found: 2 } },
    { id: "tl_w_004", kind: "tool" as const, severity: "info" as const, occurred_at: "2026-04-16T04:42:04Z", occurred_at_ms: 4000, label: "lookup_slots invoked", detail: "specialty=dermatology, from_date=2026-04-18, to_date=2026-04-19", actor: "schedule_connector", duration_ms: 980, correlation_id: "corr_002", payload: {} },
    { id: "tl_w_005", kind: "workflow_step" as const, severity: "warning" as const, occurred_at: "2026-04-16T04:42:06Z", occurred_at_ms: 6000, label: "Step 3: Send confirmation (attempt 1)", detail: "Sending SMS confirmation to +6281230001009 via Twilio. Timed out.", actor: "temporal", duration_ms: 30000, correlation_id: "corr_002", payload: { step: 3, action: "Send confirmation", attempt: 1 } },
    { id: "tl_w_006", kind: "log" as const, severity: "warning" as const, occurred_at: "2026-04-16T04:42:36Z", occurred_at_ms: 36000, label: "Twilio 504 Gateway Timeout", detail: "POST https://api.twilio.com/2010-04-01/Accounts/.../Messages returned HTTP 504 after 30s.", actor: "twilio_connector", duration_ms: null, correlation_id: "corr_002", payload: { http_status: 504 } },
    { id: "tl_w_007", kind: "workflow_step" as const, severity: "error" as const, occurred_at: "2026-04-16T04:42:38Z", occurred_at_ms: 38000, label: "Step 3: Send confirmation (attempt 2 — retry)", detail: "Retry attempt also timed out after 30s.", actor: "temporal", duration_ms: 30000, correlation_id: "corr_002", payload: { step: 3, action: "Send confirmation", attempt: 2 } },
    { id: "tl_w_008", kind: "system" as const, severity: "error" as const, occurred_at: "2026-04-16T04:48:00Z", occurred_at_ms: 360000, label: "Workflow failed", detail: "Retry budget exhausted (2/2). Workflow terminated.", actor: "temporal", duration_ms: null, correlation_id: "corr_002", payload: {} },
  ],
  next_cursor: null,
  returned: 8,
  total_items: 8,
};

const COMPARE_SNAPSHOT_LEFT = {
  summary: OBS_RUN_CALL_SESSION,
  availability: COMMON_AVAILABILITY,
  key_metrics: [
    { key: "duration", label: "Duration", value: "3m 41s", value_ms: 221000 },
    { key: "p95_latency", label: "P95 latency", value: "3.19s", value_ms: 3190 },
    { key: "errors", label: "Errors", value: "1", value_ms: null },
  ],
  transcript_excerpt: "Pasien meminta slot Jumat sore. Tiga kali lookup jadwal gagal cepat. Dialihkan ke operator.",
  tool_names: ["lookup_slots", "transfer_to_human"],
  context_fields: [{ key: "tenant", label: "Tenant", value: TENANT_NAME }],
  related_entities: [],
};

const COMPARE_SNAPSHOT_RIGHT = {
  summary: OBS_RUN_CALL_HEALTHY,
  availability: COMMON_AVAILABILITY,
  key_metrics: [
    { key: "duration", label: "Duration", value: "4m 48s", value_ms: 288000 },
    { key: "p95_latency", label: "P95 latency", value: "1.2s", value_ms: 1200 },
    { key: "errors", label: "Errors", value: "0", value_ms: null },
  ],
  transcript_excerpt: "Driver verification sukses. Nama dan nomor SIM dikonfirmasi dalam 3 turn.",
  tool_names: ["lookup_customer"],
  context_fields: [{ key: "tenant", label: "Tenant", value: TENANT_NAME }],
  related_entities: [],
};

export const observabilityCompare = {
  kind: "call_session" as const,
  left: COMPARE_SNAPSHOT_LEFT,
  right: COMPARE_SNAPSHOT_RIGHT,
  duration_delta_ms: -67000,
  warning_delta: 2,
  error_delta: 1,
  metric_deltas: [
    { key: "duration", label: "Duration", left_value: "3m 41s", right_value: "4m 48s", delta_value: "-1m 7s" },
    { key: "p95_latency", label: "P95 latency", left_value: "3.19s", right_value: "1.2s", delta_value: "+1.99s" },
    { key: "errors", label: "Errors", left_value: "1", right_value: "0", delta_value: "+1" },
    { key: "tool_calls", label: "Tool calls", left_value: "3", right_value: "1", delta_value: "+2" },
  ],
  context_deltas: [
    { key: "solution", label: "Solution", left_value: "Appointment Booking", right_value: "Driver Verification" },
  ],
  tool_usage: { shared: [], left_only: ["lookup_slots", "transfer_to_human"], right_only: ["lookup_customer"] },
  node_usage: { shared: ["greeting", "intent_detection"], left_only: ["slot_lookup", "escalation"], right_only: ["identity_check", "license_confirm"] },
  route_usage: { shared: [], left_only: ["appointment_booking.lookup_slots"], right_only: ["driver_verification.identity_check"] },
  workflow_step_usage: { shared: [], left_only: [], right_only: [] },
};

/* ---------------------------------------------------------------- */
/*  Admin                                                            */
/* ---------------------------------------------------------------- */

export const adminTenants = [
  { id: TENANT_ID, name: TENANT_NAME, slug: "northstar-mobility", status: "active" as const, environment: "production" as const, ui_locale: "id-ID", created_at: "2026-01-05T08:00:00Z", updated_at: "2026-04-14T05:00:00Z" },
  { id: "ten_01JTCLINIC000002", name: "Satelit Clinic Group", slug: "satelit-clinic", status: "active" as const, environment: "demo" as const, ui_locale: "id-ID", created_at: "2026-02-01T08:00:00Z", updated_at: "2026-04-11T05:00:00Z" },
  { id: "ten_01JTTERRA000003", name: "Terra Logistics", slug: "terra-logistics", status: "suspended" as const, environment: "test" as const, ui_locale: "en-US", created_at: "2026-03-01T08:00:00Z", updated_at: "2026-04-10T05:00:00Z" },
];

export const adminUsers = {
  users: [
    { user_id: "adm_001", tenant_id: TENANT_ID, email: "ayu@provider.example", display_name: "Ayu Wibowo", role: "client_admin" as const, user_created_at: "2026-01-01T08:00:00Z", membership_created_at: "2026-01-01T08:00:00Z" },
    { user_id: "adm_002", tenant_id: TENANT_ID, email: "bagas@provider.example", display_name: "Bagas Saputra", role: "client_operator" as const, user_created_at: "2026-01-15T08:00:00Z", membership_created_at: "2026-01-15T08:00:00Z" },
  ],
};

export const adminAgentDefinitions = [
  { id: "agent_001", tenant_id: TENANT_ID, name: "Northstar Driver Verifier", status: "published" as const, published_version: 8, created_at: "2026-02-01T08:00:00Z", updated_at: "2026-04-16T05:21:00Z" },
  { id: "agent_002", tenant_id: TENANT_ID, name: "Clinic Booking Assistant", status: "draft" as const, published_version: 3, created_at: "2026-02-18T08:00:00Z", updated_at: "2026-04-15T11:05:00Z" },
];

export const adminAgentDefinitionDetail = {
  id: "agent_002",
  tenant_id: TENANT_ID,
  name: "Clinic Booking Assistant",
  status: "draft" as const,
  published_version: 3,
};

export const adminAgentDefinitionVersions = [
  {
    id: "agent_002_v4", agent_definition_id: "agent_002", tenant_id: TENANT_ID, version: 4, status: "in_review" as const,
    source_yaml: "name: Clinic Booking Assistant\nlanguage: id-ID\nprompts:\n  system: |\n    Help patients find and confirm clinic slots.\n",
    source_yaml_hash: "yamlhash_v4", compiled_hash: "compiledhash_v4",
    model_policy_snapshot_ref: "policy_default_v3", platform_defaults_version: "defaults_2026_04_10",
    created_at: "2026-04-15T08:40:00Z", submitted_at: "2026-04-15T09:02:00Z", published_at: null,
    review_decision: null, review_reason: null, review_submitted_at: "2026-04-15T09:02:00Z", review_decided_at: null,
  },
  {
    id: "agent_002_v3", agent_definition_id: "agent_002", tenant_id: TENANT_ID, version: 3, status: "published" as const,
    source_yaml: "name: Clinic Booking Assistant\nlanguage: id-ID\n",
    source_yaml_hash: "yamlhash_v3", compiled_hash: "compiledhash_v3",
    model_policy_snapshot_ref: "policy_default_v2", platform_defaults_version: "defaults_2026_03_18",
    created_at: "2026-03-19T08:40:00Z", submitted_at: "2026-03-19T09:02:00Z", published_at: "2026-03-20T03:10:00Z",
    review_decision: "approved" as const, review_reason: "Ready for publish.", review_submitted_at: "2026-03-19T09:02:00Z", review_decided_at: "2026-03-19T11:12:00Z",
  },
];

export const adminAgentDefinitionArtifact = {
  agent_definition_id: "agent_002",
  tenant_id: TENANT_ID,
  name: "Clinic Booking Assistant",
  version: 4,
  compiled_config: { language: "id-ID", tools: ["lookup_slots", "create_booking", "handoff_to_operator"], guardrails: ["booking_time_window", "contact_confirmation"] },
  compiled_hash: "compiledhash_v4",
};

export const adminReleases = [
  { id: "rel_2026_04_14_prod_03", name: "2026.04.14-prod.03", created_by: "Ayu Wibowo", created_at: "2026-04-14T02:00:00Z", notes: "Production rollout.", component_count: 6 },
  { id: "rel_2026_04_16_canary_01", name: "2026.04.16-canary.01", created_by: "Ayu Wibowo", created_at: "2026-04-16T01:00:00Z", notes: "Canary candidate.", component_count: 4 },
];

export const adminReleaseComponents = [
  { id: "cmp_001", release_id: "rel_2026_04_14_prod_03", component_type: "platform_defaults" as const, name: "platform_defaults", version: "defaults_2026_04_10", metadata: {} },
  { id: "cmp_002", release_id: "rel_2026_04_14_prod_03", component_type: "agent_definition" as const, name: "Northstar Driver Verifier", version: "8", metadata: { agent_definition_id: "agent_001" } },
];

export const adminTenantReleaseAssignment = {
  tenant_id: TENANT_ID,
  desired_release_id: "rel_2026_04_14_prod_03",
  active_release_id: "rel_2026_04_14_prod_03",
  status: "active",
  attempt_count: 1,
  last_error: null,
  rollout_started_at: "2026-04-14T05:00:00Z",
  rollout_completed_at: "2026-04-14T05:02:30Z",
  updated_at: "2026-04-14T05:02:30Z",
};

export const adminOidcProviders = [
  { id: "oidc_001", issuer: "https://accounts.google.com", jwks_uri: "https://www.googleapis.com/oauth2/v3/certs", audience: "manibo-prod", tenant_id: null, created_at: "2026-01-05T08:00:00Z" },
  { id: "oidc_002", issuer: "https://login.microsoftonline.com/example", jwks_uri: "https://login.microsoftonline.com/example/discovery/v2.0/keys", audience: "manibo-prod", tenant_id: null, created_at: "2026-02-10T08:00:00Z" },
];

export const adminPlatformDefaults = [
  { version: "defaults_2026_04_10", config_yaml_hash: "h_2026_04_10", created_by: "Ayu Wibowo", created_at: "2026-04-10T02:00:00Z" },
  { version: "defaults_2026_04_15", config_yaml_hash: "h_2026_04_15", created_by: "Ayu Wibowo", created_at: "2026-04-15T02:00:00Z" },
];

export const adminTelephonyProviderOptions = [
  {
    provider_kind: "telnyx" as const,
    display_name: "Telnyx",
    capability_matrix: [
      { capability: "telephony.connect_provider_account" as const, enabled: true, notes: null },
      { capability: "telephony.buy_numbers" as const, enabled: true, notes: null },
      { capability: "telephony.sync_trunks" as const, enabled: true, notes: null },
      { capability: "telephony.sync_numbers" as const, enabled: true, notes: null },
      { capability: "telephony.byo_sip_trunk" as const, enabled: false, notes: null },
      { capability: "telephony.assign_published_assistant" as const, enabled: true, notes: null },
    ],
    operations: [
      { operation: "validate_account" as const, mode: "managed" as const, implemented: true, notes: null },
      { operation: "sync_trunks" as const, mode: "managed" as const, implemented: true, notes: null },
      { operation: "search_available_numbers" as const, mode: "managed" as const, implemented: true, notes: null },
      { operation: "sync_numbers" as const, mode: "managed" as const, implemented: true, notes: null },
      { operation: "acquire_numbers" as const, mode: "managed" as const, implemented: true, notes: null },
      { operation: "reconcile" as const, mode: "managed" as const, implemented: true, notes: null },
    ],
  },
];

export const adminTelephonyProviderAccounts = [
  {
    id: "tpacc_001", owner_scope: "deployment" as const, owner_tenant_id: null, provider_kind: "telnyx" as const,
    display_name: "TELNYX-PROD-01", status: "degraded" as const,
    capability_snapshot: ["telephony.connect_provider_account", "telephony.sync_trunks", "telephony.sync_numbers", "telephony.buy_numbers"],
    provider_metadata: { region: "us-west" },
    control_plane: { last_tested_at: "2026-04-16T04:35:00Z", last_test_outcome: "failure" as const, last_test_message: "Provider API timeout during validation.", last_test_probe: "provider.connectivity" as const },
    credential_configured: true, created_at: "2026-01-03T08:00:00Z", updated_at: "2026-04-16T04:35:00Z",
  },
];

export const adminTelephonyTrunks = [
  {
    id: "trunk_001", provider_account_id: "tpacc_001", display_name: "Northstar Inbound Trunk",
    direction: "inbound" as const, transport_kind: "sip", provider_resource_id: "telnyx-trunk-001", livekit_binding_id: "lkbind_001",
    status: "active" as const, config: { region: "us-west" },
    control_plane: {
      last_synced_at: "2026-04-16T04:31:00Z", last_sync_message: "Inventory synchronized.",
      last_reconciled_at: "2026-04-16T04:31:10Z", last_reconcile_message: "No drift detected.", last_reconcile_issue_codes: [],
    },
    created_at: "2026-01-03T08:20:00Z", updated_at: "2026-04-16T04:31:10Z",
  },
];

export const adminTelephonyNumbers = [
  {
    id: "num_001", provider_account_id: "tpacc_001", trunk_id: "trunk_001",
    e164_number: "+12065550101", provider_number_id: "pn_telnyx_001",
    status: "assigned" as const, source: "purchased" as const,
    capability_snapshot: ["telephony.buy_numbers", "telephony.assign_published_assistant"],
    number_metadata: { locality: "Seattle" },
    control_plane: {
      last_synced_at: "2026-04-16T04:31:00Z", last_sync_message: "Number inventory synchronized.",
      last_seen_in_provider_inventory_at: "2026-04-16T04:31:00Z",
      last_acquired_at: "2026-01-03T08:15:00Z", last_acquisition_message: "Purchased successfully.", last_provider_order_id: "order_001",
    },
    binding_summary: {
      id: "bind_001", tenant_id: TENANT_ID, tenant_name: TENANT_NAME, tenant_slug: "northstar-mobility",
      sip_trunk_id: "trunk_001", active: true, agent_definition_id: "agent_001", agent_name: "Northstar Driver Verifier",
      agent_status: "published", published_version: 8, routing_ready: true, created_at: "2026-01-04T09:00:00Z",
    },
    created_at: "2026-01-03T08:15:00Z", updated_at: "2026-04-16T04:31:00Z",
  },
];

export const adminTelephonyTenantPolicy = {
  tenant_id: TENANT_ID,
  mode: "default_with_byo_override" as const,
  allows_deployment_default: true,
  allows_tenant_byo: true,
  usable_provider_account_source: "deployment_default" as const,
  deployment_provider_account_count: 1,
  tenant_provider_account_count: 0,
  updated_at: "2026-03-01T04:00:00Z",
};

export const platformHealth = {
  checked_at: NOW,
  call_error_rate: 0.018,
  average_call_duration_seconds: 268,
  active_calls: { voice_call: 8, inbound_call: 4, total: 12 },
  worker_status: { platform_api: "healthy" as const, temporal: "degraded" as const, temporal_error: "Latency above target on workflow workers." },
};

export const adminAuditEvents = {
  events: [
    { id: "sec_evt_001", tenant_id: null, actor_user_id: "adm_001", action: "admin.login.success", resource_type: null, resource_id: null, metadata: { actor_name: "Ayu Wibowo", summary: "Successful deployment admin login." }, outcome: "success", created_at: "2026-04-16T05:00:00Z" },
    { id: "sec_evt_002", tenant_id: "ten_01JTTERRA000003", actor_user_id: "adm_002", action: "tenant.suspended", resource_type: "tenant", resource_id: "ten_01JTTERRA000003", metadata: { actor_name: "Bagas Saputra", tenant_name: "Terra Logistics", summary: "Tenant suspended pending billing review." }, outcome: "success", created_at: "2026-04-16T03:50:00Z" },
  ],
};

/* ---------------------------------------------------------------- */
/*  Admin: calls                                                     */
/* ---------------------------------------------------------------- */

export const adminLiveCalls = {
  calls: [
    {
      id: "cl_01JXYZA",
      tenant_id: TENANT_ID,
      tenant_name: TENANT_NAME,
      agent_id: "agent_002",
      agent_name: "booking_assistant",
      agent_version: "7",
      state: "in_progress" as const,
      direction: "inbound" as const,
      caller_number: "+1 415 \u2022\u2022\u2022 4421",
      caller_name: "Maya R.",
      callee_number: "+12065550105",
      channel: "pstn" as const,
      started_at: "2026-04-18T09:20:02Z",
      duration_ms: 135000,
      current_intent: "Book dinner reservation",
      cost_cents: 14,
      latency_ms: 1150,
      tools: ["check_availability"],
    },
    {
      id: "cl_01JXYZB",
      tenant_id: TENANT_ID,
      tenant_name: TENANT_NAME,
      agent_id: "agent_003",
      agent_name: "hanif_assistant",
      agent_version: "4",
      state: "on_hold" as const,
      direction: "inbound" as const,
      caller_number: "+44 20 \u2022\u2022\u2022\u2022 6621",
      caller_name: "Tom P.",
      callee_number: "+12065550105",
      channel: "pstn" as const,
      started_at: "2026-04-18T09:28:00Z",
      duration_ms: 49000,
      current_intent: "Opening hours",
      cost_cents: 5,
      latency_ms: 880,
      tools: ["get_hours"],
    },
    {
      id: "cl_01JXYZC",
      tenant_id: TENANT_ID,
      tenant_name: TENANT_NAME,
      agent_id: "agent_004",
      agent_name: "booking_assistant_2",
      agent_version: "3",
      state: "supervised" as const,
      direction: "inbound" as const,
      caller_number: "+1 646 \u2022\u2022\u2022 1100",
      caller_name: "Jordan M.",
      callee_number: "+12065550105",
      channel: "pstn" as const,
      started_at: "2026-04-18T09:10:00Z",
      duration_ms: 292000,
      current_intent: "Missing booking confirmation",
      cost_cents: 41,
      latency_ms: 1320,
      tools: ["lookup_booking", "lookup_payment"],
    },
    {
      id: "cl_01JXYZD",
      tenant_id: TENANT_ID,
      tenant_name: TENANT_NAME,
      agent_id: "agent_005",
      agent_name: "blank",
      agent_version: "1",
      state: "ringing" as const,
      direction: "outbound" as const,
      caller_number: "+1 312 \u2022\u2022\u2022 0904",
      caller_name: null,
      callee_number: "+6281230002001",
      channel: "pstn" as const,
      started_at: "2026-04-18T09:31:00Z",
      duration_ms: 13000,
      current_intent: null,
      cost_cents: 0,
      latency_ms: null,
      tools: [],
    },
    {
      id: "cl_01JXYZE",
      tenant_id: "ten_01JTCLINIC000002",
      tenant_name: "Acme Foods",
      agent_id: "agent_006",
      agent_name: "order_status",
      agent_version: "2",
      state: "in_progress" as const,
      direction: "inbound" as const,
      caller_number: "+1 303 \u2022\u2022\u2022 8812",
      caller_name: null,
      callee_number: "+12065550110",
      channel: "pstn" as const,
      started_at: "2026-04-18T09:25:00Z",
      duration_ms: 68000,
      current_intent: "Order status",
      cost_cents: 8,
      latency_ms: 920,
      tools: [],
    },
    {
      id: "cl_01JXYZF",
      tenant_id: "ten_01JTTERRA000003",
      tenant_name: "Vista Health",
      agent_id: "agent_007",
      agent_name: "nurse_triage",
      agent_version: "5",
      state: "in_progress" as const,
      direction: "inbound" as const,
      caller_number: "+1 508 \u2022\u2022\u2022 2290",
      caller_name: null,
      callee_number: "+12065550120",
      channel: "pstn" as const,
      started_at: "2026-04-18T09:18:00Z",
      duration_ms: 204000,
      current_intent: "Pediatric fever triage",
      cost_cents: 22,
      latency_ms: 1050,
      tools: [],
    },
  ],
};

export const adminCallHistory = {
  calls: [
    {
      id: "ch_001", tenant_id: TENANT_ID, tenant_name: TENANT_NAME, agent_name: "booking_assistant", state: "ended" as const, end_reason: "completed" as const, direction: "inbound" as const,
      caller_number: "+1 415 \u2022\u2022\u2022 9921", caller_name: "Daniela F.", callee_number: "+12065550105", channel: "pstn" as const,
      started_at: "2026-04-18T09:42:00Z", ended_at: "2026-04-18T09:46:51Z", duration_ms: 291000, cost_cents: 18,
      current_intent: "Modified reservation time", tools: ["lookup_booking", "modify_booking"], supervised_by: null,
    },
    {
      id: "ch_002", tenant_id: TENANT_ID, tenant_name: TENANT_NAME, agent_name: "hanif_assistant", state: "ended" as const, end_reason: "caller_hangup" as const, direction: "inbound" as const,
      caller_number: "+44 20 \u2022\u2022\u2022\u2022 4480", caller_name: "Tom P.", callee_number: "+12065550105", channel: "pstn" as const,
      started_at: "2026-04-18T09:21:00Z", ended_at: "2026-04-18T09:22:27Z", duration_ms: 87000, cost_cents: 4,
      current_intent: "Hours inquiry, hung up early", tools: ["get_hours"], supervised_by: null,
    },
    {
      id: "ch_003", tenant_id: TENANT_ID, tenant_name: TENANT_NAME, agent_name: "booking_assistant_2", state: "ended" as const, end_reason: "supervisor_end" as const, direction: "inbound" as const,
      caller_number: "+1 646 \u2022\u2022\u2022 1100", caller_name: "Jordan M.", callee_number: "+12065550105", channel: "pstn" as const,
      started_at: "2026-04-18T08:58:00Z", ended_at: "2026-04-18T09:04:52Z", duration_ms: 412000, cost_cents: 52,
      current_intent: "Missing confirmation \u2014 escalated", tools: ["lookup_booking", "lookup_payment", "issue_refund"], supervised_by: "hanif@manibo.com",
    },
    {
      id: "ch_004", tenant_id: TENANT_ID, tenant_name: TENANT_NAME, agent_name: "booking_assistant", state: "ended" as const, end_reason: "completed" as const, direction: "inbound" as const,
      caller_number: "+1 415 \u2022\u2022\u2022 7781", caller_name: "Chris L.", callee_number: "+12065550105", channel: "pstn" as const,
      started_at: "2026-04-18T08:30:00Z", ended_at: "2026-04-18T08:32:56Z", duration_ms: 176000, cost_cents: 11,
      current_intent: "New booking, party of 4", tools: ["check_availability", "create_booking"], supervised_by: null,
    },
    {
      id: "ch_005", tenant_id: TENANT_ID, tenant_name: TENANT_NAME, agent_name: "hanif_assistant", state: "ended" as const, end_reason: "error" as const, direction: "inbound" as const,
      caller_number: "+33 1 \u2022\u2022\u2022 2204", caller_name: "Am\u00e9lie D.", callee_number: "+12065550105", channel: "pstn" as const,
      started_at: "2026-04-18T08:12:00Z", ended_at: "2026-04-18T08:12:22Z", duration_ms: 22000, cost_cents: 1,
      current_intent: "ASR failure, call dropped", tools: [], supervised_by: null,
    },
    {
      id: "ch_006", tenant_id: TENANT_ID, tenant_name: TENANT_NAME, agent_name: "booking_assistant", state: "ended" as const, end_reason: "completed" as const, direction: "inbound" as const,
      caller_number: "+1 212 \u2022\u2022\u2022 0088", caller_name: "Rita V.", callee_number: "+12065550105", channel: "pstn" as const,
      started_at: "2026-04-18T07:49:00Z", ended_at: "2026-04-18T07:52:53Z", duration_ms: 233000, cost_cents: 14,
      current_intent: "Cancellation + rebook", tools: ["lookup_booking", "cancel_booking", "create_booking"], supervised_by: null,
    },
    {
      id: "ch_007", tenant_id: TENANT_ID, tenant_name: TENANT_NAME, agent_name: "booking_assistant_2", state: "ended" as const, end_reason: "agent_hangup" as const, direction: "inbound" as const,
      caller_number: "+1 718 \u2022\u2022\u2022 3340", caller_name: "Marco B.", callee_number: "+12065550105", channel: "pstn" as const,
      started_at: "2026-04-18T07:22:00Z", ended_at: "2026-04-18T07:24:24Z", duration_ms: 144000, cost_cents: 7,
      current_intent: "Dietary request", tools: [], supervised_by: null,
    },
  ],
  total: 7,
};

export const adminCallReplay = {
  call: {
    id: "call_adm_hist_002",
    tenant_id: TENANT_ID,
    tenant_name: TENANT_NAME,
    agent_id: "agent_002",
    agent_name: "Clinic Booking Assistant",
    agent_version: "3",
    state: "ended" as const,
    end_reason: "caller_hangup" as const,
    direction: "inbound" as const,
    caller_number: "+6281230001009",
    callee_number: "+12065550105",
    channel: "pstn" as const,
    started_at: "2026-04-16T02:42:00Z",
    ended_at: "2026-04-16T02:51:45Z",
    duration_ms: 585000,
    cost_cents: 38,
    recording_uri: "s3://recordings/call_adm_hist_002.opus",
  },
  transcript: [
    { id: "tt_001", seq: 1, role: "agent" as const, started_at_ms: 0, ended_at_ms: 2200, text: "Halo, terima kasih sudah menelepon. Ada yang bisa saya bantu?", confidence: 0.95, language: "id-ID" },
    { id: "tt_002", seq: 2, role: "caller" as const, started_at_ms: 3000, ended_at_ms: 7100, text: "Saya mau ubah jadwal kontrol saya ke hari Jumat sore kalau masih ada slot.", confidence: 0.91, language: "id-ID" },
    { id: "tt_003", seq: 3, role: "agent" as const, started_at_ms: 8000, ended_at_ms: 11500, text: "Tentu, saya cek slot yang tersedia untuk hari Jumat sore ya.", confidence: 0.97, language: "id-ID" },
    { id: "tt_004", seq: 4, role: "agent" as const, started_at_ms: 15000, ended_at_ms: 20200, text: "Maaf, saya kesulitan mencari jadwal saat ini. Saya coba sekali lagi.", confidence: 0.93, language: "id-ID" },
    { id: "tt_005", seq: 5, role: "agent" as const, started_at_ms: 38000, ended_at_ms: 45000, text: "Mohon maaf, sepertinya sistem penjadwalan sedang lambat. Saya sambungkan ke petugas klinik ya.", confidence: 0.96, language: "id-ID" },
    { id: "tt_006", seq: 6, role: "caller" as const, started_at_ms: 46000, ended_at_ms: 48500, text: "Ya sudah, terima kasih.", confidence: 0.94, language: "id-ID" },
    { id: "tt_007", seq: 7, role: "agent" as const, started_at_ms: 49000, ended_at_ms: 53000, text: "Sama-sama. Sebentar ya, saya sambungkan sekarang.", confidence: 0.97, language: "id-ID" },
  ],
  events: [
    { id: "ev_001", at_ms: 0, kind: "state_change" as const, severity: "info" as const, payload: { from: null, to: "in_progress" }, label: "Call started" },
    { id: "ev_002", at_ms: 11500, kind: "model_invocation" as const, severity: "info" as const, payload: { model: "gpt-4o", tokens: 820, latency_ms: 980 }, label: "LLM invocation" },
    { id: "ev_003", at_ms: 12500, kind: "asr_event" as const, severity: "info" as const, payload: { provider: "deepgram", latency_ms: 320 }, label: "ASR transcription" },
    { id: "ev_004", at_ms: 15000, kind: "state_change" as const, severity: "warning" as const, payload: { detail: "Schedule connector lookup timeout (2.1s)" }, label: "Tool timeout" },
    { id: "ev_005", at_ms: 36000, kind: "state_change" as const, severity: "warning" as const, payload: { detail: "Second lookup attempt timeout (2.4s)" }, label: "Tool retry timeout" },
    { id: "ev_006", at_ms: 50000, kind: "handoff" as const, severity: "info" as const, payload: { queue: "clinic-front-desk", reason: "Schedule connector unreachable" }, label: "Escalated to human" },
    { id: "ev_007", at_ms: 585000, kind: "state_change" as const, severity: "info" as const, payload: { from: "in_progress", to: "ended", end_reason: "caller_hangup" }, label: "Call ended" },
  ],
  tool_executions: [
    { id: "te_001", turn_id: "tt_003", tool_name: "lookup_slots", tool_version: "1.2", started_at_ms: 11500, ended_at_ms: 12480, status: "ok" as const, arguments: { specialty: "dermatology", date: "2026-04-18" }, result: { slots: ["10:00", "14:00", "16:00"] }, latency_ms: 980 },
    { id: "te_002", turn_id: "tt_004", tool_name: "lookup_slots", tool_version: "1.2", started_at_ms: 15000, ended_at_ms: 17100, status: "timeout" as const, arguments: { specialty: "dermatology", date: "2026-04-18", confirm: true }, result: null, error: { code: "TIMEOUT", message: "Connector timeout after 2100ms" }, latency_ms: 2100 },
    { id: "te_003", turn_id: "tt_004", tool_name: "lookup_slots", tool_version: "1.2", started_at_ms: 36000, ended_at_ms: 38400, status: "timeout" as const, arguments: { specialty: "dermatology", date: "2026-04-18", confirm: true }, result: null, error: { code: "TIMEOUT", message: "Connector timeout after 2400ms" }, latency_ms: 2400 },
    { id: "te_004", turn_id: "tt_005", tool_name: "transfer_to_human", tool_version: "1.0", started_at_ms: 50000, ended_at_ms: 51200, status: "ok" as const, arguments: { queue: "clinic-front-desk", reason: "Schedule connector unreachable" }, result: { transferred: true }, latency_ms: 1200 },
  ],
  recording: {
    id: "rec_adm_001",
    codec: "opus" as const,
    sample_rate: 16000,
    channels: 2,
    duration_ms: 585000,
    bytes: 468000,
    waveform_peaks_uri: null,
  },
};

export const adminObservabilityRuns = {
  runs: [
    OBS_RUN_CALL_ACTIVE,
    OBS_RUN_INCIDENT,
    OBS_RUN_CALL_SESSION,
    OBS_RUN_CALL_HEALTHY,
    OBS_RUN_WORKFLOW,
    OBS_RUN_CALL_ESCALATED,
    OBS_RUN_WORKFLOW_HEALTHY,
    OBS_RUN_CALL_FAILED,
    OBS_RUN_CHANNEL_RUNTIME,
    OBS_RUN_LEAD_CAPTURE,
  ],
  facets: OBS_FACETS,
};

export const adminObservabilityCompare = observabilityCompare;

/* ---------------------------------------------------------------- */
/*  Channel runtimes / control plane incidents (minimal stubs)        */
/* ---------------------------------------------------------------- */

export const observabilityChannelRuntimes = {
  runtimes: [],
};

export const emptyTimeline = {
  summary: OBS_RUN_CALL_SESSION,
  availability: COMMON_AVAILABILITY,
  items: [],
  next_cursor: null,
  returned: 0,
  total_items: 0,
};
