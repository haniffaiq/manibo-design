"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";

import {
  listAdminTenantAgentDefinitions,
  type AdminAgentDefinitionSummary,
} from "@/lib/api/admin-agent-definitions";
import { getAgentTemplates } from "@/lib/api/agent-builder-catalogs";
import { listAdminTenants } from "@/lib/api/tenants";

import { AssistantList } from "./components/assistant-list";
import {
  CreateAssistantModal,
  type CreateAssistantPayload,
} from "./components/create-assistant-modal";
import { DetailPanel } from "./components/detail-panel";

/**
 * Vapi-style agent builder workbench.
 *
 * Layout (inside the existing admin shell):
 *   ┌────────────────────┬────────────────────────────────────────┐
 *   │  AssistantList     │  DetailPanel (header + tabs + live)    │
 *   │  (320px)           │  (flex-1)                              │
 *   └────────────────────┴────────────────────────────────────────┘
 *
 * URL state:
 *   ?tenant_id=<id>   currently selected tenant (drives the list)
 *   ?id=<defId>       currently selected assistant (drives the detail)
 *   ?live=1           live test panel open by default on first paint
 */
export default function AgentDefinitionsWorkbenchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* -- URL state --------------------------------------------------- */

  const urlTenantId = searchParams.get("tenant_id");
  const urlAgentId = searchParams.get("id");
  const urlLive = searchParams.get("live") === "1";

  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(urlTenantId);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(urlAgentId);
  const [liveOpen, setLiveOpen] = useState<boolean>(urlLive);

  /* -- Tenants ----------------------------------------------------- */

  const { data: tenants, isLoading: tenantsLoading } = useSWR(
    "admin-agent-builder-tenants",
    () => listAdminTenants(500, 0),
  );
  const tenantList = tenants ?? [];

  // Auto-select first usable tenant if none was URL-pinned.
  useEffect(() => {
    if (selectedTenantId) return;
    const firstUsable = tenantList.find((t) => t.status !== "offboarded");
    if (firstUsable) setSelectedTenantId(firstUsable.id);
  }, [tenantList, selectedTenantId]);

  /* -- Agents (per tenant) ---------------------------------------- */

  const { data: agents, isLoading: agentsLoading, mutate: mutateAgents } = useSWR(
    selectedTenantId ? ["admin-agent-builder-agents", selectedTenantId] : null,
    () => listAdminTenantAgentDefinitions(selectedTenantId as string, 500, 0),
  );
  const agentList = agents ?? [];

  // Validate the URL-pinned agent against the loaded list. If it doesn't
  // belong to this tenant, drop it.
  useEffect(() => {
    if (!selectedAgentId) return;
    if (agents === undefined) return;
    if (!agents.some((a) => a.id === selectedAgentId)) {
      setSelectedAgentId(null);
    }
  }, [agents, selectedAgentId]);

  /* -- Templates (for create modal) ------------------------------- */

  const { data: templates, isLoading: templatesLoading } = useSWR(
    "admin-agent-builder-templates",
    getAgentTemplates,
  );

  const [createOpen, setCreateOpen] = useState(false);

  /* -- Sync URL when state changes -------------------------------- */

  const syncUrl = useCallback(
    (next: { tenantId: string | null; agentId: string | null; live: boolean }) => {
      const params = new URLSearchParams();
      if (next.tenantId) params.set("tenant_id", next.tenantId);
      if (next.agentId) params.set("id", next.agentId);
      if (next.live) params.set("live", "1");
      const qs = params.toString();
      router.replace(`/admin/agent-definitions${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router],
  );

  useEffect(() => {
    syncUrl({ tenantId: selectedTenantId, agentId: selectedAgentId, live: liveOpen });
  }, [selectedTenantId, selectedAgentId, liveOpen, syncUrl]);

  /* -- Handlers --------------------------------------------------- */

  function handleTenantChange(tenantId: string) {
    setSelectedTenantId(tenantId);
    setSelectedAgentId(null);
    setLiveOpen(false);
  }
  function handleAgentSelect(agentId: string) {
    setSelectedAgentId(agentId);
    setLiveOpen(false);
  }

  function handleCreate(payload: CreateAssistantPayload) {
    // Mock-only: optimistically prepend a fresh assistant to the list and
    // select it. A real impl would POST to /admin/tenants/<id>/agent-definitions.
    const id = `agent_local_${Math.random().toString(36).slice(2, 8)}`;
    const optimistic: AdminAgentDefinitionSummary = {
      id,
      tenant_id: payload.tenantId,
      name: payload.name,
      status: "draft",
      published_version: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    void mutateAgents((prev) => [optimistic, ...(prev ?? [])], { revalidate: false });
    setSelectedTenantId(payload.tenantId);
    setSelectedAgentId(id);
    setCreateOpen(false);
  }

  /* -- Render ----------------------------------------------------- */

  // The admin layout already provides the page chrome. We render a flex
  // 2-column workbench filling the available space.
  return (
    <div className="-mx-4 -mt-6 flex h-[calc(100vh-72px)] min-h-0 overflow-hidden border-t border-[var(--color-border)] sm:-mx-6 lg:-mx-8">
      <AssistantList
        tenants={tenantList}
        tenantsLoading={tenantsLoading}
        selectedTenantId={selectedTenantId}
        onTenantChange={handleTenantChange}
        agents={agentList}
        agentsLoading={agentsLoading}
        selectedAgentId={selectedAgentId}
        onAgentSelect={handleAgentSelect}
        onCreateClick={() => setCreateOpen(true)}
      />

      <main className="min-w-0 flex-1 overflow-hidden bg-white">
        {selectedTenantId && selectedAgentId ? (
          <DetailPanel
            tenantId={selectedTenantId}
            agentId={selectedAgentId}
            liveOpenInitial={liveOpen}
            onLiveOpenChange={setLiveOpen}
            onAfterDelete={() => {
              void mutateAgents();
              setSelectedAgentId(null);
            }}
          />
        ) : (
          <EmptyDetail
            hasTenant={Boolean(selectedTenantId)}
            hasAgents={agentList.length > 0}
            onCreateClick={() => setCreateOpen(true)}
            agentsLoading={agentsLoading}
          />
        )}
      </main>

      <CreateAssistantModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        templates={templates ?? []}
        templatesLoading={templatesLoading}
        tenants={tenantList}
        defaultTenantId={selectedTenantId}
        onSubmit={handleCreate}
      />
    </div>
  );
}

function EmptyDetail({
  hasTenant,
  hasAgents,
  onCreateClick,
  agentsLoading,
}: {
  hasTenant: boolean;
  hasAgents: boolean;
  onCreateClick: () => void;
  agentsLoading: boolean;
}) {
  if (!hasTenant) {
    return (
      <CenteredEmpty
        title="Pick a tenant to start"
        body="Use the tenant dropdown on the left to load that tenant's assistants."
      />
    );
  }
  if (agentsLoading) {
    return <CenteredEmpty title="Loading assistants…" body="" />;
  }
  if (!hasAgents) {
    return (
      <CenteredEmpty
        title="No assistants yet"
        body="Create your first assistant for this tenant."
        actionLabel="+ Create Assistant"
        onAction={onCreateClick}
      />
    );
  }
  return (
    <CenteredEmpty
      title="Pick an assistant"
      body="Select one from the list on the left to configure it."
    />
  );
}

function CenteredEmpty({
  title,
  body,
  actionLabel,
  onAction,
}: {
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-[var(--color-neutral-50)] p-8 text-center">
      <p className="text-base font-medium text-[var(--color-neutral-700)]">{title}</p>
      {body ? <p className="max-w-md text-sm text-[var(--color-neutral-500)]">{body}</p> : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-2 inline-flex h-9 items-center justify-center rounded-md bg-[var(--color-primary-500)] px-4 text-sm font-medium text-white hover:bg-[var(--color-primary-600)]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
