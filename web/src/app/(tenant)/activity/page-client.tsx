"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";
import { Input } from "@grove/ui/input";
import { PageFrame } from "@/components/page-frame";
import { PageHeader } from "@/components/page-header";
import { useTenantLocale } from "@/components/tenant-locale-provider";
import { listTenantAuditEvents, type TenantAuditEvent, type TenantAuditEventsQuery } from "@/lib/api/activity";
import { PlatformApiError } from "@/lib/api/platform";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import { formatTenantDateTime } from "@/lib/tenant-locale";
import * as swrKeys from "@/lib/swr-keys";

const EMPTY_EVENTS: TenantAuditEvent[] = [];

function prettifyLabel(copy: ReturnType<typeof useTenantLocale>["copy"], value: string | null | undefined): string {
  if (!value) {
    return copy.activity.defaultActivity;
  }
  if (value in copy.activity.actionLabels) {
    return copy.activity.actionLabels[value];
  }
  if (value in copy.activity.resourceLabels) {
    return copy.activity.resourceLabels[value];
  }
  return value
    .replace(/[._]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
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

function outcomeLabel(copy: ReturnType<typeof useTenantLocale>["copy"], outcome: string | null): string {
  if (!outcome) {
    return copy.activity.recorded;
  }
  return prettifyLabel(copy, outcome);
}

function metadataSummary(copy: ReturnType<typeof useTenantLocale>["copy"], metadata: Record<string, unknown>): string {
  const summary = Object.entries(metadata)
    .filter(([key, value]) => key !== "outcome" && (typeof value === "string" || typeof value === "number" || typeof value === "boolean"))
    .slice(0, 3)
    .map(([key, value]) => `${prettifyLabel(copy, key)}: ${String(value)}`);

  if (summary.length === 0) {
    return copy.activity.noExtraDetails;
  }
  return summary.join(" · ");
}

function parseDateTimeFilter(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString();
}

function isSuccessful(outcome: string | null): boolean {
  return outcome?.toLowerCase().includes("success") ?? false;
}

function needsAttention(outcome: string | null): boolean {
  if (!outcome) {
    return false;
  }
  const normalized = outcome.toLowerCase();
  return normalized.includes("error") || normalized.includes("fail") || normalized.includes("warning");
}

type TenantActivityClientPageProps = {
  canViewActivity: boolean;
};

export function TenantActivityClientPage({ canViewActivity }: TenantActivityClientPageProps) {
  const { locale, copy } = useTenantLocale();
  const [actionFilter, setActionFilter] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("");
  const [resourceIdFilter, setResourceIdFilter] = useState("");
  const [sinceFilter, setSinceFilter] = useState("");
  const [untilFilter, setUntilFilter] = useState("");
  const [limitFilter, setLimitFilter] = useState("100");
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<TenantAuditEventsQuery>({ limit: 100 });

  const filtersKey = JSON.stringify(appliedFilters);
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    canViewActivity ? swrKeys.tenantActivity(filtersKey) : null,
    () => listTenantAuditEvents(appliedFilters),
    {
      revalidateOnFocus: false,
    },
  );

  const events = data ?? EMPTY_EVENTS;
  const forbidden = !canViewActivity || (error instanceof PlatformApiError && error.status === 403);
  const loadError = error && !forbidden ? toErrorMessage(error, copy.common.unexpectedError) : null;

  const successCount = events.filter((event) => isSuccessful(event.outcome)).length;
  const attentionCount = events.filter((event) => needsAttention(event.outcome)).length;
  const lastUpdated = events[0]?.created_at ?? null;

  const columns: DataTableColumn<TenantAuditEvent>[] = useMemo(
    () => [
      {
        id: "created_at",
        header: copy.activity.columns.when,
        cell: (event) => (
          <span className="text-xs text-[var(--color-neutral-600)]">
            {formatTenantDateTime(locale, event.created_at, copy.common.notRecorded)}
          </span>
        ),
      },
      {
        id: "action",
        header: copy.activity.columns.whatChanged,
        cell: (event) => (
          <div className="space-y-1">
            <p data-testid={`activity-event-action-${event.id}`} className="font-medium text-[var(--color-neutral-900)]">
              {prettifyLabel(copy, event.action)}
            </p>
            <p className="font-mono text-xs text-[var(--color-neutral-500)]">{event.action}</p>
          </div>
        ),
      },
      {
        id: "resource",
        header: copy.activity.columns.item,
        cell: (event) => (
          <div className="space-y-1">
            <p className="text-sm text-[var(--color-neutral-900)]">{prettifyLabel(copy, event.resource_type)}</p>
            <p className="font-mono text-xs text-[var(--color-neutral-500)]">{event.resource_id ?? "—"}</p>
          </div>
        ),
      },
      {
        id: "outcome",
        header: copy.activity.columns.result,
        cell: (event) => (
          <Badge data-testid={`activity-event-outcome-${event.id}`} variant={outcomeBadgeVariant(event.outcome)}>
            {outcomeLabel(copy, event.outcome)}
          </Badge>
        ),
      },
      {
        id: "actor",
        header: copy.activity.columns.changedBy,
        cell: (event) => (
          <div className="space-y-1">
            <p className="text-sm text-[var(--color-neutral-900)]">
              {event.actor_user_id ? copy.activity.actorTeamMember : copy.activity.actorSystem}
            </p>
            <p className="font-mono text-xs text-[var(--color-neutral-500)]">{event.actor_user_id ?? copy.activity.systemId}</p>
          </div>
        ),
      },
      {
        id: "details",
        header: copy.activity.columns.notes,
        cell: (event) => (
          <span className="text-xs text-[var(--color-neutral-600)]" title={JSON.stringify(event.metadata, null, 2)}>
            {metadataSummary(copy, event.metadata)}
          </span>
        ),
      },
    ],
    [copy, locale],
  );

  function applyFilters(): void {
    setActionError(null);
    setActionNotice(null);

    const limitValue = Number(limitFilter);
    if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 500) {
      setActionError(copy.activity.limitValidation);
      return;
    }

    const since = parseDateTimeFilter(sinceFilter);
    const until = parseDateTimeFilter(untilFilter);
    if (since && until && since >= until) {
      setActionError(copy.activity.rangeValidation);
      return;
    }

    setAppliedFilters({
      action: actionFilter.trim() || undefined,
      resource_type: resourceTypeFilter.trim() || undefined,
      resource_id: resourceIdFilter.trim() || undefined,
      since,
      until,
      limit: limitValue,
    });
    setActionNotice(copy.activity.filtersApplied);
  }

  function clearFilters(): void {
    setActionFilter("");
    setResourceTypeFilter("");
    setResourceIdFilter("");
    setSinceFilter("");
    setUntilFilter("");
    setLimitFilter("100");
    setAppliedFilters({ limit: 100 });
    setActionError(null);
    setActionNotice(copy.activity.filtersCleared);
  }

  return (
    <PageFrame className="px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader compact title={copy.activity.title} description={copy.activity.description} />
        {canViewActivity ? (
          <Button data-testid="activity-refresh" variant="outline" onClick={() => void mutate()} disabled={isValidating}>
            {isValidating ? copy.activity.refreshing : copy.activity.refresh}
          </Button>
        ) : null}
      </div>

      {forbidden ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">{copy.activity.adminOnlyTitle}</h2>
          </CardHeader>
          <CardContent>
            <div
              data-testid="activity-forbidden"
              className="rounded-[var(--radius-md)] border border-[var(--color-warning-500)] bg-[var(--color-warning-50)] px-4 py-3 text-sm text-[var(--color-warning-800)]"
            >
              {copy.activity.adminOnlyMessage}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader>
                <p className="text-sm font-medium text-[var(--color-neutral-500)]">{copy.activity.summary.recentEntries}</p>
              </CardHeader>
              <CardContent>
                <p data-testid="activity-summary-total" className="text-3xl font-semibold text-[var(--color-neutral-900)]">
                  {events.length}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <p className="text-sm font-medium text-[var(--color-neutral-500)]">{copy.activity.summary.successfulChanges}</p>
              </CardHeader>
              <CardContent>
                <p data-testid="activity-summary-success" className="text-3xl font-semibold text-[var(--color-neutral-900)]">
                  {successCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <p className="text-sm font-medium text-[var(--color-neutral-500)]">{copy.activity.summary.needsAttention}</p>
              </CardHeader>
              <CardContent>
                <p data-testid="activity-summary-attention" className="text-3xl font-semibold text-[var(--color-neutral-900)]">
                  {attentionCount}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <p className="text-sm font-medium text-[var(--color-neutral-500)]">{copy.activity.summary.latestUpdate}</p>
              </CardHeader>
              <CardContent>
                <p data-testid="activity-summary-last" className="text-sm font-medium text-[var(--color-neutral-900)]">
                  {formatTenantDateTime(locale, lastUpdated, copy.common.notRecorded)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">{copy.activity.filtersTitle}</h2>
                <p className="text-sm text-[var(--color-neutral-500)]">{copy.activity.filtersSource}</p>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Input
                id="activity-filter-action"
                data-testid="activity-filter-action"
                label={copy.activity.filterLabels.action}
                value={actionFilter}
                onChange={(event) => setActionFilter(event.currentTarget.value)}
                placeholder={copy.activity.filterPlaceholders.action}
              />
              <Input
                id="activity-filter-resource-type"
                data-testid="activity-filter-resource-type"
                label={copy.activity.filterLabels.resourceType}
                value={resourceTypeFilter}
                onChange={(event) => setResourceTypeFilter(event.currentTarget.value)}
                placeholder={copy.activity.filterPlaceholders.resourceType}
              />
              <Input
                id="activity-filter-resource-id"
                data-testid="activity-filter-resource-id"
                label={copy.activity.filterLabels.resourceId}
                value={resourceIdFilter}
                onChange={(event) => setResourceIdFilter(event.currentTarget.value)}
                placeholder={copy.activity.filterPlaceholders.resourceId}
              />
              <Input
                id="activity-filter-since"
                data-testid="activity-filter-since"
                label={copy.activity.filterLabels.since}
                type="datetime-local"
                value={sinceFilter}
                onChange={(event) => setSinceFilter(event.currentTarget.value)}
              />
              <Input
                id="activity-filter-until"
                data-testid="activity-filter-until"
                label={copy.activity.filterLabels.until}
                type="datetime-local"
                value={untilFilter}
                onChange={(event) => setUntilFilter(event.currentTarget.value)}
              />
              <Input
                id="activity-filter-limit"
                data-testid="activity-filter-limit"
                label={copy.activity.filterLabels.limit}
                value={limitFilter}
                onChange={(event) => setLimitFilter(event.currentTarget.value)}
                inputMode="numeric"
              />
              <div className="flex items-end gap-2 md:col-span-2 xl:col-span-3">
                <Button data-testid="activity-apply-filters" onClick={applyFilters}>
                  {copy.activity.applyFilters}
                </Button>
                <Button data-testid="activity-clear-filters" variant="outline" onClick={clearFilters}>
                  {copy.activity.clearFilters}
                </Button>
              </div>
            </CardContent>
          </Card>

          {actionError ? (
            <div
              data-testid="activity-action-error"
              className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]"
            >
              {actionError}
            </div>
          ) : null}
          {actionNotice ? (
            <div
              data-testid="activity-action-notice"
              className="rounded-[var(--radius-md)] border border-[var(--color-success-500)] bg-[var(--color-success-50)] px-3 py-2 text-sm text-[var(--color-success-700)]"
            >
              {actionNotice}
            </div>
          ) : null}
          {loadError ? (
            <div
              data-testid="activity-load-error"
              className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]"
            >
              {loadError}
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{copy.activity.recentActivityTitle}</h2>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-sm text-[var(--color-neutral-500)]">{copy.activity.loadingHistory}</p>
              ) : (
                <div data-testid="activity-table">
                  <DataTable columns={columns} rows={events} rowKey="id" emptyState={copy.activity.emptyState} />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </PageFrame>
  );
}
