import { requireSession } from "@/lib/auth";
import { SessionRole } from "@/lib/auth_types";

import { TenantActivityClientPage } from "./page-client";

export default async function TenantActivityPage() {
  const session = await requireSession();
  const canViewActivity = session.role === SessionRole.ClientAdmin || session.role === SessionRole.SuperAdmin;

  return <TenantActivityClientPage canViewActivity={canViewActivity} />;
}
