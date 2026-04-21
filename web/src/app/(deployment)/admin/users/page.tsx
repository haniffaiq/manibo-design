"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { Button } from "@grove/ui/button";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";
import { Input } from "@grove/ui/input";
import { Modal } from "@grove/ui/modal";
import { OverflowMenu } from "@grove/ui/overflow-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import { AdminPageShell } from "@/components/admin-page-shell";
import { AdminTenantPicker } from "@/components/admin-tenant-picker";
import { StatusMessage } from "@/components/status-message";
import {
  deactivateAdminTenantUser,
  inviteAdminTenantUser,
  listAdminTenantUsers,
  removeAdminTenantUser,
  updateAdminTenantUserRole,
} from "@/lib/api/admin-users";
import type { TeamRole, TeamUser } from "@/lib/api/team";
import * as swrKeys from "@/lib/swr-keys";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import { useActionState } from "@/hooks/use-action-state";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useTenantPicker } from "@/hooks/use-tenant-picker";

const ROLE_OPTIONS: Array<{ value: TeamRole; label: string }> = [
  { value: "client_admin", label: "Client Admin" },
  { value: "client_operator", label: "Client Operator" },
];
const EMPTY_USERS: TeamUser[] = [];


function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(iso));
}

export default function DeploymentUsersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("client_operator");

  const { busy, error, notice, run, showNotice, setError } = useActionState();
  const { tenants, selectedTenantId, selectTenant, selectedTenant, tenantsLoading, tenantsError } = useTenantPicker({
    swrKey: swrKeys.adminUsersTenants(),
  });
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const {
    data: usersData,
    error: usersError,
    isLoading: usersLoading,
    mutate,
  } = useSWR(
    selectedTenantId ? swrKeys.adminTenantUsers(selectedTenantId) : null,
    () => listAdminTenantUsers(selectedTenantId),
    {
      revalidateOnFocus: false,
    },
  );

  const users = usersData?.users ?? EMPTY_USERS;

  function resetInviteForm(): void {
    setInviteEmail("");
    setInviteDisplayName("");
    setInviteRole("client_operator");
  }

  function closeInviteModal(): void {
    if (busy) {
      return;
    }
    setInviteOpen(false);
    resetInviteForm();
  }

  async function submitInvite(): Promise<void> {
    if (!selectedTenantId) {
      return;
    }

    const email = inviteEmail.trim();
    const displayName = inviteDisplayName.trim();

    if (!email) {
      setError("Invite email is required");
      return;
    }

    await run(async () => {
      await inviteAdminTenantUser(selectedTenantId, {
        email,
        role: inviteRole,
        display_name: displayName || undefined,
      });
      showNotice(`User invited to ${selectedTenant?.slug ?? selectedTenantId}: ${email}`);
      await mutate();
      closeInviteModal();
    });
  }

  const columns: DataTableColumn<TeamUser>[] = useMemo(() => [
    {
      id: "display_name",
      header: "Name",
      width: "15rem",
      className: "w-[15rem] min-w-[15rem] align-top",
      cell: (user) => (
        <div className="flex flex-col">
          <span data-testid={`admin-users-name-${user.user_id}`} className="font-medium text-[var(--color-neutral-900)]">
            {user.display_name || "Not set"}
          </span>
          <span className="text-xs text-[var(--color-neutral-500)]">{user.email}</span>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      width: "11rem",
      className: "w-[11rem] min-w-[11rem] align-top",
      cell: (user) => (
        <div className="flex items-center gap-2">
          <Select
            value={user.role}
            disabled={busy || !selectedTenantId}
            onValueChange={(nextRole: string) => {
              if (nextRole === user.role || !selectedTenantId) return;
              void run(async () => {
                await updateAdminTenantUserRole(selectedTenantId, user.user_id, { role: nextRole as TeamRole });
                showNotice(`Role updated for ${user.email}`);
                await mutate();
              });
            }}
          >
            <SelectTrigger data-testid={`admin-users-role-${user.user_id}`} className="h-8 w-auto px-2 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      id: "joined",
      header: "Joined",
      width: "8rem",
      className: "w-[8rem] min-w-[8rem] align-top",
      cell: (user) => (
        <span className="text-xs text-[var(--color-neutral-500)]">
          {formatShortDate(user.membership_created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      hideable: false,
      width: "3rem",
      className: "w-[3rem] min-w-[3rem] align-top",
      cell: (user) => (
        <OverflowMenu
          data-testid={`admin-users-actions-${user.user_id}`}
          items={[
            {
              label: "Deactivate",
              disabled: busy || !selectedTenantId,
              testId: `admin-users-deactivate-${user.user_id}`,
              onClick: () => {
                if (!selectedTenantId) return;
                confirm({
                  title: "Deactivate user",
                  description: `Deactivate ${user.email}?`,
                  body: "This user will lose access to the tenant.",
                  confirmLabel: "Deactivate",
                  variant: "destructive",
                  confirmTestId: "admin-users-confirm-action",
                  onConfirm: async () => {
                    await run(async () => {
                      await deactivateAdminTenantUser(selectedTenantId, user.user_id);
                      showNotice(`User deactivated: ${user.email}`);
                      await mutate();
                    });
                  },
                });
              },
            },
            {
              label: "Remove",
              destructive: true,
              disabled: busy || !selectedTenantId,
              testId: `admin-users-remove-${user.user_id}`,
              onClick: () => {
                if (!selectedTenantId) return;
                confirm({
                  title: "Remove user",
                  description: `Remove ${user.email} from this tenant?`,
                  body: "This user will be permanently removed from the tenant.",
                  confirmLabel: "Remove",
                  variant: "destructive",
                  confirmTestId: "admin-users-confirm-action",
                  onConfirm: async () => {
                    await run(async () => {
                      await removeAdminTenantUser(selectedTenantId, user.user_id);
                      showNotice(`User removed: ${user.email}`);
                      await mutate();
                    });
                  },
                });
              },
            },
          ]}
        />
      ),
    },
  ], [busy, confirm, mutate, run, selectedTenantId, showNotice]);

  const loadError = tenantsError || usersError ? toErrorMessage(tenantsError ?? usersError) : null;

  return (
    <AdminPageShell
      title="User management"
    >

      <Modal
        open={inviteOpen}
        onClose={closeInviteModal}
        title="Invite user"
        className="max-w-sm"
        footer={
          <Button data-testid="admin-users-invite-submit" onClick={() => void submitInvite()} disabled={busy}>
            {busy ? "Inviting..." : "Invite"}
          </Button>
        }
      >
        <div className="grid gap-3">
          <Input
            id="admin-users-invite-email"
            data-testid="admin-users-invite-email"
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.currentTarget.value)}
            placeholder="operator@example.com"
            autoFocus
          />
          <Input
            id="admin-users-invite-display-name"
            data-testid="admin-users-invite-display-name"
            label="Display Name"
            value={inviteDisplayName}
            onChange={(event) => setInviteDisplayName(event.currentTarget.value)}
            placeholder="Jane Support"
          />
          <div className="flex w-full flex-col gap-1.5">
            <label htmlFor="admin-users-invite-role" className="text-sm font-medium text-[var(--color-neutral-700)]">
              Role
            </label>
            <Select value={inviteRole} onValueChange={(v: string) => setInviteRole(v as TeamRole)}>
              <SelectTrigger data-testid="admin-users-invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Modal>

      <AdminTenantPicker
        tenants={tenants}
        selectedTenant={selectedTenant}
        onSelect={selectTenant}
        loading={tenantsLoading}
        error={tenantsError ? toErrorMessage(tenantsError) : null}
      />

      {loadError ? (
            <div
              data-testid="admin-users-load-error"
              className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]"
            >
              {loadError}
            </div>
          ) : null}
          {error ? (
            <div className="mb-4">
              <StatusMessage variant="error" data-testid="admin-users-action-error">{error}</StatusMessage>
            </div>
          ) : null}
          {notice ? (
            <div className="mb-4">
              <StatusMessage variant={notice.variant} data-testid="admin-users-action-notice">{notice.message}</StatusMessage>
            </div>
          ) : null}

          <div data-testid="admin-users-table">
            <DataTable
              columns={columns}
              rows={users}
              rowKey="user_id"
              emptyState="No users found."
              layout="fixed"
              loading={tenantsLoading || !!(selectedTenantId && usersLoading)}
              toolbar={
                <div className="flex w-full items-center gap-2 border-b border-neutral-100 px-4 py-3">
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="admin-users-invite-open"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={() => setInviteOpen(true)}
                      disabled={busy || !selectedTenantId}
                      aria-label="Add user"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                </div>
              }
            />
      </div>

      <ConfirmDialog />
    </AdminPageShell>
  );
}
