"use client";

import { useState } from "react";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { Input } from "@grove/ui/input";
import { PageFrame } from "@/components/page-frame";
import { PageHeader } from "@/components/page-header";
import { RelativeTime } from "@/components/relative-time";
import { useTenantLocale } from "@/components/tenant-locale-provider";
import {
  ackOperatorEvent,
  listOperatorEvents,
  resolveOperatorEvent,
  type OperatorEventSeverity,
  type OperatorEventStatus,
} from "@/lib/api/operator-events";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import * as swrKeys from "@/lib/swr-keys";

function parseSince(value: string): string | undefined {
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

function severityBadgeVariant(severity: OperatorEventSeverity): "neutral" | "warning" | "error" {
  if (severity === "warning") {
    return "warning";
  }
  if (severity === "critical") {
    return "error";
  }
  return "neutral";
}

const severityBorderColor: Record<OperatorEventSeverity, string> = {
  info: "border-l-[var(--color-neutral-400)]",
  warning: "border-l-[var(--color-warning-500)]",
  critical: "border-l-[var(--color-error-500)]",
};

function statusBadgeVariant(status: OperatorEventStatus): "neutral" | "warning" | "success" {
  if (status === "open") {
    return "warning";
  }
  if (status === "resolved") {
    return "success";
  }
  return "neutral";
}

function severityLabel(copy: ReturnType<typeof useTenantLocale>["copy"], severity: OperatorEventSeverity): string {
  return copy.alerts.severityOptions[severity];
}

function statusLabel(copy: ReturnType<typeof useTenantLocale>["copy"], status: OperatorEventStatus): string {
  return copy.alerts.statusOptions[status];
}

export default function OperatorAlertsPage() {
  const { copy } = useTenantLocale();
  const [severity, setSeverity] = useState<"" | OperatorEventSeverity>("");
  const [status, setStatus] = useState<"" | OperatorEventStatus>("");
  const [since, setSince] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.operatorAlerts(severity, status, since),
    async () => {
      const response = await listOperatorEvents({
        severity: severity || undefined,
        status: status || undefined,
        since: parseSince(since),
        limit: 200,
      });
      return response.events;
    },
    { revalidateOnFocus: false, refreshInterval: 10_000 },
  );

  const events = data ?? [];

  async function ackEvent(eventId: string): Promise<void> {
    setActionBusyId(eventId);
    setActionError(null);
    setNotice(null);
    try {
      const response = await ackOperatorEvent(eventId);
      await mutate(
        (prev) => prev?.map((event) => (event.id === eventId ? response.event : event)),
        { revalidate: false },
      );
      setNotice(copy.alerts.acknowledgedNotice(eventId));
    } catch (err) {
      setActionError(toErrorMessage(err, copy.common.unexpectedError));
    } finally {
      setActionBusyId(null);
    }
  }

  async function resolveEvent(eventId: string): Promise<void> {
    setActionBusyId(eventId);
    setActionError(null);
    setNotice(null);
    try {
      const response = await resolveOperatorEvent(eventId);
      await mutate(
        (prev) => prev?.map((event) => (event.id === eventId ? response.event : event)),
        { revalidate: false },
      );
      setNotice(copy.alerts.resolvedNotice(eventId));
    } catch (err) {
      setActionError(toErrorMessage(err, copy.common.unexpectedError));
    } finally {
      setActionBusyId(null);
    }
  }

  return (
    <PageFrame className="px-6 py-8">
      <PageHeader title={copy.alerts.title} description={copy.alerts.description} />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">{copy.alerts.filtersTitle}</h2>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="operator-events-filter-severity" className="text-sm font-medium text-[var(--color-neutral-700)]">
                {copy.alerts.severityLabel}
              </label>
              <select
                id="operator-events-filter-severity"
                data-testid="operator-events-filter-severity"
                value={severity}
                onChange={(event) => setSeverity(event.currentTarget.value as "" | OperatorEventSeverity)}
                className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]"
              >
                <option value="">{copy.common.any}</option>
                <option value="info">{copy.alerts.severityOptions.info}</option>
                <option value="warning">{copy.alerts.severityOptions.warning}</option>
                <option value="critical">{copy.alerts.severityOptions.critical}</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="operator-events-filter-status" className="text-sm font-medium text-[var(--color-neutral-700)]">
                {copy.alerts.statusLabel}
              </label>
              <select
                id="operator-events-filter-status"
                data-testid="operator-events-filter-status"
                value={status}
                onChange={(event) => setStatus(event.currentTarget.value as "" | OperatorEventStatus)}
                className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]"
              >
                <option value="">{copy.common.any}</option>
                <option value="open">{copy.alerts.statusOptions.open}</option>
                <option value="acked">{copy.alerts.statusOptions.acked}</option>
                <option value="resolved">{copy.alerts.statusOptions.resolved}</option>
              </select>
            </div>
            <Input
              id="operator-events-filter-since"
              data-testid="operator-events-filter-since"
              label={copy.alerts.sinceLabel}
              type="datetime-local"
              value={since}
              onChange={(event) => setSince(event.currentTarget.value)}
            />
          </div>
          {error ? (
            <p data-testid="operator-events-error" className="mt-3 text-sm text-[var(--color-error-700)]">
              {toErrorMessage(error, copy.common.unexpectedError)}
            </p>
          ) : null}
          {actionError ? (
            <p data-testid="operator-events-action-error" className="mt-3 text-sm text-[var(--color-error-700)]">
              {actionError}
            </p>
          ) : null}
          {notice ? (
            <p data-testid="operator-events-notice" className="mt-3 text-sm text-[var(--color-success-700)]">
              {notice}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div data-testid="operator-events-table">
        <h2 className="mb-3 text-lg font-semibold">{copy.alerts.queueTitle}</h2>
        {isLoading ? (
          <p className="text-sm text-[var(--color-neutral-500)]">{copy.alerts.queueLoading}</p>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-neutral-500)]">{copy.alerts.queueEmpty}</p>
        ) : (
          <div className="space-y-2">
            {events.map((event) => (
              <div
                key={event.id}
                className={`flex items-start gap-4 rounded-lg border border-[var(--color-border)] border-l-4 bg-[var(--color-bg)] px-4 py-3 ${severityBorderColor[event.severity]}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{event.event_type}</span>
                    <Badge variant={severityBadgeVariant(event.severity)}>{severityLabel(copy, event.severity)}</Badge>
                    <Badge variant={statusBadgeVariant(event.status)}>{statusLabel(copy, event.status)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-neutral-500)]">{event.message ?? copy.alerts.noMessage}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[var(--color-neutral-500)]">
                    <RelativeTime date={event.created_at} data-testid={`operator-events-time-${event.id}`} />
                    {event.entity_id ? (
                      <span className="font-mono">
                        {event.entity_type ?? copy.alerts.entityFallback}:{event.entity_id}
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {event.status === "open" ? (
                    <Button
                      data-testid={`operator-events-ack-${event.id}`}
                      size="sm"
                      variant="outline"
                      disabled={actionBusyId === event.id}
                      onClick={() => void ackEvent(event.id)}
                    >
                      {copy.alerts.ackAction}
                    </Button>
                  ) : null}
                  {event.status !== "resolved" ? (
                    <Button
                      data-testid={`operator-events-resolve-${event.id}`}
                      size="sm"
                      variant="destructive"
                      disabled={actionBusyId === event.id}
                      onClick={() => void resolveEvent(event.id)}
                    >
                      {copy.alerts.resolveAction}
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageFrame>
  );
}
