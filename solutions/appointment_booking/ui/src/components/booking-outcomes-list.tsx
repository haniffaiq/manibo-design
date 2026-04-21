"use client";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";
import { Input } from "@grove/ui/input";
import type {
  ClinicBookingResultListItem,
  ClinicBookingStatus,
} from "../api/clinic-bookings";

function statusLabel(status: ClinicBookingStatus): string {
  if (status === "confirmed") {
    return "Booking confirmed";
  }
  if (status === "pending") {
    return "Waiting for follow-up";
  }
  if (status === "failed") {
    return "Booking failed";
  }
  return "Handed to staff";
}

function statusVariant(status: ClinicBookingStatus): "success" | "warning" | "error" | "neutral" {
  if (status === "confirmed") {
    return "success";
  }
  if (status === "pending") {
    return "warning";
  }
  if (status === "failed") {
    return "error";
  }
  return "neutral";
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Not confirmed";
  }
  return new Date(`${value}T00:00:00`).toLocaleDateString();
}

function followUpLabel(needsFollowUp: boolean): string {
  return needsFollowUp ? "Needs human follow-up" : "No manual action needed";
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

export interface BookingOutcomesListProps {
  results: ClinicBookingResultListItem[];
  activeCallId: string | null;
  onSelectCall: (callId: string) => void;
  searchPhone: string;
  onSearchPhoneChange: (value: string) => void;
  statusFilter: ClinicBookingStatus | "all";
  onStatusFilterChange: (value: ClinicBookingStatus | "all") => void;
  isLoading: boolean;
  error: unknown;
}

export function BookingOutcomesList({
  results,
  activeCallId,
  onSelectCall,
  searchPhone,
  onSearchPhoneChange,
  statusFilter,
  onStatusFilterChange,
  isLoading,
  error,
}: BookingOutcomesListProps) {
  const columns: DataTableColumn<ClinicBookingResultListItem>[] = [
    {
      id: "patient",
      header: "Patient",
      cell: (row) => (
        <div className="space-y-1">
          <p className="font-medium text-[var(--color-neutral-900)]">{row.patient_full_name || "Name not captured"}</p>
          <p className="text-xs text-[var(--color-neutral-500)]">{row.patient_phone || row.caller_number || "No phone number"}</p>
        </div>
      ),
    },
    {
      id: "visit",
      header: "Visit request",
      cell: (row) => (
        <div className="space-y-1">
          <p>{row.specialty || "Specialty not captured"}</p>
          <p className="text-xs text-[var(--color-neutral-500)]">
            {row.clinic_city || "Clinic city pending"}{row.clinic_address ? ` · ${row.clinic_address}` : ""}
          </p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: (row) => (
        <div className="space-y-1">
          <Badge variant={statusVariant(row.booking_status)}>{statusLabel(row.booking_status)}</Badge>
          <p className="text-xs text-[var(--color-neutral-500)]">{followUpLabel(row.needs_follow_up)}</p>
        </div>
      ),
    },
    {
      id: "time",
      header: "Requested time",
      cell: (row) => (
        <div className="space-y-1">
          <p>{formatDate(row.appointment_date)}</p>
          <p className="text-xs text-[var(--color-neutral-500)]">{row.appointment_time || "Time not confirmed"}</p>
        </div>
      ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (row) => (
        <Button
          variant={activeCallId === row.call_id ? "secondary" : "outline"}
          size="sm"
          data-testid={`booking-open-${row.call_id}`}
          onClick={() => onSelectCall(row.call_id)}
        >
          {activeCallId === row.call_id ? "Viewing" : "Open"}
        </Button>
      ),
    },
  ];

  return (
    <Card id="clinic-selected-case">
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--color-neutral-900)]">Call outcomes</h2>
            <p className="text-sm text-[var(--color-neutral-500)]">
              Search by patient phone number and focus on the status that matters right now.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              id="clinic-bookings-phone"
              data-testid="clinic-bookings-phone"
              label="Search by phone"
              placeholder="+3706..."
              value={searchPhone}
              onChange={(event) => onSearchPhoneChange(event.currentTarget.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="clinic-bookings-status" className="text-sm font-medium text-[var(--color-neutral-700)]">
                Status
              </label>
              <select
                id="clinic-bookings-status"
                data-testid="clinic-bookings-status"
                className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]"
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.currentTarget.value as ClinicBookingStatus | "all")}
              >
                <option value="all">All calls</option>
                <option value="confirmed">Booking confirmed</option>
                <option value="pending">Waiting for follow-up</option>
                <option value="failed">Booking failed</option>
                <option value="handed_off">Handed to staff</option>
              </select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
            {toErrorMessage(error)}
          </div>
        ) : null}
        <DataTable
          columns={columns}
          rows={results}
          rowKey="call_id"
          emptyState={isLoading ? "Loading booking calls..." : "No booking calls match these filters."}
        />
      </CardContent>
    </Card>
  );
}
