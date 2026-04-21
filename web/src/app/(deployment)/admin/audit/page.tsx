import { redirect } from "next/navigation";

/**
 * Route alias: /admin/audit → /admin/security
 * The design pack uses "Audit" as the canonical label; the implementation
 * route is /admin/security. This redirect keeps design-pack URLs working.
 */
export default function AuditRedirect() {
  redirect("/admin/security");
}
