"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@grove/ui/button";
import { IconLogOut } from "@/components/icons";
import { SidebarNav } from "@/components/sidebar-nav";
import { useTenantLocale } from "@/components/tenant-locale-provider";
import { SessionRole } from "@/lib/auth_types";
import { buildTenantWorkbenchSections, type TenantWorkbenchIcon } from "@/lib/tenant-workbench";
import { useTenantSolutions } from "@/lib/solutions";
import { resolveWorkbenchIcon } from "@/lib/workbench-icons";
import { getSolutionNavItems } from "@/solutions/registry";

function TenantWorkbenchFrame({
  children,
  sections,
  email,
  tenantName,
}: {
  children: React.ReactNode;
  sections: Array<{ title?: string; items: Array<{ label: string; href: string; icon: TenantWorkbenchIcon; badge?: string | number | null }> }>;
  email?: string;
  tenantName?: string;
}) {
  const { locale, copy } = useTenantLocale();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }, [router]);

  const shellTitle = tenantName ?? copy.shell.title;

  return (
    <div lang={locale} className="min-h-screen bg-[var(--color-bg-subtle)] text-[var(--color-neutral-900)]">
      <SidebarNav
        title={shellTitle}
        subtitle={copy.shell.subtitle}
        titleIcon={
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-white text-[13px] font-semibold text-[var(--color-primary-700)] shadow-[var(--shadow-sm)]">
            {(tenantName ?? "W").charAt(0).toUpperCase()}
          </span>
        }
        footer={
          <div className="space-y-3">
            {email ? (
              <div className="truncate text-xs text-[var(--color-neutral-500)]" data-testid="tenant-shell-email">
                {email}
              </div>
            ) : null}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-neutral-500)]">
                {copy.shell.footer.languageLabel}
              </p>
              <div className="flex items-center rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-neutral-700)]">
                <span>{locale === "lt" ? copy.common.lithuanian : copy.common.english}</span>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => void handleSignOut()}
              className="w-full justify-center gap-2"
              data-testid="tenant-shell-sign-out"
            >
              <IconLogOut className="h-4 w-4" />
              {copy.shell.footer.signOut}
            </Button>
          </div>
        }
        sections={sections.map((section) => ({
          ...section,
          items: section.items.map((item) => ({
            ...item,
            icon: resolveWorkbenchIcon(item.icon),
            badge: item.badge,
          })),
        }))}
      />
      <main className="lg:pl-60">
        <div className="mx-auto max-w-7xl px-3 py-4 sm:px-5 lg:px-6 lg:py-5">{children}</div>
      </main>
    </div>
  );
}

function OperatorWorkbenchShell({
  children,
  visibleEnabledSet,
  email,
  tenantName,
}: {
  children: React.ReactNode;
  visibleEnabledSet: ReadonlySet<string>;
  email?: string;
  tenantName?: string;
}) {
  const { copy } = useTenantLocale();
  const sections = useMemo(() => {
    const solutionManifests = getSolutionNavItems(visibleEnabledSet, SessionRole.ClientOperator);
    return buildTenantWorkbenchSections(copy, SessionRole.ClientOperator, solutionManifests);
  }, [copy, visibleEnabledSet]);

  return (
    <TenantWorkbenchFrame sections={sections} email={email} tenantName={tenantName}>
      {children}
    </TenantWorkbenchFrame>
  );
}

function ClientAdminWorkbenchShell({
  children,
  visibleEnabledSet,
  email,
  tenantName,
}: {
  children: React.ReactNode;
  visibleEnabledSet: ReadonlySet<string>;
  email?: string;
  tenantName?: string;
}) {
  const { copy } = useTenantLocale();
  const sections = useMemo(() => {
    const solutionManifests = getSolutionNavItems(visibleEnabledSet, SessionRole.ClientAdmin);
    return buildTenantWorkbenchSections(copy, SessionRole.ClientAdmin, solutionManifests);
  }, [copy, visibleEnabledSet]);

  return (
    <TenantWorkbenchFrame sections={sections} email={email} tenantName={tenantName}>
      {children}
    </TenantWorkbenchFrame>
  );
}

export function TenantShell({
  children,
  role,
  email,
  tenantName,
}: {
  children: React.ReactNode;
  role: SessionRole;
  email?: string;
  tenantName?: string;
}) {
  const { visibleEnabledSet } = useTenantSolutions();

  if (role === SessionRole.ClientOperator) {
    return (
      <OperatorWorkbenchShell visibleEnabledSet={visibleEnabledSet} email={email} tenantName={tenantName}>
        {children}
      </OperatorWorkbenchShell>
    );
  }

  return (
    <ClientAdminWorkbenchShell visibleEnabledSet={visibleEnabledSet} email={email} tenantName={tenantName}>
      {children}
    </ClientAdminWorkbenchShell>
  );
}
