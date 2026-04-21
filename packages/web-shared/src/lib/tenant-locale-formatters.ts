import type { TenantUiLocale } from "../types/tenant-locale";

export function resolveIntlLocale(locale: TenantUiLocale): string {
  return locale === "lt" ? "lt-LT" : "en-US";
}

export function formatTenantDateTime(
  locale: TenantUiLocale,
  value: string | null | undefined,
  fallback = "\u2014",
): string {
  if (!value) {
    return fallback;
  }
  return new Date(value).toLocaleString(resolveIntlLocale(locale));
}

export function formatTenantDate(
  locale: TenantUiLocale,
  value: string | null | undefined,
  fallback = "\u2014",
): string {
  if (!value) {
    return fallback;
  }
  return new Date(value).toLocaleDateString(resolveIntlLocale(locale));
}

export function formatTenantCurrency(
  locale: TenantUiLocale,
  amount: number | null | undefined,
  currency: string,
  fallback = "\u2014",
): string {
  if (amount == null) {
    return fallback;
  }
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatTenantCurrencyFromCents(
  locale: TenantUiLocale,
  cents: number | null | undefined,
  currency: string | null | undefined,
  fallback = "\u2014",
): string {
  if (cents == null || !currency) {
    return fallback;
  }
  return formatTenantCurrency(locale, cents / 100, currency, fallback);
}

export function formatTenantPercent(locale: TenantUiLocale, value: number | null | undefined, fallback = "\u2014"): string {
  if (value == null) {
    return fallback;
  }
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTenantDurationSeconds(
  locale: TenantUiLocale,
  value: number | null | undefined,
  fallback = "\u2014",
): string {
  if (value == null) {
    return fallback;
  }
  if (value < 60) {
    return `${Math.round(value)} ${locale === "lt" ? "sek." : "sec"}`;
  }
  return `${Math.round(value / 60)} ${locale === "lt" ? "min." : "min"}`;
}
