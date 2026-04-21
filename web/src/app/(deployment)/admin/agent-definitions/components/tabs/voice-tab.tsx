"use client";

import { useMemo, useState } from "react";

import { Button } from "@grove/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import type { VoiceProvider } from "@/lib/api/agent-builder-catalogs";

import type { VoiceConfig } from "../agent-config-types";
import { Field, FieldRow, Section } from "./model-tab";

export interface VoiceTabProps {
  config: VoiceConfig;
  onChange: (next: VoiceConfig) => void;
  providers: VoiceProvider[];
  providersLoading: boolean;
}

const LANGUAGES = [
  { id: "id-ID", label: "Bahasa Indonesia" },
  { id: "en-US", label: "English (US)" },
];

export function VoiceTab({ config, onChange, providers, providersLoading }: VoiceTabProps) {
  const [previewing, setPreviewing] = useState(false);

  const currentProvider = useMemo(
    () => providers.find((p) => p.id === config.provider),
    [providers, config.provider],
  );
  const filteredVoices = useMemo(
    () =>
      currentProvider
        ? currentProvider.voices.filter((v) => v.language === config.language || currentProvider.id !== "azure")
        : [],
    [currentProvider, config.language],
  );

  function update<K extends keyof VoiceConfig>(key: K, value: VoiceConfig[K]) {
    onChange({ ...config, [key]: value });
  }

  function selectProvider(providerId: string) {
    const provider = providers.find((p) => p.id === providerId);
    const firstVoice = provider?.voices[0]?.id ?? config.voice;
    onChange({ ...config, provider: providerId, voice: firstVoice });
  }

  function previewVoice() {
    setPreviewing(true);
    // Mock-only: just flash the button briefly. A real impl would request a
    // signed sample MP3 from the platform TTS service and play it.
    setTimeout(() => setPreviewing(false), 1500);
  }

  return (
    <Section title="Voice" subtitle="Pick the TTS voice that the assistant uses.">
      <FieldRow>
        <Field label="TTS Provider">
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
        <Field label="Voice">
          <Select
            value={config.voice}
            onValueChange={(v) => update("voice", v)}
            disabled={!currentProvider}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a voice" />
            </SelectTrigger>
            <SelectContent>
              {filteredVoices.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">{v.label}</span>
                    <span className="text-[11px] uppercase tracking-wide text-[var(--color-neutral-500)]">
                      {v.gender}
                    </span>
                    <span className="text-[11px] text-[var(--color-neutral-500)]">{v.language}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </FieldRow>

      <FieldRow>
        <Field label="Language">
          <Select value={config.language} onValueChange={(v) => update("language", v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Preview">
          <Button type="button" variant="secondary" onClick={previewVoice} disabled={previewing}>
            {previewing ? "▶ Playing…" : "▶ Preview voice"}
          </Button>
        </Field>
      </FieldRow>
    </Section>
  );
}
