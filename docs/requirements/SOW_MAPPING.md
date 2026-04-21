# SOW Module Architecture Mapping

> **Status: legacy reference, not actively maintained.** This document is kept as a historical scope/architecture snapshot. Specific route names, file paths, and `live` claims here may not match the current codebase — surfaces have been added, renamed, or removed since this was last touched. Do **not** treat this document as the current source of truth and do **not** update it as part of unrelated PRs. For current state, consult the wiki and `docs/arch/generated/api_inventory.md`.

**Version:** 1.0
**Date:** 2026-02-16
**Status:** Reference Document
**Duration:** 24 weeks | **Modules:** 22

---

## 1. Overview

### Purpose

This document maps every SOW module to its architecture components, user stories, and epics. It serves as the single source of truth for:

- **Project managers:** Understanding which architecture components each module touches.
- **Engineers:** Knowing exactly which services, tables, endpoints, and pages to build per module.
- **Stakeholders:** Tracking coverage -- no architecture component left unassigned, no SOW module without stories.

### How to Read

1. **Section 2** lists all architecture components with short IDs (e.g., PRES-01, API-05, DATA-12).
2. **Section 3** maps each SOW module to its architecture components and user stories (table format).
3. **Section 4** is a cross-reference matrix: which components are touched by which modules.
4. **Section 5** shows the dependency graph between modules.
5. **Section 6** provides summary statistics.

### Legend

| Symbol | Meaning |
|--------|---------|
| PRES | Presentation Layer (Next.js UI) |
| API | Platform API Layer (FastAPI) |
| GROVE | Grove Engine (Python library) |
| VOICE | Voice Layer (LiveKit Cloud) |
| ORCH | Orchestration Layer (Temporal Cloud) |
| DATA | Data Layer (PostgreSQL, GCS) |
| INFRA | Infrastructure (Cloud Run, Terraform) |
| CROSS | Cross-Cutting Concerns |

**Roles:** SuperAdmin, ClientAdmin, ClientOperator

**User Story Sources:**
- Stories numbered N.N (e.g., 1.1, 4.2) come from the Hoptrans user stories document (PRIMARY source).
- Stories prefixed with NEW-{module}-N are created for this document to cover modules without Hoptrans coverage.
- Stories prefixed with P, AM, WF, C, O, CM, T are referenced in the module breakdown estimates.

---

## 2. Architecture Component Registry

### 2.1 Presentation Layer (PRES)

| ID | Component | Description |
|----|-----------|-------------|
| PRES-01 | Deployment Console Shell | Next.js layout, navigation, role-gated routing for SuperAdmin |
| PRES-02 | Client Portal Shell | Next.js layout, navigation for ClientAdmin/ClientOperator |
| PRES-03 | SuperAdmin Shell | Next.js layout for platform-wide management |
| PRES-04 | Login / SSO Pages | Identity Platform login, SSO/OIDC redirect, password reset |
| PRES-05 | Agent Editor UI | YAML/JSON editor, prompt playground, tool configuration |
| PRES-06 | Agent Lifecycle UI | Draft/test/publish/archive states, version list, deployment |
| PRES-07 | Call Monitoring UI | Active calls dashboard, live transcript, observer mode, takeover |
| PRES-08 | Calls List UI | Filterable/sortable call history, status badges, pagination |
| PRES-09 | Call Detail UI | Transcript view, AI summary, structured data, recording playback |
| PRES-10 | Dashboard UI | Stats cards, recent calls, active calls widget, quick links |
| PRES-11 | Analytics UI | Charts (line, donut, bar, heatmap), export, time range selector |
| PRES-12 | User Management UI | Invite form, users table, role editor, deactivation |
| PRES-13 | Tenant Management UI | Tenant CRUD, settings, limits, agent assignment |
| PRES-14 | Billing/Usage UI | Usage dashboard, alerts, monthly report export |

### 2.2 Platform API Layer (API)

| ID | Component | Description |
|----|-----------|-------------|
| API-01 | Auth Middleware | JWT validation via Firebase Admin SDK, tenant resolution, AuthContext |
| API-02 | Tenancy Middleware | SET search_path per tenant schema, RLS session vars |
| API-03 | Rate Limit Middleware | Per-tenant rate limiting via PostgreSQL counters |
| API-04 | /api/v1/tenants | Tenant CRUD endpoints (POST, GET, PATCH settings) |
| API-05 | /api/v1/agents | Agent config CRUD, deploy, version management |
| API-06 | /api/v1/calls | Call lifecycle: POST /outbound, GET list, GET detail, DELETE |
| API-07 | /api/v1/calls/{id}/monitor | WebSocket endpoint for real-time transcript + audio level |
| API-08 | /api/v1/users | User invite, list, role change, deactivation |
| API-09 | /api/v1/analytics | GET /calls/summary, GET /agents/performance |
| API-10 | /api/v1/billing | GET /usage, GET /invoices, GET /export |
| API-11 | /api/v1/integrations | Integration CRUD, POST /test, credential management |
| API-12 | /api/v1/incidents | Incident list, rule CRUD |
| API-13 | /api/v1/phone-numbers | Number provisioning (Telnyx), assignment, deletion |
| API-14 | /ws/calls | WebSocket: real-time call events (ring, answer, hangup) |
| API-15 | /api/v1/webhooks | Inbound webhook receiver per tenant (telematics, etc.) |
| API-16 | /api/health | Health check endpoint (public, no auth) |
| API-17 | /api/v1/audit | Audit log query, export |

### 2.3 Grove Engine (GROVE)

| ID | Component | Description |
|----|-----------|-------------|
| GROVE-01 | AgentConfig Loader | YAML/JSON config loading, Pydantic validation |
| GROVE-02 | AgentExecutor | LangGraph StateGraph, ReAct loop, flow graphs |
| GROVE-03 | ToolRegistry | System tools + plugin tools, per-node tool assignment |
| GROVE-04 | GrovePlugin Protocol | tools + instructions + event_source + channel_adapter |
| GROVE-05 | ProviderRegistry | LiteLLM wrapper (OpenAI, Anthropic, Gemini, etc.) |
| GROVE-06 | ConversationWorkflow | Temporal workflow for durable conversation execution |
| GROVE-07 | Checkpoint Store | LangGraph state snapshots in grove.checkpoints |
| GROVE-08 | SSE Streaming | pg_notify channel for real-time agent response streaming |
| GROVE-09 | AuthContext | org_id, user_id, roles passed from platform to Grove |
| GROVE-10 | Voice Config Models | STTConfig, TTSConfig, VADConfig Pydantic models |
| GROVE-11 | WorkflowAction Protocol | `grove/core/actions.py`, deterministic step executor protocol separate from GroveTool |
| GROVE-12 | Workflow Engine | `grove/runtime/workflow_engine.py`, sequential graph walker with template resolution |
| GROVE-13 | Built-in Actions | `grove/actions/`, http_request, transform_data, log, delay, condition |

### 2.4 Voice Layer (VOICE)

| ID | Component | Description |
|----|-----------|-------------|
| VOICE-01 | LiveKit Agent Worker | Agent worker entrypoint deployed to LiveKit Cloud |
| VOICE-02 | Google Chirp 3 STT | Speech-to-text, V2 API, location="eu", Lithuanian support |
| VOICE-03 | Google Chirp3-HD TTS | Text-to-speech, location="eu", LINEAR16 encoding |
| VOICE-04 | Silero VAD | Voice activity detection, prewarmed via asyncio.to_thread |
| VOICE-05 | SIP Bridge | LiveKit SIP bridge connecting Telnyx trunks to rooms |
| VOICE-06 | IVR / DTMF Handler | Language selection, category routing via DTMF tones |
| VOICE-07 | Call Queue | Queue implemented as Temporal workflow with entity pattern |
| VOICE-08 | Observer Mode | Hidden participant (subscribe-only) for live monitoring |
| VOICE-09 | Manual Takeover | Operator signal, agent mute, operator becomes active speaker |

### 2.5 Orchestration Layer (ORCH)

| ID | Component | Description |
|----|-----------|-------------|
| ORCH-01 | CallLifecycleWorkflow | Entity workflow: call state machine (pending to completed) |
| ORCH-02 | OutboundCampaignWorkflow | Orchestrator: trigger evaluation, call initiation, retry |
| ORCH-03 | PostCallProcessingWorkflow | Pipeline: transcript, usage tracking, analytics, follow-up |
| ORCH-04 | QueueManagementWorkflow | Entity: FIFO queue, position announcements, timeout |
| ORCH-05 | ScheduledCallWorkflow | Cron/Timer: scheduled outbound calls |
| ORCH-06 | IncidentDetectionWorkflow | Pipeline: rule evaluation, incident creation, agent dispatch |
| ORCH-07 | TenantProvisioningWorkflow | Create schema, Identity Platform tenant, phone number, SIP rule |
| ORCH-08 | Temporal Workers (Cloud Run) | Worker processes running on Cloud Run, long-poll connections |
| ORCH-09 | Call Activities | Temporal activities: initiate call, transfer, terminate |
| ORCH-10 | Billing Activities | Temporal activities: usage upsert, report generation |
| ORCH-11 | Integration Activities | Temporal activities: webhook send, REST API call, SMS |
| ORCH-12 | Notification Activities | Temporal activities: email, SMS, Freescout ticket creation |

### 2.6 Data Layer (DATA)

| ID | Component | Description |
|----|-----------|-------------|
| DATA-01 | public.tenants | Tenant registry (id, slug, identity_platform_tenant_id, settings) |
| DATA-02 | public.tenant_settings | Per-tenant config (feature flags, limits, API keys) |
| DATA-03 | public.users | Platform users (identity_platform_uid, tenant_id, role) |
| DATA-04 | public.billing_usage | Daily usage tracking per tenant |
| DATA-05 | public.audit_events | Immutable audit log |
| DATA-06 | grove.chats | Conversation sessions (org_id, agent_id, metadata) |
| DATA-07 | grove.messages | Message history (role, content, tool_calls) |
| DATA-08 | grove.checkpoints | LangGraph state snapshots |
| DATA-09 | grove.chat_subscriptions | SSE subscription tracking |
| DATA-10 | tenant.calls | Call records (direction, state, duration, recording_url) |
| DATA-11 | tenant.call_recordings | Recording metadata (gcs_path, duration, retention) |
| DATA-12 | tenant.call_transcripts | Transcript segments (speaker, text, timestamp, language) |
| DATA-13 | tenant.agents | Agent versions (config_yaml, status, published_at) |
| DATA-14 | tenant.agent_deployments | Publish history (version, published_by, rollback_from) |
| DATA-15 | tenant.incidents | Detected incidents (rule_id, severity, status) |
| DATA-16 | tenant.incident_rules | Detection config (source, conditions_jsonb, agent_id) |
| DATA-17 | public.workflow_templates + tenant.workflow_instances | Template + Overlay pattern: provider-defined templates (definition_yaml, editable_fields) in public schema; tenant-specific overrides (overrides_jsonb, enabled) in tenant schema |
| DATA-18 | tenant.workflow_executions | Execution log (temporal_run_id, status, result_jsonb) |
| DATA-19 | tenant.integrations | External connections (type, config_jsonb, status) |
| DATA-20 | tenant.integration_credentials | Encrypted secrets (credentials_encrypted, expires_at) |
| DATA-21 | tenant.drivers | Driver/entity data (name, phone, external_id, metadata) |
| DATA-22 | tenant.phone_numbers | Provisioned numbers (provider, sip_trunk_id, agent_id) |
| DATA-23 | GCS Buckets | call-recordings/, transcripts/, agent-configs/ with lifecycle |

### 2.7 Infrastructure (INFRA)

| ID | Component | Description |
|----|-----------|-------------|
| INFRA-01 | Cloud Run Services | Platform API, UI, Temporal workers deployment |
| INFRA-02 | Cloud SQL (PG 16) | PostgreSQL HA instance, europe-west1 |
| INFRA-03 | VPC + Private Service Connect | Network isolation, database private connectivity |
| INFRA-04 | Secret Manager | API keys, integration credentials, per-tenant secrets |
| INFRA-05 | Terraform Modules | cloud-run, cloud-sql, gcs, vpc, secret-manager, monitoring, iam |
| INFRA-06 | CI/CD Pipeline | GitHub Actions: lint, test, build, deploy (staging/prod) |
| INFRA-07 | Cloud Monitoring | Alerting policies, uptime checks, custom metrics |
| INFRA-08 | Docker Images | Dockerfiles for API, UI, Temporal workers, agent worker |
| INFRA-09 | IAM + Service Accounts | Per-service accounts, least-privilege roles |
| INFRA-10 | GCS Storage | Buckets for recordings, transcripts, agent configs |
| INFRA-11 | Alembic Migrations | Grove schema + public schema + tenant schema template |

### 2.8 Cross-Cutting Concerns (CROSS)

| ID | Component | Description |
|----|-----------|-------------|
| CROSS-01 | Identity Platform | Google Cloud auth, native multi-tenancy, OIDC/SAML SSO |
| CROSS-02 | RBAC | 3 roles: SuperAdmin, ClientAdmin, ClientOperator |
| CROSS-03 | Schema-per-Tenant | Physical data isolation, SET search_path per request |
| CROSS-04 | RLS Policies | Row-level security within tenant schemas (operator vs admin) |
| CROSS-05 | Encryption | AES-256 at rest, TLS 1.3 in transit, SRTP for media |
| CROSS-06 | GDPR Compliance | EU data residency, retention policies, right to erasure |
| CROSS-07 | Audit Trail | Immutable public.audit_events, middleware auto-capture |
| CROSS-08 | Structured Logging | structlog JSON, tenant_id/call_id/trace_id in every entry |
| CROSS-09 | Distributed Tracing | OpenTelemetry, Cloud Trace, W3C TraceContext |
| CROSS-10 | Error Tracking | Sentry with tenant context tags |
| CROSS-11 | Consent Management | Call recording consent announcement at call start |
| CROSS-12 | Data Retention | Per-tenant configurable retention, GCS lifecycle policies |

---

## 3. SOW Module to Architecture Mapping

### Module 1: Infrastructure (Weeks 1-5 | MVP)

**Architecture Components:** INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, INFRA-09, INFRA-10, INFRA-11, API-16, CROSS-08, CROSS-09

**Epic 1.A: GCP Project and Core Services Setup**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-INFRA-1 | GCP project provisioning | DevOps engineer | set up staging and production GCP projects with VPC, IAM, and Secret Manager | all services have a secure, isolated environment | INFRA-03, INFRA-04, INFRA-05, INFRA-09 |
| NEW-INFRA-2 | Cloud SQL PostgreSQL setup | DevOps engineer | provision Cloud SQL PostgreSQL 16 HA in europe-west1 with Private Service Connect | the database is production-ready with private network access | INFRA-02, INFRA-03, INFRA-05 |
| NEW-INFRA-3 | Cloud Run service deployment | DevOps engineer | deploy Platform API, UI, and Temporal workers to Cloud Run with proper scaling configs | all custom services run serverlessly with auto-scaling | INFRA-01, INFRA-08, INFRA-05 |
| 12.4 | Health monitoring | DevOps engineer | monitor system health via /api/health endpoint and Cloud Monitoring alerts | I know immediately when components degrade | API-16, INFRA-07, CROSS-08 |

**Epic 1.B: CI/CD and Migration Pipeline**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-INFRA-4 | CI/CD pipeline setup | DevOps engineer | configure GitHub Actions with lint, test, build, and deploy stages for staging and production | every merge to main is automatically validated and deployed | INFRA-06, INFRA-08 |
| NEW-INFRA-5 | Alembic migration pipeline | DevOps engineer | run Grove, public, and tenant schema migrations in order during deployment | database schema changes are applied safely and automatically | INFRA-11, INFRA-02 |
| NEW-INFRA-6 | GCS bucket provisioning | DevOps engineer | create call-recordings, transcripts, and agent-configs buckets with lifecycle policies | audio and transcript data has proper retention and cost management | INFRA-10, INFRA-05 |

---

### Module 2: Authentication (Weeks 4-8 | MVP)

**Architecture Components:** CROSS-01, CROSS-02, API-01, API-02, PRES-04, DATA-03, CROSS-04

**Epic 2.A: Identity Platform Integration**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 10.1 | Login/Logout | user | log in with email/password and receive a JWT (8h expiry) | I can access the platform securely | PRES-04, CROSS-01, API-01 |
| 10.2 | SSO with Active Directory | user | log in with corporate AD credentials via OIDC/SAML | I can use my existing corporate identity | PRES-04, CROSS-01, API-01 |
| NEW-AUTH-1 | JWT middleware and tenant resolution | Platform API | validate Identity Platform JWT, extract tenant_id and custom claims (role) | every API request is authenticated and scoped to a tenant | API-01, API-02, CROSS-01 |

**Epic 2.B: RBAC and Multi-Tenant Isolation**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 1.2 | Role assignment | ClientAdmin | assign roles (Admin/Manager/Operator) to users in my organization | access levels match job responsibilities | PRES-12, API-08, CROSS-02, DATA-03 |
| NEW-AUTH-2 | Schema-per-tenant middleware | Platform API | SET search_path TO tenant_{slug}, grove, public on every request | queries are automatically scoped to the correct tenant | API-02, CROSS-03, CROSS-04 |
| NEW-AUTH-3 | RLS policy setup | DevOps engineer | apply row-level security policies within tenant schemas | operators see only their assigned calls while admins see all | CROSS-04, DATA-10 |

---

### Module 3: User Management (Weeks 9-12 | Phase 2)

**Architecture Components:** PRES-12, API-08, DATA-03, CROSS-02, CROSS-07

**Epic 3.A: User Invitation and Lifecycle**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 1.1 | User invitation | ClientAdmin | invite a new user via email with a 48h token link | they can set their password and access the system | PRES-12, API-08, DATA-03, CROSS-01 |
| 1.3 | User deactivation | ClientAdmin | deactivate a user (invalidate sessions, block login) | former employees cannot access the system | PRES-12, API-08, DATA-03, CROSS-07 |
| NEW-USER-1 | Pending invites management | ClientAdmin | see pending invites and resend or revoke them | I can manage the onboarding pipeline | PRES-12, API-08, DATA-03 |

**Epic 3.B: Organization and Role Management**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 1.2 | Role change with audit | ClientAdmin | change a user's role with confirmation dialog and audit log entry | access levels are updated and tracked | PRES-12, API-08, DATA-03, CROSS-02, CROSS-07 |
| NEW-USER-2 | Users list and search | ClientAdmin | view all users with name, email, role, status, last login and search/filter | I can quickly find and manage team members | PRES-12, API-08, DATA-03 |

---

### Module 4: Multi-Tenancy Management (Weeks 7-12 | MVP)

**Architecture Components:** PRES-13, API-04, ORCH-07, DATA-01, DATA-02, CROSS-03, INFRA-11

**Epic 4.A: Tenant Provisioning**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-TENANT-1 | Create tenant via UI | SuperAdmin | create a new client tenant with name, slug, and settings | the client organization is provisioned automatically | PRES-13, API-04, ORCH-07, DATA-01 |
| NEW-TENANT-2 | Automated provisioning workflow | system | run TenantProvisioningWorkflow (create Identity Platform tenant, schema, phone number, SIP rule) | tenant setup is fully automated and idempotent | ORCH-07, DATA-01, DATA-22, CROSS-01, CROSS-03 |
| NEW-TENANT-3 | Tenant settings and limits | SuperAdmin | configure per-tenant limits (concurrent calls, agent count, recording retention, features) | each client has appropriate resource boundaries | PRES-13, API-04, DATA-02 |

**Epic 4.B: Tenant Operations**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-TENANT-4 | Agent-to-tenant assignment | SuperAdmin | assign published agents to specific tenants | clients receive the correct agents for their use case | PRES-13, API-04, API-05, DATA-13 |
| NEW-TENANT-5 | Provider support access | SuperAdmin | access any managed tenant's data for troubleshooting | I can diagnose issues without asking the client | PRES-13, API-02, CROSS-03, CROSS-07 |

---

### Module 7: Incident Detection (Weeks 2-8 | DEMO)

**Architecture Components:** ORCH-06, API-12, DATA-15, DATA-16, ORCH-02

**Epic 7.A: Rule Engine**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 2.1 | Plaktukai rule evaluation | system | evaluate the rule (work_mode="Work", duration>30min, GPS<50m) against incoming telematics events | incidents are detected automatically without manual monitoring | ORCH-06, DATA-16, DATA-15 |
| NEW-INCIDENT-1 | Duplicate prevention | system | prevent duplicate calls (max 1 call/day per driver per rule) | drivers are not called repeatedly for the same incident | ORCH-06, DATA-15 |
| NEW-INCIDENT-2 | Agent selection by language | system | select the appropriate agent by matching driver language preference | the driver hears a call in their preferred language | ORCH-06, ORCH-02, DATA-13, DATA-21 |

**Epic 7.B: Incident Management**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-INCIDENT-3 | Night hours filter | SuperAdmin | configure business hours so incidents outside working hours are queued | drivers are not called at inappropriate times | API-12, DATA-16 |
| NEW-INCIDENT-4 | Incident rules CRUD | SuperAdmin | create, edit, and delete incident detection rules via API | rules can be adjusted without code changes | API-12, DATA-16, CROSS-07 |

---

### Module 8: Voice Agent Runtime (Weeks 1-5 | DEMO)

**Architecture Components:** VOICE-01, VOICE-02, VOICE-03, VOICE-04, VOICE-05, GROVE-01, GROVE-02, GROVE-05, GROVE-10, DATA-12

**Epic 8.A: Voice Pipeline Setup**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-VOICE-1 | LiveKit agent worker deployment | DevOps engineer | deploy the grove-voice-livekit agent worker to LiveKit Cloud | voice agents can accept calls via SIP and WebRTC | VOICE-01, INFRA-08 |
| NEW-VOICE-2 | STT integration (Google Chirp 3) | voice agent | transcribe caller speech via Google Chirp 3 STT (V2 API, eu region) | the LLM receives accurate text input in Lithuanian, Russian, and English | VOICE-02, GROVE-10 |
| NEW-VOICE-3 | TTS integration (Google Chirp3-HD) | voice agent | synthesize agent responses via Google Chirp3-HD TTS (eu region, LINEAR16) | callers hear natural speech in their language | VOICE-03, GROVE-10 |
| NEW-VOICE-4 | VAD integration (Silero) | voice agent | detect speech vs silence with Silero VAD (prewarmed via asyncio.to_thread) | turn-taking is responsive and natural | VOICE-04 |

**Epic 8.B: Agent Execution and Telephony**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-VOICE-5 | Grove AgentExecutor in voice pipeline | voice agent | run Grove AgentExecutor in-process within the LiveKit agent worker | LLM reasoning and tool calling happen with zero network overhead | GROVE-02, GROVE-01, GROVE-05, VOICE-01 |
| NEW-VOICE-6 | SIP trunk integration (Telnyx) | voice agent | receive inbound and initiate outbound calls via Telnyx SIP trunks through LiveKit SIP bridge | calls connect from PSTN phones to AI agents | VOICE-05, DATA-22 |
| NEW-VOICE-7 | Real-time transcript persistence | voice agent | persist transcript segments (speaker, text, timestamp) to tenant.call_transcripts in real-time | transcripts are available during and after the call | DATA-12, VOICE-01 |
| 12.3 | Agent voice and persona configuration | SuperAdmin | configure agent voice (STT/TTS provider), persona, and conversation flow per agent | each agent has a distinct voice and behavior appropriate for its use case | GROVE-01, GROVE-10, DATA-13 |

---

### Module 9: Agent Management (Weeks 3-12 | MVP)

**Architecture Components:** PRES-05, PRES-06, API-05, GROVE-01, GROVE-03, GROVE-04, DATA-13, DATA-14

**Epic 9.A: Agent Configuration**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-AGENT-1 | Agent definition schema (YAML) | SuperAdmin | define agents via YAML with metadata, voice config, LLM settings, system prompts, tools, and guardrails | agent behavior is fully declarative and version-controlled | GROVE-01, API-05, DATA-13 |
| NEW-AGENT-2 | Agent CRUD operations | SuperAdmin | create, read, update, and delete agents via the deployment console | agents can be developed and iterated on | PRES-05, API-05, DATA-13 |
| NEW-AGENT-3 | Head config inheritance | SuperAdmin | define a "Head" agent config (STT/TTS/LLM/guardrails) that child agents inherit from | common settings are configured once, reducing duplication | GROVE-01, API-05, DATA-13 |

**Epic 9.B: Agent Lifecycle and Deployment**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-AGENT-4 | Agent versioning (semantic) | SuperAdmin | publish agents with semantic versions (v1, v2, v3) and view version history | changes are tracked and auditable | PRES-06, API-05, DATA-13, DATA-14 |
| NEW-AGENT-5 | Agent lifecycle states | SuperAdmin | move agents through draft, testing, published, archived states | only validated agents serve real calls | PRES-06, API-05, DATA-13, DATA-14 |
| NEW-AGENT-6 | Client-editable fields | ClientAdmin | edit agent instructions, business variables (hours, contacts), and greeting messages | the client can customize agent behavior without provider involvement | PRES-05, API-05, GROVE-01, DATA-13 |
| NEW-AGENT-7 | Tool and function definitions | SuperAdmin | define tools (Grove plugins) and functions available to each agent | agents can call external APIs and perform domain-specific actions | GROVE-03, GROVE-04, API-05, DATA-13 |

---

### Module 10: Outbound -- Plaktukai (Weeks 2-8 | DEMO)

**Architecture Components:** ORCH-01, ORCH-02, ORCH-05, ORCH-09, ORCH-12, DATA-10, DATA-17, DATA-18

**Epic 10.A: Outbound Call Orchestration**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 2.1 | Automatic call initiation | system | automatically initiate a call when a trigger fires (find driver phone, select agent by language, create call record) | managers do not need to do manual work for incident verification | ORCH-02, ORCH-01, ORCH-09, DATA-10, DATA-17 |
| 2.2 | Retry logic (3 attempts) | system | retry unanswered calls at +0, +30min, +60min and cancel retries if the driver's work mode changes | the chance of reaching the driver is maximized without redundant calls | ORCH-02, ORCH-05, ORCH-09, DATA-10 |
| 12.2 | Workflow configuration | SuperAdmin | configure outbound workflows (Plaktukai, Safety) with triggers, agents, retry policy, and escalation rules | workflows are reusable and adjustable per use case | DATA-17, DATA-18, ORCH-02 |

**Epic 10.B: Plaktukai Agents**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 12.3 | Plaktukai Agent RU | system | conduct a Plaktukai verification call in Russian (Simona persona, warm voice, extract work_description/duration/legitimate) | Russian-speaking drivers are verified in their language | GROVE-02, GROVE-01, DATA-13, DATA-12 |
| NEW-OUTBOUND-1 | Plaktukai Agent EN | system | conduct a Plaktukai verification call in English (Michael persona, professional voice) | English-speaking drivers are verified in their language | GROVE-02, GROVE-01, DATA-13, DATA-12 |
| NEW-OUTBOUND-2 | Call state machine | system | track call state (pending, initiating, ringing, in_progress, completed, failed, no_answer) | call lifecycle is observable and auditable | ORCH-01, DATA-10 |

---

### Module 11: Call Safeguards (Weeks 6-7 | MVP)

**Architecture Components:** GROVE-02, VOICE-01, DATA-10

**Epic 11.A: Call Safety Mechanisms**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-SAFEGUARD-1 | Maximum call duration | system | automatically terminate calls exceeding configurable max duration (default 5 minutes) with appropriate messaging | runaway calls do not waste resources or frustrate callers | GROVE-02, VOICE-01, DATA-10 |
| NEW-SAFEGUARD-2 | Ineffective dialog detection | system | detect non-productive conversations (repeated loops, no progress) and terminate with helpful messaging | calls that go nowhere are ended gracefully | GROVE-02, VOICE-01, DATA-10 |
| NEW-SAFEGUARD-3 | Safeguard configuration | SuperAdmin | configure max duration and dialog detection thresholds per agent | safeguards are tuned to each agent's use case | GROVE-01, API-05, DATA-13 |

---

### Module 12: Inbound -- Support (Weeks 8-15 | MVP)

**Architecture Components:** VOICE-06, VOICE-07, VOICE-08, ORCH-04, DATA-10, DATA-12, GROVE-02

**Epic 12.A: IVR and Call Routing**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 5.1 | IVR menu navigation | driver (caller) | call Hoptrans support, select language (1=LT, 2=EN, 3=RU), and choose category (1=Technical, 2=Tasks, 3=HR, 4=General) | I am routed to the correct agent for my issue | VOICE-06, VOICE-05 |
| 5.2 | Call queue management | driver (caller) | wait in a FIFO queue with position announcements and hold music if the agent is busy (max 10min, then voicemail) | my call is not dropped when agents are busy | VOICE-07, ORCH-04 |
| 5.3 | Voicemail capability | driver (caller) | leave a 2-minute voicemail that is transcribed and saved if no agent is available | my issue is recorded even if I cannot speak to an agent | VOICE-07, DATA-11, DATA-12, DATA-23 |

**Epic 12.B: Inbound Agents**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 12.3 | General Support Agent RU | system | handle inbound general support calls in Russian (empathetic persona, intent recognition, escalation) | Russian-speaking drivers get support in their language | GROVE-02, GROVE-01, DATA-13, DATA-12 |
| NEW-INBOUND-1 | General Support Agent EN | system | handle inbound general support calls in English | English-speaking drivers get support in their language | GROVE-02, GROVE-01, DATA-13, DATA-12 |
| NEW-INBOUND-2 | Inbound workflow setup | SuperAdmin | configure inbound workflows linking IVR categories to specific agents | call routing is configurable without code changes | DATA-17, ORCH-04, VOICE-06 |

---

### Module 13: Call Monitoring (Weeks 15-17 | MVP)

**Architecture Components:** PRES-07, API-07, API-14, VOICE-08, VOICE-09, DATA-10

**Epic 13.A: Active Calls Dashboard**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 3.2 | Real-time call monitoring | ClientAdmin or ClientOperator | observe a live call with real-time transcript, agent state, and duration timer via WebSocket | I know exactly what is happening in each call | PRES-07, API-07, API-14, VOICE-08 |
| NEW-MONITOR-1 | Active calls list | ClientAdmin or ClientOperator | see all currently active calls with driver name, agent, workflow, duration, and status | I have a real-time overview of call center activity | PRES-07, API-14, DATA-10 |
| NEW-MONITOR-2 | Real-time sentiment alerts | ClientAdmin | receive alerts when the system detects negative sentiment or errors during a call | I can intervene before calls go wrong | PRES-07, API-14, VOICE-08 |

**Epic 13.B: Operator Interventions**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 3.1 | Manual call initiation | ClientAdmin | initiate a manual call by selecting a driver, workflow, and adding notes | I can check on a driver at any time without waiting for automated triggers | PRES-07, API-06, ORCH-01 |
| NEW-MONITOR-3 | Manual takeover | ClientAdmin or ClientOperator | take over a live call (agent mutes, operator becomes active speaker) and return control to agent when done | I can handle situations the AI agent cannot | PRES-07, VOICE-09, VOICE-08 |
| NEW-MONITOR-4 | Terminate call | ClientAdmin or ClientOperator | immediately terminate a live call with confirmation dialog | I can stop problematic calls | PRES-07, API-06, ORCH-01, DATA-10 |

---

### Module 14: Calls UI -- Outbound (Weeks 2-18 | MVP)

**Architecture Components:** PRES-08, PRES-09, API-06, DATA-10, DATA-11, DATA-12

**Epic 14.A: Calls List**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 4.1 | Calls list with filters | ClientAdmin or ClientOperator | see all calls in a table (driver, date, workflow, status badge, duration, initiated by) with filters, search, sort, and 50/page pagination | I can review what happened across all calls | PRES-08, API-06, DATA-10 |
| 6.1 | Inbound calls tab | ClientAdmin or ClientOperator | see inbound calls separately with direction indicator, category, agent, and outcome | I can monitor support quality alongside outbound calls | PRES-08, API-06, DATA-10 |
| NEW-CALLS-1 | Auto-refresh and export | ClientAdmin | toggle 30s auto-refresh and export filtered call results to CSV | the list stays current and data can be analyzed externally | PRES-08, API-06 |

**Epic 14.B: Call Details**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 4.2 | Call details (transcript + summary) | ClientAdmin | see full call detail with chat-style transcript (timestamps, speaker labels), Lithuanian translation toggle, AI summary, structured data, and confidence score | I understand exactly what was discussed and its outcome | PRES-09, API-06, DATA-12 |
| NEW-CALLS-2 | Transcript download and recording playback | ClientAdmin | download the transcript as TXT and play the call recording | I can share and archive call details offline | PRES-09, DATA-11, DATA-12, DATA-23 |

---

### Module 15: Dashboard (Weeks 4-18 | MVP)

**Architecture Components:** PRES-10, API-06, API-09, DATA-10

**Epic 15.A: Dashboard Widgets**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 8.1 | Today's statistics | ClientAdmin or ClientOperator | see 6 stats cards (total calls, success rate, avg duration, cost, active now, pending retries), last 5 calls, and active calls list on the landing page | I quickly understand the current state of operations | PRES-10, API-06, API-09, DATA-10 |
| 8.2 | Quick links | user | access quick action buttons (New Call, Analytics, Drivers, Settings) based on my role | I can navigate to key functions with one click | PRES-10 |
| NEW-DASH-1 | Auto-refresh and tenant scoping | ClientAdmin | see dashboard data auto-refresh every 30s, scoped to my tenant | the dashboard is always current and shows only my organization's data | PRES-10, API-09, CROSS-03 |

---

### Module 16: Analytics (Weeks 9-18 | Phase 2)

**Architecture Components:** PRES-11, API-09, DATA-10, DATA-04

**Epic 16.A: Analytics Charts and Metrics**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 4.3 | Calls analytics with charts | ClientAdmin | see time-range-filtered analytics with key metric cards, line chart (calls over time), donut chart (outcome distribution), bar charts (by workflow, by agent), and heatmap (calls by hour/day) | I understand performance trends and can make data-driven decisions | PRES-11, API-09, DATA-10 |
| NEW-ANALYTICS-1 | Driver leaderboard | ClientAdmin | see top 10 most-called drivers with call count, success rate, and avg duration | I can identify drivers who need attention | PRES-11, API-09, DATA-10, DATA-21 |
| NEW-ANALYTICS-2 | CSV/Excel export | ClientAdmin | export all analytics data for the selected time range as CSV or Excel | I can share reports with stakeholders who do not have platform access | PRES-11, API-09 |

**Epic 16.B: Per-Tenant Analytics Isolation**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-ANALYTICS-3 | Tenant-scoped analytics | system | scope all analytics queries to the current tenant schema | clients only see their own data and never another tenant's metrics | API-09, CROSS-03, DATA-10 |
| NEW-ANALYTICS-4 | Performance metrics aggregation | SuperAdmin | view cross-tenant performance metrics (aggregate call volumes, success rates, agent performance) | I can monitor platform-wide health and identify underperforming tenants | PRES-11, API-09, DATA-04 |

---

### Module 17: Audit Trail (Week 20 | Phase 2)

**Architecture Components:** CROSS-07, API-17, PRES-03, DATA-05

**Epic 17.A: Audit Logging**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| 11.1 | Audit trail view | ClientAdmin | see an immutable audit log with timestamp, user, action, entity type/ID, changes (before/after), and IP address, with filters and 100/page pagination | I know who made every change in my organization | PRES-12, API-17, DATA-05, CROSS-07 |
| NEW-AUDIT-1 | Audit middleware auto-capture | system | automatically log every state change (who, what, when, from where) via API middleware | audit records are comprehensive without manual instrumentation | API-17, CROSS-07, DATA-05 |
| NEW-AUDIT-2 | Cross-tenant audit (SuperAdmin) | SuperAdmin | view audit logs across all tenants with tenant filter | I can investigate platform-wide security events | PRES-03, API-17, DATA-05, CROSS-07 |

**Epic 17.B: Audit Data Management**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-AUDIT-3 | Audit log export | ClientAdmin | export filtered audit logs as CSV | I can share audit data with compliance officers | API-17, DATA-05 |
| NEW-AUDIT-4 | Audit log immutability | system | enforce that audit_events rows cannot be updated or deleted (immutable table) | the audit trail is tamper-proof for compliance | DATA-05, CROSS-07 |

---

### Module 18: Provider Backoffice (Weeks 15-20 | MVP)

**Architecture Components:** PRES-01, PRES-05, PRES-06, PRES-13, API-04, API-05, INFRA-07

**Epic 18.A: Tenant and Agent Management**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-BACKOFFICE-1 | Provider portal shell and navigation | SuperAdmin | navigate the deployment console with sidebar (Tenants, Agents, Monitoring) and role-gated routing | I can access all provider functions from a single interface | PRES-01 |
| NEW-BACKOFFICE-2 | Tenant list and detail views | SuperAdmin | view all managed tenants in a list and drill into each tenant's settings, limits, and assigned agents | I can manage client organizations efficiently | PRES-13, API-04, DATA-01, DATA-02 |
| NEW-BACKOFFICE-3 | Agent editor and deployment UI | SuperAdmin | edit agent YAML/JSON configs in a rich editor and deploy agents to tenants with one click | I can develop and ship agent changes rapidly | PRES-05, PRES-06, API-05, DATA-13, DATA-14 |

**Epic 18.B: System Monitoring**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-BACKOFFICE-4 | System monitoring dashboard | SuperAdmin | see system health (component statuses), cross-tenant call volumes, error rates, and worker health | I can detect and respond to platform issues proactively | PRES-01, API-16, INFRA-07 |
| NEW-BACKOFFICE-5 | User and tenant management | SuperAdmin | manage users across tenants (invite, role change, deactivation) from the deployment console | I can handle user administration for all managed clients | PRES-13, API-08, API-04, DATA-03 |

---

### Module 20: Workflow Engine (Weeks 2-10 | DEMO)

**Architecture Components:** ORCH-01, ORCH-02, ORCH-03, ORCH-05, ORCH-08, ORCH-09, ORCH-11, ORCH-12, DATA-17, DATA-18, GROVE-11, GROVE-12, GROVE-13

**Epic 20.A: Workflow Definition and Triggers**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-WF-1 | Workflow definition schema | SuperAdmin | define workflows via YAML/JSON with triggers, actions, conditions, and error handling | workflow behavior is fully declarative and portable | DATA-17, ORCH-02, GROVE-01 |
| NEW-WF-2 | Trigger types (Call Started/Ended, Data Extracted, Scheduled) | system | fire workflows on call lifecycle events, extracted data thresholds, and cron schedules | workflows respond to the full range of business events | ORCH-02, ORCH-05, DATA-17 |
| NEW-WF-3 | Workflow templates (reusable) | SuperAdmin | create reusable workflow templates that can be cloned and customized per tenant | common patterns (Plaktukai, Safety) are not rebuilt from scratch | DATA-17, API-05 |

**Epic 20.B: Workflow Execution**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-WF-4 | Action library (webhook, API, notification) | system | execute workflow actions: send webhook, call external API, send notification (email/SMS/ticket) | workflows can integrate with any external system | ORCH-11, ORCH-12, DATA-18 |
| NEW-WF-5 | Execution logging and monitoring | SuperAdmin | see workflow execution logs with Temporal run ID, status, timing, and result JSON | I can debug workflow failures and verify correct behavior | DATA-18, ORCH-08 |
| NEW-WF-6 | Retry logic and error handling | system | retry failed workflow steps with exponential backoff and handle errors with configurable fallback actions | transient failures do not cause permanent workflow failures | ORCH-02, ORCH-09, DATA-18 |
| NEW-WF-7 | Conditional logic, wait/delay, parallel execution | system | define conditional branches, wait/delay steps, and parallel execution paths in workflows | complex business processes are modeled accurately | ORCH-02, DATA-17 |

---

### Module 21: Integration Hub (Weeks 4-22 | MVP)

**Architecture Components:** API-11, API-15, ORCH-11, DATA-19, DATA-20, CROSS-04

**Epic 21.A: Webhook and REST Connectors**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-INTEG-1 | Inbound webhook receiver | system | receive webhooks at /api/v1/webhooks/{tenant_slug}/{source} with HMAC verification and idempotent processing | external systems can push events to trigger workflows | API-15, API-11, ORCH-11 |
| NEW-INTEG-2 | Outbound webhook sender | system | send webhook POST requests to configured URLs as a workflow action with retry on failure | workflows can notify external systems of events | ORCH-11, DATA-19 |
| NEW-INTEG-3 | Generic REST API connector | system | call any REST API with configurable base URL, auth type (bearer/basic/api_key/oauth2), headers, and rate limiting | agents and workflows can integrate with arbitrary external services | ORCH-11, DATA-19, DATA-20 |

**Epic 21.B: Integration Management**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-INTEG-4 | Integration credentials vault | SuperAdmin | store integration credentials encrypted (per-tenant, Secret Manager backed) with expiry tracking | API keys and secrets are stored securely with automatic rotation awareness | API-11, DATA-20, INFRA-04 |
| NEW-INTEG-5 | Integration health check and logs | SuperAdmin | test integrations, see health status, and view integration request/response logs | I can diagnose integration failures quickly | API-11, DATA-19, ORCH-11 |
| NEW-INTEG-6 | Integration CRUD | SuperAdmin | create, edit, test, and delete integrations for each tenant via the deployment console | integrations are managed centrally per client | API-11, DATA-19, DATA-20 |

---

### Module 22: Billing and Usage (Weeks 15-22 | Phase 2)

**Architecture Components:** PRES-14, API-10, ORCH-10, ORCH-03, DATA-04

**Epic 22.A: Usage Tracking**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-BILLING-1 | Per-call usage calculation | system | calculate usage (call minutes ceil'd, LLM tokens, STT minutes, TTS characters) at call end via PostCallProcessingWorkflow | usage data is accurate and computed automatically | ORCH-03, ORCH-10, DATA-04 |
| NEW-BILLING-2 | Daily usage aggregation | system | upsert daily usage rows per tenant in public.billing_usage | usage is aggregated for efficient reporting | ORCH-10, DATA-04 |
| NEW-BILLING-3 | Test vs production flag | system | exclude calls with metadata.test=true from billing usage | development and testing do not inflate production billing | ORCH-10, DATA-04, DATA-10 |

**Epic 22.B: Billing Dashboard and Reports**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-BILLING-4 | Real-time usage dashboard | ClientAdmin | see current billing period usage (call minutes, LLM tokens, STT/TTS, storage) with live updates | I can monitor spending in real time | PRES-14, API-10, DATA-04 |
| NEW-BILLING-5 | Usage alerts | ClientAdmin | configure threshold alerts (e.g., notify when call minutes exceed 80% of limit) | I am warned before hitting limits | PRES-14, API-10, DATA-02 |
| NEW-BILLING-6 | Monthly usage export | SuperAdmin | export monthly usage per tenant as CSV via admin API (GET /api/v1/billing/export?period=YYYY-MM) | NFQ can generate invoices from accurate usage data | API-10, DATA-04 |

---

### Module 23: Compliance (Weeks 1-22 | MVP to Phase 2)

**Architecture Components:** CROSS-05, CROSS-06, CROSS-11, CROSS-12, CROSS-03, DATA-05

**Epic 23.A: Encryption and Data Isolation**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-COMPLY-1 | Encryption at rest and in transit | system | encrypt all data at rest (AES-256 via Cloud SQL/GCS defaults) and in transit (TLS 1.3, SRTP for media) | data is protected against unauthorized access | CROSS-05 |
| NEW-COMPLY-2 | Tenant data isolation | system | isolate tenant data via schema-per-tenant with SET search_path on every connection | tenants cannot access each other's data under any circumstance | CROSS-03, CROSS-04 |
| NEW-COMPLY-3 | Integration credentials encryption | system | encrypt integration credentials with per-tenant keys in Secret Manager | third-party API secrets are protected beyond database encryption | CROSS-05, INFRA-04, DATA-20 |

**Epic 23.B: GDPR and Retention**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-COMPLY-4 | Configurable data retention | SuperAdmin | configure per-tenant recording retention (default 90 days), transcript retention, and GCS lifecycle policies | data retention complies with contractual and regulatory requirements | CROSS-12, CROSS-06, DATA-02, DATA-23 |
| NEW-COMPLY-5 | Manual data deletion (right to erasure) | SuperAdmin | cascade-delete all tenant data (calls, recordings, transcripts, analytics) on request | the platform supports GDPR right to erasure | CROSS-06, DATA-10, DATA-11, DATA-12, DATA-23 |
| NEW-COMPLY-6 | Call recording consent | system | play a consent announcement at call start before recording begins | recording complies with GDPR consent requirements | CROSS-11, VOICE-01 |

---

### Module 24: Agent Testing (Weeks 8-23 | MVP)

**Architecture Components:** PRES-06, VOICE-01, VOICE-02, VOICE-03, GROVE-02, DATA-13

**Epic 24.A: WebRTC Test Calls**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-TEST-1 | WebRTC browser preview | SuperAdmin | make a test call to an agent directly from the browser via WebRTC (no SIP/PSTN needed) | I can validate agent behavior before publishing | PRES-06, VOICE-01, VOICE-02, VOICE-03 |
| NEW-TEST-2 | Live transcript during test | SuperAdmin | see the real-time transcript while testing an agent in the browser | I can verify speech recognition accuracy and conversation flow | PRES-06, DATA-12 |
| NEW-TEST-3 | Save draft and publish workflow | SuperAdmin | save agent changes as draft, test via WebRTC, then publish to connect to SIP dispatch | the publish workflow is safe: test first, then go live | PRES-06, API-05, DATA-13, DATA-14 |

**Epic 24.B: Automated Testing**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-TEST-4 | Agent-to-Agent simulation | SuperAdmin | run automated tests where an AI caller simulates a conversation with the agent | I can test at scale without manual calls | GROVE-02, VOICE-01, DATA-13 |
| NEW-TEST-5 | Test scenario definition | SuperAdmin | define test scenarios (input utterances, expected extractions, expected conversation path) | agent behavior is validated against known expectations | API-05, DATA-13 |
| NEW-TEST-6 | Latency measurement | SuperAdmin | measure and display end-to-end voice latency (STT + LLM + TTS) during test calls | I can verify the agent meets the <800ms target | VOICE-01, VOICE-02, VOICE-03, CROSS-09 |

---

### Module 25: Testing and QA (Weeks 8-24 | MVP to Phase 2)

**Architecture Components:** INFRA-06, INFRA-07, INFRA-01

**Epic 25.A: Integration and UAT Testing**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-QA-1 | Integration test suite | QA engineer | run automated integration tests covering API endpoints, Temporal workflows, and database operations | regressions are caught before deployment | INFRA-06, API-01 through API-17 |
| NEW-QA-2 | UAT with client (MVP) | ClientAdmin (Hoptrans) | execute acceptance testing against the MVP deployment with real scenarios | the platform meets Hoptrans operational requirements | INFRA-01 |
| NEW-QA-3 | Bug fixes (MVP) | developer | fix bugs discovered during MVP integration testing and UAT | the MVP is stable for production use | INFRA-06 |

**Epic 25.B: Performance and Production**

| Story ID | Title | As a | I want to | So that | Components |
|----------|-------|------|-----------|---------|------------|
| NEW-QA-4 | Performance testing | QA engineer | load-test the platform for 100+ concurrent calls per tenant with <800ms voice latency | the platform meets scaling requirements under realistic load | INFRA-07, VOICE-01, ORCH-08 |
| NEW-QA-5 | Full platform UAT (Phase 2) | ClientAdmin (Hoptrans) | execute acceptance testing against the complete platform with all Phase 2 features | all contracted features are validated before final delivery | INFRA-01 |
| NEW-QA-6 | Production deployment | DevOps engineer | deploy the validated platform to production GCP with canary rollout and smoke tests | the platform goes live safely with automatic rollback capability | INFRA-01, INFRA-06, INFRA-07 |

---

## 4. Cross-Reference Matrix

### 4.1 Presentation Layer (PRES)

| Component | M1 | M2 | M3 | M4 | M7 | M8 | M9 | M10 | M11 | M12 | M13 | M14 | M15 | M16 | M17 | M18 | M20 | M21 | M22 | M23 | M24 | M25 |
|-----------|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| PRES-01 | | | | | | | | | | | | | | | | X | | | | | | |
| PRES-02 | | | | | | | | | | | | | | | | | | | | | | |
| PRES-03 | | | | | | | | | | | | | | | X | | | | | | | |
| PRES-04 | | X | | | | | | | | | | | | | | | | | | | | |
| PRES-05 | | | | | | | X | | | | | | | | | X | | | | | | |
| PRES-06 | | | | | | | X | | | | | | | | | X | | | | | X | |
| PRES-07 | | | | | | | | | | | X | | | | | | | | | | | |
| PRES-08 | | | | | | | | | | | | X | | | | | | | | | | |
| PRES-09 | | | | | | | | | | | | X | | | | | | | | | | |
| PRES-10 | | | | | | | | | | | | | X | | | | | | | | | |
| PRES-11 | | | | | | | | | | | | | | X | | | | | | | | |
| PRES-12 | | X | X | | | | | | | | | | | | X | | | | | | | |
| PRES-13 | | | | X | | | | | | | | | | | | X | | | | | | |
| PRES-14 | | | | | | | | | | | | | | | | | | | X | | | |

### 4.2 Platform API Layer (API)

| Component | M1 | M2 | M3 | M4 | M7 | M8 | M9 | M10 | M11 | M12 | M13 | M14 | M15 | M16 | M17 | M18 | M20 | M21 | M22 | M23 | M24 | M25 |
|-----------|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| API-01 | | X | | | | | | | | | | | | | | | | | | | | X |
| API-02 | | X | | X | | | | | | | | | | | | | | | | | | |
| API-03 | | | | | | | | | | | | | | | | | | | | | | |
| API-04 | | | | X | | | | | | | | | | | | X | | | | | | |
| API-05 | | | | X | | | X | | X | | | | | | | X | X | | | | X | |
| API-06 | | | | | | | | | | | X | X | X | | | | | | | | | |
| API-07 | | | | | | | | | | | X | | | | | | | | | | | |
| API-08 | | | X | | | | | | | | | | | | | X | | | | | | |
| API-09 | | | | | | | | | | | | | X | X | | | | | | | | |
| API-10 | | | | | | | | | | | | | | | | | | | X | | | |
| API-11 | | | | | | | | | | | | | | | | | | X | | | | |
| API-12 | | | | | X | | | | | | | | | | | | | | | | | |
| API-13 | | | | | | | | | | | | | | | | | | | | | | |
| API-14 | | | | | | | | | | | X | | | | | | | | | | | |
| API-15 | | | | | | | | | | | | | | | | | | X | | | | |
| API-16 | X | | | | | | | | | | | | | | | X | | | | | | |
| API-17 | | | | | | | | | | | | | | | X | | | | | | | |

### 4.3 Grove Engine (GROVE)

| Component | M1 | M2 | M3 | M4 | M7 | M8 | M9 | M10 | M11 | M12 | M13 | M14 | M15 | M16 | M17 | M18 | M20 | M21 | M22 | M23 | M24 | M25 |
|-----------|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| GROVE-01 | | | | | | X | X | X | X | X | | | | | | | X | | | | | |
| GROVE-02 | | | | | | X | | X | X | X | | | | | | | | | | | X | |
| GROVE-03 | | | | | | | X | | | | | | | | | | | | | | | |
| GROVE-04 | | | | | | | X | | | | | | | | | | | | | | | |
| GROVE-05 | | | | | | X | | | | | | | | | | | | | | | | |
| GROVE-06 | | | | | | | | | | | | | | | | | | | | | | |
| GROVE-07 | | | | | | | | | | | | | | | | | | | | | | |
| GROVE-08 | | | | | | | | | | | | | | | | | | | | | | |
| GROVE-09 | | X | | | | | | | | | | | | | | | | | | | | |
| GROVE-10 | | | | | | X | | | | | | | | | | | | | | | | |
| GROVE-11 | | | | | | | | | | | | | | | | | X | | | | | |
| GROVE-12 | | | | | | | | | | | | | | | | | X | | | | | |
| GROVE-13 | | | | | | | | | | | | | | | | | X | | | | | |

### 4.4 Voice Layer (VOICE)

| Component | M1 | M2 | M3 | M4 | M7 | M8 | M9 | M10 | M11 | M12 | M13 | M14 | M15 | M16 | M17 | M18 | M20 | M21 | M22 | M23 | M24 | M25 |
|-----------|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| VOICE-01 | | | | | | X | | | X | | | | | | | | | | | X | X | X |
| VOICE-02 | | | | | | X | | | | | | | | | | | | | | | X | |
| VOICE-03 | | | | | | X | | | | | | | | | | | | | | | X | |
| VOICE-04 | | | | | | X | | | | | | | | | | | | | | | | |
| VOICE-05 | | | | | | X | | | | X | | | | | | | | | | | | |
| VOICE-06 | | | | | | | | | | X | | | | | | | | | | | | |
| VOICE-07 | | | | | | | | | | X | | | | | | | | | | | | |
| VOICE-08 | | | | | | | | | | | X | | | | | | | | | | | |
| VOICE-09 | | | | | | | | | | | X | | | | | | | | | | | |

### 4.5 Orchestration Layer (ORCH)

| Component | M1 | M2 | M3 | M4 | M7 | M8 | M9 | M10 | M11 | M12 | M13 | M14 | M15 | M16 | M17 | M18 | M20 | M21 | M22 | M23 | M24 | M25 |
|-----------|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| ORCH-01 | | | | | | | | X | | | X | | | | | | X | | | | | |
| ORCH-02 | | | | | X | | | X | | | | | | | | | X | | | | | |
| ORCH-03 | | | | | | | | | | | | | | | | | | | X | | | |
| ORCH-04 | | | | | | | | | | X | | | | | | | | | | | | |
| ORCH-05 | | | | | | | | X | | | | | | | | | X | | | | | |
| ORCH-06 | | | | | X | | | | | | | | | | | | | | | | | |
| ORCH-07 | | | | X | | | | | | | | | | | | | | | | | | |
| ORCH-08 | | | | | | | | | | | | | | | | | X | | | | | X |
| ORCH-09 | | | | | | | | X | | | | | | | | | X | | | | | |
| ORCH-10 | | | | | | | | | | | | | | | | | | | X | | | |
| ORCH-11 | | | | | | | | | | | | | | | | | X | X | | | | |
| ORCH-12 | | | | | | | | X | | | | | | | | | X | | | | | |

### 4.6 Data Layer (DATA)

| Component | M1 | M2 | M3 | M4 | M7 | M8 | M9 | M10 | M11 | M12 | M13 | M14 | M15 | M16 | M17 | M18 | M20 | M21 | M22 | M23 | M24 | M25 |
|-----------|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| DATA-01 | | | | X | | | | | | | | | | | | X | | | | | | |
| DATA-02 | | | | X | | | | | | | | | | | | | | | X | X | | |
| DATA-03 | | X | X | | | | | | | | | | | | | X | | | | | | |
| DATA-04 | | | | | | | | | | | | | | X | | | | | X | | | |
| DATA-05 | | | | | | | | | | | | | | | X | | | | | X | | |
| DATA-06 | | | | | | | | | | | | | | | | | | | | | | |
| DATA-07 | | | | | | | | | | | | | | | | | | | | | | |
| DATA-08 | | | | | | | | | | | | | | | | | | | | | | |
| DATA-09 | | | | | | | | | | | | | | | | | | | | | | |
| DATA-10 | | X | | | | | | X | X | | X | X | X | X | | | | | X | X | | |
| DATA-11 | | | | | | | | | | X | | X | | | | | | | | X | | |
| DATA-12 | | | | | | X | | X | | X | | X | | | | | | | | X | X | |
| DATA-13 | | | | X | | X | X | X | | X | | | | | | X | | | | | X | |
| DATA-14 | | | | | | | X | | | | | | | | | X | | | | | X | |
| DATA-15 | | | | | X | | | | | | | | | | | | | | | | | |
| DATA-16 | | | | | X | | | | | | | | | | | | | | | | | |
| DATA-17 | | | | | | | | X | | X | | | | | | | X | | | | | |
| DATA-18 | | | | | | | | X | | | | | | | | | X | | | | | |
| DATA-19 | | | | | | | | | | | | | | | | | | X | | | | |
| DATA-20 | | | | | | | | | | | | | | | | | | X | | X | | |
| DATA-21 | | | | | | | | | | | | | | X | | | | | | | | |
| DATA-22 | | | | X | | X | | | | | | | | | | | | | | | | |
| DATA-23 | | | | | | | | | | X | | X | | | | | | | | X | | |

### 4.7 Infrastructure (INFRA)

| Component | M1 | M2 | M3 | M4 | M7 | M8 | M9 | M10 | M11 | M12 | M13 | M14 | M15 | M16 | M17 | M18 | M20 | M21 | M22 | M23 | M24 | M25 |
|-----------|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| INFRA-01 | X | | | | | | | | | | | | | | | | | | | | | X |
| INFRA-02 | X | | | | | | | | | | | | | | | | | | | | | |
| INFRA-03 | X | | | | | | | | | | | | | | | | | | | | | |
| INFRA-04 | X | | | | | | | | | | | | | | | | | X | | X | | |
| INFRA-05 | X | | | | | | | | | | | | | | | | | | | | | |
| INFRA-06 | X | | | | | | | | | | | | | | | | | | | | | X |
| INFRA-07 | X | | | | | | | | | | | | | | | X | | | | | | X |
| INFRA-08 | X | | | | | X | | | | | | | | | | | | | | | | |
| INFRA-09 | X | | | | | | | | | | | | | | | | | | | | | |
| INFRA-10 | X | | | | | | | | | | | | | | | | | | | | | |
| INFRA-11 | X | | | X | | | | | | | | | | | | | | | | | | |

### 4.8 Cross-Cutting Concerns (CROSS)

| Component | M1 | M2 | M3 | M4 | M7 | M8 | M9 | M10 | M11 | M12 | M13 | M14 | M15 | M16 | M17 | M18 | M20 | M21 | M22 | M23 | M24 | M25 |
|-----------|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| CROSS-01 | | X | X | X | | | | | | | | | | | | | | | | | | |
| CROSS-02 | | X | X | | | | | | | | | | | | | | | | | | | |
| CROSS-03 | | X | | X | | | | | | | | | X | X | | | | | | X | | |
| CROSS-04 | | X | | | | | | | | | | | | | | | | X | | | | |
| CROSS-05 | | | | | | | | | | | | | | | | | | | | X | | |
| CROSS-06 | | | | | | | | | | | | | | | | | | | | X | | |
| CROSS-07 | | | X | | | | | | | | | | | | X | | | | | X | | |
| CROSS-08 | X | | | | | | | | | | | | | | | | | | | | | |
| CROSS-09 | X | | | | | | | | | | | | | | | | | | | | X | |
| CROSS-10 | | | | | | | | | | | | | | | | | | | | | | |
| CROSS-11 | | | | | | | | | | | | | | | | | | | | X | | |
| CROSS-12 | | | | | | | | | | | | | | | | | | | | X | | |

---

## 5. Dependency Graph

### Build Order Layers

Dependencies flow downward: each layer depends on layers below it.

```
Layer 0 (No dependencies -- build first):
  M1  Infrastructure
  M23 Compliance (encryption, isolation foundations)

Layer 1 (Depends on Layer 0):
  M2  Authentication (needs INFRA-01, INFRA-02)
  M8  Voice Agent Runtime (needs INFRA-08, INFRA-02)

Layer 2 (Depends on Layer 1):
  M4  Multi-Tenancy Management (needs M2 auth middleware)
  M20 Workflow Engine (needs M8 voice runtime for call workflows)
  M11 Call Safeguards (needs M8 voice pipeline)

Layer 3 (Depends on Layer 2):
  M3  User Management (needs M2 auth, M4 tenancy)
  M7  Incident Detection (needs M20 workflow engine)
  M9  Agent Management (needs M4 tenancy, M8 voice for config)
  M21 Integration Hub (needs M4 tenancy, M20 workflows)
  M24 Agent Testing (needs M8 voice, M9 agent management)

Layer 4 (Depends on Layer 3):
  M10 Outbound -- Plaktukai (needs M7 incident detection, M9 agents, M20 workflows)
  M12 Inbound -- Support (needs M9 agents, M20 workflows, M8 voice)
  M18 Provider Backoffice (needs M4 tenancy, M9 agents)

Layer 5 (Depends on Layer 4):
  M13 Call Monitoring (needs M10/M12 active calls, M8 voice observer)
  M14 Calls UI (needs M10/M12 call data)
  M15 Dashboard (needs M10/M12 call data)

Layer 6 (Depends on Layer 5):
  M16 Analytics (needs M14 calls data, M15 dashboard)
  M17 Audit Trail (needs all modules generating audit events)
  M22 Billing & Usage (needs M10/M12 calls for usage data)
  M25 Testing & QA (needs all modules for integration/UAT)
```

### Critical Path

```
M1 → M2 → M4 → M9 → M10 → M13 → M16
 \         \         \
  → M8 ----→ M20 ---→ M12 → M14 → M22
                       \
                        → M7
```

The critical path runs through Infrastructure, Authentication, Multi-Tenancy, Agent Management, and Outbound workflows. Voice Agent Runtime runs in parallel on the DEMO track.

---

## 6. Summary Statistics

### 6.1 Stories per Module

| # | Module | Epics | Stories |
|---|--------|-------|---------|
| 1 | Infrastructure | 2 | 7 |
| 2 | Authentication | 2 | 6 |
| 3 | User Management | 2 | 5 |
| 4 | Multi-Tenancy Management | 2 | 5 |
| 7 | Incident Detection | 2 | 5 |
| 8 | Voice Agent Runtime | 2 | 8 |
| 9 | Agent Management | 2 | 7 |
| 10 | Outbound -- Plaktukai | 2 | 6 |
| 11 | Call Safeguards | 1 | 3 |
| 12 | Inbound -- Support | 2 | 6 |
| 13 | Call Monitoring | 2 | 6 |
| 14 | Calls UI (Outbound) | 2 | 5 |
| 15 | Dashboard | 1 | 3 |
| 16 | Analytics | 2 | 5 |
| 17 | Audit Trail | 2 | 5 |
| 18 | Provider Backoffice | 2 | 5 |
| 20 | Workflow Engine | 2 | 7 |
| 21 | Integration Hub | 2 | 6 |
| 22 | Billing & Usage | 2 | 6 |
| 23 | Compliance | 2 | 6 |
| 24 | Agent Testing | 2 | 6 |
| 25 | Testing & QA | 2 | 6 |
| | **TOTALS** | **42** | **122** |

### 6.2 Stories per Phase

| Phase | Weeks | Modules | Stories |
|-------|-------|---------|---------|
| DEMO | 1-4 | M7, M8, M10, M20 | 26 |
| MVP Core | 4-12 | M1, M2, M3, M4, M9, M11 | 33 |
| MVP Full | 12-18 | M12, M13, M14, M15, M18, M21, M24 | 37 |
| Phase 2 | 18-24 | M16, M17, M22, M23, M25 | 28 |
| | | | **NOTE:** Module M23 spans MVP-P2 |

### 6.3 Component Coverage

- **Total architecture components:** 111
- **Components touched by at least 1 module:** 101
- **Components not directly mapped:** 10 (DATA-06 through DATA-09 are Grove framework tables used implicitly; API-03, API-13, CROSS-10, PRES-02 are used across multiple modules implicitly)
- **Average components per module:** 7.3
- **Most-connected module:** M8 Voice Agent Runtime (14 components)
- **Least-connected module:** M11 Call Safeguards (3 components)

### 6.4 User Story Sources

| Source | Count | Description |
|--------|------:|-------------|
| Hoptrans stories (N.N) | 24 | Primary source: stories 1.1-12.4 from user stories document |
| New stories (NEW-*) | 98 | Created for modules without Hoptrans coverage |
| **Total** | **122** | |

---

## Appendix: Module Number Gaps

Module numbers 5, 6, and 19 are missing from this document because they are NFQ scope (excluded from Jakit deliverables):

| # | Module | Owner | Notes |
|---|--------|-------|-------|
| 5 | Data Ingestion | NFQ | LocTracker, Fleethand API integrations |
| 6 | Driver Management | NFQ | CSV import, driver list/detail views |
| 19 | Client Portal | NFQ | Initial version by Jakit, full version by NFQ |
