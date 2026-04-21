"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

const WIDTH_MAP = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
} as const;

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  side?: "right" | "left";
  width?: "sm" | "md" | "lg";
  className?: string;
}

export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  width = "md",
  className,
}: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        />
        <DialogPrimitive.Content
          data-testid="drawer"
          className={cn(
            "fixed z-50 flex h-full flex-col border bg-[var(--color-bg)] shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            side === "right"
              ? "inset-y-0 right-0 w-full border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right"
              : "inset-y-0 left-0 w-full border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
            WIDTH_MAP[width],
            className,
          )}
        >
          {/* Header */}
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
            <div className="space-y-1">
              <DialogPrimitive.Title className="text-base font-semibold text-[var(--color-neutral-900)]">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="text-sm text-[var(--color-neutral-500)]">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <button
                type="button"
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-neutral-500)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-neutral-900)]"
              >
                &#x2715;
              </button>
            </DialogPrimitive.Close>
          </div>

          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function DrawerBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1 overflow-y-auto px-5 py-4", className)} {...props} />;
}

export function DrawerFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shrink-0 border-t border-[var(--color-border)] px-5 py-4", className)}
      {...props}
    />
  );
}
