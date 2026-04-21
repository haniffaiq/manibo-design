import { redirect } from "next/navigation";

interface RedirectProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Deep-link redirect: forward `/admin/agent-definitions/<id>?tenant_id=...`
 * to the new workbench at `/admin/agent-definitions?id=<id>&tenant_id=...`.
 *
 * The legacy detail page was replaced by the in-place detail panel rendered
 * by the workbench at the parent route.
 */
export default async function LegacyAgentDefinitionDetailRedirect({
  params,
  searchParams,
}: RedirectProps) {
  const { id } = await params;
  const sp = await searchParams;

  const next = new URLSearchParams();
  next.set("id", id);
  const tenantParam = sp.tenant_id;
  if (typeof tenantParam === "string" && tenantParam.length > 0) {
    next.set("tenant_id", tenantParam);
  }
  redirect(`/admin/agent-definitions?${next.toString()}`);
}
