"use client";

import Link from "next/link";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { AdminPageShell } from "@/components/admin-page-shell";
import { listOidcProviders } from "@/lib/api/admin-settings";
import { getPlatformHealth } from "@/lib/api/admin-health";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import { listAdminTenants } from "@/lib/api/tenants";
import * as swrKeys from "@/lib/swr-keys";

const REFRESH_INTERVAL = 30_000;

function workerBadgeVariant(status: "healthy" | "degraded" | "unconfigured"): "success" | "warning" | "neutral" {
  if (status === "healthy") return "success";
  if (status === "degraded") return "warning";
  return "neutral";
}

interface QuickLink {
  href: string;
  label: string;
  hint: (ctx: { tenantCount: number; providerCount: number; workerHealthy: boolean | null }) => string | null;
}

const QUICK_LINKS: QuickLink[] = [
  { href: "/admin/tenants", label: "Tenants", hint: ({ tenantCount }) => `${tenantCount} active` },
  { href: "/admin/agent-definitions", label: "Agents", hint: () => null },
  { href: "/admin/telephony", label: "Telephony", hint: () => null },
  { href: "/admin/releases", label: "Releases", hint: () => null },
  { href: "/admin/users", label: "Users", hint: () => null },
  { href: "/admin/health", label: "Health", hint: ({ workerHealthy }) => workerHealthy === true ? "All healthy" : workerHealthy === false ? "Needs attention" : null },
  { href: "/admin/settings", label: "Settings", hint: ({ providerCount }) => `${providerCount} providers` },
];

export default function DeploymentAdminHomePage() {
  const {
    data: tenants,
    error: tenantsError,
    isLoading: tenantsLoading,
  } = useSWR(swrKeys.adminDashboardTenants(), () => listAdminTenants(500, 0), { refreshInterval: REFRESH_INTERVAL });
  const {
    data: providers,
    error: providersError,
    isLoading: providersLoading,
  } = useSWR(swrKeys.adminDashboardOidcProviders(), listOidcProviders, { refreshInterval: REFRESH_INTERVAL });
  const {
    data: health,
    error: healthError,
    isLoading: healthLoading,
  } = useSWR(swrKeys.adminDashboardPlatformHealth(), getPlatformHealth, { refreshInterval: REFRESH_INTERVAL });

  const activeTenants = tenants?.filter((t) => t.status === "active").length ?? 0;
  const loadError = tenantsError || providersError || healthError ? toErrorMessage(tenantsError ?? providersError ?? healthError) : null;

  const platformDegraded = health && health.worker_status.platform_api === "degraded";
  const temporalDegraded = health && health.worker_status.temporal === "degraded";
  const hasDegradedWorker = platformDegraded || temporalDegraded;
  const totalTenants = tenants?.length ?? 0;
  const noTenants = !tenantsLoading && totalTenants === 0;

  const hintCtx = {
    tenantCount: activeTenants,
    providerCount: providers?.length ?? 0,
    workerHealthy: health == null ? null : health.worker_status.platform_api === "healthy" && health.worker_status.temporal === "healthy",
  };

  return (
    <AdminPageShell title="Deployment Console">
      {loadError ? (
        <div
          data-testid="admin-dashboard-load-error"
          className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]"
        >
          {loadError}
        </div>
      ) : null}

      {/* Health hero + error rate */}
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="border-[var(--color-primary-200)] bg-[var(--color-primary-50)]">
          <CardHeader className="text-xs font-semibold uppercase tracking-wide text-[var(--color-primary-600)]">
            Platform Health
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span data-testid="admin-dashboard-active-calls" className="text-3xl font-semibold text-[var(--color-neutral-900)]">
                {healthLoading || !health ? "..." : health.active_calls.total}
              </span>
              <span className="text-sm text-[var(--color-neutral-600)]">active calls</span>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge data-testid="admin-dashboard-worker-platform" variant={health ? workerBadgeVariant(health.worker_status.platform_api) : "neutral"}>
                API {health?.worker_status.platform_api ?? "..."}
              </Badge>
              <Badge data-testid="admin-dashboard-worker-temporal" variant={health ? workerBadgeVariant(health.worker_status.temporal) : "neutral"}>
                Temporal {health?.worker_status.temporal ?? "..."}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
            Error Rate
          </CardHeader>
          <CardContent data-testid="admin-dashboard-error-rate" className="text-3xl font-semibold">
            {healthLoading || !health ? "..." : health.call_error_rate != null ? `${(health.call_error_rate * 100).toFixed(1)}%` : "N/A"}
          </CardContent>
        </Card>
      </div>

      {/* Conditional attention block */}
      {hasDegradedWorker ? (
        <div
          data-testid="admin-dashboard-attention"
          className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-warning-500)] bg-[var(--color-warning-50)] px-4 py-3 text-sm text-[var(--color-neutral-800)]"
        >
          <span className="font-semibold">Attention:</span>
          {platformDegraded ? "Platform API worker degraded. " : ""}
          {temporalDegraded ? "Temporal worker degraded. " : ""}
          <Link href="/admin/health" className="ml-auto shrink-0 font-medium text-[var(--color-primary-600)] underline underline-offset-2">
            View health
          </Link>
        </div>
      ) : null}

    </AdminPageShell>
  );
}
