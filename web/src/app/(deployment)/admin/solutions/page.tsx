"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";
import { Switch } from "@grove/ui/switch";
import { AdminTenantPicker } from "@/components/admin-tenant-picker";
import { PageFrame } from "@/components/page-frame";
import { StatusMessage } from "@/components/status-message";
import { toErrorMessage } from "@grove/web-shared/lib/error-message";
import { useActionState } from "@/hooks/use-action-state";
import { useTenantPicker } from "@/hooks/use-tenant-picker";
import {
  listAdminTenantSolutions,
  updateAdminTenantSolution,
  type TenantSolutionState,
} from "@/lib/api/solutions";
import { formatSolutionLabel, isBuildEnabledSolution } from "@/lib/solutions";
import * as swrKeys from "@/lib/swr-keys";

const EMPTY_SOLUTIONS: TenantSolutionState[] = [];

type AdminSolutionRow = TenantSolutionState & {
  buildEnabled: boolean;
};

function workspaceVisibilityErrorMessage(error: unknown): string {
  const message = toErrorMessage(error).toLowerCase();
  if (message.includes("forbidden") || message.includes("unauthorized")) {
    return "You do not have permission to change solution access for this tenant.";
  }
  return "Solution access could not be updated right now. Refresh and try again.";
}

function workspaceLoadErrorMessage(error: unknown): string {
  const message = toErrorMessage(error).toLowerCase();
  if (message.includes("forbidden") || message.includes("unauthorized")) {
    return "You do not have permission to view solution access for this deployment.";
  }
  return "Solution access is unavailable right now. Refresh and try again.";
}

function solutionStatusVariant(solution: AdminSolutionRow): "success" | "warning" | "neutral" {
  return solution.enabled ? "success" : "neutral";
}

function solutionStatusLabel(solution: AdminSolutionRow): string {
  return solution.enabled ? "Enabled" : "Disabled";
}

function revisionLabel(solution: TenantSolutionState): string {
  return solution.active_revision ?? solution.desired_revision ?? "Not scheduled";
}

function canToggleSolution(solution: AdminSolutionRow): boolean {
  return solution.buildEnabled;
}

export default function AdminSolutionsPage() {
  const [actionBusySolution, setActionBusySolution] = useState<string | null>(null);
  const { notice: actionNotice, showNotice, clearNotice } = useActionState();

  const {
    tenants,
    selectedTenantId,
    selectTenant,
    selectedTenant,
    tenantsLoading,
    tenantsError,
  } = useTenantPicker({
    swrKey: swrKeys.adminSolutionsTenants(),
  });

  const { data: solutionsData, error: solutionsError, isLoading: solutionsLoading, mutate } = useSWR(
    selectedTenant ? swrKeys.adminTenantSolutions(selectedTenant.id) : null,
    ([, tenantId]) => listAdminTenantSolutions(tenantId),
    {
      revalidateOnFocus: false,
    },
  );

  const solutions = useMemo(() => {
    return (solutionsData?.solutions ?? EMPTY_SOLUTIONS).map((solution) => ({
      ...solution,
      buildEnabled: isBuildEnabledSolution(solution.solution_name),
    })).filter((solution) => solution.buildEnabled);
  }, [solutionsData]);

  async function toggleSolution(solution: AdminSolutionRow): Promise<void> {
    if (!selectedTenant) {
      return;
    }
    if (!canToggleSolution(solution)) {
      return;
    }
    setActionBusySolution(solution.solution_name);
    clearNotice();
    try {
      await updateAdminTenantSolution(selectedTenant.id, solution.solution_name, { enabled: !solution.enabled });
      await mutate();
    } catch (error) {
      showNotice(workspaceVisibilityErrorMessage(error), "error");
    } finally {
      setActionBusySolution(null);
    }
  }

  const columns: DataTableColumn<AdminSolutionRow>[] = [
    {
      id: "solution",
      header: "Solution",
      width: "16rem",
      cell: (solution) => (
        <div className="space-y-1">
          <p className="font-medium text-[var(--color-neutral-900)]">{formatSolutionLabel(solution.solution_name)}</p>
          <p className="text-xs text-[var(--color-neutral-500)]">{solution.description}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      width: "7rem",
      cell: (solution) => (
        <Badge variant={solutionStatusVariant(solution)}>{solutionStatusLabel(solution)}</Badge>
      ),
    },
    {
      id: "dependencies",
      header: "Dependencies",
      width: "12rem",
      cell: (solution) => (
        <div className="space-y-1 text-sm text-[var(--color-neutral-700)]">
          <p>{solution.requires_enabled.length > 0 ? solution.requires_enabled.join(", ") : "No required dependencies"}</p>
          {solution.optional_enabled.length > 0 ? (
            <p className="text-xs text-[var(--color-neutral-500)]">Optional: {solution.optional_enabled.join(", ")}</p>
          ) : null}
        </div>
      ),
    },
    {
      id: "revision",
      header: "Revision",
      width: "14rem",
      cell: (solution) => <span className="break-all text-sm text-[var(--color-neutral-700)]">{revisionLabel(solution)}</span>,
    },
    {
      id: "action",
      header: "",
      hideable: false,
      width: "6rem",
      className: "w-[6rem] min-w-[6rem]",
      cell: (solution) => (
        <div data-ui="row-actions" className="flex w-full items-center justify-end">
          <Switch
            checked={solution.enabled}
            onCheckedChange={() => toggleSolution(solution)}
            disabled={actionBusySolution === solution.solution_name || !canToggleSolution(solution)}
            data-testid={`admin-solutions-toggle-${solution.solution_name}`}
          />
        </div>
      ),
    },
  ];

  return (
    <PageFrame width="workspace" as="div">
      <h1 className="text-2xl font-semibold">Solutions</h1>

      <AdminTenantPicker
        tenants={tenants}
        selectedTenant={selectedTenant}
        onSelect={selectTenant}
        loading={tenantsLoading}
        error={tenantsError ? workspaceLoadErrorMessage(tenantsError) : null}
      />

      <div className="space-y-4">
        {actionNotice ? <StatusMessage variant={actionNotice.variant}>{actionNotice.message}</StatusMessage> : null}
        {solutionsError ? (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-4 py-3 text-sm text-[var(--color-error-700)]">
              {workspaceLoadErrorMessage(solutionsError)}
            </div>
          ) : null}
        <DataTable
          columns={columns}
          rows={solutions}
          rowKey="solution_name"
          emptyState={
            tenantsLoading
              ? "Loading tenants..."
              : solutionsLoading
                ? "Loading solutions\u2026"
                : "No solutions available."
          }
          layout="fixed"
        />
      </div>
    </PageFrame>
  );
}
