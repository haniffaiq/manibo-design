import { Card, CardContent, CardHeader } from "@grove/ui/card";

type SolutionUnavailableStateProps = {
  title: string;
  detail: string;
};

export function SolutionUnavailableState({ title, detail }: SolutionUnavailableStateProps) {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-900)]">{title}</h1>
          <p className="text-sm text-[var(--color-neutral-500)]">{detail}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg-subtle)] px-4 py-5 text-sm text-[var(--color-neutral-600)]">
          Ask your platform administrator to enable this workspace for your organization.
        </div>
      </CardContent>
    </Card>
  );
}
