"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { ObservabilitySelection } from "@/lib/observability-routes";

import type { Scope } from "./types";
import { useWorkspaceState } from "./use-workspace-state";

type WorkspaceState = ReturnType<typeof useWorkspaceState>;

interface ObservabilityContextValue extends WorkspaceState {
  scope: Scope;
  selection: ObservabilitySelection;
  refreshAll: () => void;
  isRefreshing: boolean;
}

const ObservabilityContext = createContext<ObservabilityContextValue | null>(null);

export function useObservability(): ObservabilityContextValue {
  const ctx = useContext(ObservabilityContext);
  if (!ctx) {
    throw new Error("useObservability must be used inside ObservabilityProvider");
  }
  return ctx;
}

interface ProviderProps {
  scope: Scope;
  selection: ObservabilitySelection;
  coverageSolutions: ReadonlySet<string>;
  children: ReactNode;
}

export function ObservabilityProvider({ scope, selection, coverageSolutions, children }: ProviderProps) {
  const ws = useWorkspaceState({ scope, selection, coverageSolutions });

  const value: ObservabilityContextValue = {
    ...ws,
    scope,
    selection,
  };

  return <ObservabilityContext value={value}>{children}</ObservabilityContext>;
}
