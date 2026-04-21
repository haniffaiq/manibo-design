import { redirect } from "next/navigation";

interface RedirectProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Deep-link redirect: forward the legacy
 * `/admin/agent-definitions/<id>/test?tenant_id=...&version=...`
 * to the new workbench with the live-test panel pre-opened:
 *   `/admin/agent-definitions?id=<id>&tenant_id=...&live=1`.
 */
export default async function LegacyAgentTestRedirect({
  params,
  searchParams,
}: RedirectProps) {
  const { id } = await params;
  const sp = await searchParams;

  const next = new URLSearchParams();
  next.set("id", id);
  next.set("live", "1");
  const tenantParam = sp.tenant_id;
  if (typeof tenantParam === "string" && tenantParam.length > 0) {
    next.set("tenant_id", tenantParam);
  }
  redirect(`/admin/agent-definitions?${next.toString()}`);
}
