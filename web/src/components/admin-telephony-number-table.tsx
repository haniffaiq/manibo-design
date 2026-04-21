"use client";

import { type BadgeVariant } from "@grove/ui/badge";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";
import { OverflowMenu, type OverflowMenuItem } from "@grove/ui/overflow-menu";

export interface AdminTelephonyNumberRow {
  id: string;
  phoneNumber: string;
  providerLabel: string;
  tenantLabel: string;
  assignmentLabel: string;
  statusLabel: string;
  statusVariant: BadgeVariant;
  active: boolean;
  canToggleActive: boolean;
}

interface AdminTelephonyNumberTableProps {
  rows: AdminTelephonyNumberRow[];
  loading: boolean;
  onSelectRow: (row: AdminTelephonyNumberRow) => void;
}

export function AdminTelephonyNumberTable({
  rows,
  loading,
  onSelectRow,
}: AdminTelephonyNumberTableProps) {
  const columns: DataTableColumn<AdminTelephonyNumberRow>[] = [
    {
      id: "number",
      header: "Number",
      className: "!align-middle",
      cell: (row) => <span className="font-medium text-[var(--color-neutral-900)]">{row.phoneNumber}</span>,
    },
    {
      id: "provider",
      header: "Provider",
      className: "!align-middle",
      cell: (row) => <span className="text-sm text-[var(--color-neutral-700)]">{row.providerLabel}</span>,
    },
    {
      id: "tenant",
      header: "Tenant",
      className: "!align-middle",
      cell: (row) => (
        <span className="text-sm text-[var(--color-neutral-700)]">{row.tenantLabel || "\u2014"}</span>
      ),
    },
    {
      id: "assistant",
      header: "Assistant",
      className: "!align-middle",
      cell: (row) => (
        <span className="text-sm text-[var(--color-neutral-700)]">{row.assignmentLabel || "\u2014"}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      width: "12%",
      className: "!align-middle",
      cell: (row) => (
        <span className="text-sm text-[var(--color-neutral-700)]">{row.statusLabel}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      width: "6%",
      className: "!align-middle",
      cell: (row) => {
        const items: OverflowMenuItem[] = [
          {
            label: row.tenantLabel ? "Edit assignment" : "Assign number",
            onClick: () => onSelectRow(row),
          },
        ];
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <OverflowMenu items={items} data-testid={`number-actions-${row.id}`} />
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey="id"
      layout="auto"
      loading={loading}
      emptyState="No numbers synced yet."
    />
  );
}
