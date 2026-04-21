"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";


import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";
import { Input } from "@grove/ui/input";
import { Modal } from "@grove/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import { PageFrame } from "@/components/page-frame";
import { PageHeader } from "@/components/page-header";
import { useTenantCopy } from "@/components/tenant-locale-provider";
import { PlatformApiError } from "@/lib/api/platform";
import {
  deactivateTeamUser,
  inviteTeamUser,
  listTeamUsers,
  removeTeamUser,
  type TeamRole,
  type TeamUser,
  updateTeamUserRole,
} from "@/lib/api/team";
import * as swrKeys from "@/lib/swr-keys";

const ROLE_OPTIONS: { value: TeamRole; label: string }[] = [
  { value: "client_admin", label: "Client Admin" },
  { value: "client_operator", label: "Client Operator" },
];
const EMPTY_USERS: TeamUser[] = [];

function roleLabel(role: TeamRole): string {
  return role === "client_admin" ? "Client Admin" : "Client Operator";
}


function actionErrorMessage(error: unknown): string {
  if (error instanceof PlatformApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

export function TenantTeamClientPage({ canManageTeam }: { canManageTeam: boolean }) {
  const copy = useTenantCopy();
  const [searchTerm, setSearchTerm] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDisplayName, setInviteDisplayName] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("client_operator");
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<TeamUser | null>(null);
  const [removeTarget, setRemoveTarget] = useState<TeamUser | null>(null);

  const { data, error, isLoading, mutate } = useSWR(canManageTeam ? swrKeys.teamUsers() : null, listTeamUsers, {
    revalidateOnFocus: false,
  });

  const users = data?.users ?? EMPTY_USERS;

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return users;
    }
    return users.filter((user) => {
      const displayName = user.display_name ?? "";
      return (
        displayName.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        roleLabel(user.role).toLowerCase().includes(query)
      );
    });
  }, [searchTerm, users]);

  const adminCount = users.filter((user) => user.role === "client_admin").length;
  const operatorCount = users.length - adminCount;

  async function runAction(action: () => Promise<void>) {
    setActionBusy(true);
    setActionError(null);
    try {
      await action();
      await mutate();
    } catch (err) {
      setActionError(actionErrorMessage(err));
    } finally {
      setActionBusy(false);
    }
  }

  function resetInviteForm() {
    setInviteEmail("");
    setInviteDisplayName("");
    setInviteRole("client_operator");
  }

  async function submitInvite() {
    const email = inviteEmail.trim();
    const displayName = inviteDisplayName.trim();
    if (!email) {
      setActionError("Invite email is required");
      return;
    }

    await runAction(async () => {
      await inviteTeamUser({
        email,
        role: inviteRole,
        display_name: displayName.length > 0 ? displayName : undefined,
      });
    });

    setInviteOpen(false);
    resetInviteForm();
  }

  if (!canManageTeam) {
    return (
      <PageFrame className="px-6 py-8">
        <PageHeader compact title={copy.team.title} description={copy.team.description} />
        <Card className="border-dashed" data-testid="team-admin-only">
          <CardContent className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <p className="text-sm font-medium text-[var(--color-neutral-700)]">{copy.team.adminOnlyTitle}</p>
            <p className="text-sm text-[var(--color-neutral-500)]">{copy.team.adminOnlyMessage}</p>
          </CardContent>
        </Card>
      </PageFrame>
    );
  }

  const columns: DataTableColumn<TeamUser>[] = [
    {
      id: "display_name",
      header: "Name",
      cell: (user) => (
        <div className="flex flex-col">
          <span data-testid={`team-name-${user.user_id}`} className="font-medium text-[var(--color-neutral-900)]">
            {user.display_name || "Not set"}
          </span>
          <span className="text-xs text-[var(--color-neutral-500)]">{user.email}</span>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      cell: (user) => (
        <Select
          value={user.role}
          disabled={actionBusy}
          onValueChange={(nextRole: string) => {
            if (nextRole === user.role) return;
            void runAction(async () => {
              await updateTeamUserRole(user.user_id, { role: nextRole as TeamRole });
            });
          }}
        >
          <SelectTrigger data-testid={`team-role-${user.user_id}`} className="h-8 w-auto px-2 text-xs">
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
      ),
    },
    {
      id: "joined",
      header: "Joined",
      cell: (user) => (
        <span className="text-xs text-[var(--color-neutral-500)]">
          {new Date(user.membership_created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      align: "right",
      cell: (user) => (
        <div className="flex justify-end gap-2">
          <Button
            data-testid={`team-deactivate-${user.user_id}`}
            variant="outline"
            size="sm"
            disabled={actionBusy}
            onClick={() => setDeactivateTarget(user)}
          >
            Deactivate
          </Button>
          <Button
            data-testid={`team-remove-${user.user_id}`}
            variant="destructive"
            size="sm"
            disabled={actionBusy}
            onClick={() => setRemoveTarget(user)}
          >
            Remove
          </Button>
        </div>
      ),
    },
  ];

  const loadError = error ? actionErrorMessage(error) : null;

  return (
    <PageFrame className="px-6 py-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader compact title={copy.team.title} description={copy.team.description} />
        <Button data-testid="team-invite-open" onClick={() => setInviteOpen(true)} disabled={actionBusy}>
          Invite Member
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
            Total Members
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{users.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
            Client Admins
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{adminCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="text-xs font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">
            Client Operators
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{operatorCount}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Members</h2>
            <p className="text-sm text-[var(--color-neutral-500)]">Current users with workspace access.</p>
          </div>
          <div className="w-full md:w-80">
            <Input
              label="Search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
              placeholder="name, email, or role"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <div
              data-testid="team-load-error"
              className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]"
            >
              {loadError}
            </div>
          ) : null}
          {actionError ? (
            <div
              data-testid="team-action-error"
              className="mb-4 rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]"
            >
              {actionError}
            </div>
          ) : null}

          <div data-testid="team-users-table">
              <DataTable
                columns={columns}
                rows={filteredUsers}
                rowKey="user_id"
                emptyState="No team members found for the current filter."
                loading={isLoading}
              />
            </div>
        </CardContent>
      </Card>

      <Modal
        open={inviteOpen}
        className="max-h-[90vh] overflow-y-auto"
        onClose={() => {
          if (actionBusy) {
            return;
          }
          setInviteOpen(false);
          resetInviteForm();
        }}
        title="Invite Team Member"
        description="Create membership access for a Client Admin or Client Operator."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setInviteOpen(false);
                resetInviteForm();
              }}
              disabled={actionBusy}
            >
              Cancel
            </Button>
            <Button data-testid="team-invite-submit" onClick={() => void submitInvite()} disabled={actionBusy}>
              {actionBusy ? "Inviting..." : "Invite"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-3">
          <Input
            id="team-invite-email"
            data-testid="team-invite-email"
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(event) => setInviteEmail(event.currentTarget.value)}
            placeholder="operator@example.com"
            autoFocus
          />
          <Input
            id="team-invite-display-name"
            label="Display Name (optional)"
            value={inviteDisplayName}
            onChange={(event) => setInviteDisplayName(event.currentTarget.value)}
            placeholder="Jane Driver Ops"
          />
          <div className="flex w-full flex-col gap-1.5">
            <label className="text-sm font-medium text-[var(--color-neutral-700)]">
              Role
            </label>
            <Select
              value={inviteRole}
              onValueChange={(value: string) => setInviteRole(value as TeamRole)}
            >
              <SelectTrigger data-testid="team-invite-role">
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
        </div>
      </Modal>

      <Modal
        open={deactivateTarget !== null}
        onClose={() => setDeactivateTarget(null)}
        title={`Deactivate ${deactivateTarget?.display_name ?? deactivateTarget?.email ?? ""}?`}
        description="This will prevent the member from accessing the workspace."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeactivateTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deactivateTarget) {
                  void runAction(async () => {
                    await deactivateTeamUser(deactivateTarget.user_id);
                  });
                }
                setDeactivateTarget(null);
              }}
            >
              Deactivate
            </Button>
          </div>
        }
      >
        {null}
      </Modal>

      <Modal
        open={removeTarget !== null}
        onClose={() => setRemoveTarget(null)}
        title={`Remove ${removeTarget?.display_name ?? removeTarget?.email ?? ""}?`}
        description="This will permanently remove the member from this workspace."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (removeTarget) {
                  void runAction(async () => {
                    await removeTeamUser(removeTarget.user_id);
                  });
                }
                setRemoveTarget(null);
              }}
            >
              Remove
            </Button>
          </div>
        }
      >
        {null}
      </Modal>
    </PageFrame>
  );
}
