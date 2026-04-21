"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@grove/ui/button";
import { Input } from "@grove/ui/input";
import { Modal } from "@grove/ui/modal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import type { AgentTemplate } from "@/lib/api/agent-builder-catalogs";
import type { AdminTenantSummary } from "@/lib/api/tenants";

export interface CreateAssistantPayload {
  templateId: string;
  name: string;
  language: string;
  tenantId: string;
}

export interface CreateAssistantModalProps {
  open: boolean;
  onClose: () => void;
  templates: AgentTemplate[];
  templatesLoading: boolean;
  tenants: AdminTenantSummary[];
  defaultTenantId: string | null;
  onSubmit: (payload: CreateAssistantPayload) => void;
}

type Step = 1 | 2 | 3;

const LANGUAGES = [
  { id: "id-ID", label: "Bahasa Indonesia" },
  { id: "en-US", label: "English (US)" },
];

export function CreateAssistantModal({
  open,
  onClose,
  templates,
  templatesLoading,
  tenants,
  defaultTenantId,
  onSubmit,
}: CreateAssistantModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("id-ID");
  const [tenantId, setTenantId] = useState<string>(defaultTenantId ?? "");

  // Reset state whenever the modal is opened.
  useEffect(() => {
    if (open) {
      setStep(1);
      setTemplateId(null);
      setName("");
      setLanguage("id-ID");
      setTenantId(defaultTenantId ?? "");
    }
  }, [open, defaultTenantId]);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  const usableTenants = useMemo(() => tenants.filter((t) => t.status !== "offboarded"), [tenants]);
  const selectedTenant = useMemo(() => usableTenants.find((t) => t.id === tenantId) ?? null, [usableTenants, tenantId]);

  // When a template is picked the first time, default name/language from it.
  useEffect(() => {
    if (selectedTemplate && !name) {
      setName(selectedTemplate.name);
    }
    if (selectedTemplate) {
      setLanguage(selectedTemplate.defaults.language);
    }
    // intentionally not depending on `name` so user typing isn't overwritten
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTemplate]);

  const canProceedFrom1 = templateId !== null;
  const canProceedFrom2 = name.trim().length > 0 && tenantId !== "";

  function handleSubmit() {
    if (!templateId || !canProceedFrom2) return;
    onSubmit({ templateId, name: name.trim(), language, tenantId });
  }

  const stepperLabel = `Step ${step} of 3`;
  const titleByStep: Record<Step, string> = {
    1: "Pick a template",
    2: "Name your assistant",
    3: "Review & create",
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={titleByStep[step]}
      description={stepperLabel}
      className="max-w-2xl"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            type="button"
            onClick={() => (step === 1 ? onClose() : setStep((step - 1) as Step))}
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <div className="flex items-center gap-2">
            <StepDots step={step} />
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => setStep((step + 1) as Step)}
                disabled={(step === 1 && !canProceedFrom1) || (step === 2 && !canProceedFrom2)}
              >
                Next
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={!canProceedFrom2}>
                Create assistant
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4 px-1 py-2">
        {step === 1 ? (
          <TemplateGrid
            templates={templates}
            loading={templatesLoading}
            selectedId={templateId}
            onSelect={setTemplateId}
          />
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <Field label="Assistant name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Northstar Booking Assistant"
                autoFocus
              />
            </Field>
            <Field label="Default language">
              <Select value={language} onValueChange={setLanguage}>
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
            <Field label="Tenant">
              <Select value={tenantId} onValueChange={setTenantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a tenant" />
                </SelectTrigger>
                <SelectContent>
                  {usableTenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} <span className="text-xs text-[var(--color-neutral-500)]">({t.environment})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3 rounded-md border border-[var(--color-border)] bg-[var(--color-neutral-50)] p-4 text-sm">
            <ReviewRow label="Template" value={selectedTemplate?.name ?? "—"} />
            <ReviewRow label="Name" value={name || "—"} />
            <ReviewRow label="Language" value={LANGUAGES.find((l) => l.id === language)?.label ?? language} />
            <ReviewRow label="Tenant" value={selectedTenant?.name ?? tenantId ?? "—"} />
            <ReviewRow
              label="Defaults"
              value={
                selectedTemplate
                  ? `${selectedTemplate.defaults.model_provider} · ${selectedTemplate.defaults.model_id} · ${selectedTemplate.defaults.voice_provider} · ${selectedTemplate.defaults.voice_id}`
                  : "—"
              }
            />
            <p className="pt-1 text-[12px] text-[var(--color-neutral-500)]">
              The assistant will be created as <strong>Draft v1</strong>. You can iterate
              on configuration before publishing.
            </p>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

function TemplateGrid({
  templates,
  loading,
  selectedId,
  onSelect,
}: {
  templates: AgentTemplate[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-md bg-[var(--color-neutral-100)]" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3">
      {templates.map((t) => {
        const selected = selectedId === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={[
              "group flex h-full flex-col rounded-md border p-4 text-left transition-colors",
              selected
                ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)] ring-1 ring-[var(--color-primary-500)]"
                : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary-300)]",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-neutral-900)]">{t.name}</span>
            </div>
            <div className="mt-1 text-[11px] uppercase tracking-wide text-[var(--color-neutral-500)]">{t.tagline}</div>
            <p className="mt-2 text-[12px] leading-5 text-[var(--color-neutral-600)]">{t.description}</p>
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-[11px] font-medium uppercase tracking-wide text-[var(--color-neutral-500)]">
        {label}
      </label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-[11px] uppercase tracking-wide text-[var(--color-neutral-500)]">{label}</span>
      <span className="text-right font-medium text-[var(--color-neutral-900)]">{value}</span>
    </div>
  );
}

function StepDots({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          className={[
            "h-1.5 w-1.5 rounded-full",
            step === i ? "bg-[var(--color-primary-500)]" : "bg-[var(--color-neutral-300)]",
          ].join(" ")}
        />
      ))}
    </div>
  );
}
