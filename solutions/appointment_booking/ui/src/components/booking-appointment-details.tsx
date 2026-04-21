"use client";

import Link from "next/link";

import { Badge } from "@grove/ui/badge";

import type { ClinicBookingResultDetailResponse } from "../api/clinic-bookings";
import { formatDate, formatDateTime, formatMoney, statusLabel, statusVariant } from "./booking-detail-helpers";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

export interface BookingAppointmentDetailsProps {
  bookingDetailData: ClinicBookingResultDetailResponse;
  callHistoryHref: string | null;
  observabilityHref: string | null;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function BookingAppointmentDetails({
  bookingDetailData,
  callHistoryHref,
  observabilityHref,
}: BookingAppointmentDetailsProps) {
  return (
    <>
      {/* Status + timing cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">Booking status</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant={statusVariant(bookingDetailData.result.booking_status)}>
              {statusLabel(bookingDetailData.result.booking_status)}
            </Badge>
          </div>
          <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
            {bookingDetailData.needs_follow_up ? "Needs human follow-up." : "No manual callback needed."}
          </p>
        </div>
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">Call timing</p>
          <p className="mt-2 text-sm text-[var(--color-neutral-900)]">{formatDateTime(bookingDetailData.call.started_at)}</p>
          <p className="mt-1 text-xs text-[var(--color-neutral-500)]">Updated {formatDateTime(bookingDetailData.call.updated_at)}</p>
        </div>
      </div>

      {/* Evidence links */}
      {callHistoryHref && observabilityHref ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-neutral-900)]">Conversation evidence</h3>
          <p className="mt-1 text-sm text-[var(--color-neutral-500)]">
            Open the saved conversation and timing evidence for this exact call without searching again.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={callHistoryHref}
              data-testid="clinic-bookings-open-call-history"
              className="inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
            >
              Open conversation history
            </Link>
            <Link
              href={observabilityHref}
              data-testid="clinic-bookings-open-observability"
              className="inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
            >
              Open latency and transcript evidence
            </Link>
          </div>
          <p className="mt-3 text-xs text-[var(--color-neutral-500)]">
            Use call history for the saved transcript and recordings. Use observability for route decisions, timing, and run context.
          </p>
        </div>
      ) : null}

      {/* Appointment + patient details */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-neutral-900)]">Appointment requested</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-neutral-500)]">Specialty</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">{bookingDetailData.result.appointment.specialty || "Not captured"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-neutral-500)]">Doctor</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">{bookingDetailData.result.appointment.doctor_name || "Not captured"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-neutral-500)]">Clinic</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">{bookingDetailData.result.appointment.clinic_city || "Not captured"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-neutral-500)]">Address</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">{bookingDetailData.result.appointment.clinic_address || "Not captured"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-neutral-500)]">Date</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">{formatDate(bookingDetailData.result.appointment.date)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-neutral-500)]">Time</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">{bookingDetailData.result.appointment.time || "Not confirmed"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-neutral-500)]">Price</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">{formatMoney(bookingDetailData.result.appointment.price_eur)}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <h3 className="text-sm font-semibold text-[var(--color-neutral-900)]">Patient details</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-neutral-500)]">Full name</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">{bookingDetailData.result.patient.full_name || "Not captured"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-neutral-500)]">Phone</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">{bookingDetailData.result.patient.phone || "Not captured"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-neutral-500)]">Personal code</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">{bookingDetailData.result.patient.personal_code || "Not captured"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[var(--color-neutral-500)]">Email</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">{bookingDetailData.result.patient.email || "Not provided"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
