"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { createContext, forwardRef, useContext, type ComponentPropsWithoutRef, type ComponentRef } from "react";
import { cn } from "../lib/cn";

// Sentinel must be unrepresentable as a real option value.
// Radix Select disallows empty string, so we use a namespaced prefix.
const EMPTY_SENTINEL = "\0__grove_select_empty__";

interface EmptyableContextValue {
  emptyLabel: string;
}

const EmptyableContext = createContext<EmptyableContextValue | null>(null);

interface SelectProps extends ComponentPropsWithoutRef<typeof SelectPrimitive.Root> {
  /** When true, prepends an "empty" option and maps its sentinel value to "" in onValueChange. */
  allowEmpty?: boolean;
  /** Label for the empty option. Default: "None". */
  emptyLabel?: string;
}

export function Select({ allowEmpty, emptyLabel = "None", value, defaultValue, onValueChange, name, children, ...props }: SelectProps) {
  if (!allowEmpty) {
    return (
      <SelectPrimitive.Root value={value} onValueChange={onValueChange} defaultValue={defaultValue} name={name} {...props}>
        {children}
      </SelectPrimitive.Root>
    );
  }

  // Controlled mode: value is provided (including empty string)
  const isControlled = value !== undefined;
  const controlledProps = isControlled
    ? { value: value === "" ? EMPTY_SENTINEL : value }
    : { defaultValue: defaultValue === "" || defaultValue === undefined ? EMPTY_SENTINEL : defaultValue };
  const externalValue = isControlled ? (value === "" ? "" : value) : undefined;
  const handleChange = (next: string) => {
    onValueChange?.(next === EMPTY_SENTINEL ? "" : next);
  };

  // Strip `name` from Radix root to prevent the sentinel leaking into its
  // hidden native <select>. Render our own hidden <input> that maps the
  // sentinel back to "" for native form submissions.
  return (
    <EmptyableContext.Provider value={{ emptyLabel }}>
      <SelectPrimitive.Root {...controlledProps} onValueChange={handleChange} {...props}>
        {name ? <input type="hidden" name={name} value={externalValue ?? ""} /> : null}
        {children}
      </SelectPrimitive.Root>
    </EmptyableContext.Provider>
  );
}

export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;

export const SelectTrigger = forwardRef<
  ComponentRef<typeof SelectPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(function SelectTrigger({ className, children, ...props }, ref) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex h-10 w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)]",
        "hover:border-[var(--color-border-strong)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-500)]",
        "disabled:cursor-not-allowed disabled:bg-[var(--color-neutral-100)] disabled:text-[var(--color-neutral-400)]",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon>
        <ChevronDownIcon />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
});

export const SelectContent = forwardRef<
  ComponentRef<typeof SelectPrimitive.Content>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(function SelectContent({ className, children, position = "popper", ...props }, ref) {
  const emptyable = useContext(EmptyableContext);

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        position={position}
        className={cn(
          "z-50 min-w-[8rem] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] shadow-[var(--shadow-md)]",
          "animate-in fade-in-0 zoom-in-95",
          position === "popper" && "max-h-[var(--radix-select-content-available-height)]",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.Viewport
          className={cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}
        >
          {emptyable ? <SelectItem value={EMPTY_SENTINEL}>{emptyable.emptyLabel}</SelectItem> : null}
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});

export const SelectItem = forwardRef<
  ComponentRef<typeof SelectPrimitive.Item>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(function SelectItem({ className, children, value, ...props }, ref) {
  // Radix Select reserves value="" for "no selection" (placeholder). Using it on an item crashes at runtime.
  // Use allowEmpty on Select instead, or a sentinel value in onValueChange.
  if (typeof globalThis !== "undefined" && value === "") {
    console.warn('SelectItem: value="" is not allowed by Radix Select. Use allowEmpty on Select or a sentinel in onValueChange.');
  }
  return (
    <SelectPrimitive.Item
      ref={ref}
      value={value}
      data-value={value}
      className={cn(
        "relative flex w-full cursor-pointer items-center rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--color-neutral-900)] outline-none select-none",
        "hover:bg-[var(--color-neutral-100)]",
        "data-[highlighted]:bg-[var(--color-neutral-100)] focus-visible:outline-none",
        "data-[disabled]:cursor-not-allowed data-[disabled]:text-[var(--color-neutral-400)]",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
});

export const SelectLabel = forwardRef<
  ComponentRef<typeof SelectPrimitive.Label>,
  ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(function SelectLabel({ className, ...props }, ref) {
  return (
    <SelectPrimitive.Label
      ref={ref}
      className={cn("px-3 py-1.5 text-xs font-semibold text-[var(--color-neutral-500)]", className)}
      {...props}
    />
  );
});

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
