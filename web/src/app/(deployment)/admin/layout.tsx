import { requireSuperAdmin } from "@/lib/auth";
import { DeploymentShell } from "@/components/deployment-shell";

export default async function DeploymentAdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return <DeploymentShell>{children}</DeploymentShell>;
}
