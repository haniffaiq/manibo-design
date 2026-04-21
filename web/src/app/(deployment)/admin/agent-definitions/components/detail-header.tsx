"use client";

import { useState } from "react";

import { Badge } from "@grove/ui/badge";
import { Button } from "@grove/ui/button";
import { OverflowMenu } from "@grove/ui/overflow-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@grove/ui/select";
import type { AdminAgentDefinitionSummary, AdminAgentDefinitionVersionDetail } from "@/lib/api/admin-agent-definitions";

import { CostLatencyStrip } from "./cost-latency-strip";

const STATUS_VARIANT: Record<AdminAgentDefinitionSummary["status"], "success" | "warning" | "neutral"> = {
  published: "success",
  draft: "warning",
  retired: "neutral",
};

export interface DetailHeaderProps {
  agent: AdminAgentDefinitionSummary;
  versions: AdminAgentDefinitionVersionDetail[];
  selectedVersion: number | null;
  onVersionChange: (version: number) => void;
  costPerMin: number;
  latencyMs: number;
  onTalk: () => void;
  talkActive: boolean;
  onPublish: () => void;
  onArchive: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

export function DetailHeader({
  agent,
  versions,
  selectedVersion,
  onVersionChange,
  costPerMin,
  latencyMs,
  onTalk,
  talkActive,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
}: DetailHeaderProps) {
  const [copied, setCopied] = useState(false);

  function copyId() {
    navigator.clipboard.writeText(agent.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] bg-white px-5 py-3">
      {/* Identity */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-lg font-semibold text-[var(--color-neutral-900)]">{agent.name}</h2>
          <Badge variant={STATUS_VARIANT[agent.status]}>{agent.status}</Badge>
        </div>
        <button
          type="button"
          onClick={copyId}
          className="mt-0.5 inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]"
          title="Copy ID"
        >
          {agent.id}
          <span className="text-[10px]">{copied ? "copied!" : "⧉"}</span>
        </button>
      </div>

      {/* Version selector */}
      {versions.length > 0 ? (
        <div className="w-[180px]">
          <Select
            value={selectedVersion != null ? String(selectedVersion) : undefined}
            onValueChange={(v) => onVersionChange(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={String(v.version)}>
                  v{v.version} · {v.status.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {/* Cost + latency */}
      <CostLatencyStrip costPerMin={costPerMin} latencyMs={latencyMs} />

      {/* Talk button */}
      <Button
        type="button"
        onClick={onTalk}
        className={
          talkActive
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-emerald-500 text-white hover:bg-emerald-600"
        }
      >
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          {talkActive ? "Hide test" : "Talk"}
        </span>
      </Button>

      {/* More menu */}
      <OverflowMenu
        items={[
          { label: "Publish version", onClick: onPublish, disabled: agent.status === "published" },
          { label: "Duplicate", onClick: onDuplicate },
          { label: "Archive", onClick: onArchive, disabled: agent.status === "retired" },
          { label: "Delete…", onClick: onDelete, destructive: true },
        ]}
        data-testid="agent-detail-overflow"
      />
    </header>
  );
}
