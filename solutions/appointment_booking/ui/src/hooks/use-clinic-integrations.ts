"use client";

import useSWR from "swr";

import { getClinicIntegrationStatus, type ClinicIntegrationStatusItem } from "../api/clinic-bookings";
import * as swrKeys from "../lib/swr-keys";

const EMPTY_INTEGRATIONS: ClinicIntegrationStatusItem[] = [];

export interface UseClinicIntegrationsParams {
  enabled: boolean;
}

export function useClinicIntegrations({ enabled }: UseClinicIntegrationsParams) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? swrKeys.clinicIntegrationStatus() : null,
    getClinicIntegrationStatus,
    { revalidateOnFocus: false },
  );

  const integrations = data?.integrations ?? EMPTY_INTEGRATIONS;

  return { integrationStatusData: data, integrations, error, isLoading, mutate };
}
