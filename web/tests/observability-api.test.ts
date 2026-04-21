import { afterEach, describe, expect, it, vi } from "vitest";

import {
  compareAdminObservabilityRuns,
  encodeWorkflowRunPath,
  getAdminObservabilityChannelRuntimeWidgetDetail,
  getAdminObservabilityChannelRuntimeWidgetTimeline,
  getAdminObservabilityRunDetail,
  getAdminObservabilityChannelRuntimeDetail,
  getAdminObservabilityInteractiveChannelTimeline,
  getAdminObservabilityCallDetail,
  getAdminObservabilityControlPlaneIncidentTimeline,
  getAdminObservabilityTenantCompositionDetail,
  getAdminObservabilityWorkflowTimeline,
  getObservabilityChannelRuntimeWidgetDetail,
  getObservabilityChannelRuntimeWidgetTimeline,
  getObservabilityInteractiveChannelDetail,
  getObservabilityRunDetail,
  getObservabilityWorkflowDetail,
  getObservabilityRecordingSignedUrl,
  listAdminObservabilityChannelRuntimeWidgets,
  listAdminObservabilityRuns,
  listObservabilityChannelRuntimeWidgets,
  listObservabilityRuns,
} from "@/lib/api/observability";

const originalFetch = global.fetch;

function mockJsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("observability api client", () => {
  it("lists tenant observability runs with parity filters", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ runs: [], facets: {} })) as typeof fetch;

    await listObservabilityRuns({
      kind: "call_session",
      status: "Completed",
      query: "driver",
      limit: 25,
      solution: "appointment_booking",
      assistant: "Reminder assistant",
      error_only: true,
      recordings_only: true,
      recording_unavailable_only: true,
      needs_review_only: true,
      min_duration_ms: 60000,
      start: "2026-03-01T00:00:00.000Z",
      end: "2026-03-07T23:59:59.999Z",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/observability/runs?kind=call_session&status=Completed&query=driver&limit=25&solution=appointment_booking&assistant=Reminder+assistant&error_only=true&recordings_only=true&recording_unavailable_only=true&needs_review_only=true&min_duration_ms=60000&start=2026-03-01T00%3A00%3A00.000Z&end=2026-03-07T23%3A59%3A59.999Z",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads tenant observability workflow detail with path routing", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          kind: "workflow_run",
          subject_id: "sol.appointment_booking/send-reminder/run-1",
          title: "Reminder workflow",
          subtitle: "sol.appointment_booking/send-reminder",
          status: "Failed",
          started_at: null,
          ended_at: null,
          duration_ms: null,
          call_id: null,
          workflow_id: "sol.appointment_booking/send-reminder",
          run_id: "run-1",
          tenant_id: null,
          tenant_name: null,
          solution_name: null,
          assistant_name: null,
          trace_available: false,
          recording_available: false,
          warning_count: 0,
          error_count: 1,
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: true,
        },
        metrics: [],
        summary_insights: [],
        recommended_actions: [],
        integrity_gaps: [],
        recordings: [],
        context_fields: [],
        trace_context: {},
        transcript_text: null,
        related_entities: [],
      }),
    ) as typeof fetch;

    await getObservabilityWorkflowDetail("sol.appointment_booking/send-reminder", "run-1");

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/platform/observability/runs/workflow_run/${encodeWorkflowRunPath("sol.appointment_booking/send-reminder", "run-1")}`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lists admin observability runs with tenant filter", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ runs: [], facets: {} })) as typeof fetch;

    await listAdminObservabilityRuns({
      tenant_id: "tenant-1",
      kind: "workflow_run",
      limit: 40,
      include_non_production: true,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/observability/runs?tenant_id=tenant-1&kind=workflow_run&limit=40&include_non_production=true",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads admin call-session detail with tenant scoping", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          kind: "call_session",
          subject_id: "call-1",
          title: "Caller",
          subtitle: null,
          status: "Completed",
          started_at: null,
          ended_at: null,
          duration_ms: null,
          call_id: "call-1",
          workflow_id: null,
          run_id: null,
          tenant_id: "tenant-1",
          tenant_name: "Clinic A",
          solution_name: null,
          assistant_name: null,
          trace_available: true,
          recording_available: true,
          warning_count: 0,
          error_count: 0,
        },
        availability: {
          recording_unavailable: false,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: false,
        },
        metrics: [],
        summary_insights: [],
        recommended_actions: [
          {
            key: "review_phone_routing",
            label: "Review channels",
            detail: "Confirm the line points to the intended published assistant before callers hit this route.",
            href: "/admin/channels?tenant_id=tenant-1",
            cta_label: "Open channels",
            severity: "warning",
          },
        ],
        integrity_gaps: [],
        recordings: [],
        context_fields: [],
        trace_context: {},
        transcript_text: null,
        related_entities: [],
      }),
    ) as typeof fetch;

    await getAdminObservabilityCallDetail("tenant-1", "call-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/observability/runs/call_session/call-1?tenant_id=tenant-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads tenant generic run detail via query contract", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          kind: "workflow_run",
          subject_id: "run-1",
          title: "Reminder workflow",
          subtitle: null,
          status: "Completed",
          started_at: null,
          ended_at: null,
          duration_ms: null,
          call_id: null,
          workflow_id: "sol.appointment_booking/send-reminder",
          run_id: "run-1",
          channel_session_id: null,
          conversation_id: null,
          correlation_id: null,
          composition_version: null,
          artifact_hash: null,
          tenant_id: null,
          tenant_name: null,
          solution_name: null,
          assistant_name: null,
          trace_available: false,
          recording_available: false,
          warning_count: 0,
          error_count: 0,
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: true,
        },
        metrics: [],
        summary_insights: [],
        recommended_actions: [],
        integrity_gaps: [],
        recordings: [],
        context_fields: [],
        trace_context: {},
        transcript_text: null,
        related_entities: [],
      }),
    ) as typeof fetch;

    await getObservabilityRunDetail({
      kind: "workflow_run",
      workflow_id: "sol.appointment_booking/send-reminder",
      run_id: "run-1",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/observability/run-detail?kind=workflow_run&workflow_id=sol.appointment_booking%2Fsend-reminder&run_id=run-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("preserves typed solution enrichers on the shared run detail response", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          kind: "call_session",
          subject_id: "call-1",
          title: "Driver Anna",
          subtitle: null,
          status: "Completed",
          started_at: null,
          ended_at: null,
          duration_ms: null,
          call_id: "call-1",
          workflow_id: null,
          run_id: null,
          channel_session_id: null,
          conversation_id: null,
          correlation_id: null,
          composition_version: null,
          artifact_hash: null,
          tenant_id: null,
          tenant_name: null,
          solution_name: "appointment_booking",
          assistant_name: "Anna voice",
          trace_available: true,
          recording_available: true,
          warning_count: 1,
          error_count: 0,
        },
        availability: {
          recording_unavailable: false,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: false,
        },
        metrics: [],
        summary_insights: [],
        recommended_actions: [],
        integrity_gaps: [],
        recordings: [],
        context_fields: [],
        trace_context: {},
        transcript_text: null,
        related_entities: [],
        solution_enrichers: [
          {
            solution_name: "appointment_booking",
            label: "Appointment booking",
            case_detail_fields: [
              {
                key: "booking_status",
                label: "Booking status",
                value: "Handed Off",
                severity: "warning",
                href: null,
              },
            ],
            evidence_items: [
              {
                key: "booking_extraction",
                label: "Clinic booking extraction",
                detail: "Caller requested a cardiology follow-up.",
                severity: "info",
                occurred_at: "2026-03-10T08:10:04Z",
                href: null,
              },
            ],
            timeline_decorators: [
              {
                key: "follow_up_opened",
                label: "Clinic follow-up opened",
                detail: "Staff follow-up case was created.",
                severity: "warning",
                occurred_at: "2026-03-10T08:10:05Z",
              },
            ],
            related_actions: [
              {
                key: "open_booking_case",
                label: "Open clinic case",
                detail: "Review the clinic queue.",
                href: "/bookings?call_id=call-1#clinic-selected-case",
                cta_label: "Open clinic case",
                severity: "warning",
              },
            ],
          },
        ],
      }),
    ) as typeof fetch;

    const detail = await getObservabilityRunDetail({
      kind: "call_session",
      call_id: "call-1",
    });

    expect(detail.solution_enrichers[0]).toMatchObject({
      solution_name: "appointment_booking",
      label: "Appointment booking",
    });
    expect(detail.solution_enrichers[0]?.case_detail_fields[0]?.label).toBe("Booking status");
    expect(detail.solution_enrichers[0]?.evidence_items[0]?.label).toBe("Clinic booking extraction");
    expect(detail.solution_enrichers[0]?.timeline_decorators[0]?.label).toBe("Clinic follow-up opened");
    expect(detail.solution_enrichers[0]?.related_actions[0]?.href).toBe(
      "/bookings?call_id=call-1#clinic-selected-case",
    );
  });

  it("loads admin generic run detail via query contract", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          kind: "control_plane_incident",
          subject_id: "incident-1",
          title: "Publish incident",
          subtitle: null,
          status: "Open",
          started_at: null,
          ended_at: null,
          duration_ms: null,
          call_id: null,
          workflow_id: null,
          run_id: null,
          channel_session_id: null,
          conversation_id: null,
          correlation_id: null,
          composition_version: null,
          artifact_hash: null,
          tenant_id: "tenant-1",
          tenant_name: "Clinic A",
          solution_name: null,
          assistant_name: null,
          trace_available: false,
          recording_available: false,
          warning_count: 1,
          error_count: 0,
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: true,
        },
        metrics: [],
        summary_insights: [],
        recommended_actions: [],
        integrity_gaps: [],
        recordings: [],
        context_fields: [],
        trace_context: {},
        transcript_text: null,
        related_entities: [],
      }),
    ) as typeof fetch;

    await getAdminObservabilityRunDetail({
      tenant_id: "tenant-1",
      kind: "control_plane_incident",
      subject_id: "incident-1",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/observability/run-detail?tenant_id=tenant-1&kind=control_plane_incident&subject_id=incident-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads admin workflow timeline with cursor pagination", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          kind: "workflow_run",
          subject_id: "sol.appointment_booking/send-reminder/run-1",
          title: "Reminder workflow",
          subtitle: null,
          status: "Failed",
          started_at: null,
          ended_at: null,
          duration_ms: null,
          call_id: null,
          workflow_id: "sol.appointment_booking/send-reminder",
          run_id: "run-1",
          tenant_id: "tenant-1",
          tenant_name: "Clinic A",
          solution_name: null,
          assistant_name: null,
          trace_available: false,
          recording_available: false,
          warning_count: 0,
          error_count: 1,
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: true,
          logs_unavailable: false,
          trace_unavailable: true,
        },
        items: [],
        next_cursor: "40",
        returned: 40,
        total_items: 120,
      }),
    ) as typeof fetch;

    await getAdminObservabilityWorkflowTimeline("tenant-1", "sol.appointment_booking/send-reminder", "run-1", {
      cursor: "40",
      limit: 40,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/platform/admin/observability/runs/workflow_run/${encodeWorkflowRunPath("sol.appointment_booking/send-reminder", "run-1")}/timeline?tenant_id=tenant-1&cursor=40&limit=40`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads tenant interactive channel detail with the normalized route", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          kind: "interactive_channel_session",
          title: "Website chat",
          subtitle: "web chat · waiting",
          status: "Awaiting reply",
          started_at: null,
          ended_at: null,
          duration_ms: null,
          call_id: null,
          workflow_id: null,
          run_id: null,
          channel_session_id: "guest-1",
          conversation_id: "conv-1",
          correlation_id: "00-11111111111111111111111111111111-2222222222222222-01",
          composition_version: "comp-web-v2",
          artifact_hash: "artifact-web-v2",
          tenant_id: null,
          tenant_name: null,
          solution_name: null,
          assistant_name: null,
          trace_available: true,
          recording_available: false,
          warning_count: 0,
          error_count: 0,
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: false,
        },
        metrics: [],
        recordings: [],
        context_fields: [],
        trace_context: {},
        transcript_text: null,
        related_entities: [],
      }),
    ) as typeof fetch;

    await getObservabilityInteractiveChannelDetail("guest-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/observability/runs/interactive_channel_session/guest-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads admin interactive channel timeline with tenant scoping", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          kind: "interactive_channel_session",
          title: "Website chat",
          subtitle: null,
          status: "Escalated",
          started_at: null,
          ended_at: null,
          duration_ms: null,
          call_id: null,
          workflow_id: null,
          run_id: null,
          channel_session_id: "guest-1",
          conversation_id: "conv-1",
          correlation_id: "corr-1",
          composition_version: "comp-web-v2",
          artifact_hash: "artifact-web-v2",
          tenant_id: "tenant-1",
          tenant_name: "Clinic A",
          solution_name: null,
          assistant_name: null,
          trace_available: true,
          recording_available: false,
          warning_count: 1,
          error_count: 0,
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: false,
        },
        items: [],
        next_cursor: null,
        returned: 0,
        total_items: 0,
      }),
    ) as typeof fetch;

    await getAdminObservabilityInteractiveChannelTimeline("tenant-1", "guest-1", {
      cursor: "40",
      limit: 40,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/observability/runs/interactive_channel_session/guest-1/timeline?tenant_id=tenant-1&cursor=40&limit=40",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads admin comparison payload", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        kind: "workflow_run",
        left: {},
        right: {},
        duration_delta_ms: 12000,
        warning_delta: 0,
        error_delta: 1,
        metric_deltas: [],
        tool_usage: { shared: [], left_only: [], right_only: [] },
      }),
    ) as typeof fetch;

    await compareAdminObservabilityRuns({
      tenant_id: "tenant-1",
      kind: "workflow_run",
      left: "sol.appointment_booking/send-reminder/run-1",
      right: "sol.appointment_booking/send-reminder/run-2",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/observability/runs/compare?tenant_id=tenant-1&kind=workflow_run&left=sol.appointment_booking%2Fsend-reminder%2Frun-1&right=sol.appointment_booking%2Fsend-reminder%2Frun-2",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads admin control-plane incident timeline", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          kind: "control_plane_incident",
          subject_id: "incident-1",
          title: "Routing command stalled",
          subtitle: null,
          status: "Investigating",
          started_at: null,
          ended_at: null,
          duration_ms: null,
          call_id: null,
          workflow_id: null,
          run_id: null,
          tenant_id: "tenant-1",
          tenant_name: "Clinic A",
          solution_name: null,
          assistant_name: null,
          trace_available: true,
          recording_available: false,
          warning_count: 1,
          error_count: 0,
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: false,
        },
        items: [],
        next_cursor: null,
        returned: 0,
        total_items: 0,
      }),
    ) as typeof fetch;

    await getAdminObservabilityControlPlaneIncidentTimeline("tenant-1", "incident-1", { limit: 40 });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/observability/runs/control_plane_incident/incident-1/timeline?tenant_id=tenant-1&limit=40",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads admin channel-runtime detail", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          kind: "channel_runtime",
          subject_id: "runtime-1",
          title: "Main inbound line",
          subtitle: null,
          status: "Needs setup",
          started_at: null,
          ended_at: null,
          duration_ms: null,
          call_id: null,
          workflow_id: null,
          run_id: null,
          tenant_id: "tenant-1",
          tenant_name: "Clinic A",
          solution_name: "voice",
          assistant_name: "Front desk",
          trace_available: false,
          recording_available: false,
          warning_count: 1,
          error_count: 0,
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: true,
        },
        metrics: [],
        summary_insights: [],
        recommended_actions: [
          {
            key: "finish_rollout",
            label: "Finish the rollout",
            detail: "The tenant is still pinned to an older release than the one it is meant to run.",
            href: "/admin/releases?tenant_id=tenant-1",
            cta_label: "Open releases",
            severity: "warning",
          },
        ],
        integrity_gaps: [],
        recordings: [],
        context_fields: [],
        trace_context: {},
        transcript_text: null,
        related_entities: [],
      }),
    ) as typeof fetch;

    await getAdminObservabilityChannelRuntimeDetail("tenant-1", "runtime-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/observability/runs/channel_runtime/runtime-1?tenant_id=tenant-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lists tenant widget channel runtimes", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ runtimes: [] })) as typeof fetch;

    await listObservabilityChannelRuntimeWidgets({ status: "Ready", limit: 25 });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/observability/channel-runtimes?status=Ready&limit=25",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("lists admin widget channel runtimes", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ runtimes: [] })) as typeof fetch;

    await listAdminObservabilityChannelRuntimeWidgets({
      tenant_id: "tenant-1",
      query: "widget-runtime",
      status: "Degraded",
      limit: 10,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/observability/channel-runtimes?tenant_id=tenant-1&query=widget-runtime&status=Degraded&limit=10",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads tenant widget channel runtime detail", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          widget_id: "widget-runtime",
          tenant_id: "tenant-1",
          tenant_name: "Clinic A",
          title: "Homepage widget",
          channel_type: "web_chat",
          status: "Degraded",
          auth_state: "blocked_sessions",
          webhook_state: "ready",
          delivery_state: "failed",
          latest_activity_at: "2026-03-15T09:05:00Z",
          correlation_id: "00-11111111111111111111111111111111-2222222222222222-01",
          composition_version: "2026.03.15",
          artifact_hash: "artifact-1",
          session_count: 2,
          active_session_count: 0,
          blocked_session_count: 1,
          expired_session_count: 0,
          captured_submission_count: 1,
          lead_delivered_count: 0,
          delivery_failure_count: 1,
          escalation_count: 1,
          warning_count: 1,
          error_count: 1,
          degraded_reasons: ["blocked_guest_sessions"],
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: false,
        },
        metrics: [],
        summary_insights: [],
        context_fields: [],
        related_entities: [],
      }),
    ) as typeof fetch;

    await getObservabilityChannelRuntimeWidgetDetail("widget-runtime");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/observability/channel-runtimes/widget-runtime",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads admin widget channel runtime detail", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          widget_id: "widget-runtime",
          tenant_id: "tenant-1",
          tenant_name: "Clinic A",
          title: "Homepage widget",
          channel_type: "web_chat",
          status: "Ready",
          auth_state: "ready",
          webhook_state: "ready",
          delivery_state: "idle",
          latest_activity_at: "2026-03-15T09:05:00Z",
          correlation_id: null,
          composition_version: "2026.03.15",
          artifact_hash: "artifact-1",
          session_count: 1,
          active_session_count: 1,
          blocked_session_count: 0,
          expired_session_count: 0,
          captured_submission_count: 0,
          lead_delivered_count: 0,
          delivery_failure_count: 0,
          escalation_count: 0,
          warning_count: 0,
          error_count: 0,
          degraded_reasons: [],
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: true,
        },
        metrics: [],
        summary_insights: [],
        context_fields: [],
        related_entities: [],
      }),
    ) as typeof fetch;

    await getAdminObservabilityChannelRuntimeWidgetDetail("tenant-1", "widget-runtime");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/observability/channel-runtimes/widget-runtime?tenant_id=tenant-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads tenant widget channel runtime timeline", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          widget_id: "widget-runtime",
          tenant_id: "tenant-1",
          tenant_name: "Clinic A",
          title: "Homepage widget",
          channel_type: "web_chat",
          status: "Ready",
          auth_state: "ready",
          webhook_state: "ready",
          delivery_state: "idle",
          latest_activity_at: "2026-03-15T09:05:00Z",
          correlation_id: null,
          composition_version: "2026.03.15",
          artifact_hash: "artifact-1",
          session_count: 1,
          active_session_count: 1,
          blocked_session_count: 0,
          expired_session_count: 0,
          captured_submission_count: 0,
          lead_delivered_count: 0,
          delivery_failure_count: 0,
          escalation_count: 0,
          warning_count: 0,
          error_count: 0,
          degraded_reasons: [],
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: true,
        },
        items: [],
        next_cursor: null,
        returned: 0,
        total_items: 0,
      }),
    ) as typeof fetch;

    await getObservabilityChannelRuntimeWidgetTimeline("widget-runtime", { cursor: "10", limit: 5 });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/observability/channel-runtimes/widget-runtime/timeline?cursor=10&limit=5",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads admin widget channel runtime timeline", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          widget_id: "widget-runtime",
          tenant_id: "tenant-1",
          tenant_name: "Clinic A",
          title: "Homepage widget",
          channel_type: "web_chat",
          status: "Ready",
          auth_state: "ready",
          webhook_state: "ready",
          delivery_state: "idle",
          latest_activity_at: "2026-03-15T09:05:00Z",
          correlation_id: null,
          composition_version: "2026.03.15",
          artifact_hash: "artifact-1",
          session_count: 1,
          active_session_count: 1,
          blocked_session_count: 0,
          expired_session_count: 0,
          captured_submission_count: 0,
          lead_delivered_count: 0,
          delivery_failure_count: 0,
          escalation_count: 0,
          warning_count: 0,
          error_count: 0,
          degraded_reasons: [],
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: true,
        },
        items: [],
        next_cursor: null,
        returned: 0,
        total_items: 0,
      }),
    ) as typeof fetch;

    await getAdminObservabilityChannelRuntimeWidgetTimeline("tenant-1", "widget-runtime", {
      cursor: "5",
      limit: 20,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/observability/channel-runtimes/widget-runtime/timeline?tenant_id=tenant-1&cursor=5&limit=20",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads admin tenant-composition detail", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        summary: {
          kind: "tenant_composition",
          subject_id: "tenant-1",
          title: "Tenant composition",
          subtitle: null,
          status: "Assigned",
          started_at: null,
          ended_at: null,
          duration_ms: null,
          call_id: null,
          workflow_id: null,
          run_id: null,
          tenant_id: "tenant-1",
          tenant_name: "Clinic A",
          solution_name: null,
          assistant_name: null,
          trace_available: false,
          recording_available: false,
          warning_count: 0,
          error_count: 0,
        },
        availability: {
          recording_unavailable: true,
          timeline_partial: false,
          logs_unavailable: false,
          trace_unavailable: true,
        },
        metrics: [],
        summary_insights: [],
        integrity_gaps: [],
        recordings: [],
        context_fields: [],
        trace_context: {},
        transcript_text: null,
        related_entities: [],
      }),
    ) as typeof fetch;

    await getAdminObservabilityTenantCompositionDetail("tenant-1", "tenant-1");

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/observability/runs/tenant_composition/tenant-1?tenant_id=tenant-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads a recording signed url from the supplied observability path", async () => {
    global.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({ url: "https://signed.example/rec-1.ogg", expires_in_seconds: 900 }),
    ) as typeof fetch;

    await getObservabilityRecordingSignedUrl("/admin/recordings/rec-1/signed-url?tenant_id=tenant-1", 900);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/platform/admin/recordings/rec-1/signed-url?tenant_id=tenant-1&expires_in_seconds=900",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
