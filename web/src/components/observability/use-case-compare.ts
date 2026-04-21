import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import {
  compareAdminObservabilityRuns,
  compareObservabilityRuns,
  type ComparableObservabilityRunKind,
  type ObservabilityRunSummary,
} from "@/lib/api/observability";
import {
  compareKeyFromRun,
  compareKeyFromSelection,
  isComparableSelection,
  type ObservabilitySelection,
} from "@/lib/observability-routes";
import * as swrKeys from "@/lib/swr-keys";
import { type Scope, EMPTY_RUNS } from "./types";

interface CaseCompareProps {
  scope: Scope;
  selection: ObservabilitySelection;
  selectionKey: string | null;
  detailTenantId: string | null;
  visibleRuns: ObservabilityRunSummary[];
}

export function useCaseCompare({ scope, selection, selectionKey, detailTenantId, visibleRuns }: CaseCompareProps) {
  const [compareTargetKey, setCompareTargetKey] = useState("");

  const comparableSelection = isComparableSelection(selection) ? selection : null;
  const currentCompareKey = comparableSelection ? compareKeyFromSelection(comparableSelection) : null;

  /* -- Reset on selection change ----------------------------------- */

  useEffect(() => {
    setCompareTargetKey("");
  }, [selectionKey]);

  /* -- Compare candidates ------------------------------------------ */

  const compareCandidates = useMemo(() => {
    if (!comparableSelection || !currentCompareKey) {
      return EMPTY_RUNS;
    }
    return visibleRuns.filter((run) => run.kind === comparableSelection.kind && compareKeyFromRun(run) !== currentCompareKey);
  }, [comparableSelection, currentCompareKey, visibleRuns]);

  useEffect(() => {
    if (!compareTargetKey) {
      return;
    }
    if (compareCandidates.some((run) => compareKeyFromRun(run) === compareTargetKey)) {
      return;
    }
    setCompareTargetKey("");
  }, [compareCandidates, compareTargetKey]);

  /* -- SWR: compare ------------------------------------------------ */

  const compare = useSWR(
    comparableSelection && currentCompareKey && compareTargetKey && (scope === "tenant" || detailTenantId)
      ? swrKeys.observabilityCompare(scope, comparableSelection.kind, currentCompareKey, compareTargetKey, detailTenantId)
      : null,
    ([, nextScope, kind, left, right, tenantId]: readonly [
      string,
      Scope,
      ComparableObservabilityRunKind,
      string,
      string,
      string | null,
    ]) => {
      if (nextScope === "admin") {
        return compareAdminObservabilityRuns({
          tenant_id: tenantId ?? "",
          kind,
          left,
          right,
        });
      }
      return compareObservabilityRuns({ kind, left, right });
    },
    { revalidateOnFocus: false },
  );

  /* ---------------------------------------------------------------- */

  return {
    compareCandidates,
    compareTargetKey,
    compare,
    setCompareTargetKey,
  };
}
