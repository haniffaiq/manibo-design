"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { Button } from "@grove/ui/button";
import { Input } from "@grove/ui/input";
import { PlatformApiError } from "@grove/web-shared/api/platform";
import {
  getAppointmentBookingConfig,
  getClinicIntegrationStatus,
  updateAppointmentBookingConfig,
  type AppointmentBookingConfigField,
  type AppointmentBookingConfigFieldName,
  type AppointmentBookingConfigResponse,
} from "../api/clinic-bookings";
import { useClinicConfig } from "../hooks/use-clinic-config";
import { useClinicIntegrations } from "../hooks/use-clinic-integrations";
import { toErrorMessage } from "./booking-detail-helpers";

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

function fieldByName(
  fields: AppointmentBookingConfigField[] | undefined,
  fieldName: AppointmentBookingConfigFieldName,
): AppointmentBookingConfigField | null {
  return fields?.find((field) => field.name === fieldName) ?? null;
}

export interface ClinicConfigEditorProps {
  enabled: boolean;
}

export function ClinicConfigEditor({ enabled }: ClinicConfigEditorProps) {
  const { configData, configSchemaData, configLoading, configSchemaLoading, configLoadError, configSchemaError, mutateConfigData } =
    useClinicConfig({ enabled });
  const { mutate: mutateIntegrationStatus } = useClinicIntegrations({ enabled });
  const [configDraft, setConfigDraft] = useState<{
    crm_adapter: string;
    notification_adapter: string;
    reminder_minutes_before_appointment: string;
  }>({
    crm_adapter: "",
    notification_adapter: "",
    reminder_minutes_before_appointment: "",
  });
  const [configBusy, setConfigBusy] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configNotice, setConfigNotice] = useState<string | null>(null);
  const hasHydratedConfig = useRef(false);

  const configAccessDenied =
    (configLoadError instanceof PlatformApiError && configLoadError.status === 403) ||
    (configSchemaError instanceof PlatformApiError && configSchemaError.status === 403);
  const configLoadIssue =
    configLoadError && !configAccessDenied
      ? toErrorMessage(configLoadError)
      : configSchemaError && !configAccessDenied
        ? toErrorMessage(configSchemaError)
        : null;
  const configFields = configSchemaData?.fields ?? [];
  const crmField = fieldByName(configFields, "crm_adapter");
  const notificationField = fieldByName(configFields, "notification_adapter");
  const reminderField = fieldByName(configFields, "reminder_minutes_before_appointment");

  useEffect(() => {
    if (!configData) {
      return;
    }
    setConfigDraft({
      crm_adapter: configData.config.crm_adapter ?? "",
      notification_adapter: configData.config.notification_adapter ?? "",
      reminder_minutes_before_appointment:
        configData.config.reminder_minutes_before_appointment !== null
          ? String(configData.config.reminder_minutes_before_appointment)
          : "",
    });

    if (!hasHydratedConfig.current) {
      setConfigError(null);
      setConfigNotice(null);
      hasHydratedConfig.current = true;
    }
  }, [configData]);

  async function saveConfig(): Promise<void> {
    const reminderFieldForValidation = fieldByName(
      configSchemaData?.fields,
      "reminder_minutes_before_appointment",
    );
    const reminderRaw = configDraft.reminder_minutes_before_appointment.trim();
    let reminderValue: number | null = null;
    if (reminderRaw.length > 0) {
      const parsed = Number(reminderRaw);
      if (!Number.isInteger(parsed)) {
        setConfigError("Reminder lead time must be a whole number of minutes.");
        return;
      }
      if (
        reminderFieldForValidation &&
        ((reminderFieldForValidation.minimum !== null && parsed < reminderFieldForValidation.minimum) ||
          (reminderFieldForValidation.maximum !== null && parsed > reminderFieldForValidation.maximum))
      ) {
        setConfigError(
          `Reminder lead time must stay between ${reminderFieldForValidation.minimum} and ${reminderFieldForValidation.maximum} minutes.`,
        );
        return;
      }
      reminderValue = parsed;
    }

    setConfigBusy(true);
    setConfigError(null);
    setConfigNotice(null);
    const successMessage =
      "Clinic setup saved. Future bookings will use the updated adapters and reminder timing.";
    let savedConfigData: AppointmentBookingConfigResponse;
    try {
      savedConfigData = await updateAppointmentBookingConfig({
        ...(configData?.config ?? {}),
        crm_adapter: configDraft.crm_adapter || null,
        notification_adapter: configDraft.notification_adapter || null,
        reminder_minutes_before_appointment: reminderValue,
      });
    } catch (error) {
      setConfigError(toErrorMessage(error));
      setConfigBusy(false);
      return;
    }

    await mutateConfigData(savedConfigData, { revalidate: false });
    setConfigNotice(successMessage);

    const [configRefresh, integrationRefresh] = await Promise.allSettled([
      getAppointmentBookingConfig(),
      getClinicIntegrationStatus(),
    ]);

    if (configRefresh.status === "fulfilled") {
      await mutateConfigData(configRefresh.value, { revalidate: false });
    }
    if (integrationRefresh.status === "fulfilled") {
      await mutateIntegrationStatus(integrationRefresh.value, { revalidate: false });
    }

    const refreshError =
      configRefresh.status === "rejected"
        ? configRefresh.reason
        : integrationRefresh.status === "rejected"
          ? integrationRefresh.reason
          : null;

    if (refreshError) {
      setConfigNotice(`${successMessage} We could not refresh the latest clinic readiness data yet. ${toErrorMessage(refreshError)}`);
    }

    setConfigBusy(false);
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[var(--color-neutral-900)]">Clinic booking settings</h3>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Choose the patient-record adapter, the messaging adapter, and how early reminder texts go out.
          </p>
        </div>
        <Link
          href="/integrations"
          className="text-sm font-medium text-[var(--color-neutral-900)] underline underline-offset-4"
        >
          Open connector registry
        </Link>
      </div>
      {configAccessDenied ? (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3 text-sm text-[var(--color-neutral-600)]">
          Only client admins can change clinic setup. Operators can still review connector readiness above.
        </div>
      ) : configLoadIssue ? (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
          {configLoadIssue}
        </div>
      ) : configLoading || configSchemaLoading || !configData || !configSchemaData ? (
        <p className="mt-4 text-sm text-[var(--color-neutral-500)]">Loading clinic settings...</p>
      ) : (
        <div className="mt-4 space-y-4">
          {configError ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
              {configError}
            </div>
          ) : null}
          {configNotice ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-success-500)] bg-[var(--color-success-50)] px-4 py-3 text-sm text-[var(--color-success-700)]">
              {configNotice}
            </div>
          ) : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="clinic-config-crm-adapter" className="text-sm font-medium text-[var(--color-neutral-700)]">
                {crmField?.label ?? "Patient system adapter"}
              </label>
              <select
                id="clinic-config-crm-adapter"
                data-testid="clinic-config-crm-adapter"
                className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]"
                value={configDraft.crm_adapter}
                disabled={configBusy}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setConfigDraft((current) => ({
                    ...current,
                    crm_adapter: nextValue,
                  }));
                }}
              >
                <option value="">No adapter selected</option>
                {(crmField?.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {crmField ? <p className="text-xs text-[var(--color-neutral-500)]">{crmField.description}</p> : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="clinic-config-notification-adapter"
                className="text-sm font-medium text-[var(--color-neutral-700)]"
              >
                {notificationField?.label ?? "Notification adapter"}
              </label>
              <select
                id="clinic-config-notification-adapter"
                data-testid="clinic-config-notification-adapter"
                className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]"
                value={configDraft.notification_adapter}
                disabled={configBusy}
                onChange={(event) => {
                  const nextValue = event.currentTarget.value;
                  setConfigDraft((current) => ({
                    ...current,
                    notification_adapter: nextValue,
                  }));
                }}
              >
                <option value="">No adapter selected</option>
                {(notificationField?.options ?? []).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {notificationField ? (
                <p className="text-xs text-[var(--color-neutral-500)]">{notificationField.description}</p>
              ) : null}
            </div>

            <Input
              id="clinic-config-reminder-minutes"
              data-testid="clinic-config-reminder-minutes"
              label={reminderField?.label ?? "Reminder lead time"}
              type="number"
              min={reminderField?.minimum ?? undefined}
              max={reminderField?.maximum ?? undefined}
              value={configDraft.reminder_minutes_before_appointment}
              description={
                reminderField?.description ??
                "Choose how many minutes before the appointment reminder texts should be sent."
              }
              disabled={configBusy}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                setConfigDraft((current) => ({
                  ...current,
                  reminder_minutes_before_appointment: nextValue,
                }));
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-3 text-sm text-[var(--color-neutral-600)]">
            <p>
              Current reminder policy:{" "}
              <span className="font-medium text-[var(--color-neutral-900)]">
                {formatReminderLeadTime(configData.config.reminder_minutes_before_appointment)}
              </span>
            </p>
            <Button
              data-testid="clinic-config-save"
              onClick={() => void saveConfig()}
              disabled={configBusy}
            >
              {configBusy ? "Saving..." : "Save clinic setup"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
