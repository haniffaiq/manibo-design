"use client";

import { useMemo, useState } from "react";

import { Button } from "@grove/ui/button";
import { Switch } from "@grove/ui/switch";
import type { ToolCatalogEntry } from "@/lib/api/agent-builder-catalogs";

import type { ToolConfig } from "../agent-config-types";
import { Section } from "./model-tab";
import { ToolPickerDrawer } from "./tool-picker-drawer";

const CATEGORY_LABEL: Record<ToolCatalogEntry["category"], string> = {
  scheduling: "Scheduling",
  messaging: "Messaging",
  lookup: "Lookup",
  handoff: "Handoff",
};

export interface ToolsTabProps {
  tools: ToolConfig[];
  onChange: (next: ToolConfig[]) => void;
  catalog: ToolCatalogEntry[];
  catalogLoading: boolean;
}

export function ToolsTab({ tools, onChange, catalog, catalogLoading }: ToolsTabProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeWithMeta = useMemo(
    () =>
      tools
        .map((t) => {
          const meta = catalog.find((c) => c.id === t.id);
          return meta ? { config: t, meta } : null;
        })
        .filter((x): x is { config: ToolConfig; meta: ToolCatalogEntry } => x !== null),
    [tools, catalog],
  );

  const activeIds = new Set(tools.map((t) => t.id));

  function toggleTool(id: string, enabled: boolean) {
    onChange(tools.map((t) => (t.id === id ? { ...t, enabled } : t)));
  }

  function removeTool(id: string) {
    onChange(tools.filter((t) => t.id !== id));
    if (expandedId === id) setExpandedId(null);
  }

  function addTools(ids: string[]) {
    const next: ToolConfig[] = [...tools];
    for (const id of ids) {
      if (!activeIds.has(id)) {
        next.push({ id, enabled: true, overrides: {} });
      }
    }
    onChange(next);
    setPickerOpen(false);
  }

  return (
    <Section
      title="Tools"
      subtitle="Function tools the assistant can call during a conversation."
    >
      {activeWithMeta.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[var(--color-border)] px-6 py-10 text-center">
          <p className="text-sm font-medium text-[var(--color-neutral-700)]">No tools yet</p>
          <p className="text-[12px] text-[var(--color-neutral-500)]">
            Add tools so the assistant can look things up, send messages, or hand off to a human.
          </p>
          <Button type="button" onClick={() => setPickerOpen(true)}>
            + Add tool
          </Button>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-[var(--color-border)] rounded-md border border-[var(--color-border)] bg-white">
            {activeWithMeta.map(({ config, meta }) => {
              const expanded = expandedId === meta.id;
              return (
                <li key={meta.id}>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : meta.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[var(--color-neutral-100)] text-[10px] uppercase text-[var(--color-neutral-500)]">
                        {meta.category[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-mono text-[13px] font-medium text-[var(--color-neutral-900)]">
                          {meta.name}
                        </span>
                        <span className="block truncate text-[11px] text-[var(--color-neutral-500)]">
                          {meta.description}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] uppercase tracking-wide text-[var(--color-neutral-500)]">
                        {CATEGORY_LABEL[meta.category]}
                      </span>
                    </button>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(v) => toggleTool(meta.id, v)}
                      aria-label={`Enable ${meta.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeTool(meta.id)}
                      className="ml-1 rounded-md p-1 text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-danger)]"
                      aria-label={`Remove ${meta.name}`}
                    >
                      ✕
                    </button>
                  </div>
                  {expanded ? (
                    <div className="border-t border-[var(--color-border)] bg-[var(--color-neutral-50)] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-wide text-[var(--color-neutral-500)]">Parameters</p>
                      <div className="mt-2 space-y-1.5 font-mono text-[12px]">
                        {meta.params.map((p) => (
                          <div
                            key={p.name}
                            className="flex items-baseline gap-2 rounded-sm bg-white px-2 py-1"
                          >
                            <span className="font-semibold text-[var(--color-neutral-900)]">{p.name}</span>
                            <span className="text-[var(--color-primary-600)]">
                              {p.type}
                              {p.required ? " *" : ""}
                            </span>
                            <span className="ml-1 text-[var(--color-neutral-500)]">{p.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setPickerOpen(true)}>
              + Add tool
            </Button>
          </div>
        </>
      )}

      <ToolPickerDrawer
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        catalog={catalog}
        catalogLoading={catalogLoading}
        excludeIds={Array.from(activeIds)}
        onAdd={addTools}
      />
    </Section>
  );
}
