"use client";

import { useEffect, useMemo, useState } from "react";

import type { TenantUiLocale } from "@grove/web-shared/types/tenant-locale";
import { TenantLocaleContext } from "@grove/web-shared/hooks/use-tenant-locale";
import { getTenantCopy, resolveIntlLocale } from "@/lib/tenant-locale";

export { useTenantLocale, useTenantCopy } from "@grove/web-shared/hooks/use-tenant-locale";
export type { TenantLocaleContextValue } from "@grove/web-shared/hooks/use-tenant-locale";

export function TenantLocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale: TenantUiLocale;
}) {
  const [locale, setLocale] = useState<TenantUiLocale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = resolveIntlLocale(locale);
  }, [locale]);

  const value = useMemo(() => {
    return {
      locale,
      copy: getTenantCopy(locale),
      setLocale,
    };
  }, [locale]);

  return <TenantLocaleContext.Provider value={value}>{children}</TenantLocaleContext.Provider>;
}
