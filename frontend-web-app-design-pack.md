# Web Frontend Design Pack

This document is a mock-first design pack for the full `apps/web` surface in Manibo. It is intended for designing the web app in another tool without needing the running backend.

Use this file as:
- a route inventory for the whole frontend
- a screen-by-screen layout contract
- a reusable component contract
- a flow reference for key user journeys
- a single source of mock JSON for all major surfaces

The route and data shape references here are grounded in the current `apps/web/src/app/**` pages and `apps/web/src/lib/api/**` contracts, but the mock payloads are simplified for frontend design work.

## 1. App Shells

### 1.1 Auth Shell

Used by:
- `/login`
- `/admin/login`
- `/signup`
- `/verify-email/resend`
- `/login/oidc-complete`

Layout contract:
- centered single-column card
- brand mark and product title at top
- primary form block
- secondary action links
- inline status banner for auth success/error/loading

### 1.2 Tenant Shell

Used by:
- `/dashboard`
- `/activity`
- `/automations`
- `/call-ops`
- `/call-ops/history`
- `/call-ops/alerts`
- `/integrations`
- `/team`
- `/settings/recordings`
- `/clinic/knowledge-base`
- `/bookings`
- `/driver-verification/drivers`
- `/observability`
- `/observability/sessions/[callId]`
- `/observability/workflow-runs/[...workflowPath]`
- `/observability/channel-sessions/[channelSessionId]`
- `/observability/channel-runtimes/[runtimeId]`
- `/observability/control-plane-incidents/[incidentId]`
- `/observability/composition/[compositionId]`

Layout contract:
- left sidebar navigation (SidebarNav) with role-based sections
- top mobile nav bar with hamburger menu
- page header (PageHeader) with title and primary action area
- main content area (PageFrame) with cards, tables, master-detail panes, filters, and timelines
- TenantLocaleProvider wrapping for i18n (English/Lithuanian)
- background gradient: light blue

### 1.3 Deployment Admin Shell

Used by:
- `/admin`
- `/admin/tenants`
- `/admin/users`
- `/admin/solutions`
- `/admin/agent-definitions`
- `/admin/agent-definitions/[id]`
- `/admin/agent-definitions/[id]/test`
- `/admin/telephony`
- `/admin/audit`

Layout contract:
- deployment-scoped sidebar with collapsible toggle
- sidebar sections: Dashboard, Tenants & Access (Tenants, Solutions, Users), Agents (Agent Definitions, Telephony), Platform (Audit)
- denser operational dashboard feel than tenant shell
- table-heavy pages
- right-side supporting panes or drawers for details, status, and actions

## 2. Reusable UI Contract

These are the reusable patterns that should stay visually consistent across the entire web app.

### 2.1 Navigation (SidebarNav)

- brand block with deployment or tenant identity
- grouped nav sections with section titles
- active route indicator (rounded-lg, CSS variable borders/shadows)
- badge counts (live pills) for active calls, alerts
- compact mobile overlay variant with hamburger toggle
- collapsible sidebar (deployment shell)
- footer with user info, language selector (English/Lithuanian), sign out

Tenant sidebar sections: Dashboard, Live Support (Call Ops, Alerts), Review (Call History, Observability, Automations), [Solution sections from manifests], Manage (Team, Activity, Integrations, Settings — admin only).

Deployment sidebar sections: Dashboard, Tenants & Access (Tenants, Solutions, Users), Agents (Agent Definitions, Telephony), Platform (Audit).

### 2.2 Headers (PageHeader / PageFrame)

- page title
- short operational subtitle only when needed in design tool, not mandatory in product UI
- contextual actions on the right
- filter chips or segmented controls under header when page needs scope changes

### 2.3 Summary Cards

- metric cards
- status cards with severity left-border accents
- alert cards (card-per-alert layout, severity left border, relative timestamps)
- active call cards (card-per-call layout, urgent banner with inline actions)
- comparison cards
- health hero card (deployment dashboard focal point)

### 2.4 Data Presentation Blocks

- DataTable with sticky header, row hover states, loading prop with Skeleton rendering
- split master-detail layout (email-client pattern for call history)
- event timeline rail with gap markers (amber dashed rows for missing evidence)
- transcript panel
- trace node list
- Badge (from @grove/ui) for status indicators
- YAML/code preview pane (CodeMirror)
- Drawer (from @grove/ui) for slide-over detail panels
- OverflowMenu (from @grove/ui, Radix DropdownMenu-based) for secondary actions
- StatusMessage (unified notice component replacing ActionBanners and InlineNotice)
- RelativeTime for human-readable timestamps
- Tabs (Radix-based) for observability navigation across subject types
- Select with allowEmpty prop for dropdown filters
- Tooltip for blocked-action hints on disabled buttons
- Skeleton for loading states on all pages

### 2.5 Progressive Disclosure

Three tiers of information density:
- operator-facing (always visible)
- technical metrics (collapsed by default)
- deep trace (collapsed by default)

### 2.6 Button Hierarchy

- primary actions (max 2 visible) plus OverflowMenu ("...") for secondary actions
- disabled buttons use solid colors (bg-neutral-100 text-neutral-400 border-neutral-200), never opacity

### 2.7 Common UI States

Every major page should have visual states for:
- loading (Skeleton components)
- empty
- partial data
- degraded dependency
- inline validation error (StatusMessage)
- permission-limited (Tooltip on disabled actions)
- archived or read-only

## 3. Route Inventory

| Shell | Route | Page Purpose |
| --- | --- | --- |
| auth | `/login` | Tenant user login |
| auth | `/admin/login` | Deployment admin login |
| auth | `/signup` | Invitation or self-serve registration |
| auth | `/verify-email/resend` | Email verification retry |
| auth | `/login/oidc-complete` | OIDC callback completion |
| tenant | `/dashboard` | Tenant overview and current workload |
| tenant | `/activity` | Tenant audit and event feed |
| tenant | `/automations` | Workflow execution list and retry management |
| tenant | `/call-ops` | Live call monitoring workspace |
| tenant | `/call-ops/history` | Historical calls and call detail |
| tenant | `/call-ops/alerts` | Operator alerts queue |
| tenant | `/integrations` | Connector catalog and tenant connectors |
| tenant | `/team` | Team user management |
| tenant | `/settings/recordings` | Recording retention and locale settings |
| tenant | `/clinic/knowledge-base` | Clinic content reference |
| tenant | `/bookings` | Appointment booking list and schedule state |
| tenant | `/driver-verification/drivers` | Driver verification registry |
| tenant | `/observability` | Observability run list |
| tenant | `/observability/sessions/[callId]` | Call session detail |
| tenant | `/observability/workflow-runs/[...workflowPath]` | Workflow run detail |
| tenant | `/observability/channel-sessions/[channelSessionId]` | Channel session detail |
| tenant | `/observability/channel-runtimes/[runtimeId]` | Channel runtime detail |
| tenant | `/observability/control-plane-incidents/[incidentId]` | Incident detail |
| tenant | `/observability/composition/[compositionId]` | Composition detail |
| admin | `/admin` | Deployment overview |
| admin | `/admin/tenants` | Tenant lifecycle management |
| admin | `/admin/users` | Provider-side user management |
| admin | `/admin/solutions` | Solution enablement overview |
| admin | `/admin/agent-definitions` | Tenant agent definition list |
| admin | `/admin/agent-definitions/[id]` | Agent definition detail and versions |
| admin | `/admin/agent-definitions/[id]/test` | Browser voice and test call workbench |
| admin | `/admin/telephony` | Provider accounts, trunks, numbers, policies |
| admin | `/admin/audit` | Deployment audit feed |

## 4. Screen Specs

Each screen lists the recommended layout blocks, primary actions, UI states, and the mock dataset names it should consume from the appendix.

### 4.1 Auth Screens

#### `/login`

- layout blocks: identity header, login form card, SSO buttons, security notice, footer links
- primary actions: sign in, continue with OIDC, recover access
- design states: default, invalid credentials, SSO loading, account suspended
- datasets: `auth.login`, `session.currentUserCandidate`, `system.notices`

#### `/admin/login`

- layout blocks: admin identity header, stricter auth card, deployment status strip
- primary actions: sign in as deployment admin, continue with OIDC
- design states: success redirect, unauthorized role, expired session
- datasets: `auth.adminLogin`, `admin.overview.healthSummary`

#### `/signup`

- layout blocks: invite summary, account form, organization info card, success confirmation state
- primary actions: create account, accept invite
- design states: first-time setup, invite expired, duplicate email
- datasets: `auth.signup`, `admin.tenants.pendingInvites`

#### `/verify-email/resend`

- layout blocks: status card, email address block, resend control, countdown state
- primary actions: resend email, back to login
- design states: waiting, sent, rate limited
- datasets: `auth.verifyEmail`

#### `/login/oidc-complete`

- layout blocks: progress state, account resolution result, redirect card
- primary actions: continue, retry login
- design states: success, mismatch, provider failure
- datasets: `auth.oidcComplete`

### 4.2 Tenant Overview and Operations

#### `/dashboard`

- layout blocks: KPI row, active calls card, usage card, trends chart, recent alerts rail
- primary actions: open live calls, inspect usage, view recent incidents
- design states: quiet day, high-load day, soft-budget warning
- datasets: `tenantContext`, `dashboard.summary`, `dashboard.activeCalls`, `dashboard.usage`, `dashboard.callsReport`, `callOps.alerts`

#### `/activity`

- layout blocks: filter bar, audit event table, event detail drawer
- primary actions: filter by actor, event type, time range
- design states: dense operational feed, no matches, permission-limited actor info
- datasets: `activity.feed`

#### `/automations`

- layout blocks: workflow status filters, workflow executions table, execution detail panel, step timeline
- primary actions: inspect failure, retry workflow, filter by status
- design states: all healthy, several failed, retry in progress
- datasets: `automations.executions`, `automations.executionDetail`, `automations.steps`

#### `/call-ops`

- layout blocks: live calls grid, active session list, latency/trace summary card, escalation rail
- primary actions: monitor session, join call, escalate, inspect trace
- design states: no live calls, one critical call, many simultaneous calls
- datasets: `callOps.liveBoard`, `callOps.latencySummary`, `callOps.traceSummary`, `callOps.escalations`

#### `/call-ops/history`

- layout blocks: search and filters, historical calls table, transcript panel, recordings block, event timeline
- primary actions: inspect call, play recording, filter by outcome, export selected view
- design states: normal history, no recordings, needs human review
- datasets: `callHistory.list`, `callHistory.detail`, `callHistory.events`

#### `/call-ops/alerts`

- layout blocks: severity tabs, alerts list, selected alert detail, action tray
- primary actions: acknowledge, resolve, open related call
- design states: critical backlog, all clear, alert detail with missing dependency data
- datasets: `callOps.alerts`

### 4.3 Tenant Management and Content

#### `/integrations`

- layout blocks: connector catalog, installed connectors list, health badges, configuration drawer
- primary actions: add connector, disable connector, edit mapping
- design states: no connectors, mixed health, setup incomplete
- datasets: `integrations.catalog`, `integrations.installed`, `integrations.health`

#### `/team`

- layout blocks: team members table, invite panel, role distribution card
- primary actions: invite user, change role, deactivate user
- design states: active team, pending invite, empty tenant team
- datasets: `team.members`, `team.invites`

#### `/settings/recordings`

- layout blocks: retention settings card, locale settings card, change history strip
- primary actions: update retention policy, change locale
- design states: defaults inherited, tenant override active, invalid retention warning
- datasets: `settings.recordings`, `settings.locale`

#### `/clinic/knowledge-base`

- layout blocks: specialty filters, city tabs, clinic cards, doctor roster, pricing blocks
- primary actions: inspect clinic, compare price cards, search doctor
- design states: full content, sparse content, unsupported city
- datasets: `clinicKnowledgeBase`

#### `/bookings`

- layout blocks: booking summary row, bookings table, booking detail drawer, status timeline
- primary actions: confirm booking, reschedule, escalate
- design states: upcoming heavy day, many pending confirmations, no results
- datasets: `bookings.summary`, `bookings.items`, `bookings.detail`

#### `/driver-verification/drivers`

- layout blocks: driver registry table, risk badges, discrepancy panel, verification history
- primary actions: review discrepancy, approve, request callback
- design states: clean fleet, flagged drivers, no driver imported
- datasets: `driverVerification.summary`, `driverVerification.drivers`, `driverVerification.history`

### 4.4 Tenant Observability

#### `/observability`

- layout blocks: facet filters, run list table, compare tray, quick summary metrics
- primary actions: open run, compare two runs, filter by kind/status/assistant
- design states: broad list, degraded traces, empty filter result
- datasets: `observability.runs`, `observability.facets`, `observability.compare`

#### `/observability/sessions/[callId]`

- layout blocks: hero summary, metrics row, insights, recommended actions, transcript, recordings, timeline
- primary actions: play recording, jump to related workflow, open trace artifact
- design states: full evidence, no recording, partial timeline
- datasets: `observability.callSessionDetail`, `observability.callSessionTimeline`

#### `/observability/workflow-runs/[...workflowPath]`

- layout blocks: workflow summary, metrics, context fields, step timeline, related entities
- primary actions: compare workflow runs, inspect failed step
- design states: healthy workflow, failed workflow, archived run
- datasets: `observability.workflowRunDetail`, `observability.workflowRunTimeline`

#### `/observability/channel-sessions/[channelSessionId]`

- layout blocks: session summary, delivery state summary, timeline, content artifacts, related entities
- primary actions: inspect channel delivery, open related lead/contact
- design states: delivered, blocked, degraded integration
- datasets: `observability.channelSessionDetail`, `observability.channelSessionTimeline`

#### `/observability/channel-runtimes/[runtimeId]`

- layout blocks: runtime summary, health matrix, KPIs, degraded reasons, session aggregate timeline
- primary actions: inspect runtime health, jump to recent sessions
- design states: healthy runtime, blocked runtime, high escalation rate
- datasets: `observability.channelRuntimeDetail`, `observability.channelRuntimeTimeline`

#### `/observability/control-plane-incidents/[incidentId]`

- layout blocks: incident severity header, root issue summary, impact scope, timeline, actions
- primary actions: follow remediation, inspect affected entities
- design states: open incident, resolved incident, incomplete evidence
- datasets: `observability.controlPlaneIncidentDetail`, `observability.controlPlaneIncidentTimeline`

#### `/observability/composition/[compositionId]`

- layout blocks: composition summary, installed solution matrix, version and artifact hashes, related runs
- primary actions: compare version impact, inspect tenant rollout state
- design states: current stable, mixed-version rollout, unresolved integrity gap
- datasets: `observability.compositionDetail`, `observability.compositionTimeline`

### 4.5 Deployment Admin Screens

#### `/admin`

- layout blocks: deployment KPI band, platform health summary, active tenants table, release state card, alert strip
- primary actions: inspect tenant issues, open health page, open releases
- design states: healthy deployment, degraded worker cluster, release in progress
- datasets: `admin.overview`

#### `/admin/tenants`

- layout blocks: tenant table, tenant status filters, lifecycle drawer, release assignment preview
- primary actions: onboard tenant, suspend tenant, offboard tenant, export data
- design states: mixed environments, suspended tenants, empty search result
- datasets: `admin.tenants`

#### `/admin/users`

- layout blocks: provider support users table, invite panel, role distribution card
- primary actions: invite user, update tenant role, deactivate access
- design states: active support team, pending invites, filtered tenant context
- datasets: `admin.users`

#### `/admin/solutions`

- layout blocks: tenant-solution matrix, installation status cards, availability notes
- primary actions: inspect tenant enablement, review missing solution coverage
- design states: all enabled, mixed enablement, dependency blocked
- datasets: `admin.solutions`

#### `/admin/agent-definitions`

- layout blocks: tenant selector, agent definitions table, status counters, draft/review badges
- primary actions: open definition, create new definition, filter by status
- design states: many drafts, published estate, no definitions for tenant
- datasets: `admin.agentDefinitions.list`

#### `/admin/agent-definitions/[id]`

- layout blocks: agent summary header, version list, YAML/editor pane, compiled artifact summary, review history
- primary actions: save draft, submit review, approve, reject, publish, archive
- design states: draft editing, in review, published with prior versions
- datasets: `admin.agentDefinitions.detail`, `admin.agentDefinitions.versions`, `admin.agentDefinitions.artifact`

#### `/admin/agent-definitions/[id]/test`

- layout blocks: browser voice launcher, test call list, transcript panel, result summary
- primary actions: launch browser session, place test call, mark pass/fail
- design states: idle workbench, active browser voice test, failed test call
- datasets: `admin.agentDefinitions.testWorkbench`

#### `/admin/telephony`

- layout blocks: provider accounts table, trunk inventory, number inventory, policy matrix, capability cards
- primary actions: add provider account, validate account, sync trunks, sync numbers, acquire number, edit policy
- design states: connected provider, degraded sync, BYO-only tenant policy
- datasets: `admin.telephony`

#### `/admin/audit`

- layout blocks: audit feed, severity chips, actor detail drawer
- primary actions: filter by tenant, actor, severity, event kind
- design states: normal audit volume, suspicious spike, no matches
- datasets: `admin.audit`

## 5. Key Interaction Flows

### 5.1 Auth Flow

1. user lands on `/login`
2. chooses password or OIDC sign-in
3. sees validation or redirect progress state
4. lands on tenant shell or admin shell based on role

### 5.2 Live Call Monitoring Flow

1. operator opens `/call-ops`
2. selects a critical live call
3. inspects latency, trace, transcript fragments, escalation state
4. opens full run detail in `/observability/sessions/[callId]`

### 5.3 Historical Call Review Flow

1. operator opens `/call-ops/history`
2. filters by outcome or phone number
3. selects a row
4. reviews transcript, recording, runtime events, and quality score

### 5.4 Observability Investigation Flow

1. user opens observability run list
2. filters by run kind, status, tenant, solution, or assistant
3. opens a run detail page
4. scans insights, integrity gaps, related entities, and timeline
5. optionally compares the run with another one

### 5.5 Tenant Lifecycle Flow

1. deployment admin opens `/admin/tenants`
2. reviews status, environment, release, and usage
3. opens lifecycle drawer
4. suspends, offboards, exports data, or updates locale/release

### 5.6 Agent Definition Governance Flow

1. admin opens `/admin/agent-definitions`
2. selects tenant and definition
3. reviews versions and YAML
4. creates or edits draft
5. submits for review
6. approves or rejects
7. publishes approved version
8. runs validation in `/admin/agent-definitions/[id]/test`

### 5.7 Telephony Provisioning Flow

1. admin opens `/admin/telephony`
2. adds or validates provider account
3. syncs trunks and numbers
4. reviews number bindings and tenant policy
5. assigns number or route to tenant agent

## 6. Page to Dataset Mapping

| Route | Dataset Names |
| --- | --- |
| `/dashboard` | `dashboard.summary`, `dashboard.activeCalls`, `dashboard.usage`, `dashboard.callsReport`, `callOps.alerts` |
| `/activity` | `activity.feed` |
| `/automations` | `automations.executions`, `automations.executionDetail`, `automations.steps` |
| `/call-ops` | `callOps.liveBoard`, `callOps.latencySummary`, `callOps.traceSummary`, `callOps.escalations` |
| `/call-ops/history` | `callHistory.list`, `callHistory.detail`, `callHistory.events` |
| `/call-ops/alerts` | `callOps.alerts` |
| `/integrations` | `integrations.catalog`, `integrations.installed`, `integrations.health` |
| `/team` | `team.members`, `team.invites` |
| `/settings/recordings` | `settings.recordings`, `settings.locale` |
| `/clinic/knowledge-base` | `clinicKnowledgeBase` |
| `/bookings` | `bookings.summary`, `bookings.items`, `bookings.detail` |
| `/driver-verification/drivers` | `driverVerification.summary`, `driverVerification.drivers`, `driverVerification.history` |
| `/observability` | `observability.runs`, `observability.facets`, `observability.compare` |
| `/observability/* detail` | `observability.*Detail`, `observability.*Timeline` |
| `/admin` | `admin.overview` |
| `/admin/tenants` | `admin.tenants` |
| `/admin/users` | `admin.users` |
| `/admin/solutions` | `admin.solutions` |
| `/admin/agent-definitions` | `admin.agentDefinitions.list` |
| `/admin/agent-definitions/[id]` | `admin.agentDefinitions.detail`, `admin.agentDefinitions.versions`, `admin.agentDefinitions.artifact` |
| `/admin/agent-definitions/[id]/test` | `admin.agentDefinitions.testWorkbench` |
| `/admin/telephony` | `admin.telephony` |
| `/admin/audit` | `admin.audit` |

## 7. Mock Data JSON

```json
{
  "meta": {
    "design_pack_version": "1.1.0",
    "generated_for": "apps/web",
    "synced_at": "2026-04-17",
    "notes": [
      "Mock-first payloads for screen design only",
      "Shapes are normalized from current frontend API contracts",
      "Routes and components aligned with codebase as of 2026-04-17"
    ]
  },
  "system": {
    "notices": [
      {
        "id": "notice_maintenance",
        "severity": "warning",
        "title": "Scheduled maintenance window",
        "detail": "Voice provisioning sync may be delayed for up to 15 minutes."
      }
    ]
  },
  "session": {
    "currentUser": {
      "id": "usr_01JADMIN8WJ1K4B3JQ2C1Q7Y",
      "name": "Raka Pratama",
      "email": "raka@northstar.example",
      "role": "client_admin",
      "tenant_id": "ten_01JTNORTHSTAR0001",
      "tenant_name": "Northstar Mobility",
      "tenant_slug": "northstar-mobility"
    },
    "currentUserCandidate": {
      "email": "raka@northstar.example",
      "preferred_auth_method": "password"
    }
  },
  "tenantContext": {
    "tenant_id": "ten_01JTNORTHSTAR0001",
    "tenant_name": "Northstar Mobility",
    "tenant_slug": "northstar-mobility",
    "environment": "production",
    "active_solution_keys": [
      "driver_verification",
      "lead_capture",
      "appointment_booking"
    ],
    "current_release": "rel_2026_04_14_prod_03"
  },
  "auth": {
    "login": {
      "title": "Sign in to tenant workspace",
      "providers": [
        {
          "id": "oidc_google_workspace",
          "label": "Continue with Google Workspace"
        },
        {
          "id": "oidc_azuread",
          "label": "Continue with Azure AD"
        }
      ],
      "form": {
        "email": "raka@northstar.example",
        "password_masked": "••••••••••••"
      },
      "state_examples": {
        "default": "idle",
        "error": {
          "code": "invalid_credentials",
          "message": "Email atau password tidak cocok."
        },
        "suspended": {
          "code": "tenant_suspended",
          "message": "Workspace tenant ini sedang disuspend."
        }
      }
    },
    "adminLogin": {
      "title": "Deployment admin access",
      "providers": [
        {
          "id": "oidc_admin",
          "label": "Continue with deployment SSO"
        }
      ],
      "state_examples": {
        "default": "idle",
        "unauthorized_role": {
          "code": "role_mismatch",
          "message": "Akun ini tidak punya akses deployment admin."
        }
      }
    },
    "signup": {
      "invite": {
        "tenant_name": "Northstar Mobility",
        "invited_role": "client_operator",
        "expires_at": "2026-04-20T09:00:00Z"
      },
      "form": {
        "full_name": "Dimas Kurniawan",
        "email": "dimas@northstar.example"
      }
    },
    "verifyEmail": {
      "email": "dimas@northstar.example",
      "cooldown_seconds": 42,
      "last_sent_at": "2026-04-16T06:15:00Z"
    },
    "oidcComplete": {
      "status": "success",
      "provider": "Google Workspace",
      "resolved_role": "client_admin",
      "redirect_to": "/dashboard"
    }
  },
  "dashboard": {
    "summary": {
      "metrics": [
        {
          "key": "active_calls",
          "label": "Active calls",
          "value": "12",
          "trend": "+3 vs 30m"
        },
        {
          "key": "open_alerts",
          "label": "Open alerts",
          "value": "4",
          "trend": "+1 critical"
        },
        {
          "key": "automation_failures",
          "label": "Automation failures",
          "value": "2",
          "trend": "1 retried"
        },
        {
          "key": "monthly_usage",
          "label": "Monthly usage",
          "value": "73%",
          "trend": "Soft budget warning"
        }
      ]
    },
    "activeCalls": {
      "calls": [
        {
          "call_id": "call_01JCALL0001",
          "workflow_id": "wf_driver_verification_0001",
          "run_id": "run_01JCALL0001",
          "workflow_type": "driver_verification.outbound_call"
        },
        {
          "call_id": "call_01JCALL0002",
          "workflow_id": "wf_appointment_booking_0101",
          "run_id": "run_01JCALL0002",
          "workflow_type": "appointment_booking.inbound_call"
        }
      ]
    },
    "usage": {
      "tenant_id": "ten_01JTNORTHSTAR0001",
      "period_start": "2026-04-01T00:00:00Z",
      "period_end": "2026-04-30T23:59:59Z",
      "currency": "USD",
      "voice_seconds": 19840,
      "voice_minutes": 330.67,
      "production_voice_seconds": 16520,
      "production_voice_minutes": 275.33,
      "test_voice_seconds": 3320,
      "test_voice_minutes": 55.33,
      "llm_tokens": 621000,
      "stt_characters": 382000,
      "tts_characters": 191000,
      "platform_fee_cents": 420000,
      "telephony_fee_cents": 168000,
      "llm_fee_cents": 93000,
      "stt_fee_cents": 41000,
      "tts_fee_cents": 26000,
      "discount_cents": 15000,
      "subtotal_cents": 748000,
      "total_cents": 733000,
      "budget_mode": "soft",
      "monthly_budget_cents": 1000000,
      "over_budget": false,
      "utilization_percent": 73.3
    },
    "callsReport": {
      "buckets": [
        {
          "bucket_start": "2026-04-16T00:00:00Z",
          "completed": 41,
          "escalated": 4,
          "total_calls": 49,
          "average_duration_seconds": 284,
          "outcome_distribution": {
            "verified": 22,
            "booked": 11,
            "no_answer": 7,
            "escalated": 4,
            "other": 5
          },
          "escalation_rate": 0.082
        },
        {
          "bucket_start": "2026-04-15T00:00:00Z",
          "completed": 36,
          "escalated": 2,
          "total_calls": 40,
          "average_duration_seconds": 251,
          "outcome_distribution": {
            "verified": 18,
            "booked": 9,
            "no_answer": 8,
            "escalated": 2,
            "other": 3
          },
          "escalation_rate": 0.05
        }
      ]
    }
  },
  "activity": {
    "feed": [
      {
        "id": "evt_tenant_001",
        "event_type": "agent_definition.published",
        "actor_name": "Raka Pratama",
        "actor_type": "user",
        "created_at": "2026-04-16T05:21:00Z",
        "tenant_id": "ten_01JTNORTHSTAR0001",
        "target_label": "Northstar Driver Verifier",
        "summary": "Published version 8 to production."
      },
      {
        "id": "evt_tenant_002",
        "event_type": "operator_event.acked",
        "actor_name": "Sinta Maharani",
        "actor_type": "user",
        "created_at": "2026-04-16T05:12:00Z",
        "tenant_id": "ten_01JTNORTHSTAR0001",
        "target_label": "Latency spike on live call",
        "summary": "Acknowledged critical call alert."
      },
      {
        "id": "evt_tenant_003",
        "event_type": "connector.updated",
        "actor_name": "System",
        "actor_type": "service",
        "created_at": "2026-04-16T04:58:00Z",
        "tenant_id": "ten_01JTNORTHSTAR0001",
        "target_label": "Salesforce CRM",
        "summary": "Connector health recovered after credential refresh."
      }
    ]
  },
  "automations": {
    "executions": [
      {
        "workflow_id": "wf_driver_verification_0001",
        "run_id": "run_01JWF0001",
        "status": "Running",
        "workflow_type": "driver_verification.outbound_call",
        "started_at": "2026-04-16T05:18:00Z",
        "ended_at": null,
        "tenant_id": "ten_01JTNORTHSTAR0001"
      },
      {
        "workflow_id": "wf_booking_0009",
        "run_id": "run_01JWF0009",
        "status": "Failed",
        "workflow_type": "appointment_booking.confirmation",
        "started_at": "2026-04-16T04:42:00Z",
        "ended_at": "2026-04-16T04:48:00Z",
        "tenant_id": "ten_01JTNORTHSTAR0001"
      }
    ],
    "executionDetail": {
      "workflow_id": "wf_booking_0009",
      "run_id": "run_01JWF0009",
      "status": "Failed",
      "workflow_type": "appointment_booking.confirmation",
      "retry_summary": {
        "attempts": 2,
        "max_attempts": 3,
        "next_retry_at": "2026-04-16T06:30:00Z"
      }
    },
    "steps": [
      {
        "step_id": "step_01",
        "name": "Load patient request",
        "status": "Completed",
        "started_at": "2026-04-16T04:42:00Z",
        "ended_at": "2026-04-16T04:42:02Z"
      },
      {
        "step_id": "step_02",
        "name": "Find slot candidates",
        "status": "Completed",
        "started_at": "2026-04-16T04:42:02Z",
        "ended_at": "2026-04-16T04:42:04Z"
      },
      {
        "step_id": "step_03",
        "name": "Send confirmation",
        "status": "Failed",
        "started_at": "2026-04-16T04:42:04Z",
        "ended_at": "2026-04-16T04:42:05Z"
      }
    ]
  },
  "callOps": {
    "liveBoard": {
      "active_calls": [
        {
          "call_id": "call_01JCALL0001",
          "customer_name": "Budi Santoso",
          "queue": "Driver Verification",
          "status": "in_progress",
          "agent_name": "Northstar Driver Verifier",
          "started_at": "2026-04-16T05:17:20Z",
          "elapsed_seconds": 383,
          "severity": "warning"
        },
        {
          "call_id": "call_01JCALL0004",
          "customer_name": "Rina Putri",
          "queue": "Booking Intake",
          "status": "awaiting_tool_response",
          "agent_name": "Clinic Booking Assistant",
          "started_at": "2026-04-16T05:20:02Z",
          "elapsed_seconds": 221,
          "severity": "critical"
        }
      ]
    },
    "latencySummary": {
      "metrics": [
        {
          "label": "Median turn latency",
          "value_ms": 1640
        },
        {
          "label": "P95 turn latency",
          "value_ms": 3190
        },
        {
          "label": "Median tool latency",
          "value_ms": 580
        }
      ]
    },
    "traceSummary": {
      "call_id": "call_01JCALL0004",
      "route_selection": {
        "route": "appointment_booking.lookup_slots",
        "confidence": 0.94,
        "fallback_used": false
      },
      "hotspots": [
        {
          "component": "schedule_connector",
          "duration_ms": 1120,
          "change_vs_baseline_ms": 420
        },
        {
          "component": "llm_response",
          "duration_ms": 980,
          "change_vs_baseline_ms": 210
        }
      ]
    },
    "escalations": [
      {
        "id": "esc_001",
        "call_id": "call_01JCALL0004",
        "severity": "critical",
        "status": "open",
        "title": "Repeated slot lookup timeout",
        "detail": "Agent retried slot lookup twice and exceeded threshold.",
        "created_at": "2026-04-16T05:22:10Z"
      },
      {
        "id": "esc_002",
        "call_id": "call_01JCALL0001",
        "severity": "warning",
        "status": "acked",
        "title": "Driver mismatch confidence low",
        "detail": "Identity response confidence dropped below configured target.",
        "created_at": "2026-04-16T05:18:32Z"
      }
    ],
    "alerts": [
      {
        "id": "op_evt_001",
        "severity": "critical",
        "status": "open",
        "title": "Live call latency spike",
        "detail": "Turn latency exceeded 3.2 seconds for 3 consecutive turns.",
        "call_id": "call_01JCALL0004",
        "created_at": "2026-04-16T05:22:14Z"
      },
      {
        "id": "op_evt_002",
        "severity": "warning",
        "status": "acked",
        "title": "Fallback provider used",
        "detail": "STT traffic switched to fallback provider for one session.",
        "call_id": "call_01JCALL0008",
        "created_at": "2026-04-16T05:05:09Z"
      },
      {
        "id": "op_evt_003",
        "severity": "info",
        "status": "resolved",
        "title": "Recovered connector health",
        "detail": "Salesforce delivery resumed after token refresh.",
        "call_id": null,
        "created_at": "2026-04-16T04:58:04Z"
      }
    ]
  },
  "callHistory": {
    "list": {
      "calls": [
        {
          "id": "call_hist_001",
          "direction": "outbound",
          "state": "completed",
          "outcome": "verified",
          "caller_number": "+12065550101",
          "callee_number": "+6281230001001",
          "started_at": "2026-04-16T03:12:00Z",
          "ended_at": "2026-04-16T03:17:04Z",
          "duration_seconds": 304,
          "created_at": "2026-04-16T03:11:58Z",
          "updated_at": "2026-04-16T03:17:04Z",
          "metadata": {
            "driver_id": "drv_001",
            "campaign": "morning-verification"
          },
          "quality_score": {
            "overall": 0.91,
            "clarity": 0.93,
            "resolution": 0.9,
            "sentiment": 0.86
          },
          "needs_human_review": false
        },
        {
          "id": "call_hist_002",
          "direction": "inbound",
          "state": "completed",
          "outcome": "escalated",
          "caller_number": "+6281230001009",
          "callee_number": "+12065550105",
          "started_at": "2026-04-16T02:42:00Z",
          "ended_at": "2026-04-16T02:51:45Z",
          "duration_seconds": 585,
          "created_at": "2026-04-16T02:41:55Z",
          "updated_at": "2026-04-16T02:51:45Z",
          "metadata": {
            "booking_request_id": "book_req_001"
          },
          "quality_score": {
            "overall": 0.67,
            "clarity": 0.82,
            "resolution": 0.48,
            "sentiment": 0.63
          },
          "needs_human_review": true
        }
      ],
      "total": 248,
      "limit": 25,
      "offset": 0
    },
    "detail": {
      "call": {
        "id": "call_hist_002",
        "direction": "inbound",
        "state": "completed",
        "outcome": "escalated",
        "caller_number": "+6281230001009",
        "callee_number": "+12065550105",
        "started_at": "2026-04-16T02:42:00Z",
        "ended_at": "2026-04-16T02:51:45Z",
        "duration_seconds": 585,
        "created_at": "2026-04-16T02:41:55Z",
        "updated_at": "2026-04-16T02:51:45Z",
        "metadata": {
          "booking_request_id": "book_req_001",
          "assistant_name": "Clinic Booking Assistant"
        },
        "quality_score": {
          "overall": 0.67,
          "clarity": 0.82,
          "resolution": 0.48,
          "sentiment": 0.63
        },
        "needs_human_review": true
      },
      "transcript": {
        "language": "id-ID",
        "full_text": "Halo, saya mau ubah jadwal kontrol saya ke hari Jumat sore kalau masih ada slot."
      },
      "recordings": [
        {
          "id": "rec_001",
          "status": "available",
          "created_at": "2026-04-16T02:51:45Z",
          "signed_url_path": "/recordings/rec_001/signed"
        }
      ],
      "has_more": {
        "transcript": false,
        "recordings": false
      }
    },
    "events": {
      "call_id": "call_hist_002",
      "events": [
        {
          "seq": 1,
          "event_type": "call.started",
          "occurred_at_ms": 0,
          "summary": "Inbound call started.",
          "created_at": "2026-04-16T02:42:00Z",
          "payload": {}
        },
        {
          "seq": 2,
          "event_type": "tool.schedule_lookup.started",
          "occurred_at_ms": 98000,
          "summary": "Schedule connector lookup started.",
          "created_at": "2026-04-16T02:43:38Z",
          "payload": {
            "connector": "medix_schedule"
          }
        },
        {
          "seq": 3,
          "event_type": "call.escalated",
          "occurred_at_ms": 540000,
          "summary": "Call escalated to human operator.",
          "created_at": "2026-04-16T02:51:00Z",
          "payload": {
            "reason": "No matching Friday slot confirmed"
          }
        }
      ]
    }
  },
  "integrations": {
    "catalog": [
      {
        "connector_type": "crm",
        "adapter_key": "salesforce",
        "display_name": "Salesforce",
        "ui_hints": {
          "icon": "cloud",
          "category": "CRM"
        }
      },
      {
        "connector_type": "scheduling",
        "adapter_key": "medix_schedule",
        "display_name": "Medix Schedule",
        "ui_hints": {
          "icon": "calendar",
          "category": "Scheduling"
        }
      },
      {
        "connector_type": "notifications",
        "adapter_key": "twilio_sms",
        "display_name": "Twilio SMS",
        "ui_hints": {
          "icon": "message-square",
          "category": "Notifications"
        }
      }
    ],
    "installed": [
      {
        "id": "conn_001",
        "display_name": "Salesforce CRM",
        "connector_type": "crm",
        "status": "active",
        "adapter_key": "salesforce"
      },
      {
        "id": "conn_002",
        "display_name": "Medix Schedule",
        "connector_type": "scheduling",
        "status": "active",
        "adapter_key": "medix_schedule"
      },
      {
        "id": "conn_003",
        "display_name": "Twilio SMS",
        "connector_type": "notifications",
        "status": "disabled",
        "adapter_key": "twilio_sms"
      }
    ],
    "health": [
      {
        "connector_id": "conn_001",
        "status": "healthy",
        "message": "Last sync 2 minutes ago."
      },
      {
        "connector_id": "conn_002",
        "status": "degraded",
        "message": "Slot lookup timeout increased in the last hour."
      },
      {
        "connector_id": "conn_003",
        "status": "disabled",
        "message": "Disabled by tenant admin."
      }
    ]
  },
  "team": {
    "members": [
      {
        "id": "user_001",
        "name": "Raka Pratama",
        "email": "raka@northstar.example",
        "role": "client_admin",
        "status": "active",
        "last_active_at": "2026-04-16T05:10:00Z"
      },
      {
        "id": "user_002",
        "name": "Sinta Maharani",
        "email": "sinta@northstar.example",
        "role": "client_operator",
        "status": "active",
        "last_active_at": "2026-04-16T05:24:00Z"
      },
      {
        "id": "user_003",
        "name": "Dimas Kurniawan",
        "email": "dimas@northstar.example",
        "role": "client_operator",
        "status": "invited",
        "last_active_at": null
      }
    ],
    "invites": [
      {
        "email": "dimas@northstar.example",
        "role": "client_operator",
        "expires_at": "2026-04-20T09:00:00Z"
      }
    ]
  },
  "settings": {
    "recordings": {
      "retention_days": 45,
      "inherits_default": false,
      "updated_at": "2026-04-10T02:00:00Z"
    },
    "locale": {
      "ui_locale": "id-ID",
      "updated_at": "2026-04-03T02:00:00Z"
    }
  },
  "clinicKnowledgeBase": {
    "specialties": [
      {
        "id": "spec_derm",
        "name": "Dermatology"
      },
      {
        "id": "spec_ent",
        "name": "ENT"
      }
    ],
    "cities": [
      {
        "id": "city_jkt",
        "name": "Jakarta"
      },
      {
        "id": "city_bdg",
        "name": "Bandung"
      }
    ],
    "locations": [
      {
        "id": "loc_001",
        "name": "Northstar Clinic Sudirman",
        "city_id": "city_jkt",
        "address": "Jl. Sudirman No. 88, Jakarta",
        "phone": "+62215550100"
      }
    ],
    "doctors": [
      {
        "id": "doc_001",
        "name": "dr. Maya Kurnia, Sp.KK",
        "specialty_id": "spec_derm",
        "location_id": "loc_001",
        "schedule_summary": "Mon-Fri 09:00-15:00"
      }
    ],
    "price_cards": [
      {
        "id": "price_001",
        "service_name": "Dermatology Consultation",
        "currency": "IDR",
        "amount": 350000,
        "location_id": "loc_001"
      }
    ]
  },
  "bookings": {
    "summary": {
      "today_total": 26,
      "pending_confirmation": 5,
      "reschedule_requests": 3
    },
    "items": [
      {
        "booking_id": "book_001",
        "patient_name": "Rina Putri",
        "specialty": "Dermatology",
        "doctor_name": "dr. Maya Kurnia, Sp.KK",
        "scheduled_at": "2026-04-18T09:30:00Z",
        "status": "pending_confirmation",
        "channel": "voice"
      },
      {
        "booking_id": "book_002",
        "patient_name": "Adi Nugroho",
        "specialty": "ENT",
        "doctor_name": "dr. Anwar Hadi, Sp.THT",
        "scheduled_at": "2026-04-18T13:00:00Z",
        "status": "confirmed",
        "channel": "web"
      }
    ],
    "detail": {
      "booking_id": "book_001",
      "patient_name": "Rina Putri",
      "contact_phone": "+6281230001009",
      "status": "pending_confirmation",
      "history": [
        {
          "label": "Booking requested",
          "occurred_at": "2026-04-16T02:41:55Z"
        },
        {
          "label": "Slot proposed",
          "occurred_at": "2026-04-16T02:44:00Z"
        },
        {
          "label": "Needs human follow-up",
          "occurred_at": "2026-04-16T02:51:00Z"
        }
      ]
    }
  },
  "driverVerification": {
    "summary": {
      "drivers_total": 143,
      "pending_review": 7,
      "flagged": 3
    },
    "drivers": [
      {
        "driver_id": "drv_001",
        "driver_name": "Budi Santoso",
        "fleet_code": "FLEET-A12",
        "verification_status": "verified",
        "last_verification_at": "2026-04-16T03:17:04Z",
        "risk_level": "low"
      },
      {
        "driver_id": "drv_002",
        "driver_name": "Eko Purnomo",
        "fleet_code": "FLEET-A19",
        "verification_status": "discrepancy_detected",
        "last_verification_at": "2026-04-16T01:12:11Z",
        "risk_level": "high"
      }
    ],
    "history": [
      {
        "driver_id": "drv_002",
        "call_id": "call_hist_001",
        "result": "voice mismatch confidence low",
        "occurred_at": "2026-04-16T01:12:11Z"
      }
    ]
  },
  "observability": {
    "runs": {
      "runs": [
        {
          "kind": "call_session",
          "subject_id": "call_01JCALL0004",
          "title": "Booking call for Rina Putri",
          "subtitle": "Clinic Booking Assistant",
          "status": "degraded",
          "started_at": "2026-04-16T05:20:02Z",
          "ended_at": null,
          "duration_ms": 221000,
          "call_id": "call_01JCALL0004",
          "workflow_id": "wf_booking_0112",
          "run_id": "run_obs_001",
          "channel_session_id": null,
          "conversation_id": "conv_001",
          "correlation_id": "corr_001",
          "composition_version": "cmp_2026_04_15.3",
          "artifact_hash": "hash_artifact_001",
          "tenant_id": "ten_01JTNORTHSTAR0001",
          "tenant_name": "Northstar Mobility",
          "solution_name": "appointment_booking",
          "assistant_name": "Clinic Booking Assistant",
          "trace_available": true,
          "recording_available": false,
          "warning_count": 2,
          "error_count": 1
        },
        {
          "kind": "workflow_run",
          "subject_id": "wf_booking_0009",
          "title": "Booking confirmation workflow",
          "subtitle": "appointment_booking.confirmation",
          "status": "failed",
          "started_at": "2026-04-16T04:42:00Z",
          "ended_at": "2026-04-16T04:48:00Z",
          "duration_ms": 360000,
          "call_id": null,
          "workflow_id": "wf_booking_0009",
          "run_id": "run_01JWF0009",
          "channel_session_id": null,
          "conversation_id": null,
          "correlation_id": "corr_002",
          "composition_version": "cmp_2026_04_15.3",
          "artifact_hash": "hash_artifact_001",
          "tenant_id": "ten_01JTNORTHSTAR0001",
          "tenant_name": "Northstar Mobility",
          "solution_name": "appointment_booking",
          "assistant_name": null,
          "trace_available": true,
          "recording_available": false,
          "warning_count": 1,
          "error_count": 2
        }
      ]
    },
    "facets": {
      "kinds": [
        {
          "value": "call_session",
          "label": "Call session",
          "count": 42
        },
        {
          "value": "workflow_run",
          "label": "Workflow run",
          "count": 18
        }
      ],
      "statuses": [
        {
          "value": "healthy",
          "label": "Healthy",
          "count": 37
        },
        {
          "value": "degraded",
          "label": "Degraded",
          "count": 16
        },
        {
          "value": "failed",
          "label": "Failed",
          "count": 7
        }
      ],
      "tenants": [
        {
          "value": "ten_01JTNORTHSTAR0001",
          "label": "Northstar Mobility",
          "count": 60
        }
      ],
      "solutions": [
        {
          "value": "appointment_booking",
          "label": "Appointment Booking",
          "count": 26
        },
        {
          "value": "driver_verification",
          "label": "Driver Verification",
          "count": 34
        }
      ],
      "assistants": [
        {
          "value": "Clinic Booking Assistant",
          "label": "Clinic Booking Assistant",
          "count": 21
        },
        {
          "value": "Northstar Driver Verifier",
          "label": "Northstar Driver Verifier",
          "count": 31
        }
      ]
    },
    "compare": {
      "left": "run_obs_001",
      "right": "run_01JWF0009",
      "metric_deltas": [
        {
          "key": "duration",
          "label": "Duration",
          "left_value": "221s",
          "right_value": "360s",
          "delta_value": "-139s"
        },
        {
          "key": "errors",
          "label": "Errors",
          "left_value": "1",
          "right_value": "2",
          "delta_value": "-1"
        }
      ]
    },
    "callSessionDetail": {
      "summary": {
        "kind": "call_session",
        "subject_id": "call_01JCALL0004",
        "title": "Booking call for Rina Putri",
        "subtitle": "Clinic Booking Assistant",
        "status": "degraded"
      },
      "availability": {
        "recording_unavailable": true,
        "timeline_partial": false,
        "logs_unavailable": false,
        "trace_unavailable": false
      },
      "metrics": [
        {
          "key": "duration",
          "label": "Duration",
          "value": "221s",
          "value_ms": 221000
        },
        {
          "key": "turn_latency_p95",
          "label": "P95 turn latency",
          "value": "3.19s",
          "value_ms": 3190
        }
      ],
      "summary_insights": [
        {
          "key": "latency_spike",
          "label": "Latency spike",
          "detail": "Schedule lookup produced elevated latency on recent turns.",
          "severity": "warning"
        }
      ],
      "recommended_actions": [
        {
          "key": "open_connector",
          "label": "Inspect scheduling connector",
          "detail": "Connector latency is the main outlier.",
          "href": "/integrations",
          "cta_label": "Open integrations",
          "severity": "warning"
        }
      ],
      "integrity_gaps": [
        {
          "key": "recording_missing",
          "label": "Recording unavailable",
          "detail": "Call recording has not been persisted yet.",
          "severity": "info"
        }
      ],
      "recordings": [],
      "context_fields": [
        {
          "key": "tenant",
          "label": "Tenant",
          "value": "Northstar Mobility"
        },
        {
          "key": "assistant",
          "label": "Assistant",
          "value": "Clinic Booking Assistant"
        }
      ],
      "trace_context": {
        "route": "appointment_booking.lookup_slots",
        "tool_calls": 3
      },
      "transcript_text": "Pasien meminta slot Jumat sore dan sistem beberapa kali mencoba lookup jadwal sebelum dialihkan ke operator.",
      "related_entities": [
        {
          "label": "Workflow run wf_booking_0112",
          "href": "/observability/workflow-runs/appointment_booking/wf_booking_0112"
        }
      ],
      "solution_enrichers": []
    },
    "callSessionTimeline": {
      "items": [
        {
          "id": "tl_001",
          "kind": "system",
          "severity": "info",
          "occurred_at": "2026-04-16T05:20:02Z",
          "occurred_at_ms": 0,
          "label": "Call connected",
          "detail": "Inbound booking call connected successfully.",
          "actor": "telephony",
          "duration_ms": null,
          "correlation_id": "corr_001",
          "payload": {}
        },
        {
          "id": "tl_002",
          "kind": "tool",
          "severity": "warning",
          "occurred_at": "2026-04-16T05:22:01Z",
          "occurred_at_ms": 119000,
          "label": "Schedule lookup retry",
          "detail": "Second lookup attempt exceeded expected latency.",
          "actor": "schedule_connector",
          "duration_ms": 1120,
          "correlation_id": "corr_001",
          "payload": {
            "retry": 2
          }
        }
      ],
      "next_cursor": null,
      "returned": 2,
      "total_items": 2
    },
    "workflowRunDetail": {
      "summary": {
        "kind": "workflow_run",
        "subject_id": "wf_booking_0009",
        "title": "Booking confirmation workflow",
        "subtitle": "appointment_booking.confirmation",
        "status": "failed"
      },
      "availability": {
        "recording_unavailable": true,
        "timeline_partial": false,
        "logs_unavailable": false,
        "trace_unavailable": false
      },
      "metrics": [
        {
          "key": "attempts",
          "label": "Attempts",
          "value": "2",
          "value_ms": null
        }
      ],
      "summary_insights": [
        {
          "key": "failed_step",
          "label": "Send confirmation failed",
          "detail": "Notification handoff returned a 504 timeout.",
          "severity": "critical"
        }
      ],
      "recommended_actions": [
        {
          "key": "retry_workflow",
          "label": "Retry workflow",
          "detail": "Transient failure likely recoverable.",
          "href": "/automations",
          "cta_label": "Open automations",
          "severity": "warning"
        }
      ],
      "integrity_gaps": [],
      "recordings": [],
      "context_fields": [
        {
          "key": "workflow_type",
          "label": "Workflow type",
          "value": "appointment_booking.confirmation"
        }
      ],
      "trace_context": {},
      "transcript_text": null,
      "related_entities": [
        {
          "label": "Booking request book_req_001",
          "href": "/bookings"
        }
      ],
      "solution_enrichers": []
    },
    "workflowRunTimeline": {
      "items": [
        {
          "id": "wftl_001",
          "kind": "workflow_step",
          "severity": "info",
          "occurred_at": "2026-04-16T04:42:02Z",
          "occurred_at_ms": 2000,
          "label": "Find slot candidates",
          "detail": "Completed successfully.",
          "actor": "workflow",
          "duration_ms": 1800,
          "correlation_id": "corr_002",
          "payload": {}
        },
        {
          "id": "wftl_002",
          "kind": "workflow_step",
          "severity": "critical",
          "occurred_at": "2026-04-16T04:42:05Z",
          "occurred_at_ms": 5000,
          "label": "Send confirmation",
          "detail": "HTTP 504 from notification provider.",
          "actor": "workflow",
          "duration_ms": 700,
          "correlation_id": "corr_002",
          "payload": {
            "status_code": 504
          }
        }
      ],
      "next_cursor": null,
      "returned": 2,
      "total_items": 2
    },
    "channelSessionDetail": {
      "summary": {
        "kind": "interactive_channel_session",
        "subject_id": "chs_001",
        "title": "Lead capture web chat",
        "subtitle": "Landing page widget session",
        "status": "healthy"
      },
      "availability": {
        "recording_unavailable": true,
        "timeline_partial": false,
        "logs_unavailable": false,
        "trace_unavailable": false
      },
      "metrics": [
        {
          "key": "messages",
          "label": "Messages",
          "value": "14",
          "value_ms": null
        }
      ],
      "summary_insights": [],
      "recommended_actions": [],
      "integrity_gaps": [],
      "recordings": [],
      "context_fields": [
        {
          "key": "channel",
          "label": "Channel",
          "value": "web"
        }
      ],
      "trace_context": {},
      "transcript_text": "Prospect requested demo pricing and left a callback number.",
      "related_entities": [
        {
          "label": "Connector Salesforce CRM",
          "href": "/integrations"
        }
      ],
      "solution_enrichers": []
    },
    "channelSessionTimeline": {
      "items": [
        {
          "id": "chtl_001",
          "kind": "transcript",
          "severity": "info",
          "occurred_at": "2026-04-16T01:00:00Z",
          "occurred_at_ms": 0,
          "label": "Visitor started chat",
          "detail": "Visitor asked for demo pricing.",
          "actor": "web_visitor",
          "duration_ms": null,
          "correlation_id": "corr_003",
          "payload": {}
        }
      ],
      "next_cursor": null,
      "returned": 1,
      "total_items": 1
    },
    "channelRuntimeDetail": {
      "summary": {
        "widget_id": "widget_001",
        "tenant_id": "ten_01JTNORTHSTAR0001",
        "tenant_name": "Northstar Mobility",
        "title": "Northstar website lead widget",
        "channel_type": "web_chat",
        "status": "degraded",
        "auth_state": "healthy",
        "webhook_state": "healthy",
        "delivery_state": "delayed",
        "latest_activity_at": "2026-04-16T05:10:00Z",
        "correlation_id": "corr_004",
        "composition_version": "cmp_2026_04_15.3",
        "artifact_hash": "hash_artifact_002",
        "session_count": 189,
        "active_session_count": 7,
        "blocked_session_count": 1,
        "expired_session_count": 13,
        "captured_submission_count": 88,
        "lead_delivered_count": 83,
        "delivery_failure_count": 5,
        "escalation_count": 2,
        "warning_count": 4,
        "error_count": 1,
        "degraded_reasons": [
          "CRM delivery latency elevated"
        ]
      },
      "availability": {
        "recording_unavailable": true,
        "timeline_partial": false,
        "logs_unavailable": false,
        "trace_unavailable": false
      },
      "metrics": [
        {
          "key": "delivery_success",
          "label": "Delivery success",
          "value": "94.3%",
          "value_ms": null
        }
      ],
      "summary_insights": [
        {
          "key": "crm_delay",
          "label": "CRM delivery delayed",
          "detail": "Lead delivery success remains high but confirmation latency is climbing.",
          "severity": "warning"
        }
      ],
      "context_fields": [
        {
          "key": "widget",
          "label": "Widget",
          "value": "Northstar website lead widget"
        }
      ],
      "related_entities": [
        {
          "label": "Salesforce CRM connector",
          "href": "/integrations"
        }
      ]
    },
    "channelRuntimeTimeline": {
      "items": [
        {
          "id": "crtl_001",
          "kind": "metric",
          "severity": "warning",
          "occurred_at": "2026-04-16T05:00:00Z",
          "occurred_at_ms": null,
          "label": "Delivery latency crossed threshold",
          "detail": "Five minute rolling average exceeded 2.5s.",
          "actor": "runtime_monitor",
          "duration_ms": null,
          "correlation_id": "corr_004",
          "payload": {}
        }
      ],
      "next_cursor": null,
      "returned": 1,
      "total_items": 1
    },
    "controlPlaneIncidentDetail": {
      "summary": {
        "kind": "control_plane_incident",
        "subject_id": "inc_001",
        "title": "Telephony provider sync degraded",
        "subtitle": "Provider account TELNYX-PROD-01",
        "status": "open"
      },
      "availability": {
        "recording_unavailable": true,
        "timeline_partial": false,
        "logs_unavailable": false,
        "trace_unavailable": false
      },
      "metrics": [
        {
          "key": "affected_tenants",
          "label": "Affected tenants",
          "value": "3",
          "value_ms": null
        }
      ],
      "summary_insights": [
        {
          "key": "provider_sync",
          "label": "Sync failing intermittently",
          "detail": "Trunk sync failed twice in the last hour.",
          "severity": "critical"
        }
      ],
      "recommended_actions": [
        {
          "key": "open_telephony",
          "label": "Inspect telephony admin",
          "detail": "Provider account requires validation.",
          "href": "/admin/telephony",
          "cta_label": "Open telephony",
          "severity": "critical"
        }
      ],
      "integrity_gaps": [],
      "recordings": [],
      "context_fields": [
        {
          "key": "provider_account",
          "label": "Provider account",
          "value": "TELNYX-PROD-01"
        }
      ],
      "trace_context": {},
      "transcript_text": null,
      "related_entities": [
        {
          "label": "Telephony provider account",
          "href": "/admin/telephony"
        }
      ],
      "solution_enrichers": []
    },
    "controlPlaneIncidentTimeline": {
      "items": [
        {
          "id": "inctl_001",
          "kind": "system",
          "severity": "critical",
          "occurred_at": "2026-04-16T04:30:00Z",
          "occurred_at_ms": null,
          "label": "Sync job failed",
          "detail": "Provider API timeout during trunk reconciliation.",
          "actor": "telephony_control_plane",
          "duration_ms": 30000,
          "correlation_id": "corr_005",
          "payload": {}
        }
      ],
      "next_cursor": null,
      "returned": 1,
      "total_items": 1
    },
    "compositionDetail": {
      "summary": {
        "kind": "tenant_composition",
        "subject_id": "cmp_2026_04_15.3",
        "title": "Northstar Mobility composition",
        "subtitle": "Release rel_2026_04_14_prod_03",
        "status": "healthy"
      },
      "availability": {
        "recording_unavailable": true,
        "timeline_partial": false,
        "logs_unavailable": false,
        "trace_unavailable": false
      },
      "metrics": [
        {
          "key": "solutions_enabled",
          "label": "Solutions enabled",
          "value": "3",
          "value_ms": null
        }
      ],
      "summary_insights": [],
      "recommended_actions": [],
      "integrity_gaps": [],
      "recordings": [],
      "context_fields": [
        {
          "key": "release",
          "label": "Release",
          "value": "rel_2026_04_14_prod_03"
        }
      ],
      "trace_context": {
        "artifact_hash": "hash_artifact_001"
      },
      "transcript_text": null,
      "related_entities": [
        {
          "label": "Tenant Northstar Mobility",
          "href": "/admin/tenants"
        }
      ],
      "solution_enrichers": []
    },
    "compositionTimeline": {
      "items": [
        {
          "id": "cmptl_001",
          "kind": "system",
          "severity": "info",
          "occurred_at": "2026-04-15T16:00:00Z",
          "occurred_at_ms": null,
          "label": "Release assigned",
          "detail": "Tenant assigned to release rel_2026_04_14_prod_03.",
          "actor": "deployment_admin",
          "duration_ms": null,
          "correlation_id": "corr_006",
          "payload": {}
        }
      ],
      "next_cursor": null,
      "returned": 1,
      "total_items": 1
    }
  },
  "admin": {
    "overview": {
      "healthSummary": {
        "overall_status": "degraded",
        "degraded_services": 2,
        "healthy_services": 6
      },
      "metrics": [
        {
          "label": "Active tenants",
          "value": 18
        },
        {
          "label": "Suspended tenants",
          "value": 2
        },
        {
          "label": "Open incidents",
          "value": 1
        },
        {
          "label": "Release rollout",
          "value": "7/18"
        }
      ],
      "activeTenants": [
        {
          "tenant_id": "ten_01JTNORTHSTAR0001",
          "tenant_name": "Northstar Mobility",
          "status": "active",
          "environment": "production",
          "release": "rel_2026_04_14_prod_03"
        },
        {
          "tenant_id": "ten_01JTCLINIC000002",
          "tenant_name": "Satelit Clinic Group",
          "status": "active",
          "environment": "demo",
          "release": "rel_2026_04_11_demo_02"
        }
      ]
    },
    "tenants": {
      "items": [
        {
          "tenant_id": "ten_01JTNORTHSTAR0001",
          "tenant_name": "Northstar Mobility",
          "slug": "northstar-mobility",
          "status": "active",
          "environment": "production",
          "locale": "id-ID",
          "release": "rel_2026_04_14_prod_03",
          "solution_count": 3
        },
        {
          "tenant_id": "ten_01JTTERRA000003",
          "tenant_name": "Terra Logistics",
          "slug": "terra-logistics",
          "status": "suspended",
          "environment": "test",
          "locale": "en-US",
          "release": "rel_2026_04_10_test_01",
          "solution_count": 2
        }
      ],
      "pendingInvites": [
        {
          "email": "new-admin@northstar.example",
          "tenant_id": "ten_01JTNORTHSTAR0001",
          "role": "client_admin",
          "expires_at": "2026-04-19T10:00:00Z"
        }
      ]
    },
    "users": {
      "items": [
        {
          "user_id": "adm_001",
          "name": "Ayu Wibowo",
          "email": "ayu@provider.example",
          "role": "super_admin",
          "status": "active",
          "tenant_scope_count": 18
        },
        {
          "user_id": "adm_002",
          "name": "Bagas Saputra",
          "email": "bagas@provider.example",
          "role": "support_admin",
          "status": "active",
          "tenant_scope_count": 7
        }
      ]
    },
    "solutions": {
      "tenants": [
        {
          "tenant_id": "ten_01JTNORTHSTAR0001",
          "tenant_name": "Northstar Mobility",
          "solutions": [
            {
              "solution_key": "driver_verification",
              "enabled": true
            },
            {
              "solution_key": "appointment_booking",
              "enabled": true
            },
            {
              "solution_key": "lead_capture",
              "enabled": true
            }
          ]
        },
        {
          "tenant_id": "ten_01JTCLINIC000002",
          "tenant_name": "Satelit Clinic Group",
          "solutions": [
            {
              "solution_key": "appointment_booking",
              "enabled": true
            },
            {
              "solution_key": "lead_capture",
              "enabled": false
            }
          ]
        }
      ]
    },
    "agentDefinitions": {
      "list": [
        {
          "id": "agent_001",
          "tenant_id": "ten_01JTNORTHSTAR0001",
          "name": "Northstar Driver Verifier",
          "status": "published",
          "published_version": 8,
          "created_at": "2026-02-01T08:00:00Z",
          "updated_at": "2026-04-16T05:21:00Z"
        },
        {
          "id": "agent_002",
          "tenant_id": "ten_01JTNORTHSTAR0001",
          "name": "Clinic Booking Assistant",
          "status": "draft",
          "published_version": 3,
          "created_at": "2026-02-18T08:00:00Z",
          "updated_at": "2026-04-15T11:05:00Z"
        }
      ],
      "detail": {
        "id": "agent_002",
        "tenant_id": "ten_01JTNORTHSTAR0001",
        "name": "Clinic Booking Assistant",
        "status": "draft",
        "published_version": 3
      },
      "versions": [
        {
          "id": "agent_002_v4",
          "agent_definition_id": "agent_002",
          "tenant_id": "ten_01JTNORTHSTAR0001",
          "version": 4,
          "status": "in_review",
          "source_yaml": "name: Clinic Booking Assistant\nlanguage: id-ID\nprompts:\n  system: |\n    Help patients find and confirm clinic slots.\n",
          "source_yaml_hash": "yamlhash_v4",
          "compiled_hash": "compiledhash_v4",
          "model_policy_snapshot_ref": "policy_default_v3",
          "platform_defaults_version": "defaults_2026_04_10",
          "created_at": "2026-04-15T08:40:00Z",
          "submitted_at": "2026-04-15T09:02:00Z",
          "published_at": null,
          "review_decision": null,
          "review_reason": null,
          "review_submitted_at": "2026-04-15T09:02:00Z",
          "review_decided_at": null
        },
        {
          "id": "agent_002_v3",
          "agent_definition_id": "agent_002",
          "tenant_id": "ten_01JTNORTHSTAR0001",
          "version": 3,
          "status": "published",
          "source_yaml": "name: Clinic Booking Assistant\nlanguage: id-ID\n",
          "source_yaml_hash": "yamlhash_v3",
          "compiled_hash": "compiledhash_v3",
          "model_policy_snapshot_ref": "policy_default_v2",
          "platform_defaults_version": "defaults_2026_03_18",
          "created_at": "2026-03-19T08:40:00Z",
          "submitted_at": "2026-03-19T09:02:00Z",
          "published_at": "2026-03-20T03:10:00Z",
          "review_decision": "approved",
          "review_reason": "Ready for publish.",
          "review_submitted_at": "2026-03-19T09:02:00Z",
          "review_decided_at": "2026-03-19T11:12:00Z"
        }
      ],
      "artifact": {
        "agent_definition_id": "agent_002",
        "tenant_id": "ten_01JTNORTHSTAR0001",
        "name": "Clinic Booking Assistant",
        "version": 4,
        "compiled_config": {
          "language": "id-ID",
          "tools": [
            "lookup_slots",
            "create_booking",
            "handoff_to_operator"
          ],
          "guardrails": [
            "booking_time_window",
            "contact_confirmation"
          ]
        },
        "compiled_hash": "compiledhash_v4"
      },
      "testWorkbench": {
        "browser_session": {
          "room_name": "test-room-clinic-booking",
          "participant_name": "admin-reviewer",
          "token_ready": true
        },
        "test_calls": [
          {
            "call_id": "test_call_001",
            "status": "passed",
            "started_at": "2026-04-15T10:12:00Z",
            "summary": "Successfully handled booking confirmation flow."
          },
          {
            "call_id": "test_call_002",
            "status": "failed",
            "started_at": "2026-04-15T10:34:00Z",
            "summary": "Escalated after repeated slot lookup retries."
          }
        ]
      }
    },
    "telephony": {
      "providerOptions": [
        {
          "provider_kind": "telnyx",
          "display_name": "Telnyx",
          "capability_matrix": [
            {
              "capability": "telephony.connect_provider_account",
              "enabled": true,
              "notes": null
            },
            {
              "capability": "telephony.buy_numbers",
              "enabled": true,
              "notes": null
            }
          ],
          "operations": [
            {
              "operation": "validate_account",
              "mode": "managed",
              "implemented": true,
              "notes": null
            },
            {
              "operation": "sync_trunks",
              "mode": "managed",
              "implemented": true,
              "notes": null
            }
          ]
        }
      ],
      "providerAccounts": [
        {
          "id": "tpacc_001",
          "owner_scope": "deployment",
          "owner_tenant_id": null,
          "provider_kind": "telnyx",
          "display_name": "TELNYX-PROD-01",
          "status": "degraded",
          "capability_snapshot": [
            "telephony.connect_provider_account",
            "telephony.sync_trunks",
            "telephony.sync_numbers",
            "telephony.buy_numbers"
          ],
          "provider_metadata": {
            "region": "us-west"
          },
          "control_plane": {
            "last_tested_at": "2026-04-16T04:35:00Z",
            "last_test_outcome": "failure",
            "last_test_message": "Provider API timeout during validation.",
            "last_test_probe": "provider.connectivity"
          },
          "credential_configured": true,
          "created_at": "2026-01-03T08:00:00Z",
          "updated_at": "2026-04-16T04:35:00Z"
        }
      ],
      "trunks": [
        {
          "id": "trunk_001",
          "provider_account_id": "tpacc_001",
          "display_name": "Northstar Inbound Trunk",
          "direction": "inbound",
          "transport_kind": "sip",
          "provider_resource_id": "telnyx-trunk-001",
          "livekit_binding_id": "lkbind_001",
          "status": "active",
          "config": {
            "region": "us-west"
          },
          "control_plane": {
            "last_synced_at": "2026-04-16T04:31:00Z",
            "last_sync_message": "Inventory synchronized.",
            "last_reconciled_at": "2026-04-16T04:31:10Z",
            "last_reconcile_message": "No drift detected.",
            "last_reconcile_issue_codes": []
          },
          "created_at": "2026-01-03T08:20:00Z",
          "updated_at": "2026-04-16T04:31:10Z"
        }
      ],
      "numbers": [
        {
          "id": "num_001",
          "provider_account_id": "tpacc_001",
          "trunk_id": "trunk_001",
          "e164_number": "+12065550101",
          "provider_number_id": "pn_telnyx_001",
          "status": "assigned",
          "source": "purchased",
          "capability_snapshot": [
            "telephony.buy_numbers",
            "telephony.assign_published_assistant"
          ],
          "number_metadata": {
            "locality": "Seattle"
          },
          "control_plane": {
            "last_synced_at": "2026-04-16T04:31:00Z",
            "last_sync_message": "Number inventory synchronized.",
            "last_seen_in_provider_inventory_at": "2026-04-16T04:31:00Z",
            "last_acquired_at": "2026-01-03T08:15:00Z",
            "last_acquisition_message": "Purchased successfully.",
            "last_provider_order_id": "order_001"
          },
          "binding_summary": {
            "id": "bind_001",
            "tenant_id": "ten_01JTNORTHSTAR0001",
            "tenant_name": "Northstar Mobility",
            "tenant_slug": "northstar-mobility",
            "sip_trunk_id": "trunk_001",
            "active": true,
            "agent_definition_id": "agent_001",
            "agent_name": "Northstar Driver Verifier",
            "agent_status": "published",
            "published_version": 8,
            "routing_ready": true,
            "created_at": "2026-01-04T09:00:00Z"
          },
          "created_at": "2026-01-03T08:15:00Z",
          "updated_at": "2026-04-16T04:31:00Z"
        }
      ],
      "tenantPolicies": [
        {
          "tenant_id": "ten_01JTNORTHSTAR0001",
          "mode": "default_with_byo_override",
          "allows_deployment_default": true,
          "allows_tenant_byo": true,
          "usable_provider_account_source": "deployment_default",
          "deployment_provider_account_count": 1,
          "tenant_provider_account_count": 0,
          "updated_at": "2026-03-01T04:00:00Z"
        }
      ]
    },
    "audit": {
      "events": [
        {
          "id": "sec_evt_001",
          "event_type": "admin.login.success",
          "severity": "info",
          "actor_name": "Ayu Wibowo",
          "tenant_name": null,
          "created_at": "2026-04-16T05:00:00Z",
          "summary": "Successful deployment admin login."
        },
        {
          "id": "sec_evt_002",
          "event_type": "tenant.suspended",
          "severity": "warning",
          "actor_name": "Bagas Saputra",
          "tenant_name": "Terra Logistics",
          "created_at": "2026-04-16T03:50:00Z",
          "summary": "Tenant suspended pending billing review."
        }
      ]
    }
  }
}
```
