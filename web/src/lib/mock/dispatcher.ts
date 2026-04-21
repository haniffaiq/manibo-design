/**
 * Mock platform API dispatcher.
 *
 * When GROVE_USE_MOCK_API=true, the /api/platform/[...path] proxy delegates
 * to this module instead of forwarding to the real backend. Routes here are
 * matched against the upstream URL (the request path with the leading
 * /api/platform stripped, plus query string).
 *
 * Returns the JSON-shaped body to send to the client, or `null` when the
 * route is not handled (the caller will then return a generic 200 + null
 * payload to keep design exploration going).
 */

import * as fx from "@/lib/mock/fixtures";
import {
  agentTemplates,
  modelProviderCatalog,
  toolCatalog,
  transcriberProviderCatalog,
  voiceProviderCatalog,
} from "@/lib/mock/agent-builder-fixtures";

const TRUTHY = new Set(["1", "true", "yes"]);

export function isMockApiEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return TRUTHY.has((env.GROVE_USE_MOCK_API ?? "").trim().toLowerCase());
}

type MockResult = {
  status: number;
  body: unknown;
};

function ok(body: unknown): MockResult {
  return { status: 200, body };
}

function noContent(): MockResult {
  return { status: 204, body: null };
}

function notFound(detail = "Not found in mock dispatcher"): MockResult {
  return { status: 404, body: { detail } };
}

/**
 * Dispatch a mock response.
 * @param method  HTTP verb
 * @param pathname leading slash, no query, e.g. "/admin/tenants"
 * @param search   query string starting with "?" or empty
 */
export function dispatchMockApi(method: string, pathname: string, search: string): MockResult {
  const upperMethod = method.toUpperCase();
  const path = pathname.replace(/\/+$/, "") || "/";
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);

  // ---- Mutating verbs: accept and echo a minimal success response ---- //
  if (upperMethod !== "GET" && upperMethod !== "HEAD") {
    return ok({ ok: true });
  }

  // ---- Tenant: dashboard / call-ops summary ---- //
  if (path === "/calls/active") return ok(fx.tenantActiveCalls);
  if (path === "/billing/usage") return ok(fx.tenantUsageSummary);
  if (path === "/reports/calls") return ok(fx.tenantCallsReport);
  if (path === "/calls/observability-summary") return ok(fx.callObservabilitySummary);

  // ---- Tenant: solutions ---- //
  if (path === "/solutions") return ok(fx.tenantSolutions);

  // ---- Tenant: activity ---- //
  if (path === "/audit/events") return ok(fx.tenantAuditEvents);

  // ---- Tenant: workflow executions ---- //
  if (path === "/workflows/executions") return ok(fx.workflowExecutions);
  if (path.startsWith("/workflows/executions/") && path.endsWith("/steps")) {
    return ok(fx.workflowExecutionSteps);
  }
  if (path.startsWith("/workflows/executions/")) return ok(fx.workflowExecutionDetail);

  // ---- Tenant: operator events ---- //
  if (path === "/operator-events") return ok(fx.operatorEvents);
  if (path.startsWith("/operator-events/")) {
    const id = decodeURIComponent(path.split("/").pop() ?? "");
    const event = fx.operatorEvents.events.find((e) => e.id === id) ?? fx.operatorEvents.events[0];
    return event ? ok(event) : notFound();
  }

  // ---- Tenant: calls / call history ---- //
  if (path === "/calls") return ok(fx.callsList);
  if (path.startsWith("/calls/") && path.endsWith("/events")) return ok(fx.callEvents);
  if (path.startsWith("/calls/")) return ok(fx.callDetail);

  // ---- Tenant: connectors ---- //
  if (path === "/connectors/catalog") return ok(fx.connectorCatalog);
  if (path === "/connectors") return ok(fx.connectors);
  if (path.startsWith("/connectors/")) {
    const id = decodeURIComponent(path.split("/").pop() ?? "");
    const connector = fx.connectors.find((c) => c.id === id) ?? fx.connectors[0];
    return connector ? ok(connector) : notFound();
  }

  // ---- Tenant: team ---- //
  if (path === "/team/users") return ok(fx.teamUsers);
  if (path.startsWith("/team/users/")) {
    const id = decodeURIComponent(path.split("/").pop() ?? "");
    const user = fx.teamUsers.users.find((u) => u.user_id === id) ?? fx.teamUsers.users[0];
    return user ? ok(user) : notFound();
  }

  // ---- Tenant: settings ---- //
  if (path === "/tenant/settings/recordings") return ok(fx.recordingsSettings);
  if (path === "/tenant/settings/locale") return ok(fx.localeSettings);

  // ---- Tenant: clinic knowledge base ---- //
  if (path === "/clinic/knowledge-base") return ok(fx.clinicKnowledgeBase);

  // ---- Tenant: observability ---- //
  if (path === "/observability/runs") return ok(fx.observabilityRuns);
  if (path === "/observability/run-detail") {
    const kind = query.get("kind");
    if (kind === "workflow_run") {
      return ok(fx.observabilityWorkflowRunDetail);
    }
    return ok(fx.observabilityCallSessionDetail);
  }
  if (path === "/observability/runs/compare") return ok(fx.observabilityCompare);
  if (path.startsWith("/observability/runs/call_session/")) {
    return ok(fx.observabilityCallSessionTimeline);
  }
  if (path.startsWith("/observability/runs/workflow_run/")) {
    return ok(fx.observabilityWorkflowRunTimeline);
  }
  if (path.startsWith("/observability/runs/")) {
    return ok(fx.emptyTimeline);
  }

  // ---- Admin: agent-builder catalogs (model/voice/STT/tools/templates) ---- //
  if (path === "/admin/model-providers") return ok(modelProviderCatalog);
  if (path === "/admin/voice-providers") return ok(voiceProviderCatalog);
  if (path === "/admin/transcriber-providers") return ok(transcriberProviderCatalog);
  if (path === "/admin/tool-catalog") return ok(toolCatalog);
  if (path === "/admin/agent-templates") return ok(agentTemplates);

  // ---- Admin: agent starters (legacy catalog used by the old create dialog) ---- //
  if (path === "/admin/agent-starters") return ok([]);

  // ---- Admin: tenants (list + tenant-scoped sub-resources) ---- //
  if (path === "/admin/tenants") return ok(fx.adminTenants);
  if (path.startsWith("/admin/tenants/")) {
    // Split into segments after "/admin/tenants/<tenantId>/..."
    const segments = path.split("/").slice(3); // [tenantId, ...rest]
    const tenantId = decodeURIComponent(segments[0] ?? "");
    const sub = segments.slice(1); // sub-resource path

    if (sub.length === 0) {
      const tenant = fx.adminTenants.find((t) => t.id === tenantId) ?? fx.adminTenants[0];
      return tenant ? ok(tenant) : notFound();
    }

    // /admin/tenants/<id>/users
    if (sub[0] === "users" && sub.length === 1) return ok(fx.adminUsers);

    // /admin/tenants/<id>/solutions
    if (sub[0] === "solutions" && sub.length === 1) return ok(fx.tenantSolutions);

    // /admin/tenants/<id>/release
    if (sub[0] === "release" && sub.length === 1) return ok(fx.adminTenantReleaseAssignment);

    // /admin/tenants/<id>/agent-definitions[...]
    if (sub[0] === "agent-definitions") {
      // /agent-definitions  (list)
      if (sub.length === 1) return ok(fx.adminAgentDefinitions);
      // /agent-definitions/by-name/<name>
      if (sub[1] === "by-name" && sub.length === 3) return ok(fx.adminAgentDefinitionDetail);
      // /agent-definitions/by-name/<name>/artifact
      if (sub[1] === "by-name" && sub[3] === "artifact") return ok(fx.adminAgentDefinitionArtifact);
      // /agent-definitions/<defId>
      if (sub.length === 2) return ok(fx.adminAgentDefinitionDetail);
      // /agent-definitions/<defId>/versions
      if (sub[2] === "versions" && sub.length === 3) return ok(fx.adminAgentDefinitionVersions);
      // /agent-definitions/<defId>/versions/<v>
      if (sub[2] === "versions" && sub.length === 4) return ok(fx.adminAgentDefinitionVersions[0]);
      // /agent-definitions/<defId>/versions/<v>/<action>  (mutation, handled above)
      return ok(fx.adminAgentDefinitionDetail);
    }

    // /admin/tenants/<id>/phone-channels (rare GET, treat as empty)
    if (sub[0] === "phone-channels") return ok([]);

    // /admin/tenants/<id>/calls/test-history → TestCallSummary[]
    if (sub[0] === "calls" && sub[1] === "test-history") return ok([]);

    // Fallback: unknown sub-resources are more likely list-style endpoints
    // than a tenant detail lookup, so return an empty array to keep
    // iteration-based consumers safe.
    return ok([]);
  }

  // ---- Admin: users ---- //
  if (path === "/admin/users") return ok(fx.adminUsers);

  // ---- Admin: agent definitions ---- //
  if (path === "/admin/agent-definitions") return ok(fx.adminAgentDefinitions);
  if (path.startsWith("/admin/agent-definitions/") && path.endsWith("/versions")) {
    return ok(fx.adminAgentDefinitionVersions);
  }
  if (path.startsWith("/admin/agent-definitions/") && path.endsWith("/artifact")) {
    return ok(fx.adminAgentDefinitionArtifact);
  }
  if (path.startsWith("/admin/agent-definitions/")) {
    return ok(fx.adminAgentDefinitionDetail);
  }

  // ---- Admin: releases ---- //
  if (path === "/admin/releases") return ok(fx.adminReleases);
  if (path.startsWith("/admin/releases/") && path.endsWith("/components")) {
    return ok(fx.adminReleaseComponents);
  }
  if (path.startsWith("/admin/releases/")) {
    const id = decodeURIComponent(path.split("/")[3] ?? "");
    const release = fx.adminReleases.find((r) => r.id === id) ?? fx.adminReleases[0];
    return release ? ok(release) : notFound();
  }

  // ---- Admin: tenant release assignment ---- //
  if (path.startsWith("/admin/tenant-release-assignments/")) {
    return ok(fx.adminTenantReleaseAssignment);
  }

  // ---- Admin: settings ---- //
  if (path === "/admin/oidc-providers") return ok(fx.adminOidcProviders);
  if (path === "/admin/platform-defaults") return ok(fx.adminPlatformDefaults);
  if (path.startsWith("/admin/platform-defaults/")) {
    return ok({ version: path.split("/").pop(), config_yaml: "language: id-ID\n", config_yaml_hash: "h_mock" });
  }

  // ---- Admin: telephony ---- //
  if (path === "/admin/telephony/provider-options") return ok(fx.adminTelephonyProviderOptions);
  if (path === "/admin/telephony/provider-accounts") return ok(fx.adminTelephonyProviderAccounts);
  if (path.startsWith("/admin/telephony/provider-accounts/")) {
    const id = decodeURIComponent(path.split("/").pop() ?? "");
    const account = fx.adminTelephonyProviderAccounts.find((a) => a.id === id) ?? fx.adminTelephonyProviderAccounts[0];
    return account ? ok(account) : notFound();
  }
  if (path === "/admin/telephony/trunks") return ok(fx.adminTelephonyTrunks);
  if (path === "/admin/telephony/numbers") return ok(fx.adminTelephonyNumbers);
  if (path.startsWith("/admin/telephony/tenant-policy/")) {
    return ok(fx.adminTelephonyTenantPolicy);
  }

  // ---- Admin: calls ---- //
  if (path === "/admin/calls/live") return ok(fx.adminLiveCalls);
  if (path === "/admin/calls/history") return ok(fx.adminCallHistory);
  if (path.startsWith("/admin/calls/") && path.endsWith("/replay")) {
    return ok(fx.adminCallReplay);
  }
  if (path.startsWith("/admin/calls/")) {
    return ok(fx.adminCallReplay);
  }

  // ---- Admin: health / reports ---- //
  if (path === "/admin/reports/platform-health") return ok(fx.platformHealth);
  if (path === "/admin/reports/calls") return ok(fx.tenantCallsReport);

  // ---- Admin: security audit ---- //
  if (path === "/admin/audit/events") return ok(fx.adminAuditEvents);

  // ---- Admin: observability ---- //
  if (path === "/admin/observability/runs") return ok(fx.adminObservabilityRuns);
  if (path === "/admin/observability/run-detail") {
    const kind = query.get("kind");
    if (kind === "workflow_run") {
      return ok(fx.observabilityWorkflowRunDetail);
    }
    return ok(fx.observabilityCallSessionDetail);
  }
  if (path === "/admin/observability/runs/compare") return ok(fx.adminObservabilityCompare);
  if (path.startsWith("/admin/observability/runs/")) return ok(fx.emptyTimeline);

  // ---- Channel runtimes ---- //
  if (path === "/observability/channel-runtimes" || path === "/admin/observability/channel-runtimes") {
    return ok(fx.observabilityChannelRuntimes);
  }

  // ---- Auth session passthrough (used by /api/platform/auth/session checks) ---- //
  if (path === "/auth/session") return noContent();

  // ---- Fallback: return a benign empty payload so SWR hooks resolve ---- //
  return ok(null);
}
