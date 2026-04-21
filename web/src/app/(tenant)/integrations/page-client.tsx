"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";
import { Input } from "@grove/ui/input";
import { PageFrame } from "@/components/page-frame";
import { PageHeader } from "@/components/page-header";
import { useTenantCopy } from "@/components/tenant-locale-provider";
import {
  createConnector,
  listConnectorCatalog,
  listConnectors,
  runConnectorHealthCheck,
  updateConnector,
  type ConnectorCatalogAdapter,
  type ConnectorCatalogType,
  type ConnectorResponse,
  type ConnectorStatus,
  type ConnectorType,
} from "@/lib/api/connectors";
import { PlatformApiError } from "@/lib/api/platform";
import { buildDefaultConfigForAdapter, serializeConfig } from "@/lib/connectors/default-config";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import { useTenantSolutionState } from "@/lib/solutions";
import * as swrKeys from "@/lib/swr-keys";

const EMPTY_CONNECTORS: ConnectorResponse[] = [];
const EMPTY_CATALOG: ConnectorCatalogType[] = [];
type ViewFilter = "all" | ConnectorType;
type ActionNoticeTone = "success" | "warning";
type FormState = {
  connectorType: ConnectorType;
  adapterName: string;
  displayName: string;
  status: ConnectorStatus;
  configText: string;
};
type ActionNotice = {
  message: string;
  tone: ActionNoticeTone;
};
const EMPTY_FORM: FormState = {
  connectorType: "crm",
  adapterName: "",
  displayName: "",
  status: "active",
  configText: "{}",
};

function formatDateTime(value: string | null): string {
  if (!value) {
    return "—";
  }
  return new Date(value).toLocaleString();
}

function connectorTypeLabel(type: ConnectorType): string {
  switch (type) {
    case "crm":
      return "Customer records";
    case "scheduling":
      return "Scheduling";
    case "notifications":
      return "Messages";
  }
}

function statusLabel(connector: ConnectorResponse): string {
  if (connector.status === "disabled") {
    return "Turned off";
  }
  if (!connector.latest_health) {
    return "Needs check";
  }
  if (connector.latest_health.status === "healthy") {
    return "Ready";
  }
  return "Needs attention";
}

function statusVariant(connector: ConnectorResponse): "success" | "warning" | "neutral" | "error" {
  if (connector.status === "disabled") {
    return "neutral";
  }
  if (!connector.latest_health) {
    return "warning";
  }
  if (connector.latest_health.status === "healthy") {
    return "success";
  }
  return "error";
}

function healthSummary(connector: ConnectorResponse): string {
  if (connector.status === "disabled") {
    return "This connection is turned off.";
  }
  if (!connector.latest_health) {
    return "Run a health check before you rely on this connection.";
  }
  if (connector.latest_health.status === "healthy") {
    return connector.latest_health.latency_ms != null
      ? `Last check passed in ${connector.latest_health.latency_ms} ms.`
      : "Last check passed.";
  }
  return connector.latest_health.error_message ?? "Last check failed.";
}

function formatConfigSummary(config: Record<string, unknown>): string {
  const keys = Object.keys(config);
  if (keys.length === 0) {
    return "No configuration saved yet.";
  }
  return keys.slice(0, 4).join(", ");
}

function parseConfigText(configText: string): Record<string, unknown> {
  const trimmed = configText.trim();
  if (!trimmed) {
    return {};
  }
  const parsed = JSON.parse(trimmed) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Configuration must be a JSON object.");
  }
  return parsed as Record<string, unknown>;
}

function catalogKey(connectorType: ConnectorType, adapterName: string): string {
  return `${connectorType}:${adapterName}`;
}

function schemaFieldNames(schema: Record<string, unknown>): string[] {
  const properties = schema.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) {
    return [];
  }
  return Object.keys(properties as Record<string, unknown>);
}

function healthCheckNotice(connector: ConnectorResponse): ActionNotice {
  if (connector.latest_health?.status === "healthy") {
    return { message: "Health check passed.", tone: "success" };
  }

  if (connector.latest_health?.error_message) {
    return {
      message: `Health check finished, but this connection still needs attention: ${connector.latest_health.error_message}`,
      tone: "warning",
    };
  }

  return {
    message: "Health check finished, but this connection still needs attention.",
    tone: "warning",
  };
}

export function IntegrationsClientPage({ canManage }: { canManage: boolean }) {
  const copy = useTenantCopy();
  const clinicBookingsSolution = useTenantSolutionState("appointment_booking");
  const [search, setSearch] = useState("");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [selectedConnectorId, setSelectedConnectorId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formBusy, setFormBusy] = useState(false);
  const [healthBusyId, setHealthBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    canManage ? swrKeys.tenantConnectors() : null,
    () => listConnectors(),
    {
      revalidateOnFocus: false,
    },
  );
  const {
    data: catalogData,
    error: catalogError,
    isLoading: catalogLoading,
  } = useSWR(
    canManage ? swrKeys.tenantConnectorsCatalog() : null,
    () => listConnectorCatalog(),
    {
      revalidateOnFocus: false,
    },
  );

  const connectors = data ?? EMPTY_CONNECTORS;
  const connectorCatalog = catalogData ?? EMPTY_CATALOG;
  const forbidden = !canManage || (error instanceof PlatformApiError && error.status === 403);
  const loadError = error && !forbidden ? toErrorMessage(error) : null;
  const catalogLoadError = catalogError && !forbidden ? toErrorMessage(catalogError) : null;
  const selectedConnector = connectors.find((connector) => connector.id === selectedConnectorId) ?? null;
  const selectedConnectorIsInternalOnly = selectedConnector?.adapter_internal_only ?? false;
  const selectedConnectorNeedsSolutionEnabled =
    selectedConnector?.adapter_source_kind === "entry_point" && selectedConnectorIsInternalOnly === false;
  const catalogByType = useMemo<Record<ConnectorType, ConnectorCatalogAdapter[]>>(
    () => ({
      crm: connectorCatalog.find((item) => item.connector_type === "crm")?.adapters ?? [],
      scheduling: connectorCatalog.find((item) => item.connector_type === "scheduling")?.adapters ?? [],
      notifications: connectorCatalog.find((item) => item.connector_type === "notifications")?.adapters ?? [],
    }),
    [connectorCatalog],
  );
  const catalogIndex = useMemo(
    () =>
      new Map(
        connectorCatalog.flatMap((item) =>
          item.adapters.map((adapter) => [catalogKey(item.connector_type, adapter.adapter_name), adapter] as const),
        ),
      ),
    [connectorCatalog],
  );
  const formAdapters = catalogByType[form.connectorType];
  const selectedFormAdapter =
    form.adapterName.trim() === ""
      ? null
      : (catalogIndex.get(catalogKey(form.connectorType, form.adapterName.trim())) ?? null);

  useEffect(() => {
    if (!canManage || selectedConnector) {
      return;
    }
    const adapters = catalogByType[form.connectorType];
    if (adapters.length === 0) {
      return;
    }
    if (form.adapterName && adapters.some((adapter) => adapter.adapter_name === form.adapterName)) {
      return;
    }
    const defaultAdapter = adapters[0];
    setForm((current) => ({
      ...current,
      adapterName: defaultAdapter.adapter_name,
      configText: buildDefaultConfigForAdapter(current.connectorType, defaultAdapter.adapter_name),
    }));
  }, [canManage, catalogByType, form.adapterName, form.connectorType, selectedConnector]);

  const filteredConnectors = useMemo(() => {
    const query = search.trim().toLowerCase();
    return connectors.filter((connector) => {
      if (viewFilter !== "all" && connector.connector_type !== viewFilter) {
        return false;
      }
      if (!query) {
        return true;
      }
      return [connector.display_name, connector.adapter_name, connectorTypeLabel(connector.connector_type)]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [connectors, search, viewFilter]);

  const activeCount = connectors.filter((connector) => connector.status === "active").length;
  const healthyCount = connectors.filter(
    (connector) => connector.status === "active" && connector.latest_health?.status === "healthy",
  ).length;
  const attentionCount = connectors.filter(
    (connector) =>
      connector.status === "active" && (connector.latest_health == null || connector.latest_health.status !== "healthy"),
  ).length;
  const lastChecked = connectors
    .map((connector) => connector.latest_health?.checked_at ?? null)
    .filter((value): value is string => value !== null)
    .sort()
    .at(-1) ?? null;
  const clinicConnectorSummary = useMemo(
    () => ({
      crmReady: connectors.some(
        (connector) =>
          connector.connector_type === "crm" &&
          connector.status === "active" &&
          connector.latest_health?.status === "healthy",
      ),
      notificationsReady: connectors.some(
        (connector) =>
          connector.connector_type === "notifications" &&
          connector.status === "active" &&
          connector.latest_health?.status === "healthy",
      ),
    }),
    [connectors],
  );

  const columns: DataTableColumn<ConnectorResponse>[] = [
    {
      id: "integration",
      header: "Integration",
      cell: (connector) => {
        const adapter = catalogIndex.get(catalogKey(connector.connector_type, connector.adapter_name));
        return (
          <div className="space-y-1">
            <p data-testid={`integrations-name-${connector.id}`} className="font-medium text-[var(--color-neutral-900)]">
              {connector.display_name}
            </p>
            <p className="text-xs text-[var(--color-neutral-500)]">
              {connectorTypeLabel(connector.connector_type)} · {adapter?.title ?? "Connector"} <code>{connector.adapter_name}</code>
            </p>
          </div>
        );
      },
    },
    {
      id: "status",
      header: "Status",
      cell: (connector) => (
        <div className="space-y-1">
          <Badge data-testid={`integrations-status-${connector.id}`} variant={statusVariant(connector)}>
            {statusLabel(connector)}
          </Badge>
          <p className="text-xs text-[var(--color-neutral-500)]">{healthSummary(connector)}</p>
        </div>
      ),
    },
    {
      id: "config",
      header: "Saved fields",
      cell: (connector) => (
        <span className="text-xs text-[var(--color-neutral-600)]" title={serializeConfig(connector.config)}>
          {formatConfigSummary(connector.config)}
        </span>
      ),
    },
    {
      id: "updated_at",
      header: "Updated",
      cell: (connector) => (
        <span className="text-xs text-[var(--color-neutral-600)]">{formatDateTime(connector.updated_at)}</span>
      ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      cell: (connector) => {
        const adapter = catalogIndex.get(catalogKey(connector.connector_type, connector.adapter_name));
        const supportsHealthCheck = adapter?.ui_hints.supports_health_check ?? false;
        return (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              data-testid={`integrations-edit-${connector.id}`}
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedConnectorId(connector.id);
                setForm({
                  connectorType: connector.connector_type,
                  adapterName: connector.adapter_name,
                  displayName: connector.display_name,
                  status: connector.status,
                  configText: serializeConfig(connector.config),
                });
                setActionError(null);
                setActionNotice(null);
              }}
            >
              Edit
            </Button>
            <Button
              data-testid={`integrations-health-${connector.id}`}
              size="sm"
              variant="outline"
              disabled={!supportsHealthCheck || healthBusyId === connector.id}
              disabledReason={!supportsHealthCheck ? "This connector does not support health checks" : undefined}
              onClick={async () => {
                setActionError(null);
                setActionNotice(null);
                setHealthBusyId(connector.id);
                try {
                  const result = await runConnectorHealthCheck(connector.id);
                  await mutate();
                  setActionNotice(
                    healthCheckNotice({
                      ...connector,
                      latest_health: result.latest_health,
                    }),
                  );
                } catch (healthError) {
                  setActionError(toErrorMessage(healthError));
                } finally {
                  setHealthBusyId(null);
                }
              }}
            >
              {!supportsHealthCheck ? "No check" : healthBusyId === connector.id ? "Checking…" : "Run check"}
            </Button>
          </div>
        );
      },
    },
  ];

  function resetForm(nextType: ConnectorType = "crm"): void {
    setSelectedConnectorId(null);
    setForm({
      connectorType: nextType,
      adapterName: "",
      displayName: "",
      status: "active",
      configText: "{}",
    });
  }

  async function handleSubmit(): Promise<void> {
    setActionError(null);
    setActionNotice(null);

    const displayName = form.displayName.trim();
    const adapterName = form.adapterName.trim();
    if (!displayName) {
      setActionError("Name your integration so operators know what it controls.");
      return;
    }
    if (!adapterName) {
      setActionError(selectedConnector ? "Connector identifier is required." : "Choose a connector from the catalog.");
      return;
    }
    if (!selectedConnector && selectedFormAdapter === null) {
      setActionError("Choose a declared connector from the catalog before saving.");
      return;
    }

    let config: Record<string, unknown>;
    try {
      config = parseConfigText(form.configText);
    } catch (parseError) {
      setActionError(toErrorMessage(parseError));
      return;
    }

    setFormBusy(true);
    try {
      if (selectedConnector) {
        const updateInput: {
          display_name: string;
          status: ConnectorStatus;
          config?: Record<string, unknown>;
        } = {
          display_name: displayName,
          status: form.status,
        };
        const originalConfigText = serializeConfig(selectedConnector.config);
        if (selectedFormAdapter !== null || form.configText !== originalConfigText) {
          updateInput.config = config;
        }
        await updateConnector(selectedConnector.id, updateInput);
        setActionNotice({ message: `Updated ${displayName}.`, tone: "success" });
      } else {
        await createConnector({
          connector_type: form.connectorType,
          adapter_name: adapterName,
          display_name: displayName,
          status: form.status,
          config,
        });
        setActionNotice({ message: `Added ${displayName}.`, tone: "success" });
      }
      await mutate();
      resetForm(form.connectorType);
    } catch (submitError) {
      setActionError(toErrorMessage(submitError));
    } finally {
      setFormBusy(false);
    }
  }

  return (
    <PageFrame className="px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader compact title={copy.integrations.title} description={copy.integrations.description} />
        <Button type="button" variant="outline" onClick={() => void mutate()} disabled={!canManage || isLoading || isValidating}>
          {isValidating ? "Refreshing…" : "Refresh"}
        </Button>
      </div>

      {actionError ? (
        <Card className="border-[var(--color-error-200)] bg-[var(--color-error-50)] text-[var(--color-error-700)]">
          <CardContent className="p-4 text-sm" data-testid="integrations-action-error">
            {actionError}
          </CardContent>
        </Card>
      ) : null}
      {actionNotice ? (
        <Card
          className={
            actionNotice.tone === "success"
              ? "border-[var(--color-success-200)] bg-[var(--color-success-50)] text-[var(--color-success-700)]"
              : "border-[var(--color-warning-200)] bg-[var(--color-warning-50)] text-[var(--color-warning-700)]"
          }
        >
          <CardContent className="p-4 text-sm" data-testid="integrations-action-notice">
            {actionNotice.message}
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
            Active Integrations
          </CardHeader>
          <CardContent className="text-2xl font-semibold" data-testid="integrations-summary-active">
            {activeCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
            Healthy Now
          </CardHeader>
          <CardContent className="text-2xl font-semibold" data-testid="integrations-summary-healthy">
            {healthyCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
            Needs Attention
          </CardHeader>
          <CardContent className="text-2xl font-semibold" data-testid="integrations-summary-attention">
            {attentionCount}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
            Latest Health Check
          </CardHeader>
          <CardContent className="text-sm font-medium text-[var(--color-neutral-900)]" data-testid="integrations-summary-latest">
            {formatDateTime(lastChecked)}
          </CardContent>
        </Card>
      </section>

      {clinicBookingsSolution.enabled ? (
        <Card id="clinic-booking-ops-map" data-testid="integrations-clinic-ops-map">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Clinic booking connectors</h2>
                <p className="text-sm text-[var(--color-neutral-500)]">
                  This page is the raw connector registry. The bookings workspace is where staff sees whether patient
                  record sync, confirmation texts, and reminder texts are truly ready for live use.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/bookings#clinic-booking-readiness"
                  className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-primary-600)] bg-[var(--color-primary-600)] px-4 text-sm font-medium text-white hover:bg-[var(--color-primary-700)]"
                  data-testid="integrations-open-clinic-bookings"
                >
                  Open clinic setup
                </Link>
                <Link
                  href="/bookings?priority=urgent#clinic-follow-up-queue"
                  className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-sm font-medium text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                  data-testid="integrations-open-clinic-queue"
                >
                  Open follow-up queue
                </Link>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 lg:grid-cols-3">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Patient record sync</p>
              <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
                Confirmed bookings need one healthy CRM-style connector before reception can trust automatic patient updates.
              </p>
              <Badge className="mt-3" variant={clinicConnectorSummary.crmReady ? "success" : "warning"}>
                {clinicConnectorSummary.crmReady ? "CRM connection looks healthy" : "CRM connection still needs attention"}
              </Badge>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Confirmation and reminder texts</p>
              <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
                SMS follow-up depends on one healthy notifications connector plus reminder timing in the bookings workspace.
              </p>
              <Badge className="mt-3" variant={clinicConnectorSummary.notificationsReady ? "success" : "warning"}>
                {clinicConnectorSummary.notificationsReady
                  ? "Notifications connection looks healthy"
                  : "Notifications connection still needs attention"}
              </Badge>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4">
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">Operator workflow</p>
              <p className="mt-2 text-sm text-[var(--color-neutral-600)]">
                Once a connector itself looks healthy, staff should leave this page. Ownership, callbacks, and manual fallback
                notes belong in the bookings workspace.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {forbidden ? (
        <Card data-testid="integrations-forbidden">
          <CardContent className="space-y-2 p-6">
            <h2 className="text-lg font-semibold">Admin access required</h2>
            <p className="text-sm text-[var(--color-neutral-500)]">
              Only workspace admins can manage integrations. Ask an admin when you need to check connection health or update
              system mappings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
          <Card>
            <CardHeader className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">Connected systems</h2>
                <p className="text-sm text-[var(--color-neutral-500)]">
                  Source: <code>/connectors</code>
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                <div className="space-y-2">
                  <label htmlFor="integrations-search" className="text-sm font-medium text-[var(--color-neutral-700)]">
                    Search
                  </label>
                  <Input
                    id="integrations-search"
                    data-testid="integrations-search"
                    value={search}
                    onChange={(event) => setSearch(event.currentTarget.value)}
                    placeholder="name, connector, or purpose"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="integrations-filter-type" className="text-sm font-medium text-[var(--color-neutral-700)]">
                    Purpose
                  </label>
                  <select
                    id="integrations-filter-type"
                    data-testid="integrations-filter-type"
                    className="w-full rounded-xl border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm"
                    value={viewFilter}
                    onChange={(event) => setViewFilter(event.currentTarget.value as ViewFilter)}
                  >
                    <option value="all">All connections</option>
                    <option value="crm">Customer records</option>
                    <option value="scheduling">Scheduling</option>
                    <option value="notifications">Messages</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadError ? (
                <p className="text-sm text-[var(--color-error-700)]" data-testid="integrations-load-error">
                  {loadError}
                </p>
              ) : null}
              <DataTable
                  columns={columns}
                  rows={filteredConnectors}
                  rowKey="id"
                  emptyState="No integrations matched these filters."
                  loading={isLoading}
                />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">{selectedConnector ? "Update integration" : "Add integration"}</h2>
              <p className="text-sm text-[var(--color-neutral-500)]">
                Use secret references like <code>env://TOKEN_NAME</code>. Do not paste raw secrets into the config.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="integrations-form-type" className="text-sm font-medium text-[var(--color-neutral-700)]">
                  Purpose
                </label>
                <select
                  id="integrations-form-type"
                  data-testid="integrations-form-type"
                  className="w-full rounded-xl border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm"
                  value={form.connectorType}
                  onChange={(event) => {
                    const nextType = event.currentTarget.value as ConnectorType;
                    setForm((current) => ({
                      ...current,
                      connectorType: nextType,
                      adapterName: "",
                      configText: "{}",
                    }));
                  }}
                  disabled={Boolean(selectedConnector)}
                >
                  <option value="crm">Customer records</option>
                  <option value="scheduling">Scheduling</option>
                  <option value="notifications">Messages</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="integrations-form-adapter" className="text-sm font-medium text-[var(--color-neutral-700)]">
                  Connector
                </label>
                {selectedConnector ? (
                  <Input
                    id="integrations-form-adapter"
                    data-testid="integrations-form-adapter"
                    value={form.adapterName}
                    disabled
                    aria-describedby="integrations-form-adapter-help"
                  />
                ) : (
                  <select
                    id="integrations-form-adapter"
                    data-testid="integrations-form-adapter"
                    className="w-full rounded-xl border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm"
                    value={form.adapterName}
                    onChange={(event) => {
                      const nextAdapterName = event.currentTarget.value;
                      setForm((current) => ({
                        ...current,
                        adapterName: nextAdapterName,
                        configText: buildDefaultConfigForAdapter(current.connectorType, nextAdapterName || null),
                      }));
                    }}
                    disabled={catalogLoading || formAdapters.length === 0}
                    aria-describedby="integrations-form-adapter-help"
                  >
                    {formAdapters.length === 0 ? (
                      <option value="">{catalogLoading ? "Loading connectors…" : "No connectors declared"}</option>
                    ) : null}
                    {formAdapters.map((adapter) => (
                      <option key={adapter.adapter_name} value={adapter.adapter_name}>
                        {adapter.title}
                      </option>
                    ))}
                  </select>
                )}
                <p id="integrations-form-adapter-help" className="text-xs text-[var(--color-neutral-500)]">
                  {selectedConnector
                    ? "Connector implementation is fixed after creation."
                    : "Choose a declared connector implementation here. The legacy raw HTTP connector stays API-only and is intentionally hidden from this typed setup flow."}
                </p>
              </div>

              {selectedFormAdapter ? (
                <div
                  data-testid="integrations-adapter-metadata"
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-4 text-sm"
                >
                  <p className="font-medium text-[var(--color-neutral-950)]">{selectedFormAdapter.title}</p>
                  <p className="mt-1 text-[var(--color-neutral-600)]">{selectedFormAdapter.description}</p>
                  {selectedFormAdapter.ui_hints.setup_summary ? (
                    <p className="mt-3 text-[var(--color-neutral-700)]">{selectedFormAdapter.ui_hints.setup_summary}</p>
                  ) : null}
                  <p className="mt-3 text-xs text-[var(--color-neutral-500)]">
                    Expected config fields:{" "}
                    {schemaFieldNames(selectedFormAdapter.config_schema).length > 0
                      ? schemaFieldNames(selectedFormAdapter.config_schema).join(", ")
                      : "No named fields declared."}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                    Secret refs:{" "}
                    {selectedFormAdapter.ui_hints.secret_fields.length > 0
                      ? selectedFormAdapter.ui_hints.secret_fields.join(", ")
                      : "No secret fields declared."}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-neutral-500)]">
                    Health checks: {selectedFormAdapter.ui_hints.supports_health_check ? "available" : "not declared"}
                  </p>
                </div>
              ) : null}
              {selectedConnector && selectedFormAdapter === null ? (
                selectedConnectorIsInternalOnly ? (
                  <p
                    className="text-xs text-[var(--color-warning-700)]"
                    data-testid="integrations-internal-adapter-warning"
                  >
                    This connector uses an internal-only adapter and cannot be edited from the tenant workspace.
                  </p>
                ) : selectedConnectorNeedsSolutionEnabled ? (
                  <p
                    className="text-xs text-[var(--color-warning-700)]"
                    data-testid="integrations-solution-disabled-adapter-warning"
                  >
                    This connector belongs to a solution that is currently disabled. You can rename or disable it here, but config
                    edits stay blocked until the owning solution is re-enabled in this workspace.
                  </p>
                ) : (
                  <p className="text-xs text-[var(--color-warning-700)]" data-testid="integrations-legacy-adapter-warning">
                    This saved connector uses a legacy compatibility or undeclared adapter. You can rename or disable it here, but
                    config edits stay blocked until the adapter is republished with catalog metadata or managed through the API-only
                    compatibility lane.
                  </p>
                )
              ) : null}
              {catalogLoadError ? (
                <p className="text-xs text-[var(--color-error-700)]" data-testid="integrations-catalog-load-error">
                  {catalogLoadError}
                </p>
              ) : null}

              <div className="space-y-2">
                <label htmlFor="integrations-form-name" className="text-sm font-medium text-[var(--color-neutral-700)]">
                  Name your integration
                </label>
                <Input
                  id="integrations-form-name"
                  data-testid="integrations-form-name"
                  value={form.displayName}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setForm((current) => ({ ...current, displayName: value }));
                  }}
                  placeholder="Clinic Calendar"
                  disabled={selectedConnectorIsInternalOnly}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="integrations-form-status" className="text-sm font-medium text-[var(--color-neutral-700)]">
                  Status
                </label>
                <select
                  id="integrations-form-status"
                  data-testid="integrations-form-status"
                  className="w-full rounded-xl border border-[var(--color-neutral-200)] bg-white px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(event) => {
                    const value = event.currentTarget.value as ConnectorStatus;
                    setForm((current) => ({ ...current, status: value }));
                  }}
                  disabled={selectedConnectorIsInternalOnly}
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="integrations-form-config" className="text-sm font-medium text-[var(--color-neutral-700)]">
                  Configuration (JSON)
                </label>
                <textarea
                  id="integrations-form-config"
                  data-testid="integrations-form-config"
                  className="min-h-52 w-full rounded-xl border border-[var(--color-neutral-200)] bg-white px-3 py-2 font-mono text-xs"
                  value={form.configText}
                  onChange={(event) => {
                    const value = event.currentTarget.value;
                    setForm((current) => ({ ...current, configText: value }));
                  }}
                  disabled={selectedConnectorIsInternalOnly || (selectedConnector !== null && selectedFormAdapter === null)}
                />
                <p className="text-xs text-[var(--color-neutral-500)]">
                  Save the config object declared by the selected connector. Secret references are fine; raw passwords are not.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  data-testid="integrations-form-submit"
                  onClick={() => void handleSubmit()}
                  disabled={formBusy || selectedConnectorIsInternalOnly}
                >
                  {formBusy ? "Saving…" : selectedConnector ? "Save changes" : "Add integration"}
                </Button>
                {selectedConnector ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetForm(form.connectorType)}
                    disabled={formBusy}
                  >
                    Cancel edit
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PageFrame>
  );
}
