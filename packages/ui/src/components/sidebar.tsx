"use client";

import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface SidebarItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  active?: boolean;
  onSelect?: () => void;
  suffix?: ReactNode;
}

export interface SidebarSection {
  label?: string;
  items: SidebarItem[];
}

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  brand?: ReactNode;
  sections: SidebarSection[];
  footer?: ReactNode;
}

function SidebarItemRow({ item }: { item: SidebarItem }) {
  const content = (
    <>
      {item.icon ? <span className="h-4 w-4 shrink-0 text-current">{item.icon}</span> : null}
      <span className="truncate">{item.label}</span>
      {item.suffix ? <span className="ml-auto shrink-0">{item.suffix}</span> : null}
    </>
  );

  if (item.href) {
    return (
      <a
        href={item.href}
        onClick={item.onSelect}
        className={cn(
          "flex h-9 items-center gap-2.5 rounded-[var(--radius-md)] border px-3 text-sm font-medium",
          item.active
            ? "border-[var(--color-primary-200)] bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)]"
            : "border-transparent text-[var(--color-neutral-700)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-neutral-900)]",
        )}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={cn(
        "flex h-9 w-full items-center gap-2.5 rounded-[var(--radius-md)] border px-3 text-left text-sm font-medium",
        item.active
          ? "border-[var(--color-primary-200)] bg-[var(--color-sidebar-active-bg)] text-[var(--color-sidebar-active-text)]"
          : "border-transparent text-[var(--color-neutral-700)] hover:border-[var(--color-border)] hover:bg-[var(--color-bg-subtle)] hover:text-[var(--color-neutral-900)]",
      )}
      onClick={item.onSelect}
    >
      {content}
    </button>
  );
}

export function Sidebar({ brand, className, footer, sections, ...props }: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 w-[var(--spacing-sidebar-width)] border-r border-[var(--color-sidebar-border)] bg-[var(--color-sidebar-bg)] px-4 py-5",
        className,
      )}
      {...props}
    >
      {brand ? <div className="mb-6">{brand}</div> : null}
      <nav aria-label="Sidebar Navigation" className="space-y-5">
        {sections.map((section, index) => (
          <section key={`${section.label ?? "section"}-${index}`} className="space-y-2">
            {section.label ? (
              <h2 className="px-3 text-xs font-semibold tracking-wide text-[var(--color-sidebar-section-label)] uppercase">
                {section.label}
              </h2>
            ) : null}
            <div className="space-y-1">
              {section.items.map((item) => (
                <SidebarItemRow key={item.href ?? item.label} item={item} />
              ))}
            </div>
          </section>
        ))}
      </nav>
      {footer ? <div className="mt-6 border-t border-[var(--color-border)] pt-4">{footer}</div> : null}
    </aside>
  );
}
