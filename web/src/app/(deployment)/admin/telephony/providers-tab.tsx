"use client";

import { useMemo } from "react";

import { Button } from "@grove/ui/button";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";

import {
  AdminTelephonyProviderForm,
  type AdminTelephonyProviderDraft,
  type AdminTelephonyProviderInventorySummary,
} from "@/components/admin-telephony-provider-form";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  type TelephonyProviderAccountView,
  type TelephonyProviderPackMetadata,
} from "@/lib/api/admin-telephony";

import { PROVIDER_COLUMNS, type ProviderTableRow } from "./view-models";

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className ?? "h-4 w-4"}>
      <path fillRule="evenodd" d="M13.836 2.477a.75.75 0 0 1 .75.75v3.182a.75.75 0 0 1-.75.75h-3.182a.75.75 0 0 1 0-1.5h1.37l-.84-.841a4.5 4.5 0 0 0-7.08.681.75.75 0 0 1-1.3-.75 6 6 0 0 1 9.44-.908l.84.84V3.227a.75.75 0 0 1 .75-.75Zm-.911 7.5A.75.75 0 0 1 13.199 11a6 6 0 0 1-9.44.908l-.84-.84v1.68a.75.75 0 0 1-1.5 0V9.565a.75.75 0 0 1 .75-.75h3.182a.75.75 0 0 1 0 1.5h-1.37l.84.841a4.5 4.5 0 0 0 7.08-.681.75.75 0 0 1 1.024-.274Z" clipRule="evenodd" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className ?? "h-4 w-4"}>
      <path d="M6.5 1.75a.75.75 0 0 0-.75.75v.75H3.5a.75.75 0 0 0 0 1.5h.294l.48 7.214A1.75 1.75 0 0 0 6.02 14.75h3.96a1.75 1.75 0 0 0 1.746-1.786l.48-7.214h.294a.75.75 0 0 0 0-1.5H10.25V2.5a.75.75 0 0 0-.75-.75h-3Zm2.25 1.5v-.5h-1.5v.5h1.5Zm1.47 2.5H5.78l.463 6.952a.25.25 0 0 0 .249.248h3.016a.25.25 0 0 0 .249-.248l.463-6.952Z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={className ?? "h-4 w-4"}>
      <path d="M11.97 1.97a1.75 1.75 0 0 1 2.474 2.474l-.733.733-2.474-2.474.733-.733Zm.673 4.326L10.17 3.823 4.134 9.86a1.75 1.75 0 0 0-.455.78l-.64 2.559a.75.75 0 0 0 .91.91l2.558-.64a1.75 1.75 0 0 0 .78-.455l6.036-6.037Z" />
    </svg>
  );
}

interface ProvidersTabProps {
  canCreateProvider: boolean;
  providerBusy: boolean;
  providerAccountsLoading: boolean;
  trunksLoading: boolean;
  numbersLoading: boolean;
  providerTableRows: ProviderTableRow[];
  onOpenCreateProviderForm: () => void;
  onOpenProviderEditor: (row: ProviderTableRow) => void;
  onConnectProvider: (providerAccountId: string) => Promise<void>;
  onDeleteProvider: (providerAccountId: string) => Promise<void>;
  providerFormOpen: boolean;
  providerFormMode: "create" | "edit";
  providerDraft: AdminTelephonyProviderDraft;
  providerOptions: TelephonyProviderPackMetadata[];
  createProviderOptions: TelephonyProviderPackMetadata[];
  selectedProvider: TelephonyProviderAccountView | null;
  inventorySummary: AdminTelephonyProviderInventorySummary | null;
  providerError: string | null;
  providerNotice: string | null;
  actionBusyKey: string | null;
  onCloseProviderForm: () => void;
  onSubmitProvider: () => Promise<void>;
  onDraftChange: (nextDraft: AdminTelephonyProviderDraft) => void;
  onTestConnection: () => Promise<void>;
  onRefreshRoutes: () => Promise<void>;
  onRefreshNumbers: () => Promise<void>;
}

export function ProvidersTab({
  canCreateProvider,
  providerBusy,
  providerAccountsLoading,
  trunksLoading,
  numbersLoading,
  providerTableRows,
  onOpenCreateProviderForm,
  onOpenProviderEditor,
  onConnectProvider,
  onDeleteProvider,
  providerFormOpen,
  providerFormMode,
  providerDraft,
  providerOptions,
  createProviderOptions,
  selectedProvider,
  inventorySummary,
  providerError,
  providerNotice,
  actionBusyKey,
  onCloseProviderForm,
  onSubmitProvider,
  onDraftChange,
  onTestConnection,
  onRefreshRoutes,
  onRefreshNumbers,
}: ProvidersTabProps) {
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const providerColumns = useMemo<DataTableColumn<ProviderTableRow>[]>(() => {
    const [providerColumn, trunksColumn, numbersColumn, statusColumn] = PROVIDER_COLUMNS;
    return [
      providerColumn,
      trunksColumn,
      numbersColumn,
      statusColumn,
      {
        id: "actions",
        header: "Actions",
        width: "6%",
        className: "!align-middle",
        cell: (row) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              disabled={providerBusy}
              data-testid={`telephony-provider-edit-desktop-${row.id}`}
              aria-label={`Edit ${row.providerLabel}`}
              onClick={() => void onOpenProviderEditor(row)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50"
            >
              <EditIcon className="h-4 w-4" />
            </button>
            {row.canConnect ? (
              <button
                type="button"
                disabled={providerBusy}
                onClick={() => void onConnectProvider(row.id)}
                aria-label="Sync inventory"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-50"
              >
                <RefreshIcon className={`h-4 w-4 ${providerBusy ? "animate-spin" : ""}`} />
              </button>
            ) : null}
            {row.canDelete ? (
              <button
                type="button"
                disabled={providerBusy}
                data-testid={`telephony-provider-delete-${row.id}`}
                aria-label={`Delete ${row.providerLabel}`}
                onClick={() =>
                  confirm({
                    title: "Delete provider",
                    description: `Remove ${row.providerLabel} from this workspace?`,
                    body: "Use this only for unused or mistaken provider accounts. Connected numbers and routes must be cleaned up first.",
                    confirmLabel: "Delete provider",
                    variant: "destructive",
                    confirmTestId: "telephony-provider-confirm-delete",
                    onConfirm: async () => {
                      await onDeleteProvider(row.id);
                    },
                  })
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ),
      },
    ];
  }, [confirm, onConnectProvider, onDeleteProvider, providerBusy]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-neutral-950)]">Provider accounts</h2>
        {canCreateProvider ? (
          <Button onClick={onOpenCreateProviderForm} disabled={providerBusy}>
            Add provider
          </Button>
        ) : null}
      </div>

      <div className="sm:hidden">
        {providerAccountsLoading || trunksLoading || numbersLoading ? (
          <p className="py-5 text-sm text-[var(--color-neutral-500)]">Loading providers…</p>
        ) : providerTableRows.length === 0 ? (
          <p className="py-5 text-sm text-[var(--color-neutral-500)]">No provider accounts yet.</p>
        ) : (
          <div className="space-y-3">
            {providerTableRows.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[var(--color-neutral-900)]">{row.providerLabel}</p>
                  <p className="mt-1 text-sm text-[var(--color-neutral-500)]">{row.trunkCount} trunks · {row.numberCount} numbers</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={providerBusy}
                    aria-label={`Edit ${row.providerLabel}`}
                    onClick={() => void onOpenProviderEditor(row)}
                    className="rounded-[var(--radius-md)] p-1.5 text-[var(--color-neutral-500)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-neutral-700)] disabled:opacity-50"
                  >
                    <EditIcon className="h-4 w-4" />
                  </button>
                  {row.canConnect ? (
                    <button
                      type="button"
                      disabled={providerBusy}
                      onClick={() => void onConnectProvider(row.id)}
                      aria-label="Sync provider"
                      className="rounded-[var(--radius-md)] p-1.5 text-[var(--color-neutral-500)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-neutral-700)] disabled:opacity-50"
                    >
                      <RefreshIcon className={`h-4 w-4 ${providerBusy ? "animate-spin" : ""}`} />
                    </button>
                  ) : null}
                  {row.canDelete ? (
                    <button
                      type="button"
                      disabled={providerBusy}
                      data-testid={`telephony-provider-delete-mobile-${row.id}`}
                      aria-label={`Delete ${row.providerLabel}`}
                      onClick={() =>
                        confirm({
                          title: "Delete provider",
                          description: `Remove ${row.providerLabel} from this workspace?`,
                          body: "Use this only for unused or mistaken provider accounts. Connected numbers and routes must be cleaned up first.",
                          confirmLabel: "Delete provider",
                          variant: "destructive",
                          confirmTestId: "telephony-provider-confirm-delete",
                          onConfirm: async () => {
                            await onDeleteProvider(row.id);
                          },
                        })
                      }
                      className="rounded-[var(--radius-md)] p-1.5 text-[var(--color-neutral-500)] hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  ) : null}
                  <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${row.statusVariant === "success" ? "bg-emerald-500" : row.statusVariant === "error" ? "bg-red-500" : row.statusVariant === "warning" ? "bg-amber-500" : "bg-neutral-400"}`} title={row.statusLabel} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <DataTable
          columns={providerColumns}
          rows={providerTableRows}
          rowKey="id"
          layout="auto"
          loading={providerAccountsLoading || trunksLoading || numbersLoading}
          emptyState="No provider accounts yet."
        />
      </div>

      {providerFormOpen ? (
        <AdminTelephonyProviderForm
          open={providerFormOpen}
          mode={providerFormMode}
          draft={providerDraft}
          providerOptions={providerOptions}
          createProviderOptions={createProviderOptions}
          selectedProvider={selectedProvider}
          inventorySummary={inventorySummary}
          busy={providerBusy}
          error={providerError}
          notice={providerNotice}
          actionBusyKey={actionBusyKey}
          onClose={onCloseProviderForm}
          onSubmit={onSubmitProvider}
          onDraftChange={onDraftChange}
          onTestConnection={onTestConnection}
          onRefreshRoutes={onRefreshRoutes}
          onRefreshNumbers={onRefreshNumbers}
        />
      ) : null}

      <ConfirmDialog />
    </section>
  );
}
