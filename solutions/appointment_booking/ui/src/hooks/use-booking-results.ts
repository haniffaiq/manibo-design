"use client";

import { useMemo } from "react";
import useSWR from "swr";

import {
  listClinicBookingResults,
  getClinicBookingResult,
  type ClinicBookingResultListItem,
  type ClinicBookingStatus,
} from "../api/clinic-bookings";
import * as swrKeys from "../lib/swr-keys";

const EMPTY_RESULTS: ClinicBookingResultListItem[] = [];

export interface UseBookingResultsListParams {
  enabled: boolean;
  statusFilter: ClinicBookingStatus | "all";
  searchPhone: string;
}

export function useBookingResultsList({ enabled, statusFilter, searchPhone }: UseBookingResultsListParams) {
  const key = useMemo(() => {
    return swrKeys.clinicBookingResults(statusFilter, searchPhone.trim());
  }, [searchPhone, statusFilter]);

  const { data, error, isLoading, mutate } = useSWR(
    enabled ? key : null,
    ([, nextStatusFilter, nextPhone]: readonly ["clinic-booking-results", ClinicBookingStatus | "all", string]) =>
      listClinicBookingResults({
        bookingStatus: nextStatusFilter === "all" ? undefined : nextStatusFilter,
        phone: nextPhone || undefined,
      }),
    { revalidateOnFocus: false },
  );

  const results = data?.results ?? EMPTY_RESULTS;
  const confirmedCount = results.filter((r) => r.booking_status === "confirmed").length;

  return { results, confirmedCount, error, isLoading, mutate };
}

export interface UseBookingResultDetailParams {
  enabled: boolean;
  callId: string | null;
}

export function useBookingResultDetail({ enabled, callId }: UseBookingResultDetailParams) {
  const { data, error, isLoading } = useSWR(
    enabled && callId ? swrKeys.clinicBookingDetail(callId) : null,
    ([, id]: readonly ["clinic-booking-detail", string]) => getClinicBookingResult(id),
    { revalidateOnFocus: false },
  );

  return { bookingDetailData: data, bookingDetailError: error, bookingDetailLoading: isLoading };
}
