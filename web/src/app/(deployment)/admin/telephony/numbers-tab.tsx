"use client";

import { useState } from "react";

import { Button } from "@grove/ui/button";
import { Modal } from "@grove/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import { Switch } from "@grove/ui/switch";

import {
  AdminTelephonyNumberTable,
  type AdminTelephonyNumberRow,
} from "@/components/admin-telephony-number-table";
import { StatusMessage } from "@/components/status-message";
import { type AdminAgentDefinitionSummary } from "@/lib/api/admin-agent-definitions";
import { type AdminTenantSummary } from "@/lib/api/tenants";

import {
  type NumberEditorDraft,
  type TenantPhoneBinding,
} from "./view-models";

interface NumbersTabProps {
  numbersLoadError: string | null;
  activeTenants: AdminTenantSummary[];
  numberTableRows: AdminTelephonyNumberRow[];
  numbersLoading: boolean;
  bindingsLoading: boolean;
  onSelectRow: (row: AdminTelephonyNumberRow) => void;
  numberEditorOpen: boolean;
  onCloseNumberEditor: () => void;
  selectedNumberBinding: TenantPhoneBinding | null;
  numberError: string | null;
  numberBusy: boolean;
  onReleaseNumber: () => Promise<void>;
  onSaveNumber: () => Promise<void>;
  numberDraft: NumberEditorDraft;
  onNumberDraftChange: (nextDraft: NumberEditorDraft) => void;
  assistantsLoading: boolean;
  publishedAssistants: AdminAgentDefinitionSummary[];
  selectedNumberLabel: string;
  liveRoutingToggleDisabled: boolean;
}

export function NumbersTab({
  numbersLoadError,
  activeTenants,
  numberTableRows,
  numbersLoading,
  bindingsLoading,
  onSelectRow,
  numberEditorOpen,
  onCloseNumberEditor,
  selectedNumberBinding,
  numberError,
  numberBusy,
  onReleaseNumber,
  onSaveNumber,
  numberDraft,
  onNumberDraftChange,
  assistantsLoading,
  publishedAssistants,
  selectedNumberLabel,
  liveRoutingToggleDisabled,
}: NumbersTabProps) {
  const [releaseConfirmOpen, setReleaseConfirmOpen] = useState(false);

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-[var(--color-neutral-950)]">Numbers</h2>

      {numbersLoadError ? <StatusMessage variant="error">{numbersLoadError}</StatusMessage> : null}

      <AdminTelephonyNumberTable
        rows={numberTableRows}
        loading={numbersLoading || bindingsLoading}
        onSelectRow={onSelectRow}
      />

      <Modal
        open={numberEditorOpen}
        onClose={onCloseNumberEditor}
        title={selectedNumberLabel ? `Assign ${selectedNumberLabel}` : "Assign number"}
        className="max-w-sm"
        footer={
          <div className="flex justify-end gap-2">
            {selectedNumberBinding ? (
              <>
                <Button variant="outline" onClick={() => void onSaveNumber()} disabled={numberBusy}>
                  Save assignment
                </Button>
                <Button variant="destructive" onClick={() => setReleaseConfirmOpen(true)} disabled={numberBusy}>
                  Release
                </Button>
              </>
            ) : (
              <Button onClick={() => void onSaveNumber()} disabled={numberBusy}>
                Assign
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-4">
          {numberError ? <StatusMessage variant="error">{numberError}</StatusMessage> : null}

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-neutral-200)] px-3 py-2">
              <label className="text-sm font-medium text-[var(--color-neutral-700)]" htmlFor="admin-telephony-number-active-toggle">
                Live routing
              </label>
              <Switch
                id="admin-telephony-number-active-toggle"
                data-testid="admin-telephony-number-active-toggle"
                aria-label="Live routing"
                checked={numberDraft.active}
                disabled={numberBusy || liveRoutingToggleDisabled}
                onCheckedChange={(checked) => onNumberDraftChange({ ...numberDraft, active: checked })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-neutral-700)]">Tenant</label>
              <Select
                value={numberDraft.tenantId}
                onValueChange={(value) => onNumberDraftChange({ ...numberDraft, tenantId: value })}
                disabled={numberBusy || selectedNumberBinding !== null}
              >
                <SelectTrigger data-testid="admin-telephony-number-tenant-select">
                  <SelectValue placeholder="Choose a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {activeTenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name} ({tenant.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-neutral-700)]">Assistant</label>
              <Select
                value={numberDraft.agentDefinitionId}
                onValueChange={(value) => onNumberDraftChange({ ...numberDraft, agentDefinitionId: value })}
                disabled={numberBusy || assistantsLoading || publishedAssistants.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={assistantsLoading ? "Loading…" : "Choose an assistant"} />
                </SelectTrigger>
                <SelectContent>
                  {publishedAssistants.map((assistant) => (
                    <SelectItem key={assistant.id} value={assistant.id}>
                      {assistant.name} (v{assistant.published_version})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={releaseConfirmOpen}
        onClose={() => setReleaseConfirmOpen(false)}
        title="Release number"
        description={`Release ${selectedNumberLabel} from ${selectedNumberBinding?.tenant_name ?? "this tenant"}?`}
        className="max-w-xs"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setReleaseConfirmOpen(false)} disabled={numberBusy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={numberBusy}
              onClick={() => {
                void onReleaseNumber().then(() => setReleaseConfirmOpen(false));
              }}
            >
              Release
            </Button>
          </div>
        }
      >
        {null}
      </Modal>
    </section>
  );
}
