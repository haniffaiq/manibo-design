"use client";

import { Badge } from "@grove/ui/badge";
import { Card, CardContent, CardHeader } from "@grove/ui/card";

import { coverageLabel, coverageVariant } from "./formatters";
import type { CoverageState } from "./types";

type CaseCoverageSubject = {
  key: string;
  label: string;
  detail: string;
  state: CoverageState;
};

export function CaseCoverageCard({ subjectCoverage }: { subjectCoverage: CaseCoverageSubject[] }) {
  return (
    <Card
      data-testid="observability-subject-coverage"
      className="border-[rgba(15,23,42,0.08)] bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.98))]"
    >
      <CardHeader className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-neutral-500)]">
          V2 case coverage
        </p>
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-neutral-950)]">
            One case grammar, more subject types
          </h2>
          <p className="mt-1 text-sm text-[var(--color-neutral-600)]">
            This workspace already treats every investigation as summary, evidence, context, and related actions. V2 adds more case subjects without turning the UI into a second dashboard zoo.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 2xl:grid-cols-2 4xl:grid-cols-3">
        {subjectCoverage.map((subject) => (
          <div
            key={subject.key}
            className="rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/80 px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-[var(--color-neutral-950)]">{subject.label}</p>
              <Badge variant={coverageVariant(subject.state)}>{coverageLabel(subject.state)}</Badge>
            </div>
            <p className="mt-3 text-sm text-[var(--color-neutral-600)]">{subject.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
