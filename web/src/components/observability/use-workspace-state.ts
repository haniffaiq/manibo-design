import type { ObservabilitySelection } from "@/lib/observability-routes";

import type { Scope, WorkspaceMode } from "./types";
import { useQueueFilters } from "./use-queue-filters";
import { useCaseDetail } from "./use-case-detail";
import { useCaseCompare } from "./use-case-compare";
import { useObservabilityNavigation } from "./use-navigation";

interface WorkspaceProps {
  scope: Scope;
  selection: ObservabilitySelection;
  coverageSolutions: ReadonlySet<string>;
}

export function useWorkspaceState({ scope, selection, coverageSolutions }: WorkspaceProps) {
  const queue = useQueueFilters({ scope });
  const navigation = useObservabilityNavigation({ scope });

  const caseDetail = useCaseDetail({
    scope,
    selection,
    detailTenantId: queue.detailTenantId,
    coverageSolutions,
  });

  const caseCompare = useCaseCompare({
    scope,
    selection,
    selectionKey: caseDetail.selectionKey,
    detailTenantId: queue.detailTenantId,
    visibleRuns: queue.visibleRuns,
  });

  /* -- Refresh ----------------------------------------------------- */

  function refreshAll(): void {
    void Promise.all([
      queue.runs.mutate(),
      caseDetail.detail.mutate(),
      caseDetail.timeline.mutate(),
      caseCompare.compare.mutate(),
    ]);
  }

  const isRefreshing = queue.runs.isValidating || caseDetail.detail.isValidating || caseDetail.timeline.isValidating;

  /* -- Admin message ----------------------------------------------- */

  const selectionRequiredMessage =
    scope === "admin" && selection && !queue.detailTenantId
      ? "Tenant context is missing for this admin detail route. Reopen the run from the list so the workspace knows which tenant to inspect."
      : null;

  /* -- Mode detection ----------------------------------------------- */

  const mode: WorkspaceMode = !selection ? "queue" : caseCompare.compareTargetKey ? "compare" : "case";

  /* ---------------------------------------------------------------- */

  return {
    ...queue,
    ...caseDetail,
    ...caseCompare,
    ...navigation,
    mode,
    selectionRequiredMessage,
    refreshAll,
    isRefreshing,
  };
}
