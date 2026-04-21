"use client";

import { useState } from "react";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";
import { Input } from "@grove/ui/input";
import { AdminTenantPicker } from "@/components/admin-tenant-picker";
import { AdminPageShell } from "@/components/admin-page-shell";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import { useTenantPicker } from "@/hooks/use-tenant-picker";
import { listAdminTenantAuditEvents, type AdminAuditEvent, type AdminAuditEventsQuery } from "@/lib/api/admin-security";
import * as swrKeys from "@/lib/swr-keys";

const EMPTY_EVENTS: AdminAuditEvent[] = [];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString();
}

function outcomeBadgeVariant(outcome: string | null): "success" | "error" | "warning" | "neutral" {
  if (!outcome) {
    return "neutral";
  }
  const normalized = outcome.toLowerCase();
  if (normalized.includes("success")) {
    return "success";
  }
  if (normalized.includes("error") || normalized.includes("fail")) {
    return "error";
  }
  return "warning";
}

function summarizeMetadata(metadata: Record<string, unknown>): string {
  const raw = JSON.stringify(metadata);
  if (!raw) {
    return "{}";
  }
  if (raw.length <= 96) {
    return raw;
  }
  return `${raw.slice(0, 93)}...`;
}

export default function DeploymentSecurityPage() {
  const [actionFilter, setActionFilter] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("");
  const [resourceIdFilter, setResourceIdFilter] = useState("");
  const [limitFilter, setLimitFilter] = useState("100");

  const [appliedFilters, setAppliedFilters] = useState<AdminAuditEventsQuery>({ limit: 100 });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const {
    tenants,
    selectedTenantId,
    selectTenant,
    selectedTenant,
    tenantsLoading,
    tenantsError,
  } = useTenantPicker({
    swrKey: swrKeys.adminSecurityTenants(),
  });

  const filtersKey = JSON.stringify(appliedFilters);
  const {
    data: eventsData,
    error: eventsError,
    isLoading: eventsLoading,
    isValidating: eventsValidating,
    mutate,
  } = useSWR(
    selectedTenantId ? swrKeys.adminSecurityEvents(selectedTenantId, filtersKey) : null,
    () => listAdminTenantAuditEvents(selectedTenantId, appliedFilters),
    {
      revalidateOnFocus: false,
    },
  );

  const events = eventsData ?? EMPTY_EVENTS;

  function applyFilters(): void {
    setActionError(null);
    setActionNotice(null);

    const limitValue = Number(limitFilter);
    if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 500) {
      setActionError("Limit must be an integer between 1 and 500");
      return;
    }

    setAppliedFilters({
      action: actionFilter.trim() || undefined,
      resource_type: resourceTypeFilter.trim() || undefined,
      resource_id: resourceIdFilter.trim() || undefined,
      limit: limitValue,
    });
    setActionNotice("Audit filters applied");
  }

  function clearFilters(): void {
    setActionFilter("");
    setResourceTypeFilter("");
    setResourceIdFilter("");
    setLimitFilter("100");
    setAppliedFilters({ limit: 100 });
    setActionError(null);
    setActionNotice("Filters cleared");
  }

  const columns: DataTableColumn<AdminAuditEvent>[] = [
    {
      id: "created_at",
      header: "Created",
      width: "9rem",
      className: "w-[9rem] min-w-[9rem] align-top",
      cell: (event) => <span className="text-xs text-[var(--color-neutral-600)]">{formatDate(event.created_at)}</span>,
    },
    {
      id: "action",
      header: "Action",
      width: "12rem",
      className: "w-[12rem] min-w-[12rem] align-top",
      cell: (event) => (
        <span data-testid={`admin-security-event-action-${event.id}`} className="font-medium text-[var(--color-neutral-900)]">
          {event.action}
        </span>
      ),
    },
    {
      id: "resource",
      header: "Resource",
      width: "11rem",
      className: "w-[11rem] min-w-[11rem] align-top",
      cell: (event) => (
        <div className="flex max-w-[10rem] flex-col gap-1">
          <span className="text-xs text-[var(--color-neutral-600)]">{event.resource_type ?? "-"}</span>
          <span className="font-mono text-xs break-all text-[var(--color-neutral-500)]">{event.resource_id ?? "-"}</span>
        </div>
      ),
    },
    {
      id: "outcome",
      header: "Outcome",
      width: "7.5rem",
      className: "w-[7.5rem] min-w-[7.5rem] align-top",
      cell: (event) => (
        <Badge data-testid={`admin-security-event-outcome-${event.id}`} variant={outcomeBadgeVariant(event.outcome)}>
          {event.outcome ?? "unknown"}
        </Badge>
      ),
    },
    {
      id: "actor",
      header: "Actor",
      width: "10rem",
      className: "w-[10rem] min-w-[10rem] align-top",
      cell: (event) => (
        <span className="font-mono text-xs break-all text-[var(--color-neutral-600)]">{event.actor_user_id ?? "system"}</span>
      ),
    },
    {
      id: "metadata",
      header: "Metadata",
      width: "13rem",
      className: "w-[13rem] min-w-[13rem] align-top",
      cell: (event) => (
        <div className="max-w-[11rem] space-y-2">
          <span className="block font-mono text-xs break-words text-[var(--color-neutral-500)]">
            {summarizeMetadata(event.metadata)}
          </span>
          <details className="text-xs text-[var(--color-neutral-600)]">
            <summary className="cursor-pointer font-medium text-[var(--color-primary-700)]">View details</summary>
            <pre className="mt-2 max-h-40 overflow-auto rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-2 font-mono text-[11px] whitespace-pre-wrap break-words text-[var(--color-neutral-600)]">
              {JSON.stringify(event.metadata, null, 2)}
            </pre>
          </details>
        </div>
      ),
    },
  ];

  const loadError = tenantsError || eventsError ? toErrorMessage(tenantsError ?? eventsError) : null;

  return (
    <AdminPageShell
      title="Security"
      description="Cross-tenant support audit visibility for deployment administrators."
      actions={
        <Button
          data-testid="admin-security-refresh"
          variant="outline"
          onClick={() => void mutate()}
          disabled={eventsValidating || !selectedTenantId}
        >
          {eventsValidating ? "Refreshing..." : "Refresh"}
        </Button>
      }
    >

      <AdminTenantPicker
        tenants={tenants}
        selectedTenant={selectedTenant}
        onSelect={selectTenant}
        loading={tenantsLoading}
        error={tenantsError ? toErrorMessage(tenantsError) : null}
      />

      <Card>
        <CardHeader className="flex flex-col gap-3">
          <h2 className="text-base font-semibold">Audit Event Filters</h2>
          <p className="text-sm text-[var(--color-neutral-500)]">
            Narrow the audit trail and inspect who changed what.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          <div className="space-y-1">
            <label htmlFor="admin-security-action-filter" className="text-xs font-semibold uppercase text-[var(--color-neutral-500)]">
              Action
            </label>
            <Input
              id="admin-security-action-filter"
              data-testid="admin-security-filter-action"
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
              placeholder="tenant.plan.updated"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="admin-security-resource-type-filter" className="text-xs font-semibold uppercase text-[var(--color-neutral-500)]">
              Resource Type
            </label>
            <Input
              id="admin-security-resource-type-filter"
              data-testid="admin-security-filter-resource-type"
              value={resourceTypeFilter}
              onChange={(event) => setResourceTypeFilter(event.target.value)}
              placeholder="tenant"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="admin-security-resource-id-filter" className="text-xs font-semibold uppercase text-[var(--color-neutral-500)]">
              Resource ID
            </label>
            <Input
              id="admin-security-resource-id-filter"
              data-testid="admin-security-filter-resource-id"
              value={resourceIdFilter}
              onChange={(event) => setResourceIdFilter(event.target.value)}
              placeholder="UUID or external id"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="admin-security-limit-filter" className="text-xs font-semibold uppercase text-[var(--color-neutral-500)]">
              Limit
            </label>
            <Input
              id="admin-security-limit-filter"
              data-testid="admin-security-filter-limit"
              value={limitFilter}
              onChange={(event) => setLimitFilter(event.target.value)}
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-wrap items-end gap-2 lg:col-span-2 2xl:col-span-4">
            <Button data-testid="admin-security-apply-filters" onClick={applyFilters} disabled={!selectedTenantId} className="min-w-[8.5rem]">
              Apply Filters
            </Button>
            <Button
              data-testid="admin-security-clear-filters"
              variant="outline"
              onClick={clearFilters}
              disabled={!selectedTenantId}
              className="min-w-[5.5rem]"
            >
              Clear
            </Button>
            <span className="text-xs text-[var(--color-neutral-500)]">
              {selectedTenant ? `Tenant: ${selectedTenant.name} (${selectedTenant.slug})` : "No tenant selected"}
            </span>
          </div>
        </CardContent>
      </Card>

      {loadError ? (
        <div
          data-testid="admin-security-load-error"
          className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]"
        >
          {loadError}
        </div>
      ) : null}
      {actionError ? (
        <div
          data-testid="admin-security-action-error"
          className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]"
        >
          {actionError}
        </div>
      ) : null}
      {actionNotice ? (
        <div
          data-testid="admin-security-action-notice"
          className="rounded-[var(--radius-md)] border border-[var(--color-success-500)] bg-[var(--color-success-50)] px-3 py-2 text-sm text-[var(--color-success-700)]"
        >
          {actionNotice}
        </div>
      ) : null}

      {!selectedTenantId && !tenantsLoading ? (
        <p className="text-sm text-[var(--color-neutral-500)]">Select a tenant to view audit events.</p>
      ) : (
        <div data-testid="admin-security-table">
          <DataTable columns={columns} rows={events} rowKey="id" emptyState="No audit events found." layout="fixed" loading={tenantsLoading || eventsLoading} />
        </div>
      )}
    </AdminPageShell>
  );
}
