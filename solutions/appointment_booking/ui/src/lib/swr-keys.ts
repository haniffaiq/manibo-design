/**
 * Centralized SWR cache key factories for the appointment_booking solution UI.
 */

import type { ClinicBookingStatus, ClinicFollowUpPriority } from "../api/clinic-bookings";

/* ------------------------------------------------------------------ */
/*  Dashboard widget                                                  */
/* ------------------------------------------------------------------ */

export const clinicDashboardBookings = () => "clinic-dashboard-bookings" as const;
export const clinicDashboardConfirmed = () => "clinic-dashboard-confirmed" as const;
export const clinicDashboardFollowUps = () => "clinic-dashboard-follow-ups" as const;
export const clinicDashboardIntegration = () => "clinic-dashboard-integration" as const;

/* ------------------------------------------------------------------ */
/*  Booking workspace                                                 */
/* ------------------------------------------------------------------ */

export const clinicBookingResults = (statusFilter: ClinicBookingStatus | "all", phone: string) =>
  ["clinic-booking-results", statusFilter, phone] as const;
export const clinicFollowUps = (priorityFilter: ClinicFollowUpPriority | "all", phone: string) =>
  ["clinic-follow-ups", priorityFilter, phone] as const;
export const clinicBookingDetail = (callId: string) => ["clinic-booking-detail", callId] as const;
export const clinicFollowUpDetail = (callId: string) => ["clinic-follow-up-detail", callId] as const;
export const clinicBookingAutomation = (callId: string) => ["clinic-booking-automation", callId] as const;
export const clinicFollowUpTeamUsers = () => "clinic-follow-up-team-users" as const;
export const clinicIntegrationStatus = () => "clinic-integration-status" as const;
export const appointmentBookingConfig = () => "appointment-booking-config" as const;
export const appointmentBookingConfigSchema = () => "appointment-booking-config-schema" as const;
