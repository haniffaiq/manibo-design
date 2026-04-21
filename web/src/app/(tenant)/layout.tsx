import { TenantLocaleProvider } from "@/components/tenant-locale-provider";
import { TenantShell } from "@/components/tenant-shell";
import { requireSession } from "@/lib/auth";
import { getTenantLocaleServer } from "@/lib/server-platform-api";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const locale = await getTenantLocaleServer();
  return (
    <TenantLocaleProvider initialLocale={locale}>
      <TenantShell role={session.role} email={session.email} tenantName={session.tenantName}>
        {children}
      </TenantShell>
    </TenantLocaleProvider>
  );
}
