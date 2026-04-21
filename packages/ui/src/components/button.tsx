import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";
import { Tooltip } from "./tooltip";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** When set on a disabled button, wraps in a Tooltip explaining why the button is disabled. */
  disabledReason?: string;
}

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    "border-[var(--color-primary-600)] bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] disabled:border-[var(--color-neutral-200)] disabled:bg-[var(--color-neutral-100)] disabled:text-[var(--color-neutral-400)]",
  secondary:
    "border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-neutral-900)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-muted)] disabled:border-[var(--color-neutral-200)] disabled:bg-[var(--color-neutral-100)] disabled:text-[var(--color-neutral-400)]",
  outline:
    "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-neutral-900)] hover:border-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] disabled:border-[var(--color-neutral-200)] disabled:bg-[var(--color-neutral-100)] disabled:text-[var(--color-neutral-400)]",
  ghost:
    "border-transparent bg-transparent text-[var(--color-neutral-700)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-neutral-900)] disabled:border-transparent disabled:bg-[var(--color-neutral-100)] disabled:text-[var(--color-neutral-400)]",
  destructive:
    "border-[var(--color-error-500)] bg-[var(--color-error-50)] text-[var(--color-error-700)] hover:border-[var(--color-error-700)] hover:bg-[var(--color-error-50)] hover:text-[var(--color-error-700)] disabled:border-[var(--color-error-200)] disabled:bg-[var(--color-error-50)] disabled:text-[var(--color-error-300)]",
};

const sizeClassName: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, type, variant = "primary", size = "md", disabled, disabledReason, ...props },
  ref,
) {
  const button = (
    <button
      ref={disabledReason && disabled ? undefined : ref}
      type={type ?? "button"}
      disabled={disabled}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-[var(--radius-md)] border font-medium whitespace-nowrap leading-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-500)]",
        "disabled:cursor-not-allowed disabled:opacity-100 disabled:shadow-none",
        variantClassName[variant],
        sizeClassName[size],
        className,
      )}
      {...props}
    />
  );

  if (disabledReason && disabled) {
    return (
      <Tooltip content={disabledReason} delayDuration={0}>
        <span ref={ref as React.Ref<HTMLSpanElement>} className="inline-flex">
          {button}
        </span>
      </Tooltip>
    );
  }

  return button;
});
