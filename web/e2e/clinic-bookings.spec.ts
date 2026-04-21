import { test, expect } from "./harness";
import { isBuildEnabledSolution } from "./build-solutions";
import { primeSessionCookie } from "./session-helpers";

type ClinicAutomationActionStatus = {
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
  execution_mode: string | null;
  status_detail: string;
  provider_id: string | null;
  recorded_at: string | null;
  recorded_by_user_id: string | null;
  recorded_by_display_name: string | null;
  latest_health_status: "healthy" | "unhealthy" | null;
  latest_health_checked_at: string | null;
  latest_health_error: string | null;
};

type ClinicFollowUpQueueItem = {
  call_id: string;
  follow_up_status: string;
  booking_status: string;
  handoff_reason: string | null;
  follow_up_priority: string;
  follow_up_category: string;
  recommended_action: string | null;
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
};

async function gotoAndWaitForUrl(
  page: import("@playwright/test").Page,
  href: string,
  pattern: RegExp,
): Promise<void> {
  await Promise.all([page.waitForURL(pattern, { timeout: 15000 }), page.goto(href)]);
}

test.describe("clinic bookings", () => {
  test.skip(!isBuildEnabledSolution("appointment_booking"), "Appointment booking route is excluded from this build.");
  test.use({
    allowConsoleErrors: [/502 \(Bad Gateway\)/],
    allowRequestFailures: [/\/api\/platform\/calls\/call-1\/latency$/],
  });
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/platform/calls/call-1/latency", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: "call-1",
          source: "persisted_metadata",
          has_latency_data: false,
          turns: [],
          summaries: {},
          stack: null,
        }),
      });
    });
  });

  test.describe("solution availability lookup failures", () => {
    test.use({
      allowConsoleErrors: [/503 \(Service Unavailable\)/],
      allowRequestFailures: [/\/api\/platform\/solutions/],
    });

    test("shows a retryable load error when workspace visibility cannot be confirmed", async ({ page }) => {
      await primeSessionCookie(page, "client_admin");

      await page.route("**/api/platform/solutions", async (route) => {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Solution visibility is temporarily unavailable." }),
        });
      });

      await page.goto("/bookings");

      await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
      await expect(page.getByText("We could not confirm whether appointment booking is available for this workspace.")).toBeVisible();
      await expect(page.getByText("Solution visibility is temporarily unavailable.")).toBeVisible();
      await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
    });
  });

  test("tenant can review booking outcomes and manage follow-up ownership", async ({ page }) => {
    const callId = "call-1";
    const bookingResultsLog: string[] = [];
    const followUpsLog: string[] = [];
    const followUpActionLog: string[] = [];
    const configUpdateLog: string[] = [];
    const operatorAId = "33333333-3333-3333-3333-333333333333";
    const operatorBId = "44444444-4444-4444-4444-444444444444";
    let clinicConfig = {
      crm_adapter: "clinic_ehr",
      notification_adapter: "telnyx_sms",
      reminder_minutes_before_appointment: 90,
      custom_fields: { clinicCode: "vilnius-1" },
      language: "lt",
    };
    let followUpItem: ClinicFollowUpQueueItem = {
      call_id: callId,
      follow_up_status: "open",
      booking_status: "pending",
      handoff_reason: "complex_scheduling",
      follow_up_priority: "normal",
      follow_up_category: "callback_required",
      recommended_action: "Call the patient back to confirm a time with staff.",
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
    };

    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Clinic booking workspace.",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: "latest",
              active_revision: "2026-03-01",
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/solutions/appointment_booking/config/schema", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solution_name: "appointment_booking",
          title: "Clinic booking settings",
          description: "Controls clinic integrations and reminder timing.",
          fields: [
            {
              name: "crm_adapter",
              label: "Patient system adapter",
              description: "Choose which patient-record adapter receives confirmed bookings.",
              field_type: "choice",
              section: "integrations",
              nullable: true,
              minimum: null,
              maximum: null,
              options: [
                { value: "clinic_ehr", label: "Clinic Ehr" },
                { value: "clinic_webhook", label: "Clinic Webhook" },
              ],
            },
            {
              name: "notification_adapter",
              label: "Notification adapter",
              description: "Choose which messaging provider sends confirmation and reminder messages.",
              field_type: "choice",
              section: "integrations",
              nullable: true,
              minimum: null,
              maximum: null,
              options: [{ value: "telnyx_sms", label: "Telnyx Sms" }],
            },
            {
              name: "reminder_minutes_before_appointment",
              label: "Reminder lead time",
              description: "Choose how many minutes before the appointment reminder texts should be sent.",
              field_type: "integer",
              section: "follow_up",
              nullable: true,
              minimum: 5,
              maximum: 10080,
              options: [],
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/solutions/appointment_booking/config", async (route) => {
      if (route.request().method() === "PUT") {
        clinicConfig = {
          ...clinicConfig,
          ...(JSON.parse(route.request().postData() || "{}") as typeof clinicConfig),
        };
        configUpdateLog.push(JSON.stringify(clinicConfig));
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solution_name: "appointment_booking",
          config: clinicConfig,
        }),
      });
    });

    await page.route("**/api/platform/clinic/integration-status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          overall_status: "ready",
          integrations: [
            {
              integration_id: "patient_record_sync",
              label: "Patient record sync",
              connector_type: "crm",
              channel: null,
              configured_adapter: clinicConfig.crm_adapter,
              connector_id: "connector-1",
              connector_display_name: "Clinic EHR",
              readiness_status: "ready",
              status_detail: "Patient records will sync automatically after confirmed bookings.",
              configured_minutes_before_appointment: null,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T09:59:00Z",
              latest_health_error: null,
            },
            {
              integration_id: "confirmation_sms",
              label: "Confirmation SMS",
              connector_type: "notifications",
              channel: "sms",
              configured_adapter: clinicConfig.notification_adapter,
              connector_id: "connector-2",
              connector_display_name: "SMS gateway",
              readiness_status: "ready",
              status_detail: "Confirmation texts are ready to send automatically.",
              configured_minutes_before_appointment: null,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T09:58:00Z",
              latest_health_error: null,
            },
            {
              integration_id: "appointment_reminder",
              label: "Appointment reminder",
              connector_type: "notifications",
              channel: "sms",
              configured_adapter: clinicConfig.notification_adapter,
              connector_id: "connector-2",
              connector_display_name: "SMS gateway",
              readiness_status: "ready",
              status_detail: `Appointment reminders are ready to schedule ${clinicConfig.reminder_minutes_before_appointment} minutes before the appointment.`,
              configured_minutes_before_appointment: clinicConfig.reminder_minutes_before_appointment,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T09:58:00Z",
              latest_health_error: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/clinic/booking-results**", async (route) => {
      bookingResultsLog.push(new URL(route.request().url()).search);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              call_id: callId,
              booking_status: "pending",
              handoff_reason: "complex_scheduling",
              needs_follow_up: true,
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
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }),
      });
    });

    await page.route("**/api/platform/clinic/follow-ups**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === "GET" && !url.pathname.endsWith(`/${callId}`) && !url.pathname.endsWith("/claim") && !url.pathname.endsWith("/assign") && !url.pathname.endsWith("/resolve")) {
        followUpsLog.push(url.search);
        const status = url.searchParams.get("status");
        const includeResolved = status === "resolved";
        const includeClaimed = status === "claimed";
        const includeOpen = status === "open";
        const shouldInclude =
          followUpItem.follow_up_status === "resolved"
            ? includeResolved
            : status == null
              ? true
              : (followUpItem.follow_up_status === "claimed" && includeClaimed) ||
                (followUpItem.follow_up_status === "open" && includeOpen);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: shouldInclude ? [followUpItem] : [],
            summary: {
              total: followUpItem.follow_up_status === "resolved" ? 0 : 1,
              urgent: 0,
              normal: followUpItem.follow_up_status === "resolved" ? 0 : 1,
              open: followUpItem.follow_up_status === "open" ? 1 : 0,
              claimed: followUpItem.follow_up_status === "claimed" ? 1 : 0,
              resolved: followUpItem.follow_up_status === "resolved" ? 1 : 0,
              handed_off: 0,
              pending: followUpItem.follow_up_status === "resolved" ? 0 : 1,
              failed: 0,
            },
            limit: 50,
            offset: 0,
          }),
        });
        return;
      }

      if (request.method() === "GET" && url.pathname.endsWith(`/${callId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ item: followUpItem }),
        });
        return;
      }

      if (request.method() === "POST" && url.pathname.endsWith("/claim")) {
        followUpActionLog.push("claim");
        followUpItem = {
          ...followUpItem,
          follow_up_status: "claimed",
          owner_user_id: operatorAId,
          owner_display_name: "Operator A",
          owner_email: "operator-a@example.com",
          owner_assigned_at: "2026-03-06T10:06:00Z",
          resolved_at: null,
          resolved_by_user_id: null,
          resolved_by_display_name: null,
          resolution_note: null,
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ item: followUpItem }),
        });
        return;
      }

      if (request.method() === "POST" && url.pathname.endsWith("/assign")) {
        const payload = JSON.parse(request.postData() || "{}") as { user_id?: string };
        followUpActionLog.push(`assign:${payload.user_id ?? ""}`);
        followUpItem = {
          ...followUpItem,
          follow_up_status: "claimed",
          owner_user_id: operatorBId,
          owner_display_name: "Operator B",
          owner_email: "operator-b@example.com",
          owner_assigned_at: "2026-03-06T10:07:00Z",
          resolved_at: null,
          resolved_by_user_id: null,
          resolved_by_display_name: null,
          resolution_note: null,
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ item: followUpItem }),
        });
        return;
      }

      if (request.method() === "POST" && url.pathname.endsWith("/resolve")) {
        const payload = JSON.parse(request.postData() || "{}") as { resolution_note?: string };
        followUpActionLog.push(`resolve:${payload.resolution_note ?? ""}`);
        followUpItem = {
          ...followUpItem,
          follow_up_status: "resolved",
          resolved_at: "2026-03-06T10:08:00Z",
          resolved_by_user_id: operatorBId,
          resolved_by_display_name: "Operator B",
          resolution_note: payload.resolution_note ?? null,
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ item: followUpItem }),
        });
        return;
      }

      await route.fulfill({
        status: 405,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Method not allowed" }),
      });
    });

    await page.route("**/api/platform/team/users", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          users: [
            {
              user_id: operatorAId,
              tenant_id: "22222222-2222-2222-2222-222222222222",
              email: "operator-a@example.com",
              display_name: "Operator A",
              role: "client_operator",
              user_created_at: "2026-03-06T08:00:00Z",
              membership_created_at: "2026-03-06T08:00:00Z",
            },
            {
              user_id: operatorBId,
              tenant_id: "22222222-2222-2222-2222-222222222222",
              email: "operator-b@example.com",
              display_name: "Operator B",
              role: "client_operator",
              user_created_at: "2026-03-06T08:00:00Z",
              membership_created_at: "2026-03-06T08:00:00Z",
            },
          ],
        }),
      });
    });

    await page.route(`**/api/platform/clinic/booking-results/${callId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call: {
            call_id: callId,
            direction: "inbound",
            state: "completed",
            outcome: "pending",
            caller_number: "+37061234567",
            callee_number: "+37060000000",
            started_at: "2026-03-06T10:00:00Z",
            ended_at: "2026-03-06T10:05:00Z",
            created_at: "2026-03-06T10:00:00Z",
            updated_at: "2026-03-06T10:05:00Z",
          },
          result: {
            appointment: {
              specialty: "Cardiology",
              doctor_name: null,
              clinic_city: "Vilnius",
              clinic_address: "Gedimino pr. 1",
              date: "2026-03-10",
              time: "09:30",
              price_eur: 89,
            },
            patient: {
              personal_code: "39901011234",
              full_name: "Jonas Jonaitis",
              phone: "+37061234567",
              email: null,
            },
            booking_status: "pending",
            handoff_reason: "complex_scheduling",
          },
          needs_follow_up: true,
        }),
      });
    });

    await page.route(`**/api/platform/clinic/booking-results/${callId}/automation-status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: callId,
          booking_status: "pending",
          overall_status: "attention_required",
          actions: [
            {
              action_id: "patient_record_sync",
              label: "Update patient record",
              action_type: "system_sync",
              connector_type: "crm",
              channel: null,
              configured_adapter: "clinic_crm",
              connector_id: "connector-1",
              connector_display_name: "Clinic CRM",
              readiness_status: "ready",
              execution_status: "planned",
              execution_mode: null,
              status_detail: "Ready to update the patient record after staff review.",
              provider_id: null,
              recorded_at: null,
              recorded_by_user_id: null,
              recorded_by_display_name: null,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T09:59:00Z",
              latest_health_error: null,
            },
            {
              action_id: "confirmation_sms",
              label: "Send confirmation SMS",
              action_type: "notification",
              connector_type: "notifications",
              channel: "sms",
              configured_adapter: "telnyx_sms",
              connector_id: "connector-2",
              connector_display_name: "SMS gateway",
              readiness_status: "not_configured",
              execution_status: "blocked",
              execution_mode: null,
              status_detail: "Blocked: SMS channel not configured for this tenant.",
              provider_id: null,
              recorded_at: null,
              recorded_by_user_id: null,
              recorded_by_display_name: null,
              latest_health_status: "unhealthy",
              latest_health_checked_at: "2026-03-06T09:58:00Z",
              latest_health_error: "missing sms credentials",
            },
          ],
        }),
      });
    });

    await page.route(`**/api/platform/calls/${callId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call: {
            id: callId,
            direction: "inbound",
            state: "completed",
            outcome: "pending",
            caller_number: "+37061234567",
            callee_number: "+37060000000",
            started_at: "2026-03-06T10:00:00Z",
            ended_at: "2026-03-06T10:05:00Z",
            duration_seconds: 300,
            created_at: "2026-03-06T10:00:00Z",
            updated_at: "2026-03-06T10:05:00Z",
            metadata: { clinic_case: "case-1" },
            quality_score: null,
            needs_human_review: true,
          },
          transcript: {
            language: "lt",
            full_text: "Caller: I need help with a complex visit.\nAssistant: I will hand this to clinic staff.",
          },
          recordings: [],
          has_more: { transcript: false, recordings: false },
        }),
      });
    });

    await page.route(`**/api/platform/calls/${callId}/events?**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: callId,
          events: [
            {
              seq: 1,
              occurred_at_ms: 5000,
              event_type: "call.transcript.segment",
              summary: "Assistant handed the case to staff",
              created_at: "2026-03-06T10:00:05Z",
              payload: {
                speaker: "assistant",
                text: "I will hand this to clinic staff.",
              },
            },
            {
              seq: 2,
              occurred_at_ms: 18000,
              event_type: "call.route.selected",
              summary: "Route changed to staff follow-up",
              created_at: "2026-03-06T10:00:18Z",
              payload: {
                route: "staff_follow_up",
                node_name: "triage",
                next_node_name: "handoff",
              },
            },
          ],
          limit: 200,
          offset: 0,
          total: 2,
        }),
      });
    });

    await page.route(`**/api/platform/calls/${callId}/trace`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: callId,
          has_trace_context: true,
          trace_context: {
            trace_id: "trace-clinic-1",
            correlation_id: "trace-clinic-1",
            traceparent: "00-11111111111111111111111111111111-2222222222222222-01",
          },
          event_count: 2,
          first_event_at_ms: 5000,
          last_event_at_ms: 18000,
          stack: {
            llm: { provider: "openai", model: "gpt-4.1-mini", language: "lt", voice_id: null, voice_name: null },
            stt: { provider: "deepgram", model: "nova-3", language: "lt", voice_id: null, voice_name: null },
            tts: { provider: "telnyx", model: null, language: "lt", voice_id: "voice-1", voice_name: "Mila" },
          },
          routes: [
            {
              seq: 2,
              occurred_at_ms: 18000,
              graph_type: "conversation",
              node_name: "triage",
              route: "staff_follow_up",
              next_node_name: "handoff",
            },
          ],
          nodes: [
            {
              graph_type: "conversation",
              node_name: "triage",
              started_at_ms: 17000,
              completed_at_ms: 18200,
              latency_ms: 1200,
              ttft_ms: 420,
              route: "staff_follow_up",
              next_node_name: "handoff",
              llm_roundtrips: 1,
              retry_count: 0,
              tools_called: ["request_human_handoff"],
              prompt_tokens: 110,
              completion_tokens: 24,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/observability/runs?**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          runs: [
            {
              kind: "call_session",
              title: "Jonas Jonaitis",
              subtitle: "clinic follow-up · completed",
              status: "Completed",
              started_at: "2026-03-06T10:00:00Z",
              ended_at: "2026-03-06T10:05:00Z",
              duration_ms: 300000,
              call_id: callId,
              workflow_id: null,
              run_id: null,
              tenant_id: null,
              tenant_name: null,
              solution_name: "appointment_booking",
              assistant_name: "Clinic booking assistant",
              trace_available: true,
              recording_available: false,
              warning_count: 1,
              error_count: 0,
            },
          ],
          facets: {
            kinds: [{ value: "call_session", label: "call_session", count: 1 }],
            statuses: [{ value: "Completed", label: "Completed", count: 1 }],
            tenants: [],
            solutions: [{ value: "appointment_booking", label: "appointment_booking", count: 1 }],
            assistants: [{ value: "Clinic booking assistant", label: "Clinic booking assistant", count: 1 }],
          },
        }),
      });
    });

    await page.route(`**/api/platform/observability/runs/call_session/${callId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "call_session",
            title: "Jonas Jonaitis",
            subtitle: "clinic follow-up · completed",
            status: "Completed",
            started_at: "2026-03-06T10:00:00Z",
            ended_at: "2026-03-06T10:05:00Z",
            duration_ms: 300000,
            call_id: callId,
            workflow_id: null,
            run_id: null,
            tenant_id: null,
            tenant_name: null,
            solution_name: "appointment_booking",
            assistant_name: "Clinic booking assistant",
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
          metrics: [
            { key: "llm_ttft_ms", label: "AI first token", value: "420 ms", value_ms: 420 },
            { key: "tts_ttfb_ms", label: "Voice playback start", value: "190 ms", value_ms: 190 },
          ],
          summary_insights: [
            {
              key: "trace_shape",
              label: "Runtime path",
              detail: "1 LangGraph node and 1 route decision were recorded for this session.",
              severity: "info",
            },
          ],
          recordings: [],
          context_fields: [
            { key: "assistant_release", label: "Assistant release", value: "v2" },
            { key: "llm", label: "LLM stack", value: "openai · gpt-4.1-mini" },
            { key: "vad", label: "Turn detection", value: "livekit · silero-vad" },
          ],
          trace_context: {
            trace_id: "trace-clinic-1",
            correlation_id: "trace-clinic-1",
            traceparent: "00-11111111111111111111111111111111-2222222222222222-01",
          },
          transcript_text: "caller: I need help with a complex visit.\nassistant: I will hand this to clinic staff.",
          related_entities: [
            { label: "Open call history", href: `/call-ops/history?call_id=${callId}` },
            { label: "Open clinic case", href: `/bookings?call_id=${callId}#clinic-selected-case` },
          ],
        }),
      });
    });

    await page.route(`**/api/platform/observability/runs/call_session/${callId}/timeline**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          summary: {
            kind: "call_session",
            title: "Jonas Jonaitis",
            subtitle: "clinic follow-up · completed",
            status: "Completed",
            started_at: "2026-03-06T10:00:00Z",
            ended_at: "2026-03-06T10:05:00Z",
            duration_ms: 300000,
            call_id: callId,
            workflow_id: null,
            run_id: null,
            tenant_id: null,
            tenant_name: null,
            solution_name: "appointment_booking",
            assistant_name: "Clinic booking assistant",
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
          items: [
            {
              id: "route-1",
              kind: "route",
              severity: "warning",
              occurred_at: "2026-03-06T10:00:18Z",
              occurred_at_ms: 18000,
              label: "Route changed to staff follow-up",
              detail: "The assistant escalated after hearing a complex scheduling request.",
              actor: "system",
              duration_ms: 1200,
              correlation_id: "trace-clinic-1",
              payload: { route: "staff_follow_up" },
            },
          ],
          next_cursor: null,
          returned: 1,
          total_items: 1,
        }),
      });
    });

    await page.goto(`/bookings?call_id=${callId}&source=live-support`);
    await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
    await expect(page.getByTestId("clinic-bookings-context-banner")).toContainText(callId);
    await expect(page.getByTestId("clinic-bookings-back-to-call-ops")).toHaveAttribute("href", "/call-ops");
    await expect(page.getByTestId("clinic-selected-case-next-step")).toContainText("What staff does next");
    await expect(page.getByTestId("clinic-selected-case-next-step")).toContainText("Opened from live support");
    await expect(page.getByTestId("clinic-selected-case-next-step")).toContainText(
      "Carry the live support note into this booking review before you promise a callback or close the case.",
    );
    await expect(page.getByRole("heading", { name: "Staff follow-up queue" })).toBeVisible();
    await expect(page.getByTestId("clinic-integration-overall-status")).toContainText("Ready for live bookings");
    await expect(page.getByTestId("clinic-integration-card-patient_record_sync")).toContainText("Clinic EHR");
    await expect(page.getByTestId("clinic-config-reminder-minutes")).toHaveValue("90");
    await expect(
      page.getByTestId(`clinic-follow-up-row-${callId}`).getByText("Call the patient back to confirm a time with staff."),
    ).toBeVisible();
    await expect(page.getByRole("table").getByText("Jonas Jonaitis", { exact: true })).toBeVisible();
    await expect(page.getByText("Needs human follow-up", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Blocked: SMS channel not configured for this tenant.")).toBeVisible();
    await expect(page.getByText("Current owner: Unassigned")).toBeVisible();
    await expect(page.getByTestId("clinic-bookings-open-call-history")).toBeVisible();
    await expect(page.getByTestId("clinic-bookings-open-observability")).toBeVisible();

    await page.getByTestId("clinic-config-reminder-minutes").fill("60");
    await page.getByTestId("clinic-config-save").click();
    await expect(
      page.getByText("Clinic setup saved. Future bookings will use the updated adapters and reminder timing."),
    ).toBeVisible();
    await expect(page.getByTestId("clinic-integration-card-appointment_reminder")).toContainText(
      "60 minutes before the appointment",
    );

    await page.getByTestId("clinic-bookings-phone").fill("+37061234567");
    await expect.poll(() => bookingResultsLog.some((entry) => entry.includes("phone=%2B37061234567"))).toBe(true);
    await expect.poll(() => followUpsLog.some((entry) => entry.includes("phone=%2B37061234567"))).toBe(true);

    await page.getByTestId("clinic-bookings-status").selectOption("pending");
    await expect.poll(() => bookingResultsLog.some((entry) => entry.includes("booking_status=pending"))).toBe(true);

    await page.getByTestId("clinic-follow-ups-priority").selectOption("normal");
    await expect.poll(() => followUpsLog.some((entry) => entry.includes("follow_up_priority=normal"))).toBe(true);

    await page.getByTestId("clinic-follow-up-claim").click();
    await expect(page.getByText("You now own this follow-up.")).toBeVisible();
    await expect(page.getByText("Current owner: Operator A")).toBeVisible();

    await page.getByTestId("clinic-follow-up-assignee").selectOption(operatorBId);
    await page.getByTestId("clinic-follow-up-assign").click();
    await expect(page.getByText("This follow-up is now assigned to Operator B.")).toBeVisible();
    await expect(page.getByText("Current owner: Operator B")).toBeVisible();

    await page.getByTestId("clinic-follow-up-resolution-note").fill("Called the patient back and confirmed the appointment.");
    await page.getByTestId("clinic-follow-up-resolve").click();
    await expect(page.getByText("This follow-up is marked complete.")).toBeVisible();
    await expect(page.getByText("Completed by: Operator B")).toBeVisible();
    await expect(page.getByText("Staff note: Called the patient back and confirmed the appointment.")).toBeVisible();
    await expect(page.getByText("No clinic calls need staff follow-up for these filters.")).toBeVisible();

    expect(followUpActionLog).toEqual([
      "claim",
      `assign:${operatorBId}`,
      "resolve:Called the patient back and confirmed the appointment.",
    ]);
    expect(configUpdateLog).toEqual([
      JSON.stringify({
        crm_adapter: "clinic_ehr",
        notification_adapter: "telnyx_sms",
        reminder_minutes_before_appointment: 60,
        custom_fields: { clinicCode: "vilnius-1" },
        language: "lt",
      }),
    ]);

    const callHistoryHref = await page.getByTestId("clinic-bookings-open-call-history").getAttribute("href");
    expect(callHistoryHref).toBe(`/call-ops/history?call_id=${callId}`);
    const observabilityHref = await page.getByTestId("clinic-bookings-open-observability").getAttribute("href");
    expect(observabilityHref).toBe(`/observability/sessions/${callId}`);

    await gotoAndWaitForUrl(page, callHistoryHref ?? "", /\/call-ops\/history\?call_id=call-1/);
    await expect(page.getByTestId("call-history-detail")).toBeVisible();
    await expect(page.getByTestId("call-history-session-item-transcript")).toContainText(
      "I will hand this to clinic staff.",
    );

    await gotoAndWaitForUrl(page, observabilityHref ?? "", /\/observability\/sessions\/call-1/);
    await expect(page.getByTestId("observability-detail-context")).toBeVisible();
    await expect(page.getByText("Route changed to staff follow-up", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("assistant: I will hand this to clinic staff.")).toBeVisible();
  });

  test.describe("config refresh fallback", () => {
    test.use({
      allowConsoleErrors: [/503 \(Service Unavailable\)/],
      allowRequestFailures: [/\/api\/platform\/clinic\/integration-status$/],
    });

    test("keeps config save successful when integration status refresh fails after the update", async ({ page }) => {
      const configUpdateLog: string[] = [];
      let integrationStatusRequests = 0;
      let clinicConfig = {
        crm_adapter: "clinic_ehr",
        notification_adapter: "telnyx_sms",
        reminder_minutes_before_appointment: 90,
        custom_fields: { clinicCode: "vilnius-1" },
        language: "lt",
      };

      await primeSessionCookie(page, "client_admin");

      await page.route("**/api/platform/solutions", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            solutions: [
              {
                solution_name: "appointment_booking",
                enabled: true,
                version: "1.0.0",
                description: "Clinic booking workspace.",
                requires_enabled: [],
                optional_enabled: [],
                desired_revision: "latest",
                active_revision: "2026-03-01",
              },
            ],
          }),
        });
      });

      await page.route("**/api/platform/solutions/appointment_booking/config/schema", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            solution_name: "appointment_booking",
            title: "Clinic booking settings",
            description: "Controls clinic integrations and reminder timing.",
            fields: [
              {
                name: "crm_adapter",
                label: "Patient system adapter",
                description: "Choose which patient-record adapter receives confirmed bookings.",
                field_type: "choice",
                section: "integrations",
                nullable: true,
                minimum: null,
                maximum: null,
                options: [{ value: "clinic_ehr", label: "Clinic Ehr" }],
              },
              {
                name: "notification_adapter",
                label: "Notification adapter",
                description: "Choose which messaging provider sends confirmation and reminder messages.",
                field_type: "choice",
                section: "integrations",
                nullable: true,
                minimum: null,
                maximum: null,
                options: [{ value: "telnyx_sms", label: "Telnyx Sms" }],
              },
              {
                name: "reminder_minutes_before_appointment",
                label: "Reminder lead time",
                description: "Choose how many minutes before the appointment reminder texts should be sent.",
                field_type: "integer",
                section: "follow_up",
                nullable: true,
                minimum: 5,
                maximum: 10080,
                options: [],
              },
            ],
          }),
        });
      });

      await page.route("**/api/platform/solutions/appointment_booking/config", async (route) => {
        if (route.request().method() === "PUT") {
          clinicConfig = {
            ...clinicConfig,
            ...(JSON.parse(route.request().postData() || "{}") as typeof clinicConfig),
          };
          configUpdateLog.push(JSON.stringify(clinicConfig));
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            solution_name: "appointment_booking",
            config: clinicConfig,
          }),
        });
      });

      await page.route("**/api/platform/clinic/integration-status", async (route) => {
        integrationStatusRequests += 1;
        if (integrationStatusRequests > 1) {
          await route.fulfill({
            status: 503,
            contentType: "application/json",
            body: JSON.stringify({ detail: "Integration refresh is temporarily unavailable." }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            overall_status: "ready",
            integrations: [
              {
                integration_id: "patient_record_sync",
                label: "Patient record sync",
                connector_type: "crm",
                channel: null,
                configured_adapter: clinicConfig.crm_adapter,
                connector_id: "connector-1",
                connector_display_name: "Clinic EHR",
                readiness_status: "ready",
                status_detail: "Patient records will sync automatically after confirmed bookings.",
                configured_minutes_before_appointment: null,
                latest_health_status: "healthy",
                latest_health_checked_at: "2026-03-06T09:59:00Z",
                latest_health_error: null,
              },
              {
                integration_id: "confirmation_sms",
                label: "Confirmation SMS",
                connector_type: "notifications",
                channel: "sms",
                configured_adapter: clinicConfig.notification_adapter,
                connector_id: "connector-2",
                connector_display_name: "SMS gateway",
                readiness_status: "ready",
                status_detail: "Confirmation texts are ready to send automatically.",
                configured_minutes_before_appointment: null,
                latest_health_status: "healthy",
                latest_health_checked_at: "2026-03-06T09:58:00Z",
                latest_health_error: null,
              },
              {
                integration_id: "appointment_reminder",
                label: "Appointment reminder",
                connector_type: "notifications",
                channel: "sms",
                configured_adapter: clinicConfig.notification_adapter,
                connector_id: "connector-2",
                connector_display_name: "SMS gateway",
                readiness_status: "ready",
                status_detail: `Appointment reminders are ready to schedule ${clinicConfig.reminder_minutes_before_appointment} minutes before the appointment.`,
                configured_minutes_before_appointment: clinicConfig.reminder_minutes_before_appointment,
                latest_health_status: "healthy",
                latest_health_checked_at: "2026-03-06T09:58:00Z",
                latest_health_error: null,
              },
            ],
          }),
        });
      });

      await page.route("**/api/platform/clinic/booking-results**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            results: [],
            total: 0,
            limit: 50,
            offset: 0,
          }),
        });
      });

      await page.route("**/api/platform/clinic/follow-ups**", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
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
        });
      });

      await page.route("**/api/platform/team/users", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ users: [] }),
        });
      });

      await page.goto("/bookings");

      await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
      await expect(page.getByTestId("clinic-config-reminder-minutes")).toHaveValue("90");

      await page.getByTestId("clinic-config-reminder-minutes").fill("45");
      await page.getByTestId("clinic-config-save").click();

      await expect(
        page.getByText(
          /Clinic setup saved\. Future bookings will use the updated adapters and reminder timing\. We could not refresh the latest clinic readiness data yet\. 503 Service Unavailable: Integration refresh is temporarily unavailable\./,
        ),
      ).toBeVisible();
      await expect(page.getByText("503 Service Unavailable: Integration refresh is temporarily unavailable.")).toBeVisible();
      await expect(page.getByText("Current reminder policy:")).toContainText("45 minutes before the appointment");
      await expect(page.getByTestId("clinic-config-save")).toHaveText("Save clinic setup");

      expect(configUpdateLog).toEqual([
        JSON.stringify({
          crm_adapter: "clinic_ehr",
          notification_adapter: "telnyx_sms",
          reminder_minutes_before_appointment: 45,
          custom_fields: { clinicCode: "vilnius-1" },
          language: "lt",
        }),
      ]);
    });
  });

  test("requested call context stays selected even when the current list excludes it", async ({ page }) => {
    const requestedCallId = "call-context";
    const listedCallId = "call-listed";
    const listedFollowUpItem: ClinicFollowUpQueueItem = {
      call_id: listedCallId,
      follow_up_status: "open",
      booking_status: "pending",
      handoff_reason: "complex_scheduling",
      follow_up_priority: "normal",
      follow_up_category: "callback_required",
      recommended_action: "Call the patient back to confirm a time with staff.",
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
    };

    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Clinic booking workspace.",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: "latest",
              active_revision: "2026-03-01",
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/solutions/appointment_booking/config/schema", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solution_name: "appointment_booking",
          title: "Clinic booking settings",
          description: "Controls clinic integrations and reminder timing.",
          fields: [
            {
              name: "crm_adapter",
              label: "Patient system adapter",
              description: "Choose which patient-record adapter receives confirmed bookings.",
              field_type: "choice",
              section: "integrations",
              nullable: true,
              minimum: null,
              maximum: null,
              options: [{ value: "clinic_ehr", label: "Clinic EHR" }],
            },
            {
              name: "notification_adapter",
              label: "Notification adapter",
              description: "Choose which messaging provider sends confirmation and reminder messages.",
              field_type: "choice",
              section: "integrations",
              nullable: true,
              minimum: null,
              maximum: null,
              options: [{ value: "telnyx_sms", label: "Telnyx SMS" }],
            },
            {
              name: "reminder_minutes_before_appointment",
              label: "Reminder lead time",
              description: "Choose how many minutes before the appointment reminder texts should be sent.",
              field_type: "integer",
              section: "follow_up",
              nullable: true,
              minimum: 5,
              maximum: 10080,
              options: [],
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/solutions/appointment_booking/config", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solution_name: "appointment_booking",
          config: {
            crm_adapter: "clinic_ehr",
            notification_adapter: "telnyx_sms",
            reminder_minutes_before_appointment: 90,
            custom_fields: {},
          },
        }),
      });
    });

    await page.route("**/api/platform/clinic/integration-status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          overall_status: "ready",
          integrations: [
            {
              integration_id: "patient_record_sync",
              label: "Patient record sync",
              connector_type: "crm",
              channel: null,
              configured_adapter: "clinic_ehr",
              connector_id: "connector-1",
              connector_display_name: "Clinic EHR",
              readiness_status: "ready",
              status_detail: "Patient records will sync automatically after confirmed bookings.",
              configured_minutes_before_appointment: null,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T09:59:00Z",
              latest_health_error: null,
            },
            {
              integration_id: "confirmation_sms",
              label: "Confirmation SMS",
              connector_type: "notifications",
              channel: "sms",
              configured_adapter: "telnyx_sms",
              connector_id: "connector-2",
              connector_display_name: "SMS gateway",
              readiness_status: "ready",
              status_detail: "Confirmation texts are ready to send automatically.",
              configured_minutes_before_appointment: null,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T09:58:00Z",
              latest_health_error: null,
            },
            {
              integration_id: "appointment_reminder",
              label: "Appointment reminder",
              connector_type: "notifications",
              channel: "sms",
              configured_adapter: "telnyx_sms",
              connector_id: "connector-2",
              connector_display_name: "SMS gateway",
              readiness_status: "ready",
              status_detail: "Appointment reminders are ready to schedule 90 minutes before the appointment.",
              configured_minutes_before_appointment: 90,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T09:58:00Z",
              latest_health_error: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/clinic/booking-results", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              call_id: listedCallId,
              booking_status: "pending",
              handoff_reason: "complex_scheduling",
              needs_follow_up: true,
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
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }),
      });
    });

    await page.route(`**/api/platform/clinic/booking-results/${requestedCallId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call: {
            call_id: requestedCallId,
            direction: "inbound",
            state: "completed",
            outcome: "pending",
            caller_number: "+37069999999",
            callee_number: "+37060000000",
            started_at: "2026-03-06T11:00:00Z",
            ended_at: "2026-03-06T11:04:00Z",
            created_at: "2026-03-06T11:00:00Z",
            updated_at: "2026-03-06T11:04:00Z",
          },
          result: {
            appointment: {
              specialty: "Dermatology",
              doctor_name: null,
              clinic_city: "Kaunas",
              clinic_address: "Laisves al. 10",
              date: "2026-03-12",
              time: "14:30",
              price_eur: 79,
            },
            patient: {
              personal_code: "49901011234",
              full_name: "Ieva Petrauskaite",
              phone: "+37069999999",
              email: null,
            },
            booking_status: "pending",
            handoff_reason: "manual_review",
          },
          needs_follow_up: true,
        }),
      });
    });

    await page.route(`**/api/platform/clinic/booking-results/${requestedCallId}/automation-status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: requestedCallId,
          booking_status: "pending",
          overall_status: "attention_required",
          actions: [
            {
              action_id: "sms_confirmation",
              label: "Confirmation SMS",
              action_type: "notification",
              connector_type: "notifications",
              channel: "sms",
              configured_adapter: "telnyx_sms",
              connector_id: "connector-2",
              connector_display_name: "SMS gateway",
              readiness_status: "ready",
              execution_status: "blocked",
              execution_mode: null,
              status_detail: "Blocked until staff confirms the slot manually.",
              provider_id: null,
              recorded_at: null,
              recorded_by_user_id: null,
              recorded_by_display_name: null,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T09:58:00Z",
              latest_health_error: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/clinic/follow-ups**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (request.method() === "GET" && url.pathname.endsWith(`/${requestedCallId}`)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            item: {
              ...listedFollowUpItem,
              call_id: requestedCallId,
              handoff_reason: "manual_review",
              specialty: "Dermatology",
              clinic_city: "Kaunas",
              clinic_address: "Laisves al. 10",
              appointment_date: "2026-03-12",
              appointment_time: "14:30",
              patient_full_name: "Ieva Petrauskaite",
              patient_phone: "+37069999999",
              price_eur: 79,
              caller_number: "+37069999999",
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          items: [
            {
              ...listedFollowUpItem,
            },
          ],
          summary: {
            total: 1,
            urgent: 0,
            normal: 1,
            open: 1,
            claimed: 0,
            resolved: 0,
            handed_off: 0,
            pending: 1,
            failed: 0,
          },
          limit: 50,
          offset: 0,
        }),
      });
    });

    await page.route("**/api/platform/team/users", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          users: [
            {
              user_id: "33333333-3333-3333-3333-333333333333",
              display_name: "Operator A",
              email: "operator-a@example.com",
              role: "client_operator",
            },
          ],
        }),
      });
    });

    await page.goto(`/bookings?call_id=${requestedCallId}&source=live-support`);

    await expect(page.getByTestId("clinic-bookings-context-banner")).toContainText(requestedCallId);
    await expect(page.getByTestId("clinic-bookings-context-banner")).toContainText(
      "Live support sent this case here",
    );
    await expect(page.getByTestId(`clinic-follow-up-row-${listedCallId}`)).toContainText("Jonas Jonaitis");
    await expect(page.getByText("Ieva Petrauskaite", { exact: true })).toBeVisible();
    await expect(page.getByText("Kaunas", { exact: true })).toBeVisible();
    await expect(page.getByText("Laisves al. 10", { exact: true })).toBeVisible();
    await expect(page.getByText("+37069999999", { exact: true })).toBeVisible();
  });

  test("tenant sees automatic SMS status and can record manual fallback tasks", async ({ page }) => {
    const callId = "call-2";
    const bookingStatus = "confirmed";
    let automationActions: ClinicAutomationActionStatus[] = [
      {
        action_id: "patient_record_sync",
        label: "Update patient record",
        action_type: "system_sync",
        connector_type: "crm",
        channel: null,
        configured_adapter: null,
        connector_id: null,
        connector_display_name: null,
        readiness_status: "not_configured",
        execution_status: "blocked",
        execution_mode: "system",
        status_detail: "Set up the patient system connection before records can sync automatically.",
        provider_id: null,
        recorded_at: null,
        recorded_by_user_id: null,
        recorded_by_display_name: null,
        latest_health_status: null,
        latest_health_checked_at: null,
        latest_health_error: null,
      },
      {
        action_id: "confirmation_sms",
        label: "Send confirmation SMS",
        action_type: "notification",
        connector_type: "notifications",
        channel: "sms",
        configured_adapter: "telnyx_sms",
        connector_id: "connector-2",
        connector_display_name: "SMS gateway",
        readiness_status: "ready",
        execution_status: "completed",
        execution_mode: "system",
        status_detail: "Confirmation SMS sent automatically via Telnyx.",
        provider_id: "telnyx",
        recorded_at: "2026-03-06T11:05:00Z",
        recorded_by_user_id: null,
        recorded_by_display_name: null,
        latest_health_status: "healthy",
        latest_health_checked_at: "2026-03-06T11:05:00Z",
        latest_health_error: null,
      },
      {
        action_id: "appointment_reminder",
        label: "Schedule reminder",
        action_type: "notification",
        connector_type: "notifications",
        channel: "sms",
        configured_adapter: "telnyx_sms",
        connector_id: "connector-2",
        connector_display_name: "SMS gateway",
        readiness_status: "ready",
        execution_status: "scheduled",
        execution_mode: "system",
        status_detail: "Reminder SMS is scheduled for 2026-03-11 14:30.",
        provider_id: "telnyx",
        recorded_at: "2026-03-06T11:05:30Z",
        recorded_by_user_id: null,
        recorded_by_display_name: null,
        latest_health_status: "healthy",
        latest_health_checked_at: "2026-03-06T11:05:30Z",
        latest_health_error: null,
      },
    ];
    const automationActionLog: string[] = [];

    await primeSessionCookie(page, "client_admin");

    await page.route("**/api/platform/solutions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solutions: [
            {
              solution_name: "appointment_booking",
              enabled: true,
              version: "1.0.0",
              description: "Clinic booking workspace.",
              requires_enabled: [],
              optional_enabled: [],
              desired_revision: "latest",
              active_revision: "2026-03-01",
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/solutions/appointment_booking/config/schema", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solution_name: "appointment_booking",
          title: "Clinic booking settings",
          description: "Controls clinic integrations and reminder timing.",
          fields: [
            {
              name: "crm_adapter",
              label: "Patient system adapter",
              description: "Choose which patient-record adapter receives confirmed bookings.",
              field_type: "choice",
              section: "integrations",
              nullable: true,
              minimum: null,
              maximum: null,
              options: [{ value: "clinic_webhook", label: "Clinic Webhook" }],
            },
            {
              name: "notification_adapter",
              label: "Notification adapter",
              description: "Choose which messaging provider sends confirmation and reminder messages.",
              field_type: "choice",
              section: "integrations",
              nullable: true,
              minimum: null,
              maximum: null,
              options: [{ value: "telnyx_sms", label: "Telnyx Sms" }],
            },
            {
              name: "reminder_minutes_before_appointment",
              label: "Reminder lead time",
              description: "Choose how many minutes before the appointment reminder texts should be sent.",
              field_type: "integer",
              section: "follow_up",
              nullable: true,
              minimum: 5,
              maximum: 10080,
              options: [],
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/solutions/appointment_booking/config", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          solution_name: "appointment_booking",
          config: {
            crm_adapter: "clinic_webhook",
            notification_adapter: "telnyx_sms",
            reminder_minutes_before_appointment: 1440,
            custom_fields: {},
          },
        }),
      });
    });

    await page.route("**/api/platform/clinic/integration-status", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          overall_status: "attention_required",
          integrations: [
            {
              integration_id: "patient_record_sync",
              label: "Patient record sync",
              connector_type: "crm",
              channel: null,
              configured_adapter: null,
              connector_id: null,
              connector_display_name: null,
              readiness_status: "not_configured",
              status_detail: "Patient-record sync is not configured for this tenant yet.",
              configured_minutes_before_appointment: null,
              latest_health_status: null,
              latest_health_checked_at: null,
              latest_health_error: null,
            },
            {
              integration_id: "confirmation_sms",
              label: "Confirmation SMS",
              connector_type: "notifications",
              channel: "sms",
              configured_adapter: "telnyx_sms",
              connector_id: "connector-2",
              connector_display_name: "SMS gateway",
              readiness_status: "ready",
              status_detail: "Confirmation texts are ready to send automatically.",
              configured_minutes_before_appointment: null,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T11:05:00Z",
              latest_health_error: null,
            },
            {
              integration_id: "appointment_reminder",
              label: "Appointment reminder",
              connector_type: "notifications",
              channel: "sms",
              configured_adapter: "telnyx_sms",
              connector_id: "connector-2",
              connector_display_name: "SMS gateway",
              readiness_status: "ready",
              status_detail: "Appointment reminders are ready to schedule 1440 minutes before the appointment.",
              configured_minutes_before_appointment: 1440,
              latest_health_status: "healthy",
              latest_health_checked_at: "2026-03-06T11:05:30Z",
              latest_health_error: null,
            },
          ],
        }),
      });
    });

    await page.route("**/api/platform/team/users", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ users: [] }),
      });
    });

    await page.route("**/api/platform/clinic/booking-results**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              call_id: callId,
              booking_status: bookingStatus,
              handoff_reason: null,
              needs_follow_up: false,
              specialty: "Dermatology",
              clinic_city: "Kaunas",
              clinic_address: "Laisves al. 10",
              appointment_date: "2026-03-12",
              appointment_time: "14:30",
              patient_full_name: "Ieva Petrauskaite",
              patient_phone: "+37069876543",
              price_eur: 79,
              state: "completed",
              outcome: "confirmed",
              caller_number: "+37069876543",
              callee_number: "+37060000001",
              started_at: "2026-03-06T11:00:00Z",
              ended_at: "2026-03-06T11:04:00Z",
              created_at: "2026-03-06T11:00:00Z",
              updated_at: "2026-03-06T11:04:00Z",
            },
          ],
          total: 1,
          limit: 50,
          offset: 0,
        }),
      });
    });

    await page.route("**/api/platform/clinic/follow-ups**", async (route) => {
      const url = new URL(route.request().url());
      if (route.request().method() === "GET" && url.pathname.endsWith(`/${callId}`)) {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ detail: "Clinic follow-up not found" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
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
      });
    });

    await page.route(`**/api/platform/clinic/booking-results/${callId}`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call: {
            call_id: callId,
            direction: "inbound",
            state: "completed",
            outcome: "confirmed",
            caller_number: "+37069876543",
            callee_number: "+37060000001",
            started_at: "2026-03-06T11:00:00Z",
            ended_at: "2026-03-06T11:04:00Z",
            created_at: "2026-03-06T11:00:00Z",
            updated_at: "2026-03-06T11:04:00Z",
          },
          result: {
            appointment: {
              specialty: "Dermatology",
              doctor_name: null,
              clinic_city: "Kaunas",
              clinic_address: "Laisves al. 10",
              date: "2026-03-12",
              time: "14:30",
              price_eur: 79,
            },
            patient: {
              personal_code: "49901011234",
              full_name: "Ieva Petrauskaite",
              phone: "+37069876543",
              email: null,
            },
            booking_status: bookingStatus,
            handoff_reason: null,
          },
          needs_follow_up: false,
        }),
      });
    });

    await page.route(`**/api/platform/clinic/booking-results/${callId}/automation-status`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: callId,
          booking_status: bookingStatus,
          overall_status: "attention_required",
          actions: automationActions,
        }),
      });
    });

    await page.route(`**/api/platform/clinic/booking-results/${callId}/automation-actions/**`, async (route) => {
      const request = route.request();
      const payload = JSON.parse(request.postData() ?? "{}") as { status_detail?: string };
      const status = request.url().endsWith("/complete") ? "completed" : "failed";
      const actionId = request.url().split("/automation-actions/")[1]?.split("/")[0];
      automationActionLog.push(`${status}:${actionId}:${payload.status_detail ?? ""}`);
      automationActions = automationActions.map((action) =>
        action.action_id === actionId
          ? {
              ...action,
              execution_status: status,
              execution_mode: "manual",
              status_detail:
                payload.status_detail ??
                (status === "completed"
                  ? `${action.label} was marked complete manually.`
                  : `${action.label} was marked failed manually.`),
              recorded_at: "2026-03-06T11:06:00Z",
              recorded_by_user_id: "11111111-1111-1111-1111-111111111111",
              recorded_by_display_name: "Casey Operator",
            }
          : action,
      );
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          call_id: callId,
          booking_status: bookingStatus,
          overall_status: "attention_required",
          actions: automationActions,
        }),
      });
    });

    await page.goto("/bookings");

    await expect(page.getByRole("heading", { name: "Bookings" })).toBeVisible();
    await expect(page.getByTestId("clinic-integration-overall-status")).toContainText("Needs setup attention");
    await expect(page.getByTestId("clinic-integration-card-patient_record_sync")).toContainText("Not configured");
    await expect(page.getByText("Connector ready").first()).toBeVisible();
    await expect(page.getByText("Connector missing").first()).toBeVisible();
    await expect(page.getByText("This call does not need staff follow-up right now.")).toBeVisible();
    const smsCard = page.getByTestId("clinic-automation-card-confirmation_sms");
    await expect(smsCard.getByText("Sent automatically", { exact: true })).toBeVisible();
    await expect(smsCard.getByText("Automatic", { exact: true })).toBeVisible();
    await expect(smsCard.getByText("Confirmation SMS sent automatically via Telnyx.")).toBeVisible();
    await expect(smsCard.getByText("Updated automatically on")).toBeVisible();
    await expect(page.getByTestId("clinic-automation-note-confirmation_sms")).toHaveCount(0);
    await expect(page.getByTestId("clinic-automation-complete-confirmation_sms")).toHaveCount(0);

    const reminderCard = page.getByTestId("clinic-automation-card-appointment_reminder");
    await expect(reminderCard.getByText("Reminder scheduled", { exact: true })).toBeVisible();
    await expect(reminderCard.getByText("Automatic", { exact: true })).toBeVisible();
    await expect(reminderCard.getByText("Reminder SMS is scheduled for 2026-03-11 14:30.")).toBeVisible();
    await expect(reminderCard.getByText("Scheduled automatically on")).toBeVisible();
    await expect(page.getByTestId("clinic-automation-note-appointment_reminder")).toHaveCount(0);
    await expect(page.getByTestId("clinic-automation-complete-appointment_reminder")).toHaveCount(0);

    await page.getByTestId("clinic-automation-note-patient_record_sync").fill(
      "Reception staff updated the patient record in the clinic system.",
    );
    await page.getByTestId("clinic-automation-complete-patient_record_sync").click();
    await expect(page.getByText("Update patient record is now marked done for this booking.")).toBeVisible();
    await expect(
      page.getByTestId("clinic-automation-card-patient_record_sync").getByText("Done", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Reception staff updated the patient record in the clinic system.").first(),
    ).toBeVisible();

    expect(automationActionLog).toEqual([
      "completed:patient_record_sync:Reception staff updated the patient record in the clinic system.",
    ]);
  });
});
