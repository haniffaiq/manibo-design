"use client";

import type { ReactNode } from "react";

import { Badge, type BadgeVariant } from "@grove/ui/badge";

export interface SessionInsightItem {
  id: string;
  category: string;
  categoryVariant?: BadgeVariant;
  headline: string;
  meta: string;
  detail?: string;
  facts?: string[];
  action?: ReactNode;
}

interface SessionInsightsFeedProps {
  title: string;
  description: string;
  items: SessionInsightItem[];
  emptyState: string;
  testIdPrefix: string;
}

export function SessionInsightsFeed({
  title,
  description,
  items,
  emptyState,
  testIdPrefix,
}: SessionInsightsFeedProps) {
  return (
    <section
      data-testid={`${testIdPrefix}-feed`}
      className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-neutral-950)]">{title}</h3>
          <p className="mt-1 text-xs text-[var(--color-neutral-500)]">{description}</p>
        </div>
        <Badge variant="neutral">{items.length} items</Badge>
      </div>

      {items.length > 0 ? (
        <ol className="mt-4 flex max-h-96 flex-col gap-3 overflow-auto pr-1">
          {items.map((item) => (
            <li
              key={item.id}
              data-testid={`${testIdPrefix}-item-${item.id}`}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg-subtle)] p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.categoryVariant ?? "neutral"}>{item.category}</Badge>
                  <p className="text-sm font-medium text-[var(--color-neutral-950)]">{item.headline}</p>
                </div>
                {item.action ? <div className="flex items-center">{item.action}</div> : null}
              </div>
              <p className="mt-2 text-xs text-[var(--color-neutral-500)]">{item.meta}</p>
              {item.detail ? <p className="mt-2 text-sm text-[var(--color-neutral-700)]">{item.detail}</p> : null}
              {item.facts && item.facts.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--color-neutral-500)]">
                  {item.facts.map((fact) => (
                    <span key={fact}>{fact}</span>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-4 text-sm text-[var(--color-neutral-500)]">{emptyState}</p>
      )}
    </section>
  );
}
