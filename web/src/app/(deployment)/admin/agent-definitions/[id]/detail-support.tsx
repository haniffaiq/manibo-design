"use client";

import { Card, CardContent, CardHeader } from "@grove/ui/card";

export function ArtifactPanel({ artifactJson }: { artifactJson: string }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="text-base font-semibold">Live Artifact</h3>
      </CardHeader>
      <CardContent>
        <pre
          data-testid="admin-agent-definitions-artifact-json"
          className="overflow-x-auto rounded-[var(--radius-md)] bg-[var(--color-bg-subtle)] p-3 text-xs text-[var(--color-neutral-800)]"
        >
          {artifactJson}
        </pre>
      </CardContent>
    </Card>
  );
}
