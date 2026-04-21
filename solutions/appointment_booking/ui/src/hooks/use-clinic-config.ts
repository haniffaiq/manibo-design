"use client";

import useSWR from "swr";

import { getAppointmentBookingConfig, getAppointmentBookingConfigSchema } from "../api/clinic-bookings";
import * as swrKeys from "../lib/swr-keys";

export interface UseClinicConfigParams {
  enabled: boolean;
}

export function useClinicConfig({ enabled }: UseClinicConfigParams) {
  const { data: configData, error: configLoadError, isLoading: configLoading, mutate: mutateConfigData } = useSWR(
    enabled ? swrKeys.appointmentBookingConfig() : null,
    getAppointmentBookingConfig,
    { revalidateOnFocus: false },
  );

  const { data: configSchemaData, error: configSchemaError, isLoading: configSchemaLoading } = useSWR(
    enabled ? swrKeys.appointmentBookingConfigSchema() : null,
    getAppointmentBookingConfigSchema,
    { revalidateOnFocus: false },
  );

  return { configData, configLoadError, configLoading, configSchemaData, configSchemaError, configSchemaLoading, mutateConfigData };
}
