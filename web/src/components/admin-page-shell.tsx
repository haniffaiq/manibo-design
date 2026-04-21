import type { ReactNode } from "react";
import type { Notice } from "@/hooks/use-notice";
import { StatusMessage } from "./status-message";
import { PageFrame } from "./page-frame";

interface AdminPageShellProps {
  title: string;
  description?: string;
  /** Render buttons or controls opposite the title. */
  actions?: ReactNode;
  /** Error string from useActionState — shown as error banner. */
  error?: string | null;
  /** Notice from useActionState — shown as notice banner. */
  notice?: Notice | null;
  errorTestId?: string;
  noticeTestId?: string;
  children: ReactNode;
}

export function AdminPageShell({
  title,
  description,
  actions,
  error,
  notice,
  errorTestId,
  noticeTestId,
  children,
}: AdminPageShellProps) {
  return (
    <PageFrame width="full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-[var(--color-neutral-900)]">{title}</h1>
          {description ? (
            <p className="mt-0.5 text-[12px] text-[var(--color-neutral-500)]">{description}</p>
          ) : null}
        </div>
        {actions ?? null}
      </div>
      {error ? (
        <StatusMessage variant="error" data-testid={errorTestId}>{error}</StatusMessage>
      ) : null}
      {notice ? (
        <StatusMessage variant={notice.variant} data-testid={noticeTestId}>{notice.message}</StatusMessage>
      ) : null}
      {children}
    </PageFrame>
  );
}
