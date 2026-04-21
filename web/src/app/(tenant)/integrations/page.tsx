import { requireSession } from "@/lib/auth";
import { SessionRole } from "@/lib/auth_types";

import { IntegrationsClientPage } from "./page-client";

export default async function IntegrationsPage() {
  const session = await requireSession();
  const canManage =
    session.role === SessionRole.ClientAdmin || session.role === SessionRole.SuperAdmin;

  return <IntegrationsClientPage canManage={canManage} />;
}
