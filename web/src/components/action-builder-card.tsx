"use client";

import type { ReactNode } from "react";

import { Button } from "@grove/ui/button";
import { Card, CardContent, CardHeader } from "@grove/ui/card";

type ActionBuilderCardProps = {
  open: boolean;
  title: string;
  description: string;
  helper?: string;
  closeLabel?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
  dataTestId?: string;
};

export function ActionBuilderCard({
  open,
  title,
  description,
  helper,
  closeLabel = "Close form",
  onClose,
  footer,
  children,
  dataTestId,
}: ActionBuilderCardProps) {
  if (!open) {
    return null;
  }

  return (
    <Card
      data-testid={dataTestId}
      className="border-[rgba(99,102,241,0.24)] bg-[rgba(245,243,255,0.62)] shadow-[0_14px_38px_rgba(15,23,42,0.05)]"
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-neutral-950)]">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[var(--color-neutral-600)]">{description}</p> : null}
          {helper ? (
            <p className="mt-2 text-sm text-[var(--color-neutral-500)]">{helper}</p>
          ) : null}
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>
          {closeLabel}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {footer ? <div className="flex flex-wrap justify-end gap-2 border-t border-[rgba(15,23,42,0.08)] pt-4">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
