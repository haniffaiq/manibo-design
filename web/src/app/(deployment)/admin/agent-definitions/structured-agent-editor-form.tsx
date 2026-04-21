"use client";

import { useId, type ChangeEvent, type ReactNode } from "react";
import type { Document } from "yaml";

import { Input } from "@grove/ui/input";

export function docGet(doc: Document, path: string[]): unknown {
  try {
    return doc.getIn(path);
  } catch {
    return undefined;
  }
}

export function docGetString(doc: Document, path: string[]): string {
  const v = docGet(doc, path);
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

export function docGetNumber(doc: Document, path: string[]): number | null {
  const v = docGet(doc, path);
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

export function docGetBoolean(doc: Document, path: string[]): boolean | null {
  const v = docGet(doc, path);
  if (typeof v === "boolean") return v;
  return null;
}

export function docHas(doc: Document, path: string[]): boolean {
  return docGet(doc, path) !== undefined;
}

export function detectPrefix(doc: Document): string[] {
  if (docHas(doc, ["agent", "name"]) || docHas(doc, ["agent", "mission"])) {
    return ["agent"];
  }
  return [];
}

export function prefixed(prefix: string[], path: string[]): string[] {
  return [...prefix, ...path];
}

function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium text-[var(--color-neutral-500)]"
    >
      {children}
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  readOnly,
  description,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  readOnly?: boolean;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {description ? (
        <p className="text-[10px] leading-tight text-[var(--color-neutral-400)]">{description}</p>
      ) : null}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="h-10 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-neutral-900)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-500)] disabled:opacity-60"
      >
        <option value="">-</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  readOnly,
  description,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
  readOnly?: boolean;
  description?: string;
}) {
  const id = useId();
  const display = value != null ? `${value}${unit ?? ""}` : "-";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
        <span className="text-xs font-mono text-[var(--color-neutral-600)]">
          {display}
        </span>
      </div>
      {description ? (
        <p className="text-[10px] leading-tight text-[var(--color-neutral-400)]">{description}</p>
      ) : null}
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value ?? min}
        onChange={(e) => onChange(Number(e.target.value))}
        disabled={readOnly}
        className="w-full accent-[var(--color-primary-500)]"
      />
    </div>
  );
}

export function ToggleField({
  label,
  checked,
  onChange,
  readOnly,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  readOnly?: boolean;
  description?: string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={readOnly}
          className="h-4 w-4 rounded border-[var(--color-border)] accent-[var(--color-primary-500)]"
        />
        <label
          htmlFor={id}
          className="text-xs text-[var(--color-neutral-600)]"
        >
          {label}
        </label>
      </div>
      {description ? (
        <p className="ml-6 mt-0.5 text-[10px] leading-tight text-[var(--color-neutral-400)]">{description}</p>
      ) : null}
    </div>
  );
}

export function TextareaField({
  label,
  value,
  rows,
  placeholder,
  onChange,
  readOnly,
}: {
  label: string;
  value: string;
  rows: number;
  placeholder?: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <textarea
        id={id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-500)] read-only:opacity-60 resize-y"
      />
    </div>
  );
}

export function InputField({
  label,
  value,
  type,
  placeholder,
  onChange,
  readOnly,
  description,
}: {
  label: string;
  value: string;
  type?: string;
  placeholder?: string;
  onChange: (v: string) => void;
  readOnly?: boolean;
  description?: string;
}) {
  const id = useId();
  return (
    <div className="space-y-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {description ? (
        <p className="text-[10px] leading-tight text-[var(--color-neutral-400)]">{description}</p>
      ) : null}
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        readOnly={readOnly}
      />
    </div>
  );
}

export function EditableStringList({
  label,
  items,
  onChange,
  readOnly,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <FieldLabel>{label}</FieldLabel>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-1.5">
          <textarea
            value={item}
            rows={2}
            onChange={(e) => {
              const next = [...items];
              next[index] = e.target.value;
              onChange(next);
            }}
            readOnly={readOnly}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1.5 text-xs text-[var(--color-neutral-900)] read-only:opacity-60 resize-y"
          />
          {!readOnly ? (
            <button
              type="button"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
              className="mt-1 text-xs text-[var(--color-error-500)] hover:text-[var(--color-error-700)]"
              title="Remove"
            >
              x
            </button>
          ) : null}
        </div>
      ))}
      {!readOnly ? (
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="text-xs text-[var(--color-primary-600)] hover:text-[var(--color-primary-800)]"
        >
          + Add
        </button>
      ) : null}
    </div>
  );
}
