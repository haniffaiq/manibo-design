"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { IconLogOut } from "@/components/icons";
import { SidebarNav } from "@/components/sidebar-nav";
import { buildDeploymentWorkbenchSections } from "@/lib/deployment-workbench";
import { BUILD_ENABLED_SOLUTIONS } from "@/lib/solutions";
import { resolveWorkbenchIcon } from "@/lib/workbench-icons";
import { getSolutionNavItems } from "@/solutions/registry";

export function DeploymentShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const sections = useMemo(() => {
    const manifests = getSolutionNavItems(BUILD_ENABLED_SOLUTIONS);
    return buildDeploymentWorkbenchSections(manifests);
  }, []);

  const handleSignOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-subtle)]">
      <SidebarNav
        title="Deployment Console"
        titleIcon={
          <span className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-[var(--color-primary-600)] text-[10px] font-bold text-white">
            D
          </span>
        }
        sections={sections.map((section) => ({
          ...section,
          items: section.items.map((item) => ({
            ...item,
            icon: resolveWorkbenchIcon(item.icon),
          })),
        }))}
        collapsed={sidebarCollapsed}
        footer={
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => void handleSignOut()}
              data-testid="deployment-sign-out"
              className="inline-flex items-center gap-2 rounded-md px-2.5 py-[7px] text-[12px] font-medium text-[var(--color-neutral-500)] transition-colors hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-900)]"
            >
              <IconLogOut className="h-[15px] w-[15px]" />
              {sidebarCollapsed ? null : "Sign out"}
            </button>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-md p-1.5 text-[var(--color-neutral-400)] transition-colors hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-700)]"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="text-[11px]">{sidebarCollapsed ? "»" : "«"}</span>
            </button>
          </div>
        }
      />
      <main className={`transition-[padding-left] duration-200 ${sidebarCollapsed ? "lg:pl-14" : "lg:pl-60"}`}>
        <div className="mx-auto w-full max-w-[1880px] px-3 py-4 sm:px-5 lg:px-6 lg:py-5">{children}</div>
      </main>
    </div>
  );
}
