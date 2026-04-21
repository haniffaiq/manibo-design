"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel?: string;
  className?: string;
}

export function Modal({
  children,
  className,
  closeLabel = "Close",
  description,
  footer,
  onClose,
  open,
  title,
}: ModalProps) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-[rgb(17_24_39_/_0.35)]" />
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <Dialog.Content
            aria-describedby={description ? undefined : ""}
            className={cn(
              "w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]",
              className,
            )}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
              <div className="space-y-1">
                {title ? (
                  <Dialog.Title className="text-base font-semibold text-[var(--color-neutral-900)]">
                    {title}
                  </Dialog.Title>
                ) : null}
                {description ? (
                  <Dialog.Description className="text-sm text-[var(--color-neutral-500)]">
                    {description}
                  </Dialog.Description>
                ) : null}
              </div>
              <Dialog.Close asChild>
                <button
                  type="button"
                  aria-label={closeLabel}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-neutral-400)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-neutral-900)]"
                >
                  ×
                </button>
              </Dialog.Close>
            </div>
            <div className="px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-[var(--color-border)] px-5 py-4">{footer}</div> : null}
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
