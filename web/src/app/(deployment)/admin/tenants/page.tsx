"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { Button } from "@grove/ui/button";
import { Switch } from "@grove/ui/switch";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";
import { Input } from "@grove/ui/input";
import { Modal } from "@grove/ui/modal";
import { OverflowMenu } from "@grove/ui/overflow-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import { ActionBuilderCard } from "@/components/action-builder-card";
import { AdminPageShell } from "@/components/admin-page-shell";
import { tenantActionErrorMessage, tenantLoadErrorMessage } from "./error-copy";
import {
  listAdminTenants,
  offboardAdminTenant,
  onboardAdminTenant,
  type AdminTenantSummary,
  type MutableTenantStatus,
  type TenantStatus,
  updateAdminTenantLocale,
  updateAdminTenantStatus,
} from "@/lib/api/tenants";
import type { TenantUiLocale } from "@/lib/api/tenant-settings";
import * as swrKeys from "@/lib/swr-keys";

const EMPTY_TENANTS: AdminTenantSummary[] = [];

const TENANT_SLUG_PATTERN = /^[a-z][a-z0-9_]{0,62}$/;
const LOCAL_DEV_HINT_STORAGE_KEY = "admin-tenants:last-local-dev-login";

const LOCALE_OPTIONS: { value: TenantUiLocale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "lt", label: "Lithuanian" },
];
type LocalDevLoginHint = {
  adminUserId: string;
  provisioningStarted: boolean;
  tenantLabel: string;
  tenantSlug: string;
};

function localDevTokenLoginEnabled(): boolean {
  if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === "true") {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function nextStatus(status: TenantStatus): MutableTenantStatus | null {
  if (status === "active") {
    return "suspended";
  }
  if (status === "suspended") {
    return "active";
  }
  return null;
}

function formatDateParts(iso: string): { date: string; time: string } {
  const formatter = new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(iso));
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${lookup.month}/${lookup.day}/${lookup.year}`,
    time: `${lookup.hour ?? ""}:${lookup.minute ?? ""}${lookup.dayPeriod ? ` ${lookup.dayPeriod}` : ""}`,
  };
}

function parseGracePeriodDays(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 30) {
    return null;
  }
  return parsed;
}

function normalizeTenantSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['".,()]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/^[^a-z]+/, "")
    .slice(0, 63);
}

function localeLabel(locale: TenantUiLocale): string {
  return locale === "lt" ? "Lithuanian" : "English";
}

export default function DeploymentTenantsPage() {
  const includeNonProduction = true;
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [localDevLoginHint, setLocalDevLoginHint] = useState<LocalDevLoginHint | null>(null);

  const [onboardOpen, setOnboardOpen] = useState(false);
  const [onboardTenantName, setOnboardTenantName] = useState("");
  const [onboardTenantSlug, setOnboardTenantSlug] = useState("");
  const [onboardAdminEmail, setOnboardAdminEmail] = useState("");

  const [offboardOpen, setOffboardOpen] = useState(false);
  const [offboardTarget, setOffboardTarget] = useState<AdminTenantSummary | null>(null);
  const [offboardGracePeriodDays, setOffboardGracePeriodDays] = useState("7");
  const [offboardSlugConfirmation, setOffboardSlugConfirmation] = useState("");

  useEffect(() => {
    if (!localDevTokenLoginEnabled() || typeof window === "undefined") {
      return;
    }
    const rawValue = window.localStorage.getItem(LOCAL_DEV_HINT_STORAGE_KEY);
    if (!rawValue) {
      return;
    }
    try {
      const parsed = JSON.parse(rawValue) as LocalDevLoginHint;
      if (parsed.adminUserId && parsed.tenantLabel && parsed.tenantSlug) {
        setLocalDevLoginHint(parsed);
      }
    } catch {
      window.localStorage.removeItem(LOCAL_DEV_HINT_STORAGE_KEY);
    }
  }, []);

  const { data, error, isLoading, mutate } = useSWR(
    swrKeys.adminTenants(includeNonProduction),
    ([, nextIncludeNonProduction]: readonly [string, boolean]) => listAdminTenants(100, 0, { include_non_production: nextIncludeNonProduction }),
    {
      revalidateOnFocus: false,
    },
  );
  const tenants = data ?? EMPTY_TENANTS;
  const filtered = tenants;
  const tenantEmptyState = includeNonProduction
      ? "No tenants exist yet. Start onboarding when you are ready to create a new tenant."
      : "No production tenants are visible. Enable non-production tenants only if you intentionally need demo, test, or E2E tenants.";

  async function runAction<T>(action: () => Promise<T>): Promise<T | null> {
    setActionBusy(true);
    setActionError(null);
    setActionNotice(null);
    try {
      const result = await action();
      return result;
    } catch (err) {
      setActionError(tenantActionErrorMessage(err));
      return null;
    } finally {
      setActionBusy(false);
    }
  }

  function resetOnboardForm(): void {
    setOnboardTenantName("");
    setOnboardTenantSlug("");
    setOnboardAdminEmail("");
  }

  function closeOnboardModal(): void {
    if (actionBusy) {
      return;
    }
    setOnboardOpen(false);
    resetOnboardForm();
  }

  function openOffboardModal(tenant: AdminTenantSummary): void {
    setOffboardTarget(tenant);
    setOffboardGracePeriodDays("7");
    setOffboardSlugConfirmation("");
    setOffboardOpen(true);
  }

  function closeOffboardModal(): void {
    if (actionBusy) {
      return;
    }
    setOffboardOpen(false);
    setOffboardTarget(null);
    setOffboardGracePeriodDays("7");
    setOffboardSlugConfirmation("");
  }

  async function setStatus(tenant: AdminTenantSummary, status: MutableTenantStatus) {
    await runAction(async () => {
      await updateAdminTenantStatus(tenant.id, status);
      await mutate();
      return true;
    });
  }

  async function setLocale(tenant: AdminTenantSummary, uiLocale: TenantUiLocale) {
    await runAction(async () => {
      await updateAdminTenantLocale(tenant.id, uiLocale);
      await mutate();
      return true;
    });
  }

  async function submitOnboard(): Promise<void> {
    const tenantName = onboardTenantName.trim();
    const tenantSlug = onboardTenantSlug.trim();
    const adminEmail = onboardAdminEmail.trim();

    if (!tenantName) {
      setActionError("Tenant name is required");
      return;
    }
    if (!TENANT_SLUG_PATTERN.test(tenantSlug)) {
      setActionError("Tenant slug must match [a-z][a-z0-9_]{0,62}");
      return;
    }
    if (!adminEmail) {
      setActionError("Admin email is required");
      return;
    }

    const response = await runAction(async () => {
      return onboardAdminTenant({
        tenant_slug: tenantSlug,
        tenant_name: tenantName,
        admin_email: adminEmail,
        wait_for_provisioning: false,
      });
    });

    if (!response) {
      return;
    }

    await mutate();
    setActionNotice(
      response.provisioning_started
        ? `Onboarding started for ${tenantName}. The workspace will appear in the list when setup is ready.`
        : `${tenantName} is already provisioned and ready to manage.`,
    );
    const nextHint: LocalDevLoginHint = {
      adminUserId: response.admin_user_id,
      provisioningStarted: response.provisioning_started,
      tenantLabel: tenantName,
      tenantSlug,
    };
    setLocalDevLoginHint(nextHint);
    if (localDevTokenLoginEnabled() && typeof window !== "undefined") {
      window.localStorage.setItem(LOCAL_DEV_HINT_STORAGE_KEY, JSON.stringify(nextHint));
    }
    closeOnboardModal();
  }

  async function submitOffboard(): Promise<void> {
    if (!offboardTarget) {
      setActionError("Choose a tenant to offboard");
      return;
    }

    const gracePeriodDays = parseGracePeriodDays(offboardGracePeriodDays);
    if (gracePeriodDays === null) {
      setActionError("Grace period must be an integer from 0 to 30 days");
      return;
    }

    const response = await runAction(async () => {
      const offboardResponse = await offboardAdminTenant(offboardTarget.id, {
        grace_period_days: gracePeriodDays,
        wait_for_completion: false,
      });
      await mutate();
      return offboardResponse;
    });

    if (!response) {
      return;
    }

    setActionNotice(
      response.started
        ? `Offboarding started for ${offboardTarget.slug}.`
        : `Offboarding workflow already in progress for ${offboardTarget.slug}.`,
    );
    closeOffboardModal();
  }

  async function copyLocalDevToken(token: string): Promise<void> {
    const msg = "Local sign-in token copied. Paste it on /login after the tenant is active.";
    try { await navigator.clipboard.writeText(token); setActionNotice(msg); } catch {
      try {
        const el = Object.assign(document.createElement("textarea"), { value: token });
        Object.assign(el.style, { position: "fixed", opacity: "0" });
        document.body.appendChild(el); el.select(); document.execCommand("copy"); document.body.removeChild(el);
        setActionNotice(msg);
      } catch { setActionError("Could not copy token. Select and paste manually on /login."); }
    }
  }

  function localDevTokenForTenant(tenant: AdminTenantSummary): string | null {
    if (!localDevTokenLoginEnabled() || !localDevLoginHint) {
      return null;
    }
    if (localDevLoginHint.tenantSlug !== tenant.slug) {
      return null;
    }
    return `dev:${localDevLoginHint.adminUserId}`;
  }

  const columns: DataTableColumn<AdminTenantSummary>[] = [
    {
      id: "name",
      header: "Tenant",
            width: "12rem",
      className: "w-[12rem] min-w-[12rem] align-top",
      cell: (tenant) => (
        <div className="flex flex-col">
          <span data-testid={`tenant-name-${tenant.id}`} className="font-medium text-[var(--color-neutral-900)]">
            {tenant.name}
          </span>
          <span className="text-xs text-[var(--color-neutral-500)]">{tenant.slug}</span>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      width: "7.5rem",
      className: "w-[7.5rem] min-w-[7.5rem] align-top",
      cell: (tenant) => {
        const status = nextStatus(tenant.status);
        return (
          <div className="flex items-center gap-2">
            <Switch
              data-testid={`tenant-toggle-status-${tenant.id}`}
              checked={tenant.status === "active"}
              disabled={actionBusy || !status}
              onCheckedChange={() => {
                if (status) {
                  void setStatus(tenant, status);
                }
              }}
            />
            <span className={`text-xs font-medium ${tenant.status === "active" ? "text-emerald-600" : "text-neutral-400"}`}>
              {tenant.status === "active" ? "Active" : tenant.status === "offboarded" ? "Offboarded" : "Deactivated"}
            </span>
          </div>
        );
      },
    },
    {
      id: "ui_locale",
      header: "Language",
      width: "8.5rem",
      className: "w-[8.5rem] min-w-[8.5rem] align-top",
      cell: (tenant) => (
        <Select
          value={tenant.ui_locale}
          disabled={actionBusy || tenant.status === "offboarded"}
          onValueChange={(nextLocale: string) => {
            if (nextLocale === tenant.ui_locale) return;
            void setLocale(tenant, nextLocale as TenantUiLocale);
          }}
        >
          <SelectTrigger data-testid={`tenant-locale-${tenant.id}`} className="h-8 w-auto px-2 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOCALE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      id: "updated",
      header: "Updated",
            width: "8rem",
      className: "w-[8rem] min-w-[8rem] align-top",
      cell: (tenant) => {
        const { date, time } = formatDateParts(tenant.updated_at);
        return (
          <div className="flex flex-col leading-tight text-[var(--color-neutral-500)]">
            <span className="text-xs">{date}</span>
            <span className="text-xs">{time}</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      width: "3rem",
      className: "w-[3rem] min-w-[3rem] align-top",
      cell: (tenant) => {
        const status = nextStatus(tenant.status);
        const localDevToken = localDevTokenForTenant(tenant);
        const items = [];
        if (localDevToken) {
          items.push({
            label: "Copy token",
            onClick: () => void copyLocalDevToken(localDevToken),
            testId: `tenant-copy-token-${tenant.id}`,
          });
        }
        if (status) {
          items.push({
            label: status === "active" ? "Activate" : "Deactivate",
            onClick: () => void setStatus(tenant, status),
            testId: `tenant-toggle-status-${tenant.id}`,
          });
        }
        if (tenant.status !== "offboarded") {
          items.push({
            label: "Offboard",
            onClick: () => openOffboardModal(tenant),
            testId: `tenant-offboard-${tenant.id}`,
            destructive: true,
          });
        }
        return (
          <OverflowMenu
            items={items}
            data-testid={`tenant-actions-${tenant.id}`}
          />
        );
      },
    },
  ];

  const loadError = error ? tenantLoadErrorMessage(error) : null;

  return (
    <AdminPageShell
      title="Tenants"
      description="Manage tenant access, language, and retirement from one list."
    >

      <ActionBuilderCard
        open={onboardOpen}
        dataTestId="admin-tenants-onboard-panel"
        title="Tenant onboarding form"
        description="Create a tenant and give the first admin access without leaving the tenant list."
        onClose={closeOnboardModal}
        closeLabel="Close form"
        footer={
          <>
            <Button variant="outline" onClick={closeOnboardModal} disabled={actionBusy}>
              Cancel
            </Button>
            <Button data-testid="admin-tenants-onboard-submit" onClick={() => void submitOnboard()} disabled={actionBusy}>
              {actionBusy ? "Creating..." : "Create tenant"}
            </Button>
          </>
        }
      >
        <div className="grid gap-3">
          <Input
            id="admin-tenants-onboard-name"
            data-testid="admin-tenants-onboard-name"
            label="Tenant Name"
            value={onboardTenantName}
            onChange={(event) => {
              const nextName = event.currentTarget.value;
              const suggestedSlug = normalizeTenantSlug(nextName);
              const currentSuggestedSlug = normalizeTenantSlug(onboardTenantName);
              setOnboardTenantName(nextName);
              if (!onboardTenantSlug || onboardTenantSlug === currentSuggestedSlug) {
                setOnboardTenantSlug(suggestedSlug);
              }
            }}
            placeholder="North Clinic"
            autoFocus
          />
          <Input
            id="admin-tenants-onboard-slug"
            data-testid="admin-tenants-onboard-slug"
            label="Tenant Slug"
            value={onboardTenantSlug}
            onChange={(event) => setOnboardTenantSlug(normalizeTenantSlug(event.currentTarget.value))}
            placeholder="north_clinic"
            description="We fill this in from the tenant name. You can adjust it if needed."
          />
          <Input
            id="admin-tenants-onboard-admin-email"
            data-testid="admin-tenants-onboard-admin-email"
            label="Admin Email"
            type="email"
            value={onboardAdminEmail}
            onChange={(event) => setOnboardAdminEmail(event.currentTarget.value)}
            placeholder="admin@example.com"
          />
        </div>
      </ActionBuilderCard>

      {loadError ? (
        <div
          data-testid="admin-tenants-load-error"
          className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]"
        >
          {loadError}
        </div>
      ) : null}
      {actionError ? (
        <div
          data-testid="admin-tenants-action-error"
          className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]"
        >
          {actionError}
        </div>
      ) : null}
      {actionNotice ? (
        <div
          data-testid="admin-tenants-action-notice"
          className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-success-500)] bg-[var(--color-success-50)] px-3 py-2 text-sm text-[var(--color-success-700)]"
        >
          {actionNotice}
        </div>
      ) : null}
      {isLoading ? (
        <p className="text-sm text-[var(--color-neutral-500)]">Loading tenants...</p>
      ) : (
        <div data-testid="admin-tenants-table">
          <DataTable
                columns={columns}
                rows={filtered}
                rowKey="id"
                emptyState={tenantEmptyState}
                layout="fixed"
                toolbar={
                  <div className="flex items-center justify-end border-b border-neutral-100 px-4 py-3">
                    <button
                      type="button"
                      data-testid="admin-tenants-onboard-open"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                      onClick={() => setOnboardOpen(true)}
                      disabled={actionBusy}
                      aria-label="Add tenant"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                }
            />
        </div>
      )}

      <Modal
        open={offboardOpen}
        onClose={closeOffboardModal}
        title={offboardTarget ? `Offboard "${offboardTarget.name}"` : "Offboard Tenant"}
        description="This will permanently remove all tenant data after the grace period expires."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeOffboardModal} disabled={actionBusy}>
              Cancel
            </Button>
            <Button
              data-testid="admin-tenants-offboard-submit"
              variant="destructive"
              onClick={() => void submitOffboard()}
              disabled={actionBusy || !offboardTarget || offboardSlugConfirmation !== offboardTarget?.slug}
            >
              {actionBusy ? "Submitting..." : "Start Offboarding"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3">
          <Input
            id="admin-tenants-offboard-grace-days"
            data-testid="admin-tenants-offboard-grace-days"
            label="Grace period (days)"
            type="number"
            min={0}
            max={30}
            value={offboardGracePeriodDays}
            onChange={(event) => setOffboardGracePeriodDays(event.currentTarget.value)}
            description="Allowed range: 0 to 30 days."
          />
          <Input
            id="admin-tenants-offboard-slug-confirm"
            data-testid="admin-tenants-offboard-slug-confirm"
            label={`Type "${offboardTarget?.slug ?? ""}" to confirm`}
            value={offboardSlugConfirmation}
            onChange={(event) => setOffboardSlugConfirmation(event.currentTarget.value)}
            placeholder={offboardTarget?.slug ?? ""}
          />
        </div>
      </Modal>
    </AdminPageShell>
  );
}
