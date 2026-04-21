import { platformApiRequest } from "@/lib/api/platform";

export interface TenantSolutionState {
  solution_name: string;
  enabled: boolean;
  version: string;
  description: string;
  requires_enabled: string[];
  optional_enabled: string[];
  desired_revision: string | null;
  active_revision: string | null;
}

export interface TenantSolutionsResponse {
  solutions: TenantSolutionState[];
}

export interface UpdateTenantSolutionRequest {
  enabled: boolean;
}

export function extractEnabledTenantSolutionNames(payload: { solutions?: unknown } | null | undefined): string[] {
  if (!payload || !Array.isArray(payload.solutions)) {
    return [];
  }
  return payload.solutions
    .filter(
      (solution): solution is Pick<TenantSolutionState, "enabled" | "solution_name"> =>
        !!solution &&
        typeof solution === "object" &&
        typeof (solution as { enabled?: unknown }).enabled === "boolean" &&
        typeof (solution as { solution_name?: unknown }).solution_name === "string",
    )
    .filter((solution) => solution.enabled)
    .map((solution) => solution.solution_name);
}

export function listTenantSolutions(): Promise<TenantSolutionsResponse> {
  return platformApiRequest<TenantSolutionsResponse>("/solutions", { method: "GET" });
}

export function listAdminTenantSolutions(tenantId: string): Promise<TenantSolutionsResponse> {
  return platformApiRequest<TenantSolutionsResponse>(`/admin/tenants/${encodeURIComponent(tenantId)}/solutions`, {
    method: "GET",
  });
}

export function updateAdminTenantSolution(
  tenantId: string,
  solutionName: string,
  payload: UpdateTenantSolutionRequest,
): Promise<TenantSolutionState> {
  return platformApiRequest<TenantSolutionState>(
    `/admin/tenants/${encodeURIComponent(tenantId)}/solutions/${encodeURIComponent(solutionName)}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}
