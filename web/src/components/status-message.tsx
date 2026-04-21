import type { ReactNode } from "react";

import { cn } from "@grove/ui/cn";

export type StatusVariant = "success" | "warning" | "error" | "info";

export interface StatusMessageProps {
  variant?: StatusVariant;
  inline?: boolean;
  children: ReactNode;
  className?: string;
  "data-testid"?: string;
}

const boxVariantClass: Record<StatusVariant, string> = {
  success: "border-[var(--color-success-500)] bg-[var(--color-success-50)] text-[var(--color-success-700)]",
  warning: "border-[var(--color-warning-500)] bg-[var(--color-warning-50)] text-[var(--color-neutral-800)]",
  error: "border-[var(--color-error-500)] bg-[var(--color-error-50)] text-[var(--color-error-700)]",
  info: "border-[var(--color-primary-300)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]",
};

const inlineVariantClass: Record<StatusVariant, string> = {
  success: "text-[var(--color-success-700)]",
  warning: "text-[var(--color-neutral-700)]",
  error: "text-[var(--color-error-700)]",
  info: "text-[var(--color-primary-700)]",
};

export function StatusMessage({
  variant = "error",
  inline = false,
  children,
  className,
  "data-testid": testId,
}: StatusMessageProps) {
  if (children == null || children === "") return null;

  if (inline) {
    return (
      <p data-testid={testId} className={cn("text-sm", inlineVariantClass[variant], className)}>
        {children}
      </p>
    );
  }

  return (
    <div
      data-testid={testId}
      className={cn("rounded-[var(--radius-md)] border px-3 py-2 text-sm", boxVariantClass[variant], className)}
    >
      {children}
    </div>
  );
}
