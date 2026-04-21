"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@grove/ui/tabs";
import {
  getModelProviders,
  getToolCatalog,
  getTranscriberProviders,
  getVoiceProviders,
} from "@/lib/api/agent-builder-catalogs";
import {
  getAdminTenantAgentDefinition,
  listAdminTenantAgentDefinitionVersions,
  type AdminAgentDefinitionVersionDetail,
} from "@/lib/api/admin-agent-definitions";

import {
  DEFAULT_AGENT_CONFIG,
  type AgentBuilderConfig,
  type AdvancedConfig,
  type AnalysisConfig,
  type ModelConfig,
  type ToolConfig,
  type VoiceConfig,
} from "./agent-config-types";
import { DetailHeader } from "./detail-header";
import { AdvancedTab } from "./tabs/advanced-tab";
import { AnalysisTab } from "./tabs/analysis-tab";
import { ModelTab } from "./tabs/model-tab";
import { TestTab } from "./tabs/test-tab";
import { ToolsTab } from "./tabs/tools-tab";
import { VoiceTab } from "./tabs/voice-tab";
import { UnsavedBar } from "./unsaved-bar";

export interface DetailPanelProps {
  tenantId: string;
  agentId: string;
  liveOpenInitial: boolean;
  onLiveOpenChange: (open: boolean) => void;
  onAfterDelete: () => void;
}

const TABS = ["model", "voice", "tools", "analysis", "advanced", "test"] as const;
type TabId = (typeof TABS)[number];

export function DetailPanel({
  tenantId,
  agentId,
  liveOpenInitial,
  onLiveOpenChange,
  onAfterDelete,
}: DetailPanelProps) {
  /* -- Agent + version data --------------------------------------- */

  const { data: agent, error: agentError } = useSWR(
    ["admin-agent-builder-detail", tenantId, agentId],
    () => getAdminTenantAgentDefinition(tenantId, agentId),
  );
  const { data: versions } = useSWR(
    ["admin-agent-builder-versions", tenantId, agentId],
    () => listAdminTenantAgentDefinitionVersions(tenantId, agentId),
  );

  const versionList: AdminAgentDefinitionVersionDetail[] = versions ?? [];
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

  // Default to latest version on first load.
  useEffect(() => {
    if (selectedVersion == null && versionList.length > 0) {
      const latest = versionList.reduce((a, b) => (a.version > b.version ? a : b));
      setSelectedVersion(latest.version);
    }
  }, [versionList, selectedVersion]);

  /* -- Catalog data (used by tabs) -------------------------------- */

  const { data: modelProviders } = useSWR("admin-agent-builder-model-providers", getModelProviders);
  const { data: voiceProviders } = useSWR("admin-agent-builder-voice-providers", getVoiceProviders);
  const { data: transcriberProviders } = useSWR(
    "admin-agent-builder-transcriber-providers",
    getTranscriberProviders,
  );
  const { data: toolCatalog } = useSWR("admin-agent-builder-tool-catalog", getToolCatalog);

  /* -- Working config + dirty tracking ---------------------------- */

  const [activeTab, setActiveTab] = useState<TabId>(liveOpenInitial ? "test" : "model");
  const [config, setConfig] = useState<AgentBuilderConfig>(DEFAULT_AGENT_CONFIG);
  const [savedConfig, setSavedConfig] = useState<AgentBuilderConfig>(DEFAULT_AGENT_CONFIG);
  const [saving, setSaving] = useState(false);

  // Reset working config whenever the selected agent changes.
  useEffect(() => {
    setConfig(DEFAULT_AGENT_CONFIG);
    setSavedConfig(DEFAULT_AGENT_CONFIG);
    setActiveTab(liveOpenInitial ? "test" : "model");
  }, [agentId, liveOpenInitial]);

  // Keep external URL state in sync with internal tab state.
  useEffect(() => {
    onLiveOpenChange(activeTab === "test");
  }, [activeTab, onLiveOpenChange]);

  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(savedConfig), [config, savedConfig]);

  function handleSave() {
    setSaving(true);
    // Mock-only: pretend to persist. A real impl would POST a new version.
    setTimeout(() => {
      setSavedConfig(config);
      setSaving(false);
    }, 350);
  }
  function handleDiscard() {
    setConfig(savedConfig);
  }

  /* -- Loading / error gates -------------------------------------- */

  if (agentError) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-neutral-50)] p-8 text-center">
        <p className="text-sm text-[var(--color-danger)]">
          Failed to load assistant: {String((agentError as Error).message ?? agentError)}
        </p>
      </div>
    );
  }
  if (!agent) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-neutral-50)] p-8 text-sm text-[var(--color-neutral-500)]">
        Loading assistant…
      </div>
    );
  }

  /* -- Header derived data ---------------------------------------- */

  const providerLabel = modelProviders?.find((p) => p.id === config.model.provider)?.label ?? config.model.provider;
  const voiceLabel =
    voiceProviders
      ?.find((p) => p.id === config.voice.provider)
      ?.voices.find((v) => v.id === config.voice.voice)?.label ?? config.voice.voice;

  return (
    <div className="flex h-full min-w-0 flex-col bg-white">
      <DetailHeader
        agent={{
          id: agent.id,
          tenant_id: agent.tenant_id,
          name: agent.name,
          status: agent.status,
          published_version: agent.published_version,
          created_at: "", // not used in header — omit fields the type doesn't expose on the detail endpoint
          updated_at: "",
        }}
        versions={versionList}
        selectedVersion={selectedVersion}
        onVersionChange={setSelectedVersion}
        costPerMin={0.14}
        latencyMs={1150}
        onTalk={() => setActiveTab(activeTab === "test" ? "model" : "test")}
        talkActive={activeTab === "test"}
        onPublish={() => alert("Mock: publish flow not wired in design pack.")}
        onArchive={() => alert("Mock: archive flow not wired in design pack.")}
        onDuplicate={() => alert("Mock: duplicate flow not wired in design pack.")}
        onDelete={() => {
          if (confirm(`Delete ${agent.name}? (Mock — no persistence.)`)) {
            onAfterDelete();
          }
        }}
      />

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
          <div className="border-b border-[var(--color-border)] bg-white px-5 py-2">
            <TabsList>
              <TabsTrigger value="model">Model</TabsTrigger>
              <TabsTrigger value="voice">Voice</TabsTrigger>
              <TabsTrigger value="tools">
                Tools
                {config.tools.length > 0 ? (
                  <span className="ml-1.5 rounded-full bg-[var(--color-primary-500)] px-1.5 text-[10px] font-semibold text-white">
                    {config.tools.length}
                  </span>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="test">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Test
                </span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="model">
            <ModelTab
              config={config.model}
              onChange={(next: ModelConfig) => setConfig((c) => ({ ...c, model: next }))}
              providers={modelProviders ?? []}
              providersLoading={!modelProviders}
            />
          </TabsContent>
          <TabsContent value="voice">
            <VoiceTab
              config={config.voice}
              onChange={(next: VoiceConfig) => setConfig((c) => ({ ...c, voice: next }))}
              providers={voiceProviders ?? []}
              providersLoading={!voiceProviders}
            />
          </TabsContent>
          <TabsContent value="tools">
            <ToolsTab
              tools={config.tools}
              onChange={(next: ToolConfig[]) => setConfig((c) => ({ ...c, tools: next }))}
              catalog={toolCatalog ?? []}
              catalogLoading={!toolCatalog}
            />
          </TabsContent>
          <TabsContent value="analysis">
            <AnalysisTab
              config={config.analysis}
              onChange={(next: AnalysisConfig) => setConfig((c) => ({ ...c, analysis: next }))}
            />
          </TabsContent>
          <TabsContent value="advanced">
            <AdvancedTab
              config={config.advanced}
              onChange={(next: AdvancedConfig) => setConfig((c) => ({ ...c, advanced: next }))}
              fullConfig={config}
              providers={transcriberProviders ?? []}
              providersLoading={!transcriberProviders}
            />
          </TabsContent>
          <TabsContent value="test" className="h-full">
            <TestTab providerLabel={providerLabel} voiceLabel={voiceLabel} />
          </TabsContent>
        </Tabs>
      </div>

      <UnsavedBar visible={dirty} onSave={handleSave} onDiscard={handleDiscard} saving={saving} />
    </div>
  );
}
