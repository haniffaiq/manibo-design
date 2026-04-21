import { platformApiRequest } from "@/lib/api/platform";

export type { TenantUiLocale } from "@grove/web-shared/types/tenant-locale";
import type { TenantUiLocale } from "@grove/web-shared/types/tenant-locale";

export interface RecordingRetentionSettings {
  call_recording_retention_days: number;
}

export interface TenantLocaleSettings {
  ui_locale: TenantUiLocale;
}

export function getRecordingRetentionSettings(): Promise<RecordingRetentionSettings> {
  return platformApiRequest<RecordingRetentionSettings>("/tenant/settings/recordings", {
    method: "GET",
  });
}

export function updateRecordingRetentionSettings(
  callRecordingRetentionDays: number,
): Promise<RecordingRetentionSettings> {
  return platformApiRequest<RecordingRetentionSettings>("/tenant/settings/recordings", {
    method: "PATCH",
    body: JSON.stringify({ call_recording_retention_days: callRecordingRetentionDays }),
  });
}

export function getTenantLocaleSettings(): Promise<TenantLocaleSettings> {
  return platformApiRequest<TenantLocaleSettings>("/tenant/settings/locale", {
    method: "GET",
  });
}

export function updateTenantLocaleSettings(uiLocale: TenantUiLocale): Promise<TenantLocaleSettings> {
  return platformApiRequest<TenantLocaleSettings>("/tenant/settings/locale", {
    method: "PATCH",
    body: JSON.stringify({ ui_locale: uiLocale }),
  });
}
