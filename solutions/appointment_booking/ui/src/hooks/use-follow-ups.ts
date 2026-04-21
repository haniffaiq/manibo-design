"use client";

import useSWR from "swr";

import { PlatformApiError } from "@grove/web-shared/api/platform";
import {
  listClinicFollowUps,
  getClinicFollowUp,
  type ClinicFollowUpPriority,
  type ClinicFollowUpQueueItem,
  type ClinicFollowUpQueueSummary,
} from "../api/clinic-bookings";
import * as swrKeys from "../lib/swr-keys";

const EMPTY_FOLLOW_UPS: ClinicFollowUpQueueItem[] = [];
const EMPTY_FOLLOW_UP_SUMMARY: ClinicFollowUpQueueSummary = {
  total: 0, urgent: 0, normal: 0, open: 0,
  claimed: 0, resolved: 0, handed_off: 0, pending: 0, failed: 0,
};

export interface UseFollowUpListParams {
  enabled: boolean;
  priorityFilter: ClinicFollowUpPriority | "all";
  searchPhone: string;
}

export function useFollowUpList({ enabled, priorityFilter, searchPhone }: UseFollowUpListParams) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled ? swrKeys.clinicFollowUps(priorityFilter, searchPhone.trim()) : null,
    ([, nextPriorityFilter, nextPhone]: readonly ["clinic-follow-ups", ClinicFollowUpPriority | "all", string]) =>
      listClinicFollowUps({
        followUpPriority: nextPriorityFilter === "all" ? undefined : nextPriorityFilter,
        phone: nextPhone || undefined,
      }),
    { revalidateOnFocus: false },
  );

  const followUpItems = data?.items ?? EMPTY_FOLLOW_UPS;
  const followUpSummary = data?.summary ?? EMPTY_FOLLOW_UP_SUMMARY;

  return { followUpItems, followUpSummary, error, isLoading, mutate };
}

export interface UseFollowUpDetailParams {
  enabled: boolean;
  callId: string | null;
  needsFollowUp: boolean;
}

export function useFollowUpDetail({ enabled, callId, needsFollowUp }: UseFollowUpDetailParams) {
  const { data, error, isLoading, mutate } = useSWR(
    enabled && callId && needsFollowUp ? swrKeys.clinicFollowUpDetail(callId) : null,
    async ([, id]: readonly ["clinic-follow-up-detail", string]) => {
      try {
        return await getClinicFollowUp(id);
      } catch (err) {
        if (err instanceof PlatformApiError && err.status === 404) {
          return null;
        }
        throw err;
      }
    },
    { revalidateOnFocus: false },
  );

  return { followUpDetailData: data, followUpDetailError: error, followUpDetailLoading: isLoading, mutateFollowUpDetail: mutate };
}
