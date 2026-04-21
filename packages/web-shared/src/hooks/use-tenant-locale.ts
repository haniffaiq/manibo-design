"use client";

import { createContext, useContext } from "react";
import type { TenantUiLocale, TenantCopy } from "../types/tenant-locale";

export type TenantLocaleContextValue = {
  locale: TenantUiLocale;
  copy: TenantCopy;
  setLocale: (nextLocale: TenantUiLocale) => void;
};

export const TenantLocaleContext = createContext<TenantLocaleContextValue | null>(null);

export function useTenantLocale(): TenantLocaleContextValue {
  const context = useContext(TenantLocaleContext);
  if (!context) {
    throw new Error("useTenantLocale must be used within TenantLocaleProvider");
  }
  return context;
}

export function useTenantCopy(): TenantCopy {
  return useTenantLocale().copy;
}
