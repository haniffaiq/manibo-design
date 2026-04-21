"use client";

import * as Popover from "@radix-ui/react-popover";
import { cn } from "../lib/cn";
import type { DataTableColumn } from "./data-table";

export interface DataTableColumnToggleProps<RowData> {
  columns: DataTableColumn<RowData>[];
  hiddenColumns: Set<string>;
  onToggle: (columnId: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

/** Eye icon shown when a column is visible. */
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M1.5 8C2.5 5 5 3 8 3s5.5 2 6.5 5c-1 3-3.5 5-6.5 5s-5.5-2-6.5-5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Eye-off icon shown when a column is hidden. */
function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2 2L14 14M6.5 6.5a2 2 0 0 0 3 3M1.5 8C2.5 5 5 3 8 3c1 0 1.9.2 2.8.5M14.5 8c-.4 1.2-1.1 2.3-2 3.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Gear icon trigger for the popover. */
function GearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.2 1.6a.8.8 0 0 0-.8.7l-.2 1.3a4.8 4.8 0 0 0-1.1.7l-1.3-.4a.8.8 0 0 0-.9.4l-.8 1.4a.8.8 0 0 0 .1 1l1 .9a5 5 0 0 0 0 1.3l-1 .8a.8.8 0 0 0-.1 1l.8 1.5a.8.8 0 0 0 .9.4l1.3-.5a4.8 4.8 0 0 0 1.1.7l.2 1.3a.8.8 0 0 0 .8.7h1.6a.8.8 0 0 0 .8-.7l.2-1.3a4.8 4.8 0 0 0 1.1-.7l1.3.5a.8.8 0 0 0 .9-.4l.8-1.5a.8.8 0 0 0-.1-1l-1-.8a5 5 0 0 0 0-1.3l1-.9a.8.8 0 0 0 .1-1l-.8-1.4a.8.8 0 0 0-.9-.4l-1.3.4a4.8 4.8 0 0 0-1.1-.7l-.2-1.3a.8.8 0 0 0-.8-.7H7.2ZM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
      />
    </svg>
  );
}

export function DataTableColumnToggle<RowData>({
  columns,
  hiddenColumns,
  onToggle,
  onShowAll,
  onHideAll,
}: DataTableColumnToggleProps<RowData>) {
  const hideableColumns = columns.filter((col) => col.hideable !== false);

  if (hideableColumns.length === 0) return null;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          data-testid="column-toggle-trigger"
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500",
            "hover:bg-neutral-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2",
          )}
          aria-label="Toggle column visibility"
        >
          <GearIcon />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[200px] rounded-lg border border-[var(--color-border)] bg-white p-3 shadow-md"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-[var(--color-neutral-500)] uppercase">
              Columns
            </span>
            <span className="flex gap-2">
              <button
                type="button"
                onClick={onShowAll}
                className="text-xs text-[var(--color-primary-600)] hover:underline"
              >
                Show all
              </button>
              <button
                type="button"
                onClick={onHideAll}
                className="text-xs text-[var(--color-primary-600)] hover:underline"
              >
                Hide all
              </button>
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {hideableColumns.map((col) => {
              const isHidden = hiddenColumns.has(col.id);
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => onToggle(col.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm",
                    "hover:bg-neutral-50",
                    isHidden ? "text-[var(--color-neutral-400)]" : "text-[var(--color-neutral-700)]",
                  )}
                >
                  {isHidden ? <EyeOffIcon /> : <EyeIcon />}
                  <span>{col.header}</span>
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
