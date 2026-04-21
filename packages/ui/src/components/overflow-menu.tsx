"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "../lib/cn";

export interface OverflowMenuItem {
  label: string;
  onClick: () => void;
  testId?: string;
  destructive?: boolean;
  disabled?: boolean;
}

export interface OverflowMenuProps {
  items: OverflowMenuItem[];
  align?: "start" | "center" | "end";
  "data-testid"?: string;
}

export function OverflowMenu({ items, align = "end", "data-testid": testId }: OverflowMenuProps) {
  if (items.length === 0) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          data-testid={testId ?? "overflow-menu-trigger"}
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400",
            "hover:bg-neutral-100 hover:text-neutral-600",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2",
          )}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          className={cn(
            "z-50 min-w-[160px] rounded-lg border border-[var(--color-border)] bg-white py-1 shadow-md",
            "animate-in fade-in-0 zoom-in-95",
          )}
        >
          {items.map((item) => (
            <DropdownMenu.Item
              key={item.label}
              disabled={item.disabled}
              onSelect={item.onClick}
              data-testid={item.testId}
              className={cn(
                "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm outline-none select-none",
                "hover:bg-neutral-50",
                "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                item.destructive ? "text-red-600" : "text-neutral-700",
              )}
            >
              {item.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
