import { type ReactNode, type TableHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { Skeleton } from "./skeleton";

export type DataTableAlign = "left" | "center" | "right";

export interface DataTableColumn<RowData> {
  id: string;
  header: ReactNode;
  accessor?: keyof RowData;
  cell?: (row: RowData) => ReactNode;
  align?: DataTableAlign;
  width?: string;
  className?: string;
  /** When true and onSort is provided, the header renders as a clickable sort button. */
  sortable?: boolean;
  /** When false, prevents this column from appearing in column-visibility toggles. Default: true. */
  hideable?: boolean;
}

export interface DataTableProps<RowData> extends TableHTMLAttributes<HTMLTableElement> {
  columns: DataTableColumn<RowData>[];
  rows: RowData[];
  rowKey: keyof RowData | ((row: RowData, index: number) => string);
  emptyState?: ReactNode;
  layout?: "auto" | "fixed";
  /** Show skeleton placeholder rows instead of data. */
  loading?: boolean;
  /** Number of skeleton rows to display when loading. Default: 3. */
  loadingRows?: number;
  /** Called when a data row is clicked. */
  onRowClick?: (row: RowData) => void;

  /** Set of column IDs to hide. */
  hiddenColumns?: Set<string>;

  /** Currently sorted column ID, or null for no sort. */
  sortColumn?: string | null;
  /** Direction of the current sort. */
  sortDirection?: "asc" | "desc";
  /** Called when a sortable column header is clicked. */
  onSort?: (columnId: string) => void;

  /** Toolbar slot rendered above the table, inside the border container. */
  toolbar?: ReactNode;
}

function getAlignmentClassName(align: DataTableAlign | undefined): string {
  if (align === "right") {
    return "text-right";
  }
  if (align === "center") {
    return "text-center";
  }
  return "text-left";
}

function getCellValue<RowData>(row: RowData, column: DataTableColumn<RowData>): ReactNode {
  if (column.cell) {
    return column.cell(row);
  }

  if (column.accessor) {
    const value = row[column.accessor];
    if (value == null) {
      return "";
    }
    return String(value);
  }

  return "";
}

function getRowKey<RowData>(row: RowData, index: number, rowKey: DataTableProps<RowData>["rowKey"]): string {
  if (typeof rowKey === "function") {
    return rowKey(row, index);
  }
  return String(row[rowKey]);
}

/** Sort arrow indicators for column headers. */
function SortIndicator({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  return (
    <span className="ml-1 inline-flex flex-col" aria-hidden="true">
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        className={cn(
          "-mb-0.5",
          active && direction === "asc" ? "text-[var(--color-neutral-700)]" : "text-[var(--color-neutral-300)]",
        )}
      >
        <path d="M4 1L7 5H1L4 1Z" fill="currentColor" />
      </svg>
      <svg
        width="8"
        height="8"
        viewBox="0 0 8 8"
        fill="none"
        className={cn(
          active && direction === "desc" ? "text-[var(--color-neutral-700)]" : "text-[var(--color-neutral-300)]",
        )}
      >
        <path d="M4 7L1 3H7L4 7Z" fill="currentColor" />
      </svg>
    </span>
  );
}

const DEFAULT_LOADING_ROWS = 3;

export function DataTable<RowData>({
  className,
  columns,
  emptyState = "No results",
  hiddenColumns,
  layout = "auto",
  loading = false,
  loadingRows = DEFAULT_LOADING_ROWS,
  onRowClick,
  onSort,
  rowKey,
  rows,
  sortColumn,
  sortDirection = "asc",
  toolbar,
  ...props
}: DataTableProps<RowData>) {
  const visibleColumns = hiddenColumns
    ? columns.filter((col) => !hiddenColumns.has(col.id))
    : columns;

  return (
    <div
      data-ui="data-table"
      className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)]"
    >
      {toolbar ?? null}
      <table
        data-ui="data-table-table"
        className={cn("w-full min-w-full border-collapse", layout === "fixed" ? "table-fixed" : "table-auto", className)}
        {...props}
      >
        <colgroup>
          {visibleColumns.map((column) => (
            <col key={column.id} style={column.width ? { width: column.width } : undefined} />
          ))}
        </colgroup>
        <thead className="bg-[var(--color-bg-subtle)]">
          <tr>
            {visibleColumns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={cn(
                  "border-b border-[var(--color-border)] px-4 py-3 text-xs font-medium text-[var(--color-neutral-500)]",
                  getAlignmentClassName(column.align),
                  column.className,
                )}
              >
                {onSort && column.sortable ? (
                  <button
                    type="button"
                    onClick={() => onSort(column.id)}
                    className="inline-flex items-center gap-0.5 text-xs font-medium hover:text-[var(--color-neutral-700)]"
                  >
                    {column.header}
                    <SortIndicator
                      active={sortColumn === column.id}
                      direction={sortColumn === column.id ? sortDirection : "asc"}
                    />
                  </button>
                ) : (
                  column.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <LoadingRows columns={visibleColumns} count={loadingRows} />
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={visibleColumns.length}
                className="px-4 py-8 text-center text-sm text-[var(--color-neutral-500)]"
              >
                {emptyState}
              </td>
            </tr>
          ) : (
            rows.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex, rowKey)}
                className={cn(
                  "border-b border-[var(--color-border)] last:border-b-0 hover:bg-[var(--color-bg-subtle)]",
                  onRowClick && "cursor-pointer",
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {visibleColumns.map((column) => (
                  <td
                    key={column.id}
                    className={cn(
                      "align-top px-4 py-3 text-sm text-[var(--color-neutral-700)]",
                      getAlignmentClassName(column.align),
                      column.className,
                    )}
                  >
                    {getCellValue(row, column)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function LoadingRows<RowData>({ columns, count }: { columns: DataTableColumn<RowData>[]; count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, rowIndex) => (
        <tr
          key={`skeleton-${rowIndex}`}
          className="border-b border-[var(--color-border)] last:border-b-0"
          role="status"
          aria-label="Loading"
        >
          {columns.map((column) => (
            <td
              key={column.id}
              className={cn(
                "align-top px-4 py-3",
                getAlignmentClassName(column.align),
                column.className,
              )}
            >
              <Skeleton className="h-4 w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
