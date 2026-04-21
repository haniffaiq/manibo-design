import { redirect } from "next/navigation";

/**
 * Legacy redirect: /admin-login → /admin/login
 * The admin login page moved to /admin/login to match the design pack route convention.
 */
export default function LegacyAdminLoginRedirect() {
  redirect("/admin/login");
}
