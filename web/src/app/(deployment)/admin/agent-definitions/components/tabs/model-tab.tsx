"use client";

import { useMemo } from "react";

import { Button } from "@grove/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import type { ModelProvider } from "@/lib/api/agent-builder-catalogs";

import type { ModelConfig, FirstMessageMode } from "../agent-config-types";

export interface ModelTabProps {
  config: ModelConfig;
  onChange: (next: ModelConfig) => void;
  providers: ModelProvider[];
  providersLoading: boolean;
}

const FIRST_MESSAGE_MODES: { id: FirstMessageMode; label: string; hint: string }[] = [
  { id: "assistant_speaks_first", label: "Assistant speaks first", hint: "Agent greets immediately on connect." },
  { id: "user_speaks_first", label: "User speaks first", hint: "Agent waits for the caller to begin." },
  { id: "wait_for_greeting", label: "Wait for greeting", hint: "Agent waits, then prompts if silent for 3s." },
];

export function ModelTab({ config, onChange, providers, providersLoading }: ModelTabProps) {
  const currentProvider = useMemo(
    () => providers.find((p) => p.id === config.provider),
    [providers, config.provider],
  );

  function update<K extends keyof ModelConfig>(key: K, value: ModelConfig[K]) {
    onChange({ ...config, [key]: value });
  }

  function selectProvider(providerId: string) {
    const provider = providers.find((p) => p.id === providerId);
    const firstModel = provider?.models[0]?.id ?? config.model;
    onChange({ ...config, provider: providerId, model: firstModel });
  }

  function generatePrompt() {
    update(
      "system_prompt",
      "You are a helpful voice assistant. Speak naturally in the caller's language. Keep responses short, ask clarifying questions when needed, and confirm important details before acting.",
    );
  }

  return (
    <Section title="Model" subtitle="Configure the LLM that drives the assistant.">
      {/* Provider + model row */}
      <FieldRow>
        <Field label="Provider">
          <Select value={config.provider} onValueChange={selectProvider}>
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
            value={config.model}
            onValueChange={(v) => update("model", v)}
            disabled={!currentProvider}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
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

      {/* First message mode + first message */}
      <Field label="First Message Mode">
        <Select
          value={config.first_message_mode}
          onValueChange={(v) => update("first_message_mode", v as FirstMessageMode)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FIRST_MESSAGE_MODES.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <span className="flex flex-col items-start">
                  <span className="font-medium">{m.label}</span>
                  <span className="text-[11px] text-[var(--color-neutral-500)]">{m.hint}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="First Message">
        <textarea
          rows={2}
          className={textareaClass}
          value={config.first_message}
          onChange={(e) => update("first_message", e.target.value)}
          placeholder="Hi, how can I help today?"
        />
      </Field>

      {/* System prompt */}
      <Field
        label="System Prompt"
        actions={
          <Button type="button" size="sm" variant="ghost" onClick={generatePrompt}>
            ✨ Generate
          </Button>
        }
      >
        <textarea
          rows={10}
          className={`${textareaClass} font-mono text-[12px] leading-5`}
          value={config.system_prompt}
          onChange={(e) => update("system_prompt", e.target.value)}
          placeholder="Describe the assistant's role, goals, and tone."
        />
      </Field>

      {/* Temperature */}
      <Field label={`Temperature: ${config.temperature.toFixed(2)}`}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.temperature}
          onChange={(e) => update("temperature", Number(e.target.value))}
          className="w-full"
        />
        <p className="mt-1 text-[11px] text-[var(--color-neutral-500)]">
          Lower = more deterministic and on-script. Higher = more creative phrasing.
        </p>
      </Field>
    </Section>
  );
}

/* --------------------------- Layout helpers --------------------------- */

const textareaClass =
  "w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-neutral-900)] placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-primary-500)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]";

export function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 px-5 py-5">
      <div>
        <h3 className="text-sm font-semibold text-[var(--color-neutral-900)]">{title}</h3>
        {subtitle ? <p className="text-[12px] text-[var(--color-neutral-500)]">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}

export function Field({
  label,
  actions,
  children,
}: {
  label: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
          {label}
        </label>
        {actions}
      </div>
      {children}
    </div>
  );
}
