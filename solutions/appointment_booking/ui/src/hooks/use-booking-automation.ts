"use client";

import useSWR from "swr";

import { getClinicBookingAutomationStatus } from "../api/clinic-bookings";
import * as swrKeys from "../lib/swr-keys";

export interface UseBookingAutomationParams {
  enabled: boolean;
  callId: string | null;
}

export function useBookingAutomation({ enabled, callId }: UseBookingAutomationParams) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled && callId ? swrKeys.clinicBookingAutomation(callId) : null,
    ([, id]: readonly ["clinic-booking-automation", string]) => getClinicBookingAutomationStatus(id),
    { revalidateOnFocus: false },
  );

  return { automationData: data, automationError: error, automationLoading: isLoading, mutateAutomationData: mutate };
}
