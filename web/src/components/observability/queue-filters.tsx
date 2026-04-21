import type { ObservabilityListKind, ObservabilityFacetCounts } from "@/lib/api/observability";
import type { Scope } from "./types";
import {
  DURATION_OPTIONS,
  RUN_KIND_OPTIONS,
  STATUS_OPTIONS,
} from "./types";
import { facetLabel } from "./formatters";

export interface QueueFiltersProps {
  scope: Scope;
  facets: ObservabilityFacetCounts;
  advancedFilterCount: number;

  startDateDraft: string;
  endDateDraft: string;
  appliedKind: ObservabilityListKind;
  appliedStatus: string;
  appliedTenantId: string;
  appliedSolution: string;
  appliedAssistant: string;
  appliedMinDuration: string;
  appliedIncludeNonProduction: boolean;
  appliedErrorOnly: boolean;
  appliedRecordingsOnly: boolean;

  onStartDateDraftChange: (value: string) => void;
  onEndDateDraftChange: (value: string) => void;
  onSetFilter: (name: string, value: string) => void;
  onSetBooleanFilter: (name: string, enabled: boolean) => void;
}

export function QueueFilters({
  scope,
  facets,
  advancedFilterCount,
  startDateDraft,
  endDateDraft,
  appliedKind,
  appliedStatus,
  appliedTenantId,
  appliedSolution,
  appliedAssistant,
  appliedMinDuration,
  appliedIncludeNonProduction,
  appliedErrorOnly,
  appliedRecordingsOnly,
  onStartDateDraftChange,
  onEndDateDraftChange,
  onSetFilter,
  onSetBooleanFilter,
}: QueueFiltersProps) {
  return (
    <details
      open={advancedFilterCount > 0}
      className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.65)]"
    >
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-[var(--color-neutral-900)]">
        Advanced filters and scope{advancedFilterCount > 0 ? ` (${advancedFilterCount} active)` : ""}
      </summary>
      <div className="space-y-3 border-t border-[rgba(15,23,42,0.08)] px-4 py-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-[var(--color-neutral-700)]">
            <span>Start date</span>
            <input
              data-testid="observability-start-date"
              type="date"
              value={startDateDraft}
              onChange={(event) => onStartDateDraftChange(event.currentTarget.value)}
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            />
          </label>
          <label className="space-y-1 text-sm font-medium text-[var(--color-neutral-700)]">
            <span>End date</span>
            <input
              data-testid="observability-end-date"
              type="date"
              value={endDateDraft}
              onChange={(event) => onEndDateDraftChange(event.currentTarget.value)}
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-[var(--color-neutral-700)]">
            <span>Case type</span>
            <select
              value={appliedKind}
              onChange={(event) => onSetFilter("filter_kind", event.currentTarget.value === "all" ? "" : event.currentTarget.value)}
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            >
              {RUN_KIND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-[var(--color-neutral-700)]">
            <span>Status</span>
            <select
              value={appliedStatus}
              onChange={(event) => onSetFilter("status", event.currentTarget.value === "all" ? "" : event.currentTarget.value)}
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All statuses" : option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-[var(--color-neutral-700)]">
            <span>Solution</span>
            <select
              value={appliedSolution}
              onChange={(event) => onSetFilter("solution", event.currentTarget.value)}
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            >
              <option value="">All solutions</option>
              {facets.solutions.map((facet) => (
                <option key={facet.value} value={facet.value}>
                  {facetLabel(facet)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-[var(--color-neutral-700)]">
            <span>Assistant</span>
            <select
              value={appliedAssistant}
              onChange={(event) => onSetFilter("assistant", event.currentTarget.value)}
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            >
              <option value="">All assistants</option>
              {facets.assistants.map((facet) => (
                <option key={facet.value} value={facet.value}>
                  {facetLabel(facet)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-[var(--color-neutral-700)]">
            <span>Minimum duration</span>
            <select
              value={appliedMinDuration}
              onChange={(event) => onSetFilter("min_duration_ms", event.currentTarget.value)}
              className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option.value || "any"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {scope === "admin" ? (
            <div className="space-y-3">
              <label className="space-y-1 text-sm font-medium text-[var(--color-neutral-700)]">
                <span>Tenant</span>
                <select
                  value={appliedTenantId}
                  onChange={(event) => onSetFilter("filter_tenant_id", event.currentTarget.value)}
                  className="h-11 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 text-sm"
                >
                  <option value="">All tenants</option>
                  {facets.tenants.map((facet) => (
                    <option key={facet.value} value={facet.value}>
                      {facetLabel(facet)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.75)] px-3 py-3 text-sm text-[var(--color-neutral-700)]">
                <input
                  data-testid="observability-include-non-production"
                  type="checkbox"
                  checked={appliedIncludeNonProduction}
                  onChange={(event) => onSetBooleanFilter("include_non_production", event.currentTarget.checked)}
                />
                Include demo, test, and E2E tenants
              </label>
            </div>
          ) : (
            <div className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.75)] px-4 py-3 text-sm text-[var(--color-neutral-600)]">
              Tenant scope is fixed here. Use admin observability if you need cross-tenant drill-down.
            </div>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.75)] px-3 py-3 text-sm text-[var(--color-neutral-700)]">
            <input
              type="checkbox"
              checked={appliedErrorOnly}
              onChange={(event) => onSetBooleanFilter("error_only", event.currentTarget.checked)}
            />
            Only cases with warnings or errors
          </label>
          <label className="flex items-center gap-2 rounded-2xl border border-[rgba(15,23,42,0.08)] bg-[rgba(248,250,252,0.75)] px-3 py-3 text-sm text-[var(--color-neutral-700)]">
            <input
              type="checkbox"
              checked={appliedRecordingsOnly}
              onChange={(event) => onSetBooleanFilter("recordings_only", event.currentTarget.checked)}
            />
            Only cases with audio
          </label>
        </div>
      </div>
    </details>
  );
}
