"use client";

import { useMemo, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import { Switch } from "@grove/ui/switch";
import type { TranscriberProvider } from "@/lib/api/agent-builder-catalogs";

import type { AdvancedConfig, AgentBuilderConfig } from "../agent-config-types";
import { Field, FieldRow, Section } from "./model-tab";

export interface AdvancedTabProps {
  config: AdvancedConfig;
  onChange: (next: AdvancedConfig) => void;
  /** The full working config — used to render the read-only YAML preview. */
  fullConfig: AgentBuilderConfig;
  providers: TranscriberProvider[];
  providersLoading: boolean;
}

export function AdvancedTab({ config, onChange, fullConfig, providers, providersLoading }: AdvancedTabProps) {
  const [yamlExpanded, setYamlExpanded] = useState(false);

  const currentProvider = useMemo(
    () => providers.find((p) => p.id === config.transcriber_provider),
    [providers, config.transcriber_provider],
  );

  function update<K extends keyof AdvancedConfig>(key: K, value: AdvancedConfig[K]) {
    onChange({ ...config, [key]: value });
  }

  function selectProvider(providerId: string) {
    const provider = providers.find((p) => p.id === providerId);
    const firstModel = provider?.models[0]?.id ?? config.transcriber_model;
    onChange({ ...config, transcriber_provider: providerId, transcriber_model: firstModel });
  }

  return (
    <Section title="Advanced" subtitle="Transcription, retention, redaction, and raw configuration.">
      {/* Transcriber */}
      <div>
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">Transcriber (STT)</h4>
        <div className="mt-2 space-y-3">
          <FieldRow>
            <Field label="STT Provider">
              <Select value={config.transcriber_provider} onValueChange={selectProvider}>
                <SelectTrigger>
                  <SelectValue placeholder={providersLoading ? "Loading…" : "Select provider"} />
                </SelectTrigger>
                <SelectContent>
                  {providers.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Model">
              <Select
                value={config.transcriber_model}
                onValueChange={(v) => update("transcriber_model", v)}
                disabled={!currentProvider}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(currentProvider?.models ?? []).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <span className="flex items-center gap-2">
                        <span className="font-medium">{m.label}</span>
                        {m.notes ? (
                          <span className="text-[11px] text-[var(--color-neutral-500)]">{m.notes}</span>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldRow>
          <ToggleRow
            label="Auto-detect language"
            hint="Switch transcription language automatically when the caller switches."
            checked={config.language_detection}
            onChange={(v) => update("language_detection", v)}
          />
        </div>
      </div>

      {/* Recording / compliance */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">Recording &amp; Compliance</h4>
        <div className="mt-2 space-y-3">
          <Field label={`Recording retention: ${config.recording_retention_days} days`}>
            <input
              type="range"
              min={1}
              max={365}
              step={1}
              value={config.recording_retention_days}
              onChange={(e) => update("recording_retention_days", Number(e.target.value))}
              className="w-full"
            />
            <p className="mt-1 text-[11px] text-[var(--color-neutral-500)]">
              Calls are deleted automatically after this many days.
            </p>
          </Field>
          <ToggleRow
            label="PII redaction"
            hint="Mask phone numbers, IDs, and email addresses in transcripts and logs."
            checked={config.pii_redaction}
            onChange={(v) => update("pii_redaction", v)}
          />
        </div>
      </div>

      {/* Raw YAML preview */}
      <div className="border-t border-[var(--color-border)] pt-4">
        <button
          type="button"
          onClick={() => setYamlExpanded(!yamlExpanded)}
          className="flex w-full items-center justify-between text-left"
        >
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-neutral-500)]">Raw YAML</h4>
          <span className="text-[11px] text-[var(--color-neutral-500)]">{yamlExpanded ? "Hide" : "Show"}</span>
        </button>
        {yamlExpanded ? (
          <pre className="mt-2 max-h-[320px] overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-neutral-50)] p-3 font-mono text-[11px] leading-5 text-[var(--color-neutral-800)]">
{renderYamlPreview(fullConfig)}
          </pre>
        ) : null}
      </div>
    </Section>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-[var(--color-border)] bg-white p-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-[var(--color-neutral-900)]">{label}</p>
        <p className="text-[11px] text-[var(--color-neutral-500)]">{hint}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

/**
 * Naive YAML renderer for preview only — good enough to display the working
 * config as a recognisable shape. Not safe for round-trip.
 */
function renderYamlPreview(config: AgentBuilderConfig): string {
  const lines: string[] = [];
  lines.push("model:");
  lines.push(`  provider: ${config.model.provider}`);
  lines.push(`  id: ${config.model.model}`);
  lines.push(`  first_message_mode: ${config.model.first_message_mode}`);
  lines.push(`  first_message: ${JSON.stringify(config.model.first_message)}`);
  lines.push(`  temperature: ${config.model.temperature}`);
  lines.push(`  system_prompt: |`);
  for (const ln of config.model.system_prompt.split("\n")) {
    lines.push(`    ${ln}`);
  }
  lines.push("voice:");
  lines.push(`  provider: ${config.voice.provider}`);
  lines.push(`  id: ${config.voice.voice}`);
  lines.push(`  language: ${config.voice.language}`);
  if (config.tools.length > 0) {
    lines.push("tools:");
    for (const t of config.tools) {
      lines.push(`  - id: ${t.id}`);
      lines.push(`    enabled: ${t.enabled}`);
    }
  } else {
    lines.push("tools: []");
  }
  lines.push("analysis:");
  lines.push(`  summary_prompt: ${JSON.stringify(config.analysis.summary_prompt)}`);
  lines.push(`  success_criteria: ${JSON.stringify(config.analysis.success_criteria)}`);
  if (config.analysis.fields.length > 0) {
    lines.push("  fields:");
    for (const f of config.analysis.fields) {
      lines.push(`    - name: ${f.name}`);
      lines.push(`      json_path: ${JSON.stringify(f.json_path)}`);
      lines.push(`      type: ${f.type}`);
    }
  }
  lines.push("transcriber:");
  lines.push(`  provider: ${config.advanced.transcriber_provider}`);
  lines.push(`  model: ${config.advanced.transcriber_model}`);
  lines.push(`  language_detection: ${config.advanced.language_detection}`);
  lines.push(`recording:`);
  lines.push(`  retention_days: ${config.advanced.recording_retention_days}`);
  lines.push(`  pii_redaction: ${config.advanced.pii_redaction}`);
  return lines.join("\n");
}
