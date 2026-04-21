import { type HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export type BadgeVariant = "neutral" | "success" | "warning" | "error";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClassName: Record<BadgeVariant, string> = {
  neutral: "border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-neutral-700)]",
  success: "border-[var(--color-success-500)] bg-[var(--color-success-50)] text-[var(--color-success-700)]",
  warning: "border-[var(--color-warning-500)] bg-[var(--color-warning-50)] text-[var(--color-neutral-700)]",
  error: "border-[var(--color-error-500)] bg-[var(--color-error-50)] text-[var(--color-error-700)]",
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap leading-none",
        variantClassName[variant],
        className,
      )}
      {...props}
    />
  );
}
