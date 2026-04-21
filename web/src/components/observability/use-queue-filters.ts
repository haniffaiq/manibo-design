import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";

import {
  listAdminObservabilityRuns,
  listObservabilityRuns,
  type ListAdminObservabilityRunsQuery,
  type ListObservabilityRunsQuery,
  type ObservabilityListKind,
} from "@/lib/api/observability";
import * as swrKeys from "@/lib/swr-keys";
import {
  type FilterPreset,
  type Scope,
  EMPTY_FACETS,
  EMPTY_RUNS,
  RUN_KIND_OPTIONS,
} from "./types";
import { endDateToIso, parseDateFilter, parseMinDuration, startDateToIso } from "./formatters";
import { buildActiveFilterBadges, countRunsNeedingAttention, countRunsWithAudio, observabilityErrorMessage } from "./domain-logic";

interface QueueFiltersProps {
  scope: Scope;
}

export function useQueueFilters({ scope }: QueueFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  /* -- URL param parsing ------------------------------------------- */

  const appliedKind = (searchParams.get("filter_kind") as ObservabilityListKind | null) ?? "all";
  const appliedStatus = searchParams.get("status") ?? "all";
  const appliedQuery = searchParams.get("query") ?? "";
  const appliedTenantId = searchParams.get("filter_tenant_id") ?? "";
  const appliedSolution = searchParams.get("solution") ?? "";
  const appliedAssistant = searchParams.get("assistant") ?? "";
  const appliedIncludeNonProduction = searchParams.get("include_non_production") === "1";
  const appliedErrorOnly = searchParams.get("error_only") === "1";
  const appliedRecordingsOnly = searchParams.get("recordings_only") === "1";
  const appliedRecordingUnavailableOnly = searchParams.get("recording_unavailable_only") === "1";
  const appliedNeedsReviewOnly = searchParams.get("needs_review_only") === "1";
  const appliedMinDuration = parseMinDuration(searchParams.get("min_duration_ms"));
  const appliedStartDate = parseDateFilter(searchParams.get("start"));
  const appliedEndDate = parseDateFilter(searchParams.get("end"));
  const detailTenantId = scope === "admin" ? searchParams.get("tenant_id") ?? appliedTenantId : null;

  /* -- Local state ------------------------------------------------- */

  const [searchDraft, setSearchDraft] = useState(appliedQuery);
  const [startDateDraft, setStartDateDraft] = useState(appliedStartDate);
  const [endDateDraft, setEndDateDraft] = useState(appliedEndDate);

  /* -- Sync drafts with URL ---------------------------------------- */

  useEffect(() => {
    setSearchDraft(appliedQuery);
  }, [appliedQuery]);

  useEffect(() => {
    setStartDateDraft(appliedStartDate);
  }, [appliedStartDate]);

  useEffect(() => {
    setEndDateDraft(appliedEndDate);
  }, [appliedEndDate]);

  /* -- SWR: runs list ---------------------------------------------- */

  const runsKey = useMemo(
    () =>
      swrKeys.observabilityRuns(
        scope,
        appliedKind,
        appliedStatus,
        appliedQuery,
        appliedTenantId,
        appliedSolution,
        appliedAssistant,
        appliedIncludeNonProduction,
        appliedErrorOnly,
        appliedRecordingsOnly,
        appliedRecordingUnavailableOnly,
        appliedNeedsReviewOnly,
        appliedMinDuration,
        appliedStartDate,
        appliedEndDate,
      ),
    [
      appliedAssistant,
      appliedErrorOnly,
      appliedIncludeNonProduction,
      appliedKind,
      appliedMinDuration,
      appliedQuery,
      appliedNeedsReviewOnly,
      appliedEndDate,
      appliedRecordingUnavailableOnly,
      appliedRecordingsOnly,
      appliedSolution,
      appliedStartDate,
      appliedStatus,
      appliedTenantId,
      scope,
    ],
  );

  const runs = useSWR(
    runsKey,
    ([
      ,
      nextScope,
      kind,
      status,
      query,
      tenantId,
      solution,
      assistant,
      includeNonProduction,
      errorOnly,
      recordingsOnly,
      recordingUnavailableOnly,
      needsReviewOnly,
      minDuration,
      start,
      end,
    ]) => {
      const payload: ListObservabilityRunsQuery | ListAdminObservabilityRunsQuery = {
        kind: kind as ObservabilityListKind,
        status: status === "all" ? undefined : status,
        query: query || undefined,
        limit: 60,
        solution: solution || undefined,
        assistant: assistant || undefined,
        include_non_production: includeNonProduction || undefined,
        error_only: errorOnly || undefined,
        recordings_only: recordingsOnly || undefined,
        recording_unavailable_only: recordingUnavailableOnly || undefined,
        needs_review_only: needsReviewOnly || undefined,
        min_duration_ms: minDuration ? Number(minDuration) : undefined,
        start: start ? startDateToIso(start) : undefined,
        end: end ? endDateToIso(end) : undefined,
      };
      if (nextScope === "admin") {
        return listAdminObservabilityRuns({
          ...payload,
          tenant_id: tenantId || undefined,
        });
      }
      return listObservabilityRuns(payload);
    },
    { revalidateOnFocus: false },
  );

  const visibleRuns = runs.data?.runs ?? EMPTY_RUNS;
  const facets = runs.data?.facets ?? EMPTY_FACETS;

  /* -- Active filter badges ---------------------------------------- */

  const activeFilterBadges = useMemo(
    () =>
      buildActiveFilterBadges({
        appliedKind,
        appliedStatus,
        appliedQuery,
        appliedTenantId,
        appliedSolution,
        appliedAssistant,
        appliedIncludeNonProduction,
        appliedErrorOnly,
        appliedRecordingsOnly,
        appliedRecordingUnavailableOnly,
        appliedNeedsReviewOnly,
        appliedMinDuration,
        appliedStartDate,
        appliedEndDate,
        facets,
      }),
    [
      appliedAssistant,
      appliedEndDate,
      appliedErrorOnly,
      appliedIncludeNonProduction,
      appliedKind,
      appliedMinDuration,
      appliedNeedsReviewOnly,
      appliedQuery,
      appliedRecordingUnavailableOnly,
      appliedRecordingsOnly,
      appliedSolution,
      appliedStartDate,
      appliedStatus,
      appliedTenantId,
      facets,
    ],
  );

  const advancedFilterCount = activeFilterBadges.filter((badge) => !badge.startsWith("Search: ")).length;

  /* -- URL param mutation helpers ---------------------------------- */

  function updateParams(mutator: (params: URLSearchParams) => void): void {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    const suffix = params.toString();
    router.replace(suffix ? `${pathname}?${suffix}` : pathname, { scroll: false });
  }

  function applySearch(): void {
    updateParams((params) => {
      if (searchDraft.trim()) {
        params.set("query", searchDraft.trim());
      } else {
        params.delete("query");
      }
      if (startDateDraft) {
        params.set("start", startDateToIso(startDateDraft));
      } else {
        params.delete("start");
      }
      if (endDateDraft) {
        params.set("end", endDateToIso(endDateDraft));
      } else {
        params.delete("end");
      }
    });
  }

  function clearFilters(): void {
    updateParams((params) => {
      for (const key of [
        "query",
        "filter_kind",
        "status",
        "filter_tenant_id",
        "include_non_production",
        "solution",
        "assistant",
        "error_only",
        "recordings_only",
        "recording_unavailable_only",
        "needs_review_only",
        "min_duration_ms",
        "start",
        "end",
      ]) {
        params.delete(key);
      }
    });
  }

  function applyPreset(name: FilterPreset): void {
    updateParams((params) => {
      params.delete("error_only");
      params.delete("recordings_only");
      params.delete("recording_unavailable_only");
      params.delete("needs_review_only");
      params.delete("status");
      params.delete("min_duration_ms");
      if (name === "errors") {
        params.set("error_only", "1");
        return;
      }
      if (name === "slow") {
        params.set("min_duration_ms", "60000");
        return;
      }
      if (name === "recent_failures") {
        params.set("status", "Failed");
        return;
      }
      if (name === "recordings_missing") {
        params.set("recording_unavailable_only", "1");
        return;
      }
      params.set("needs_review_only", "1");
    });
  }

  function setFilter(name: string, value: string): void {
    updateParams((params) => {
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
    });
  }

  function setBooleanFilter(name: string, enabled: boolean): void {
    updateParams((params) => {
      if (enabled) {
        params.set(name, "1");
      } else {
        params.delete(name);
      }
    });
  }

  /* ---------------------------------------------------------------- */

  return {
    searchParams,
    appliedKind,
    appliedStatus,
    appliedTenantId,
    appliedSolution,
    appliedAssistant,
    appliedIncludeNonProduction,
    appliedErrorOnly,
    appliedRecordingsOnly,
    appliedMinDuration,
    detailTenantId,
    visibleRuns,
    facets,
    runs,
    runsLoading: runs.isLoading,
    runsError: runs.error,
    runsHasData: !!runs.data,
    activeFilterBadges,
    advancedFilterCount,
    searchDraft,
    startDateDraft,
    endDateDraft,
    setSearchDraft,
    setStartDateDraft,
    setEndDateDraft,
    applySearch,
    clearFilters,
    applyPreset,
    setFilter,
    setBooleanFilter,
    RUN_KIND_OPTIONS,
    countRunsNeedingAttention,
    countRunsWithAudio,
    observabilityErrorMessage,
  };
}
