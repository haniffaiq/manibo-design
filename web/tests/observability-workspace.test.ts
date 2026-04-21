import { describe, expect, it } from "vitest";

import {
  buildSolutionCaseDetailSections,
  buildSolutionEvidenceItems,
  buildSolutionTimelineDecorators,
} from "@/components/observability/domain-logic";
import { resolveSubjectCoverage } from "@/components/observability/types";

describe("observability workspace subject coverage", () => {
  it("only includes enabled tenant solution contributions", () => {
    const tenantCoverage = resolveSubjectCoverage(new Set(["appointment_booking"]));

    expect(tenantCoverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "voice_session" }),
        expect.objectContaining({ key: "appointment_booking" }),
      ]),
    );
    expect(tenantCoverage).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ key: "driver_verification" })]),
    );
  });

  it("includes every shipped solution contribution for admin coverage", () => {
    const adminCoverage = resolveSubjectCoverage(new Set(["appointment_booking", "driver_verification"]));

    expect(adminCoverage).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "appointment_booking" }),
        expect.objectContaining({ key: "driver_verification" }),
      ]),
    );
  });
});

describe("shared observability enricher helpers", () => {
  const appointmentBookingEnricher = {
    solution_name: "appointment_booking",
    label: "Appointment booking",
    case_detail_fields: [
      {
        key: "booking_status",
        label: "Booking status",
        value: "Handed Off",
        severity: "warning" as const,
        href: null,
      },
      {
        key: "appointment",
        label: "Appointment",
        value: "Cardiology follow-up",
        severity: "info" as const,
        href: "/bookings?call_id=call-1#clinic-selected-case",
      },
    ],
    evidence_items: [
      {
        key: "booking_extraction",
        label: "Clinic booking extraction",
        detail: "Caller requested a cardiology follow-up and staff handoff.",
        severity: "info" as const,
        occurred_at: "2026-03-10T08:10:04Z",
        href: null,
      },
      {
        key: "follow_up_state",
        label: "Clinic follow-up state",
        detail: "Follow-up queue item is still open and waiting for staff.",
        severity: "error" as const,
        occurred_at: "2026-03-10T08:10:06Z",
        href: "/bookings?call_id=call-1#clinic-selected-case",
      },
    ],
    timeline_decorators: [
      {
        key: "follow_up_opened",
        label: "Clinic follow-up opened",
        detail: "Staff follow-up case was created.",
        severity: "warning" as const,
        occurred_at: "2026-03-10T08:10:05Z",
      },
    ],
    related_actions: [
      {
        key: "open_booking_case",
        label: "Open clinic case",
        detail: "Review the clinic queue and assign an owner.",
        href: "/bookings?call_id=call-1#clinic-selected-case",
        cta_label: "Open clinic case",
        severity: "warning" as const,
      },
    ],
  };

  const driverVerificationEnricher = {
    solution_name: "driver_verification",
    label: "Driver verification",
    case_detail_fields: [
      {
        key: "driver",
        label: "Driver",
        value: "Driver One",
        severity: "info" as const,
        href: "/driver-verification/drivers",
      },
      {
        key: "verification_outcome",
        label: "Verification outcome",
        value: "Discrepancy",
        severity: "warning" as const,
        href: null,
      },
    ],
    evidence_items: [
      {
        key: "driver_self_report",
        label: "Driver self-report",
        detail: "Driver reported resting at Kaunas depot.",
        severity: "warning" as const,
        occurred_at: "2026-03-10T10:07:00Z",
        href: null,
      },
      {
        key: "discrepancy_flags",
        label: "Discrepancy flags",
        detail: "Status, location, and hours mismatched telematics.",
        severity: "error" as const,
        occurred_at: "2026-03-10T10:07:00Z",
        href: "/driver-verification/drivers",
      },
    ],
    timeline_decorators: [
      {
        key: "verification_scheduled",
        label: "Driver verification scheduled",
        detail: "Verification job scheduled before the call started.",
        severity: "info" as const,
        occurred_at: "2026-03-10T09:55:00Z",
      },
      {
        key: "telematics_snapshot_recorded",
        label: "Telematics snapshot recorded",
        detail: "Telematics snapshot captured near the end of the call.",
        severity: "warning" as const,
        occurred_at: "2026-03-10T10:06:00Z",
      },
    ],
    related_actions: [
      {
        key: "open_driver_board",
        label: "Open driver board",
        detail: "Review the latest verification state for this driver.",
        href: "/driver-verification/drivers",
        cta_label: "Open driver board",
        severity: "warning" as const,
      },
    ],
  };

  it("keeps empty shared enricher state quiet", () => {
    expect(buildSolutionCaseDetailSections([])).toEqual([]);
    expect(buildSolutionEvidenceItems([])).toEqual([]);
    expect(buildSolutionTimelineDecorators([])).toEqual([]);
  });

  it("builds shared case-detail sections with related actions", () => {
    const sections = buildSolutionCaseDetailSections([appointmentBookingEnricher, driverVerificationEnricher]);

    expect(sections).toHaveLength(2);
    expect(sections[0]).toMatchObject({
      solutionName: "appointment_booking",
      label: "Appointment booking",
    });
    expect(sections[0]?.fields.map((field) => field.label)).toEqual(["Booking status", "Appointment"]);
    expect(sections[1]?.relatedActions[0]?.cta_label).toBe("Open driver board");
  });

  it("sorts shared solution evidence by time and severity without losing solution labels", () => {
    const evidenceItems = buildSolutionEvidenceItems([appointmentBookingEnricher, driverVerificationEnricher]);

    expect(evidenceItems.map((item) => item.label)).toEqual([
      "Discrepancy flags",
      "Driver self-report",
      "Clinic follow-up state",
      "Clinic booking extraction",
    ]);
    expect(evidenceItems[0]).toMatchObject({
      solutionName: "driver_verification",
      solutionLabel: "Driver verification",
      severity: "error",
    });
    expect(evidenceItems[2]?.href).toBe("/bookings?call_id=call-1#clinic-selected-case");
  });

  it("sorts shared solution timeline decorators newest first", () => {
    const decorators = buildSolutionTimelineDecorators([appointmentBookingEnricher, driverVerificationEnricher]);

    expect(decorators.map((item) => item.label)).toEqual([
      "Telematics snapshot recorded",
      "Driver verification scheduled",
      "Clinic follow-up opened",
    ]);
    expect(decorators[0]).toMatchObject({
      solutionName: "driver_verification",
      solutionLabel: "Driver verification",
    });
  });
});
