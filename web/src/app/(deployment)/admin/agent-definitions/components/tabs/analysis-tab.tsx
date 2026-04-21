"use client";

import { Button } from "@grove/ui/button";
import { Input } from "@grove/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";

import type { AnalysisConfig, AnalysisFieldConfig } from "../agent-config-types";
import { Field, Section } from "./model-tab";

const FIELD_TYPES: AnalysisFieldConfig["type"][] = ["string", "number", "boolean", "enum"];

export interface AnalysisTabProps {
  config: AnalysisConfig;
  onChange: (next: AnalysisConfig) => void;
}

export function AnalysisTab({ config, onChange }: AnalysisTabProps) {
  function update<K extends keyof AnalysisConfig>(key: K, value: AnalysisConfig[K]) {
    onChange({ ...config, [key]: value });
  }

  function updateField(index: number, patch: Partial<AnalysisFieldConfig>) {
    const next = [...config.fields];
    next[index] = { ...next[index], ...patch };
    update("fields", next);
  }

  function removeField(index: number) {
    const next = config.fields.filter((_, i) => i !== index);
    update("fields", next);
  }

  function addField() {
    update("fields", [...config.fields, { name: "", json_path: "", type: "string" }]);
  }

  return (
    <Section title="Analysis" subtitle="Post-call evaluation: summary, success criteria, and structured data extraction.">
      <Field label="Summary prompt">
        <textarea
          rows={3}
          className={textareaClass}
          value={config.summary_prompt}
          onChange={(e) => update("summary_prompt", e.target.value)}
          placeholder="Summarise the call in 2-3 sentences."
        />
      </Field>

      <Field label="Success criteria">
        <textarea
          rows={3}
          className={textareaClass}
          value={config.success_criteria}
          onChange={(e) => update("success_criteria", e.target.value)}
          placeholder="The caller's request was acknowledged and either fulfilled or escalated."
        />
      </Field>

      <Field label="Structured data extraction">
        {config.fields.length === 0 ? (
          <div className="rounded-md border border-dashed border-[var(--color-border)] px-4 py-6 text-center text-[12px] text-[var(--color-neutral-500)]">
            No fields defined. Add a field to extract structured data from each call.
          </div>
        ) : (
          <ul className="space-y-2">
            {config.fields.map((field, idx) => (
              <li key={idx} className="grid grid-cols-[1fr_1fr_120px_28px] gap-2 rounded-md border border-[var(--color-border)] bg-white p-2">
                <Input
                  placeholder="field_name"
                  value={field.name}
                  onChange={(e) => updateField(idx, { name: e.target.value })}
                />
                <Input
                  placeholder="$.json.path"
                  value={field.json_path}
                  onChange={(e) => updateField(idx, { json_path: e.target.value })}
                />
                <Select
                  value={field.type}
                  onValueChange={(v) => updateField(idx, { type: v as AnalysisFieldConfig["type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  onClick={() => removeField(idx)}
                  className="rounded-md text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-danger)]"
                  aria-label="Remove field"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-2 flex justify-end">
          <Button type="button" variant="secondary" size="sm" onClick={addField}>
            + Add field
          </Button>
        </div>
      </Field>
    </Section>
  );
}

const textareaClass =
  "w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]";
