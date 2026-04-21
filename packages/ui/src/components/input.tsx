import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "../lib/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, description, error, id, label, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-[var(--color-neutral-700)]">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "h-10 w-full rounded-[var(--radius-md)] border bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]",
          "placeholder:text-[var(--color-neutral-400)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-500)]",
          error
            ? "border-[var(--color-error-500)]"
            : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
          className,
        )}
        {...props}
      />
      {description ? (
        <p id={descriptionId} className="text-xs text-[var(--color-neutral-500)]">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-xs text-[var(--color-error-500)]">
          {error}
        </p>
      ) : null}
    </div>
  );
});
