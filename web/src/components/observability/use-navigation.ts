import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import type { ObservabilityRunSummary } from "@/lib/api/observability";
import { observabilityListHref, observabilityRunHref } from "@/lib/observability-routes";

import type { Scope } from "./types";

interface NavigationProps {
  scope: Scope;
}

export function useObservabilityNavigation({ scope }: NavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const openRun = useCallback(
    (run: ObservabilityRunSummary): void => {
      router.replace(observabilityRunHref(scope, run, searchParams), { scroll: false });
    },
    [router, scope, searchParams],
  );

  const openListView = useCallback((): void => {
    router.replace(observabilityListHref(scope, searchParams), { scroll: false });
  }, [router, scope, searchParams]);

  return { openRun, openListView };
}
