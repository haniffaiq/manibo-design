import { afterEach, describe, expect, it, vi } from "vitest";
import * as clinicBookingsApi from "../src/api/clinic-bookings";

type AsyncApiFunction = (...args: unknown[]) => Promise<unknown>;

type ClinicBookingsApiModule = {
  assignClinicFollowUp: AsyncApiFunction;
  claimClinicFollowUp: AsyncApiFunction;
  completeClinicAutomationAction: AsyncApiFunction;
  createClinicBrowserSession: AsyncApiFunction;
  failClinicAutomationAction: AsyncApiFunction;
  getAppointmentBookingConfig: AsyncApiFunction;
  getAppointmentBookingConfigSchema: AsyncApiFunction;
  getClinicBookingAutomationStatus: AsyncApiFunction;
  getClinicBookingResult: AsyncApiFunction;
  getClinicIntegrationStatus: AsyncApiFunction;
  getClinicFollowUp: AsyncApiFunction;
  listClinicBookingResults: AsyncApiFunction;
  listClinicFollowUps: AsyncApiFunction;
  resolveClinicFollowUp: AsyncApiFunction;
  updateAppointmentBookingConfig: AsyncApiFunction;
};

const originalFetch = globalThis.fetch;

function mockJsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    statusText: init.statusText,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("clinic bookings api client", () => {
  it("lists booking results with filters", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        results: [],
        total: 0,
        limit: 50,
        offset: 0,
      }),
    ) as typeof fetch;

    await clinicBookingsApi.listClinicBookingResults({ bookingStatus: "pending", phone: "+37061234567" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/booking-results?booking_status=pending&phone=%2B37061234567",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads booking detail", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        call: {
          call_id: "call-1",
          direction: "inbound",
          state: "completed",
          outcome: "confirmed",
          caller_number: "+37061234567",
          callee_number: "+37060000000",
          started_at: "2026-03-06T10:00:00Z",
          ended_at: "2026-03-06T10:05:00Z",
          created_at: "2026-03-06T10:00:00Z",
          updated_at: "2026-03-06T10:05:00Z",
        },
        result: {
          appointment: {},
          patient: {},
          booking_status: "confirmed",
          handoff_reason: null,
        },
        needs_follow_up: false,
      }),
    ) as typeof fetch;

    await clinicBookingsApi.getClinicBookingResult("call-1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/booking-results/call-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads automation status", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        call_id: "call-1",
        booking_status: "confirmed",
        overall_status: "ready_to_run",
        actions: [],
      }),
    ) as typeof fetch;

    await clinicBookingsApi.getClinicBookingAutomationStatus("call-1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/booking-results/call-1/automation-status",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads clinic integration readiness", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        overall_status: "ready",
        integrations: [],
      }),
    ) as typeof fetch;

    await clinicBookingsApi.getClinicIntegrationStatus();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/integration-status",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("creates a browser rehearsal session", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        room_name: "clinic-browser-123",
        participant_identity: "clinic-browser-user-123",
        token: "jwt-token",
        connect_url: "wss://voice.example.com",
        profile: "gemini-3-flash-preview-structured-routing",
        expires_at: "2026-03-12T12:00:00Z",
      }),
    ) as typeof fetch;

    await clinicBookingsApi.createClinicBrowserSession();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/browser-session",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({}),
      }),
    );
  });

  it("loads appointment booking config and schema", async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce(
        mockJsonResponse({
          solution_name: "appointment_booking",
          config: {
            crm_adapter: "clinic_ehr",
            notification_adapter: "telnyx_sms",
            reminder_minutes_before_appointment: 90,
            custom_fields: {},
          },
        }),
      )
      .mockResolvedValueOnce(
        mockJsonResponse({
          solution_name: "appointment_booking",
          title: "Clinic booking settings",
          description: "Controls clinic integrations and reminder timing.",
          fields: [],
        }),
      ) as typeof fetch;

    await clinicBookingsApi.getAppointmentBookingConfig();
    await clinicBookingsApi.getAppointmentBookingConfigSchema();

    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/platform/solutions/appointment_booking/config",
      expect.objectContaining({ method: "GET" }),
    );
    expect(globalThis.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/platform/solutions/appointment_booking/config/schema",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("updates appointment booking config", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        solution_name: "appointment_booking",
        config: {
          crm_adapter: "clinic_ehr",
          notification_adapter: "telnyx_sms",
          reminder_minutes_before_appointment: 45,
          custom_fields: {},
        },
      }),
    ) as typeof fetch;

    await clinicBookingsApi.updateAppointmentBookingConfig({
      crm_adapter: "clinic_ehr",
      notification_adapter: "telnyx_sms",
      reminder_minutes_before_appointment: 45,
      custom_fields: { clinicCode: "vilnius-1" },
      language: "lt",
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/solutions/appointment_booking/config",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          crm_adapter: "clinic_ehr",
          notification_adapter: "telnyx_sms",
          reminder_minutes_before_appointment: 45,
          custom_fields: { clinicCode: "vilnius-1" },
          language: "lt",
        }),
      }),
    );
  });

  it("records a completed automation action", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        call_id: "call-1",
        booking_status: "confirmed",
        overall_status: "attention_required",
        actions: [],
      }),
    ) as typeof fetch;

    await clinicBookingsApi.completeClinicAutomationAction("call-1", "confirmation_sms", {
      status_detail: "Receptionist sent the confirmation text manually.",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/booking-results/call-1/automation-actions/confirmation_sms/complete",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ status_detail: "Receptionist sent the confirmation text manually.", provider_id: undefined }),
      }),
    );
  });

  it("records a failed automation action", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        call_id: "call-1",
        booking_status: "confirmed",
        overall_status: "attention_required",
        actions: [],
      }),
    ) as typeof fetch;

    await clinicBookingsApi.failClinicAutomationAction("call-1", "appointment_reminder", {
      status_detail: "The reminder could not be sent because the phone number was invalid.",
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/booking-results/call-1/automation-actions/appointment_reminder/fail",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          status_detail: "The reminder could not be sent because the phone number was invalid.",
          provider_id: undefined,
        }),
      }),
    );
  });

  it("loads the follow-up queue with filters", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        items: [],
        summary: {
          total: 0,
          urgent: 0,
          normal: 0,
          open: 0,
          claimed: 0,
          resolved: 0,
          handed_off: 0,
          pending: 0,
          failed: 0,
        },
        limit: 50,
        offset: 0,
      }),
    ) as typeof fetch;

    await clinicBookingsApi.listClinicFollowUps({ followUpPriority: "urgent", phone: "+37061234567" });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/follow-ups?follow_up_priority=urgent&phone=%2B37061234567",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("loads follow-up detail", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(
      mockJsonResponse({
        item: {
          call_id: "call-1",
          follow_up_status: "open",
          booking_status: "pending",
          handoff_reason: "complex_scheduling",
          follow_up_priority: "normal",
          follow_up_category: "callback_required",
          recommended_action: "Call back",
          owner_user_id: null,
          owner_display_name: null,
          owner_email: null,
          owner_assigned_at: null,
          resolved_at: null,
          resolved_by_user_id: null,
          resolved_by_display_name: null,
          resolution_note: null,
          specialty: "Cardiology",
          clinic_city: "Vilnius",
          clinic_address: "Gedimino pr. 1",
          appointment_date: "2026-03-10",
          appointment_time: "09:30",
          patient_full_name: "Jonas Jonaitis",
          patient_phone: "+37061234567",
          price_eur: 89,
          state: "completed",
          outcome: "pending",
          caller_number: "+37061234567",
          callee_number: "+37060000000",
          started_at: "2026-03-06T10:00:00Z",
          ended_at: "2026-03-06T10:05:00Z",
          created_at: "2026-03-06T10:00:00Z",
          updated_at: "2026-03-06T10:05:00Z",
        },
      }),
    ) as typeof fetch;

    await clinicBookingsApi.getClinicFollowUp("call-1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/follow-ups/call-1",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("claims a follow-up", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ item: { call_id: "call-1" } })) as typeof fetch;

    await clinicBookingsApi.claimClinicFollowUp("call-1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/follow-ups/call-1/claim",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("assigns a follow-up", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ item: { call_id: "call-1" } })) as typeof fetch;

    await clinicBookingsApi.assignClinicFollowUp("call-1", "user-1");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/follow-ups/call-1/assign",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ user_id: "user-1" }),
      }),
    );
  });

  it("resolves a follow-up", async () => {
    globalThis.fetch = vi.fn().mockResolvedValueOnce(mockJsonResponse({ item: { call_id: "call-1" } })) as typeof fetch;

    await clinicBookingsApi.resolveClinicFollowUp("call-1", "Called back and confirmed");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/platform/clinic/follow-ups/call-1/resolve",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ resolution_note: "Called back and confirmed" }),
      }),
    );
  });
});
