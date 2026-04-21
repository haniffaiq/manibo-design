import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";

type SolutionLoadErrorStateProps = {
  title: string;
  detail: string;
  errorMessage: string;
  onRetry: () => void;
};

export function SolutionLoadErrorState({ title, detail, errorMessage, onRetry }: SolutionLoadErrorStateProps) {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[var(--color-neutral-900)]">{title}</h1>
          <p className="text-sm text-[var(--color-neutral-500)]">{detail}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-warning-200)] bg-[var(--color-warning-50)] px-4 py-5 text-sm text-[var(--color-warning-700)]">
          {errorMessage}
        </div>
        <Button type="button" variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
