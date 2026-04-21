import type { ObservabilityTimelineSeverity } from "@/lib/api/observability-shared";

export interface SolutionObservabilityCaseDetailField {
  key: string;
  label: string;
  value: string;
  severity: ObservabilityTimelineSeverity;
  href: string | null;
}

export interface SolutionObservabilityEvidenceItem {
  key: string;
  label: string;
  detail: string;
  severity: ObservabilityTimelineSeverity;
  occurred_at: string | null;
  href: string | null;
}

export interface SolutionObservabilityTimelineDecorator {
  key: string;
  label: string;
  detail: string | null;
  severity: ObservabilityTimelineSeverity;
  occurred_at: string | null;
}

export interface SolutionObservabilityRelatedAction {
  key: string;
  label: string;
  detail: string;
  href: string;
  cta_label: string | null;
  severity: ObservabilityTimelineSeverity;
}

export interface SolutionObservabilityEnricher {
  solution_name: string;
  label: string;
  case_detail_fields: SolutionObservabilityCaseDetailField[];
  evidence_items: SolutionObservabilityEvidenceItem[];
  timeline_decorators: SolutionObservabilityTimelineDecorator[];
  related_actions: SolutionObservabilityRelatedAction[];
}
