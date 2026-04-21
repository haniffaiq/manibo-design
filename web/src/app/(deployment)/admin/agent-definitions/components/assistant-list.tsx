"use client";

import { useMemo, useState } from "react";

import { Button } from "@grove/ui/button";
import { Input } from "@grove/ui/input";
import { Skeleton } from "@grove/ui/skeleton";
import type { AdminAgentDefinitionSummary, AdminAgentDefinitionStatus } from "@/lib/api/admin-agent-definitions";
import type { AdminTenantSummary } from "@/lib/api/tenants";

import { TenantSelector } from "./tenant-selector";

const STATUS_DOT: Record<AdminAgentDefinitionStatus, string> = {
  draft: "bg-amber-400",
  published: "bg-emerald-500",
  retired: "bg-slate-400",
};

export interface AssistantListProps {
  tenants: AdminTenantSummary[];
  tenantsLoading: boolean;
  selectedTenantId: string | null;
  onTenantChange: (tenantId: string) => void;
  agents: AdminAgentDefinitionSummary[] | undefined;
  agentsLoading: boolean;
  selectedAgentId: string | null;
  onAgentSelect: (agentId: string) => void;
  onCreateClick: () => void;
}

export function AssistantList({
  tenants,
  tenantsLoading,
  selectedTenantId,
  onTenantChange,
  agents,
  agentsLoading,
  selectedAgentId,
  onAgentSelect,
  onCreateClick,
}: AssistantListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const list = agents ?? [];
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter((a) => a.name.toLowerCase().includes(q));
  }, [agents, search]);

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-neutral-50)]">
      {/* Header */}
      <div className="space-y-3 border-b border-[var(--color-border)] px-4 py-4">
        <TenantSelector
          tenants={tenants}
          selectedTenantId={selectedTenantId}
          onChange={onTenantChange}
          loading={tenantsLoading}
        />
        <div className="flex items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assistants…"
            className="flex-1"
            disabled={!selectedTenantId}
          />
          <Button
            type="button"
            size="sm"
            onClick={onCreateClick}
            disabled={!selectedTenantId}
            aria-label="Create assistant"
          >
            + Create
          </Button>
        </div>
      </div>

      {/* List body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!selectedTenantId ? (
          <EmptyState title="Select a tenant" body="Pick a tenant above to see its assistants." />
        ) : agentsLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          search ? (
            <EmptyState title="No matches" body={`No assistants matching "${search}".`} />
          ) : (
            <EmptyState
              title="No assistants yet"
              body="Create your first assistant to start configuring agents for this tenant."
              cta={
                <Button type="button" onClick={onCreateClick}>
                  + Create Assistant
                </Button>
              }
            />
          )
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {filtered.map((agent) => {
              const selected = agent.id === selectedAgentId;
              return (
                <li key={agent.id}>
                  <button
                    type="button"
                    onClick={() => onAgentSelect(agent.id)}
                    className={[
                      "block w-full px-4 py-3 text-left transition-colors",
                      selected
                        ? "bg-white shadow-[inset_3px_0_0_var(--color-primary-500)]"
                        : "hover:bg-white/60",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2">
                      <span className={["h-2 w-2 shrink-0 rounded-full", STATUS_DOT[agent.status]].join(" ")} />
                      <span className="truncate text-sm font-medium text-[var(--color-neutral-900)]">
                        {agent.name}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-[11px] text-[var(--color-neutral-500)]">
                      {agent.published_version != null ? `v${agent.published_version} · ` : "no published version · "}
                      {agent.status}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--color-border)] px-4 py-2 text-[11px] text-[var(--color-neutral-500)]">
        {filtered.length === 0 ? "0 assistants" : `${filtered.length} assistant${filtered.length === 1 ? "" : "s"}`}
      </div>
    </aside>
  );
}

function EmptyState({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-10 text-center">
      <p className="text-sm font-medium text-[var(--color-neutral-700)]">{title}</p>
      <p className="text-[12px] leading-5 text-[var(--color-neutral-500)]">{body}</p>
      {cta}
    </div>
  );
}
