"use client";

import { Badge } from "@grove/ui/badge";
import type { ClinicIntegrationStatusItem } from "../api/clinic-bookings";
import { useClinicIntegrations } from "../hooks/use-clinic-integrations";
import { toErrorMessage } from "./booking-detail-helpers";

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Not recorded";
  }
  return new Date(value).toLocaleString();
}

function formatReminderLeadTime(value: number | null): string {
  if (value == null) {
    return "Not configured";
  }
  if (value < 60) {
    return `${value} minutes before the appointment`;
  }
  const hours = value / 60;
  if (hours < 24) {
    return `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} hours before the appointment`;
  }
  const days = hours / 24;
  return `${days % 1 === 0 ? days.toFixed(0) : days.toFixed(1)} days before the appointment`;
}

function formatAdapterLabel(value: string | null): string {
  if (!value) {
    return "Not configured";
  }
  return value.replaceAll("_", " ");
}

function integrationReadinessVariant(
  status: ClinicIntegrationStatusItem["readiness_status"],
): "success" | "warning" | "error" {
  if (status === "ready") {
    return "success";
  }
  if (status === "unhealthy") {
    return "error";
  }
  return "warning";
}

function healthLabel(status: ClinicIntegrationStatusItem["latest_health_status"]): string {
  if (status === "healthy") {
    return "Health check passed";
  }
  if (status === "unhealthy") {
    return "Health check failed";
  }
  return "No health check on file";
}

function healthVariant(status: ClinicIntegrationStatusItem["latest_health_status"]): "success" | "warning" | "neutral" {
  if (status === "healthy") {
    return "success";
  }
  if (status === "unhealthy") {
    return "warning";
  }
  return "neutral";
}

export interface IntegrationStatusCardProps {
  enabled: boolean;
}

export function IntegrationStatusCard({ enabled }: IntegrationStatusCardProps) {
  const { integrations, error, isLoading, integrationStatusData } = useClinicIntegrations({ enabled });

  if (error) {
    return (
      <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
        {toErrorMessage(error)}
      </div>
    );
  }

  if (isLoading && !integrationStatusData) {
    return <p className="text-sm text-[var(--color-neutral-500)]">Loading connector readiness...</p>;
  }

  if (integrations.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {integrations.map((integration: ClinicIntegrationStatusItem) => (
        <div
          key={integration.integration_id}
          data-testid={`clinic-integration-card-${integration.integration_id}`}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-[var(--color-neutral-900)]">{integration.label}</p>
            <Badge variant={integrationReadinessVariant(integration.readiness_status)}>
              {integration.readiness_status === "ready"
                ? "Ready"
                : integration.readiness_status === "unhealthy"
                  ? "Needs attention"
                  : "Not configured"}
            </Badge>
            <Badge variant={healthVariant(integration.latest_health_status)}>
              {healthLabel(integration.latest_health_status)}
            </Badge>
          </div>
          <p className="mt-3 text-sm text-[var(--color-neutral-700)]">{integration.status_detail}</p>
          <dl className="mt-3 space-y-2 text-xs text-[var(--color-neutral-500)]">
            <div className="flex justify-between gap-3">
              <dt>Adapter</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">
                {formatAdapterLabel(integration.configured_adapter)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>Connector</dt>
              <dd className="text-right text-[var(--color-neutral-900)]">
                {integration.connector_display_name || "No active connector"}
              </dd>
            </div>
            {integration.integration_id === "appointment_reminder" ? (
              <div className="flex justify-between gap-3">
                <dt>Reminder timing</dt>
                <dd className="text-right text-[var(--color-neutral-900)]">
                  {formatReminderLeadTime(integration.configured_minutes_before_appointment)}
                </dd>
              </div>
            ) : null}
            {integration.latest_health_checked_at ? (
              <div className="flex justify-between gap-3">
                <dt>Last check</dt>
                <dd className="text-right text-[var(--color-neutral-900)]">
                  {formatDateTime(integration.latest_health_checked_at)}
                </dd>
              </div>
            ) : null}
            {integration.latest_health_error ? (
              <div className="space-y-1">
                <dt>Last issue</dt>
                <dd className="text-[var(--color-error-700)]">{integration.latest_health_error}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ))}
    </div>
  );
}
