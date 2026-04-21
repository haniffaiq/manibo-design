import { requireSession } from "@/lib/auth";
import { SessionRole } from "@/lib/auth_types";

import { TenantTeamClientPage } from "./page-client";

export default async function TenantTeamPage() {
  const session = await requireSession();
  const canManageTeam = session.role === SessionRole.ClientAdmin || session.role === SessionRole.SuperAdmin;

  return <TenantTeamClientPage canManageTeam={canManageTeam} />;
}
