"use client";

import { useMemo, useState } from "react";

import { Button } from "@grove/ui/button";
import { Drawer, DrawerBody, DrawerFooter } from "@grove/ui/drawer";
import { Input } from "@grove/ui/input";
import type { ToolCatalogEntry } from "@/lib/api/agent-builder-catalogs";

const CATEGORY_LABEL: Record<ToolCatalogEntry["category"], string> = {
  scheduling: "Scheduling",
  messaging: "Messaging",
  lookup: "Lookup",
  handoff: "Handoff",
};

export interface ToolPickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  catalog: ToolCatalogEntry[];
  catalogLoading: boolean;
  excludeIds: string[];
  onAdd: (ids: string[]) => void;
}

export function ToolPickerDrawer({
  open,
  onOpenChange,
  catalog,
  catalogLoading,
  excludeIds,
  onAdd,
}: ToolPickerDrawerProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const available = useMemo(() => {
    const excluded = new Set(excludeIds);
    return catalog.filter((c) => !excluded.has(c.id));
  }, [catalog, excludeIds]);

  const filtered = useMemo(() => {
    if (!search.trim()) return available;
    const q = search.trim().toLowerCase();
    return available.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }, [available, search]);

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleAdd() {
    onAdd(Array.from(selected));
    setSelected(new Set());
    setSearch("");
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setSelected(new Set());
      setSearch("");
    }
    onOpenChange(nextOpen);
  }

  return (
    <Drawer
      open={open}
      onOpenChange={handleClose}
      title="Add tools"
      description="Pick one or more tools from the catalog. The assistant can call them during a conversation."
      width="md"
    >
      <DrawerBody>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tools by name or category…"
          autoFocus
        />
        <div className="mt-3 space-y-2">
          {catalogLoading ? (
            <p className="py-6 text-center text-sm text-[var(--color-neutral-500)]">Loading catalog…</p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-neutral-500)]">
              {available.length === 0 ? "All tools already added." : "No matches."}
            </p>
          ) : (
            filtered.map((tool) => {
              const checked = selected.has(tool.id);
              return (
                <label
                  key={tool.id}
                  className={[
                    "flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors",
                    checked
                      ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]"
                      : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary-300)]",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    onChange={() => toggle(tool.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-semibold text-[var(--color-neutral-900)]">
                        {tool.name}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-[var(--color-neutral-500)]">
                        {CATEGORY_LABEL[tool.category]}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-5 text-[var(--color-neutral-600)]">{tool.description}</p>
                  </div>
                </label>
              );
            })
          )}
        </div>
      </DrawerBody>
      <DrawerFooter>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] text-[var(--color-neutral-500)]">
            {selected.size} selected
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => handleClose(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={selected.size === 0}>
              Add {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
          </div>
        </div>
      </DrawerFooter>
    </Drawer>
  );
}
