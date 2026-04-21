"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import useSWR from "swr";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { DataTable, type DataTableColumn } from "@grove/ui/data-table";

import {
  listTestCalls,
  type AdminAgentDefinitionStatus,
  type AdminAgentDefinitionVersionDetail,
  type TestCallSummary,
} from "@/lib/api/admin-agent-definitions";

import {
  formatDate,
  toErrorMessage,
  versionStatusLabel,
  versionStatusVariant,
  type AdminAgentDefinitionVersionStatus,
} from "./helpers";

const StructuredAgentEditor = dynamic(
  () => import("./structured-agent-editor").then((mod) => mod.StructuredAgentEditor),
  {
    ssr: false,
    loading: () => <EditorLoadingMessage>Loading editor...</EditorLoadingMessage>,
  },
);

const YamlFlowPreview = dynamic(
  () => import("./yaml-flow-preview").then((mod) => mod.YamlFlowPreview),
  {
    loading: () => <EditorLoadingMessage>Loading flow preview...</EditorLoadingMessage>,
  },
);

type Props = {
  tenantId: string;
  definitionId: string;
  definitionStatus: AdminAgentDefinitionStatus | undefined;
  versions: AdminAgentDefinitionVersionDetail[];
  versionsError: unknown;
  versionsLoading: boolean;
  focusedVersion: number | null;
  actionBusy: boolean;
  publishingVersion: number | null;
  archivingVersion: number | null;
  showNewVersionForm: boolean;
  onPublish: (version: number) => Promise<void>;
  onArchive: (version: number) => Promise<void>;
  onReject: (version: number) => Promise<void>;
  onOpenNewVersion: () => void;
  onCloseNewVersion: () => void;
  onUpdateDraft: (version: number, sourceYaml: string, sourceYamlHash: string) => Promise<boolean>;
};

function EditorLoadingMessage({ children }: { children: string }) {
  return <p className="text-sm text-[var(--color-neutral-500)]">{children}</p>;
}

export function AgentDefinitionVersionHistory({
  tenantId,
  definitionId,
  definitionStatus,
  versions,
  versionsError,
  versionsLoading,
  focusedVersion,
  actionBusy,
  publishingVersion,
  archivingVersion,
  showNewVersionForm,
  onPublish,
  onArchive,
  onReject,
  onOpenNewVersion,
  onCloseNewVersion,
  onUpdateDraft,
}: Props) {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [expandedTab, setExpandedTab] = useState<"configuration" | "flow" | "test_calls">("configuration");

  const versionColumns: DataTableColumn<AdminAgentDefinitionVersionDetail>[] = [
    {
      id: "version",
      header: "Version",
      width: "14rem",
      cell: (version) => (
        <div
          className="space-y-1"
          data-testid={`admin-agent-definitions-version-row-${version.version}`}
          data-focused-version={version.version === focusedVersion ? "true" : undefined}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setExpandedVersion(expandedVersion === version.version ? null : version.version);
            }}
            className="cursor-pointer font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-800)] hover:underline"
          >
            v{version.version} {expandedVersion === version.version ? "▾" : "▸"}
          </button>
          {version.version === focusedVersion ? (
            <Badge data-testid="admin-agent-definitions-focused-version" variant="warning">
              Observed run
            </Badge>
          ) : null}
          <p className="text-xs text-[var(--color-neutral-500)]">Created {formatDate(version.created_at)}</p>
        </div>
      ),
    },
    {
      id: "status",
      header: "Stage",
      width: "8rem",
      className: "w-[8rem] min-w-[6rem] align-top",
      cell: (version) => (
        <Badge
          data-testid={`admin-agent-definition-version-status-${version.version}`}
          variant={versionStatusVariant(version.status)}
        >
          {versionStatusLabel(version.status)}
        </Badge>
      ),
    },
    {
      id: "change_cues",
      header: "Change cues",
      cell: (version) => (
        <div className="space-y-1 text-xs text-[var(--color-neutral-600)]">
          {version.submitted_at ? <p>Submitted {formatDate(version.submitted_at)}</p> : null}
          {version.review_decision ? (
            <p>
              {version.review_decision === "approved" ? "Approved" : "Rejected"}{" "}
              {formatDate(version.review_decided_at ?? version.review_submitted_at)}
              {version.review_reason ? ` · ${version.review_reason}` : ""}
            </p>
          ) : null}
          {version.published_at ? <p>Published {formatDate(version.published_at)}</p> : null}
        </div>
      ),
    },
    {
      id: "action",
      header: "Action",
      align: "right",
      width: "10rem",
      cell: (version) => (
        <VersionActions
          tenantId={tenantId}
          definitionId={definitionId}
          definitionStatus={definitionStatus}
          version={version}
          actionBusy={actionBusy}
          publishingVersion={publishingVersion}
          archivingVersion={archivingVersion}
          onPublish={onPublish}
          onArchive={onArchive}
          onReject={onReject}
        />
      ),
    },
  ];

  const expandedRow = versions.find((version) => version.version === expandedVersion) ?? null;

  return (
    <div className="space-y-4">
      {versionsError ? (
        <div className="rounded-[var(--radius-md)] border border-[var(--color-error-500)] bg-[var(--color-error-50)] px-3 py-2 text-sm text-[var(--color-error-700)]">
          {toErrorMessage(versionsError)}
        </div>
      ) : versionsLoading ? (
        <p className="text-sm text-[var(--color-neutral-500)]">Loading versions...</p>
      ) : (
        <div data-testid="admin-agent-definitions-versions-table">
          <DataTable
            columns={versionColumns}
            rows={versions}
            rowKey={(version) => `${version.id}:${version.version}`}
            emptyState={
              <div className="flex flex-col items-center gap-3">
                <p>No versions yet.</p>
                <Button variant="outline" size="sm" onClick={onOpenNewVersion} disabled={actionBusy}>
                  New Version
                </Button>
              </div>
            }
            layout="fixed"
            toolbar={
              definitionStatus !== "retired" ? (
                <div className="flex items-center gap-2 border-b border-neutral-100 px-4 py-3">
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="admin-agent-definitions-open-new-version"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={showNewVersionForm ? onCloseNewVersion : onOpenNewVersion}
                      disabled={versionsLoading}
                      aria-label={showNewVersionForm ? "Cancel new version" : "New version"}
                    >
                      {showNewVersionForm ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              ) : undefined
            }
          />
          {expandedRow ? (
            <div className="space-y-3 border-t border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-0 border-b border-[var(--color-border)]">
                  {(["configuration", "flow", "test_calls"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setExpandedTab(tab)}
                      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                        expandedTab === tab
                          ? "border-[var(--color-primary-500)] text-[var(--color-primary-700)]"
                          : "border-transparent text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]"
                      }`}
                    >
                      {tab === "configuration" ? `v${expandedRow.version} Configuration` : tab === "flow" ? "Flow" : "Test Calls"}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedVersion(null)}
                  className="text-xs text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]"
                >
                  Close
                </button>
              </div>
              {expandedTab === "configuration" ? (
                expandedRow.status === "draft" ? (
                  <DraftVersionEditor
                    version={expandedRow.version}
                    value={expandedRow.source_yaml}
                    sourceYamlHash={expandedRow.source_yaml_hash}
                    disabled={actionBusy}
                    onSave={onUpdateDraft}
                  />
                ) : (
                  <ReadOnlyYaml value={expandedRow.source_yaml} version={expandedRow.version} status={expandedRow.status} />
                )
              ) : expandedTab === "flow" ? (
                <ReadOnlyFlowPreview yaml={expandedRow.source_yaml} />
              ) : (
                <TestCallsPanel tenantId={tenantId} definitionId={definitionId} version={expandedRow.version} />
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function DraftVersionEditor({
  version,
  value,
  sourceYamlHash,
  disabled,
  onSave,
}: {
  version: number;
  value: string;
  sourceYamlHash: string;
  disabled: boolean;
  onSave: (version: number, sourceYaml: string, sourceYamlHash: string) => Promise<boolean>;
}) {
  const [draftYaml, setDraftYaml] = useState(value);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!saving) {
      setDraftYaml(value);
    }
  }, [saving, value]);

  const dirty = draftYaml.trim() !== value.trim();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-warning-300,#fdba74)] bg-[var(--color-warning-50,#fffbeb)] px-3 py-2 text-sm text-[var(--color-warning-800,#9a3412)]">
        <span>Editing draft v{version}. Save updates this draft instead of creating a new version.</span>
      </div>
      <StructuredAgentEditor value={draftYaml} onChange={setDraftYaml} />
      <div className="flex items-center justify-end gap-2">
        {dirty ? <span className="text-xs text-[var(--color-neutral-500)]">Unsaved changes</span> : null}
        <Button
          data-testid={`admin-agent-definition-save-draft-${version}`}
          size="sm"
          disabled={disabled || saving || !dirty}
          onClick={() => {
            setSaving(true);
            void onSave(version, draftYaml, sourceYamlHash).finally(() => setSaving(false));
          }}
        >
          {saving ? "Saving..." : "Save Draft"}
        </Button>
      </div>
    </div>
  );
}

function VersionActions({
  tenantId,
  definitionId,
  definitionStatus,
  version,
  actionBusy,
  publishingVersion,
  archivingVersion,
  onPublish,
  onArchive,
  onReject,
}: {
  tenantId: string;
  definitionId: string;
  definitionStatus: AdminAgentDefinitionStatus | undefined;
  version: AdminAgentDefinitionVersionDetail;
  actionBusy: boolean;
  publishingVersion: number | null;
  archivingVersion: number | null;
  onPublish: (version: number) => Promise<void>;
  onArchive: (version: number) => Promise<void>;
  onReject: (version: number) => Promise<void>;
}) {
  if (version.status === "published") {
    const testHref = tenantId
      ? `/admin/agent-definitions/${encodeURIComponent(definitionId)}/test?tenant_id=${encodeURIComponent(tenantId)}&version=${version.version}`
      : null;
    return (
      <ActionRow>
        <TestButton testHref={testHref} version={version.version} />
      </ActionRow>
    );
  }
  if (version.status === "archived" || definitionStatus === "retired") {
    return <span className="text-sm text-[var(--color-neutral-500)]">Archived</span>;
  }

  const testHref = tenantId
    ? `/admin/agent-definitions/${encodeURIComponent(definitionId)}/test?tenant_id=${encodeURIComponent(tenantId)}&version=${version.version}`
    : null;

  if (version.status === "rejected") {
    return (
      <ActionRow>
        <Button
          data-testid={`admin-agent-definition-archive-${version.version}`}
          variant="outline"
          size="sm"
          disabled={actionBusy}
          onClick={() => void onArchive(version.version)}
        >
          {archivingVersion === version.version ? "Archiving..." : "Archive"}
        </Button>
      </ActionRow>
    );
  }

  if (version.status === "previously_published") {
    return (
      <ActionRow>
        <TestButton testHref={testHref} version={version.version} />
        <Button
          data-testid={`admin-agent-definition-publish-${version.version}`}
          size="sm"
          disabled={actionBusy}
          onClick={() => void onPublish(version.version)}
        >
          {publishingVersion === version.version ? "Publishing..." : "Publish"}
        </Button>
        <Button
          data-testid={`admin-agent-definition-archive-${version.version}`}
          variant="outline"
          size="sm"
          disabled={actionBusy}
          onClick={() => void onArchive(version.version)}
        >
          {archivingVersion === version.version ? "Archiving..." : "Archive"}
        </Button>
      </ActionRow>
    );
  }

  if (version.status === "in_review") {
    return (
      <ActionRow>
        <TestButton testHref={testHref} version={version.version} />
        <Button
          data-testid={`admin-agent-definition-reject-${version.version}`}
          variant="outline"
          size="sm"
          disabled={actionBusy}
          onClick={() => void onReject(version.version)}
        >
          Reject
        </Button>
        <Button
          data-testid={`admin-agent-definition-publish-${version.version}`}
          size="sm"
          disabled={actionBusy}
          onClick={() => void onPublish(version.version)}
        >
          {publishingVersion === version.version ? "Publishing..." : "Publish"}
        </Button>
      </ActionRow>
    );
  }

  return (
    <ActionRow>
      <TestButton testHref={testHref} version={version.version} />
      <Button
        data-testid={`admin-agent-definition-publish-${version.version}`}
        size="sm"
        disabled={actionBusy}
        onClick={() => void onPublish(version.version)}
      >
        {publishingVersion === version.version ? "Publishing..." : "Publish"}
      </Button>
    </ActionRow>
  );
}

function ActionRow({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-2">{children}</div>;
}

function TestButton({ testHref, version }: { testHref: string | null; version: number }) {
  if (!testHref) {
    return null;
  }
  return (
    <a
      href={testHref}
      data-testid={`admin-agent-definition-test-${version}`}
      onClick={(event) => {
        event.stopPropagation();
      }}
      className="inline-flex h-8 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs font-medium text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]"
    >
      Test
    </a>
  );
}

function TestCallsPanel({ tenantId, definitionId, version }: { tenantId: string; definitionId: string; version: number }) {
  const { data: calls, isLoading } = useSWR(
    tenantId ? ["test-calls", tenantId, definitionId, version] : null,
    () => listTestCalls(tenantId, definitionId, version),
    { revalidateOnFocus: false },
  );

  if (isLoading) {
    return <p className="py-4 text-center text-sm text-[var(--color-neutral-500)]">Loading test calls...</p>;
  }
  if (!calls || calls.length === 0) {
    return <EmptyTestCallsState tenantId={tenantId} definitionId={definitionId} version={version} />;
  }
  return (
    <div className="space-y-1">
      {calls.map((call) => (
        <TestCallRow key={call.call_id} call={call} />
      ))}
    </div>
  );
}

function EmptyTestCallsState({ tenantId, definitionId, version }: { tenantId: string; definitionId: string; version: number }) {
  const testHref = `/admin/agent-definitions/${encodeURIComponent(definitionId)}/test?tenant_id=${encodeURIComponent(tenantId)}&version=${version}`;
  return (
    <div className="flex flex-col items-center gap-3 py-6">
      <p className="text-sm text-[var(--color-neutral-500)]">No test calls for this version yet.</p>
      <a
        href={testHref}
        className="inline-flex h-8 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-xs font-medium text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-100)]"
      >
        Open test workbench
      </a>
    </div>
  );
}

function ReadOnlyYaml({ value, version, status }: { value: string; version: number; status: AdminAgentDefinitionVersionStatus }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-info-300,#93c5fd)] bg-[var(--color-info-50,#eff6ff)] px-3 py-2 text-sm text-[var(--color-info-700,#1d4ed8)]">
        <span>Viewing version {version} ({versionStatusLabel(status).toLowerCase()}). Only draft versions are editable.</span>
      </div>
      <StructuredAgentEditor value={value} onChange={() => {}} readOnly />
    </div>
  );
}

function ReadOnlyFlowPreview({ yaml }: { yaml: string }) {
  return <YamlFlowPreview yaml={yaml} />;
}

function TestCallRow({ call }: { call: TestCallSummary }) {
  return (
    <div className="flex items-center gap-4 rounded-[var(--radius-md)] px-3 py-2 text-sm hover:bg-[var(--color-bg)]">
      <code className="text-xs text-[var(--color-neutral-600)]">{call.call_id.slice(0, 8)}</code>
      <span className="text-[var(--color-neutral-700)]">{call.started_at ? new Date(call.started_at).toLocaleString() : "—"}</span>
      <span className="text-[var(--color-neutral-500)]">{call.duration_seconds != null ? `${Math.round(call.duration_seconds)}s` : "—"}</span>
      <span className="text-xs text-[var(--color-neutral-500)]">{call.outcome ?? "in progress"}</span>
    </div>
  );
}
