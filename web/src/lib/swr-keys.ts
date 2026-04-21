/**
 * Centralized SWR cache key factories for the web app.
 *
 * Every useSWR() call in apps/web/ should reference a factory here instead of
 * inlining a raw string. This prevents typo-driven cache misses and makes
 * global invalidation grep-able.
 */

/* ------------------------------------------------------------------ */
/*  Tenant dashboard                                                  */
/* ------------------------------------------------------------------ */

export const tenantDashboard = () => "tenant-dashboard" as const;
export const tenantSolutions = () => "tenant-solutions" as const;

/* ------------------------------------------------------------------ */
/*  Call ops                                                          */
/* ------------------------------------------------------------------ */

export const callOpsDashboard = () => "call-ops-dashboard" as const;
export const operatorAlerts = (severity: string, status: string, since: string) =>
  ["operator-alerts", severity, status, since] as const;

/* ------------------------------------------------------------------ */
/*  Call detail (hooks/use-call-detail)                               */
/* ------------------------------------------------------------------ */

export const callDetail = (id: string) => ["call-detail", id] as const;
export const callEvents = (id: string) => ["call-events", id] as const;
export const callTrace = (id: string) => ["call-trace", id] as const;
export const callLatency = (id: string) => ["call-latency", id] as const;

/* ------------------------------------------------------------------ */
/*  Observability workspace                                           */
/* ------------------------------------------------------------------ */

export const observabilityRuns = (
  scope: string,
  kind: string,
  status: string,
  query: string,
  tenantId: string,
  solution: string,
  assistant: string,
  includeNonProduction: boolean,
  errorOnly: boolean,
  recordingsOnly: boolean,
  recordingUnavailableOnly: boolean,
  needsReviewOnly: boolean,
  minDuration: string,
  startDate: string,
  endDate: string,
) =>
  [
    "observability-runs",
    scope,
    kind,
    status,
    query,
    tenantId,
    solution,
    assistant,
    includeNonProduction,
    errorOnly,
    recordingsOnly,
    recordingUnavailableOnly,
    needsReviewOnly,
    minDuration,
    startDate,
    endDate,
  ] as const;

export const observabilityDetail = (scope: string, selectionKey: string | null, tenantId: string | null) =>
  ["observability-detail", scope, selectionKey, tenantId] as const;

export const observabilityTimeline = (scope: string, selectionKey: string | null, tenantId: string | null) =>
  ["observability-timeline", scope, selectionKey, tenantId] as const;

export const observabilityCompare = (
  scope: string,
  kind: string,
  left: string,
  right: string,
  tenantId: string | null,
) => ["observability-compare", scope, kind, left, right, tenantId] as const;

/* ------------------------------------------------------------------ */
/*  Team                                                              */
/* ------------------------------------------------------------------ */

export const teamUsers = () => "team-users" as const;

/* ------------------------------------------------------------------ */
/*  Tenant integrations (connectors)                                  */
/* ------------------------------------------------------------------ */

export const tenantConnectors = () => "tenant-connectors" as const;
export const tenantConnectorsCatalog = () => "tenant-connectors-catalog" as const;

/* ------------------------------------------------------------------ */
/*  Tenant activity (audit events)                                    */
/* ------------------------------------------------------------------ */

export const tenantActivity = (filtersKey: string) => `tenant-activity:${filtersKey}` as const;

/* ------------------------------------------------------------------ */
/*  Tenant automations (workflow executions)                          */
/* ------------------------------------------------------------------ */

export const workflowExecutions = (statusFilter: string) => ["workflow-executions", statusFilter] as const;
export const workflowDetail = (workflowId: string, runId: string) =>
  ["workflow-detail", workflowId, runId] as const;
export const workflowSteps = (workflowId: string, runId: string) =>
  ["workflow-steps", workflowId, runId] as const;

/* ------------------------------------------------------------------ */
/*  Clinic knowledge base                                             */
/* ------------------------------------------------------------------ */

export const clinicKnowledgeBase = () => "clinic-knowledge-base" as const;

/* ------------------------------------------------------------------ */
/*  Admin — dashboard home                                            */
/* ------------------------------------------------------------------ */

export const adminDashboardTenants = () => "admin-dashboard-tenants" as const;
export const adminDashboardOidcProviders = () => "admin-dashboard-oidc-providers" as const;
export const adminDashboardPlatformHealth = () => "admin-dashboard-platform-health" as const;

/* ------------------------------------------------------------------ */
/*  Admin — tenants                                                   */
/* ------------------------------------------------------------------ */

export const adminTenants = (includeNonProduction?: boolean) =>
  includeNonProduction !== undefined
    ? (["admin-tenants", includeNonProduction] as const)
    : ("admin-tenants" as const);

export const adminOidcProviders = () => "admin-oidc-providers" as const;

/* ------------------------------------------------------------------ */
/*  Admin — solutions                                                 */
/* ------------------------------------------------------------------ */

export const adminSolutionsTenants = () => "admin-solutions-tenants" as const;
export const adminTenantSolutions = (tenantId: string) => ["admin-tenant-solutions", tenantId] as const;

/* ------------------------------------------------------------------ */
/*  Admin — releases                                                  */
/* ------------------------------------------------------------------ */

export const adminReleasesTenants = () => "admin-releases-tenants" as const;
export const adminReleasesList = () => "admin-releases-list" as const;
export const adminTenantReleaseAssignment = (tenantId: string) =>
  `admin-tenant-release-assignment:${tenantId}` as const;
export const adminReleaseComponents = (releaseId: string) =>
  `admin-release-components:${releaseId}` as const;

/* ------------------------------------------------------------------ */
/*  Admin — users                                                     */
/* ------------------------------------------------------------------ */

export const adminUsersTenants = () => "admin-users-tenants" as const;
export const adminTenantUsers = (tenantId: string) => `admin-users:${tenantId}` as const;

/* ------------------------------------------------------------------ */
/*  Admin — health                                                    */
/* ------------------------------------------------------------------ */

export const adminPlatformHealth = () => "admin-platform-health" as const;
export const adminCallsReport = () => "admin-calls-report" as const;
export const adminCallObservabilitySummary = () => "admin-call-observability-summary" as const;

/* ------------------------------------------------------------------ */
/*  Admin — settings                                                  */
/* ------------------------------------------------------------------ */

export const adminPlatformDefaults = () => "admin-platform-defaults" as const;
export const adminTenantsForSettings = () => "admin-tenants-for-settings" as const;

/* ------------------------------------------------------------------ */
/*  Admin — security                                                  */
/* ------------------------------------------------------------------ */

export const adminSecurityTenants = () => "admin-security-tenants" as const;
export const adminSecurityEvents = (tenantId: string, filtersKey: string) =>
  `admin-security-events:${tenantId}:${filtersKey}` as const;

/* ------------------------------------------------------------------ */
/*  Admin — phone channels                                            */
/* ------------------------------------------------------------------ */

export const adminPhoneChannelsTenants = () => "admin-phone-channels-tenants" as const;
export const adminPhoneChannels = (tenantId: string) => ["admin-phone-channels", tenantId] as const;
export const adminAgentDefinitionsForPhoneChannels = (tenantId: string) =>
  ["admin-agent-definitions", tenantId] as const;
export const adminTelephonyProviderOptions = () => "admin-telephony-provider-options" as const;
export const adminTelephonyProviderAccounts = (includeArchived = false) =>
  ["admin-telephony-provider-accounts", includeArchived] as const;
export const adminTelephonyTrunks = (providerAccountId: string | null = null) =>
  ["admin-telephony-trunks", providerAccountId] as const;
export const adminTelephonyNumbers = (providerAccountId: string | null = null) =>
  ["admin-telephony-numbers", providerAccountId] as const;
export const adminTenantTelephonyPolicy = (tenantId: string) =>
  ["admin-tenant-telephony-policy", tenantId] as const;

/* ------------------------------------------------------------------ */
/*  Admin — agent definitions                                         */
/* ------------------------------------------------------------------ */

export const adminAgentDefinitionsTenants = () => "admin-agent-definitions-tenants" as const;
export const adminAgentDefinitionsStarters = () => "admin-agent-definitions-starters" as const;
export const adminAgentDefinitionsSolutions = (tenantId: string) =>
  `admin-agent-definitions-solutions:${tenantId}` as const;
export const adminAgentDefinitions = (tenantId: string) =>
  `admin-agent-definitions:${tenantId}` as const;
export const adminAgentDefinitionByName = (tenantId: string, name: string) =>
  `admin-agent-definitions:${tenantId}:by-name:${name}` as const;
export const adminAgentDefinition = (tenantId: string, definitionId: string) =>
  `admin-agent-definitions:${tenantId}:${definitionId}` as const;
export const adminAgentDefinitionVersions = (tenantId: string, definitionId: string) =>
  `admin-agent-definition-versions:${tenantId}:${definitionId}` as const;
export const adminAgentDefinitionsPlatformDefaults = () =>
  "admin-agent-definitions-platform-defaults" as const;
export const adminAgentDefinitionChannels = (tenantId: string, definitionId: string) =>
  `admin-agent-definition-channels:${tenantId}:${definitionId}` as const;
export const adminTenantAllPhoneNumbers = (tenantId: string) =>
  `admin-tenant-all-phone-numbers:${tenantId}` as const;

/* ------------------------------------------------------------------ */
/*  Admin — calls                                                     */
/* ------------------------------------------------------------------ */

export const adminLiveCalls = () => "admin-live-calls" as const;
export const adminCallHistory = (tenantId: string | null) => ["admin-call-history", tenantId] as const;
export const adminCallReplay = (callId: string) => ["admin-call-replay", callId] as const;

export const adminPhoneNumbersTenants = adminPhoneChannelsTenants;
export const adminPhoneNumbers = adminPhoneChannels;
export const adminAgentDefinitionsForPhoneNumbers = adminAgentDefinitionsForPhoneChannels;
