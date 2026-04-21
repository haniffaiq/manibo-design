"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number | null;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface SidebarNavProps {
  title: string;
  subtitle?: string;
  titleIcon?: React.ReactNode;
  sections: NavSection[];
  footer?: React.ReactNode;
  collapsed?: boolean;
}

export function SidebarNav({ title, subtitle, titleIcon, sections, footer, collapsed = false }: SidebarNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const renderNavigation = (onItemClick?: () => void) => (
    <>
      {/* Brand header */}
      <div className="border-b border-[var(--color-border)] px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          {titleIcon ? <span>{titleIcon}</span> : null}
          <div>
            <p className="text-[13px] font-semibold tracking-tight text-[var(--color-neutral-900)]">{title}</p>
            {subtitle ? (
              <p className="mt-0.5 text-[11px] text-[var(--color-neutral-500)]">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {sections.map((section, i) => (
          <div key={i} className={i > 0 ? "mt-4" : ""}>
            {section.title && (
              <p className="mb-1.5 px-2.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-neutral-400)]">
                {section.title}
              </p>
            )}
            <ul className="space-y-px">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onItemClick}
                      className={[
                        "group flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13px] font-medium transition-all duration-150",
                        isActive
                          ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                          : "text-[var(--color-neutral-500)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)]",
                      ].join(" ")}
                    >
                      <span className={["h-[15px] w-[15px] flex-shrink-0 transition-colors", isActive ? "text-[var(--color-primary-600)]" : "text-[var(--color-neutral-400)] group-hover:text-[var(--color-neutral-600)]"].join(" ")}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge != null ? (
                        <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-[var(--color-primary-50)] px-1 py-px text-[9px] font-semibold leading-none text-[var(--color-primary-600)]">
                          {item.badge}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      {footer && (
        <div className="border-t border-[var(--color-border)] px-2.5 py-3">{footer}</div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <div className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-white px-4 py-2.5 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {titleIcon}
            <p className="text-[13px] font-semibold tracking-tight text-[var(--color-neutral-900)]">{title}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border)] text-[var(--color-neutral-600)]"
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              {mobileOpen ? (
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              ) : (
                <>
                  <path d="M4 6h12" strokeLinecap="round" />
                  <path d="M4 10h12" strokeLinecap="round" />
                  <path d="M4 14h12" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 bg-black/20 lg:hidden" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute inset-y-0 left-0 flex w-[min(18rem,85vw)] flex-col border-r border-[var(--color-border)] bg-white shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            {renderNavigation(() => setMobileOpen(false))}
          </aside>
        </div>
      ) : null}

      {/* Desktop sidebar */}
      <aside className={[
        "fixed bottom-0 left-0 top-0 z-20 hidden flex-col border-r border-[var(--color-border)] bg-white transition-[width] duration-200 lg:flex",
        collapsed ? "w-14" : "w-60",
      ].join(" ")}>
        {collapsed ? (
          <>
            <div className="flex items-center justify-center border-b border-[var(--color-border)] px-1.5 py-3.5">
              {titleIcon ?? null}
            </div>
            <nav className="flex-1 overflow-y-auto px-1.5 py-3">
              {sections.map((section, i) => (
                <div key={i} className={i > 0 ? "mt-3" : ""}>
                  <ul className="space-y-px">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            title={item.label}
                            className={[
                              "flex items-center justify-center rounded-md p-2 transition-all duration-150",
                              isActive
                                ? "bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                                : "text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)]",
                            ].join(" ")}
                          >
                            <span className={["h-[15px] w-[15px] flex-shrink-0", isActive ? "text-[var(--color-primary-600)]" : ""].join(" ")}>
                              {item.icon}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
            {footer ? (
              <div className="border-t border-[var(--color-border)] px-1.5 py-3">{footer}</div>
            ) : null}
          </>
        ) : (
          renderNavigation()
        )}
      </aside>
    </>
  );
}
