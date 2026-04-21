import { useMemo } from "react";
import useSWR from "swr";

import { listTenantSolutions, type TenantSolutionState } from "@/lib/api/solutions";
import { GENERATED_SOLUTION_MANIFESTS } from "@/lib/generated-solution-manifests";
import * as swrKeys from "@/lib/swr-keys";
import { getManifestById } from "@/solutions/registry";

const EMPTY_SOLUTIONS: TenantSolutionState[] = [];
const SOLUTION_ID_PATTERN = /^[a-z][a-z0-9_]*$/;

function humanizeSolutionName(solutionName: string): string {
  return solutionName
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function parseBuildEnabledSolutions(rawValue: string): Set<string> {
  return new Set(
    rawValue
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0 && SOLUTION_ID_PATTERN.test(value)),
  );
}

const DEFAULT_BUILD_ENABLED_SOLUTIONS = new Set(GENERATED_SOLUTION_MANIFESTS.map((manifest) => manifest.id));

export const BUILD_ENABLED_SOLUTIONS =
  process.env.NEXT_PUBLIC_SOLUTIONS && process.env.NEXT_PUBLIC_SOLUTIONS.trim().length > 0
    ? parseBuildEnabledSolutions(process.env.NEXT_PUBLIC_SOLUTIONS)
    : DEFAULT_BUILD_ENABLED_SOLUTIONS;

export function intersectWithBuildEnabledSolutions(
  solutionNames: readonly string[],
  buildEnabledSolutions: ReadonlySet<string> = BUILD_ENABLED_SOLUTIONS,
): string[] {
  return solutionNames.filter((solutionName) => buildEnabledSolutions.has(solutionName));
}

export function isBuildEnabledSolution(
  solutionName: string,
  buildEnabledSolutions: ReadonlySet<string> = BUILD_ENABLED_SOLUTIONS,
): boolean {
  return buildEnabledSolutions.has(solutionName);
}

export function formatSolutionLabel(solutionName: string): string {
  return getManifestById(solutionName)?.name ?? humanizeSolutionName(solutionName);
}

export function formatSolutionNavLabel(solutionName: string): string {
  const manifest = getManifestById(solutionName);
  return manifest?.navLabel ?? manifest?.name ?? humanizeSolutionName(solutionName);
}

export function useTenantSolutions() {
  const { data, error, isLoading, mutate } = useSWR(swrKeys.tenantSolutions(), () => listTenantSolutions(), {
    revalidateOnFocus: false,
  });

  const states = data?.solutions ?? EMPTY_SOLUTIONS;
  const enabledSet = useMemo(() => {
    return new Set(states.filter((solution) => solution.enabled).map((solution) => solution.solution_name));
  }, [states]);
  const visibleEnabledSet = useMemo(() => {
    return new Set(intersectWithBuildEnabledSolutions(Array.from(enabledSet)));
  }, [enabledSet]);

  return {
    states,
    enabledSet,
    visibleEnabledSet,
    error,
    isLoading,
    mutate,
  };
}

export function useTenantSolutionState(solutionName: string): {
  solution: TenantSolutionState | null;
  enabled: boolean;
  tenantEnabled: boolean;
  buildEnabled: boolean;
  isLoading: boolean;
  error: unknown;
} {
  const { states, enabledSet, visibleEnabledSet, error, isLoading } = useTenantSolutions();
  const solution = states.find((candidate) => candidate.solution_name === solutionName) ?? null;
  return {
    solution,
    enabled: visibleEnabledSet.has(solutionName),
    tenantEnabled: enabledSet.has(solutionName),
    buildEnabled: isBuildEnabledSolution(solutionName),
    isLoading,
    error,
  };
}
