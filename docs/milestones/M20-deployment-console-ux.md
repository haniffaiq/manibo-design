# M20: Deployment Console UX

Status: done
Created: 2026-03-20
Owner: Jakit
Branch: feat/M20-deployment-console-ux
Stream: ui
Depends on: none
Reference: wiki/design-docs/deployment-console-ux-spec.md
Prior art: docs/milestones/exec-plans/v2_ui_ux_control_system_execution_plan.md

## Goal

Finish the deployment console UX so non-technical operators can complete tenant onboarding, assistant governance, release rollout, and incident triage without interpreting backend semantics. Adopt targeted shadcn/ui primitives (Tabs, Tooltip, Select, Skeleton) to fill component gaps. Align every admin page with the V2 page-archetype model (directory / workflow / workspace / record) and ship with Playwright regression proof.

## Design Decisions

1. **Sidebar reorganization into 4 job-groups** — "Tenants & Access", "Assistants & Rollouts", "Operations", "Platform". Groups read as operator jobs, not feature lists.

2. **Adopt 4 shadcn/ui primitives in packages/ui** — Tabs (observability navigation), Tooltip (blocked-action explanation), Select (styled dropdowns replacing native `<select>`), Skeleton (loading states). All use existing Radix UI patterns and brand tokens.

3. **ActionBuilderCard for create flows, Modal for destructive confirmations** — no change to the existing split. Inline builders stay for onboarding, OIDC, release creation, assistant creation. Modals stay for offboard, delete, apply-release confirmations.

4. **Disabled buttons use solid colors, never opacity** — `bg-neutral-100 text-neutral-400 border-neutral-200`. Already partially enforced, now universal.

5. **Dashboard strips explanation cards** — replaces the "Provider Workbench" card with a conditional attention block that only renders when something needs action (degraded worker, zero tenants, high error rate).

6. **Observability gets `full` width and Tabs for subject types** — replaces dropdown/filter patterns with horizontal tab pills for the 6 supported subject kinds (Sessions, Channel Sessions, Workflows, Incidents, Runtimes, Composition). `interactive_channel_session` is already supported with admin routes and E2E coverage.

7. **Assistant lifecycle labels translated to business language** — definition-level: draft → "Draft", published → "Live", retired → "Retired". Version-level only: in_review → "Under review". The list API (`AdminAgentDefinitionStatus`) only has `draft | published | retired`; review state exists on individual versions, not definition summaries.

## Wireframes

### Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│  H1: Deployment Console                       [Refresh]     │
│  Last refreshed 2 min ago                                    │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│  Tenants     │  Active      │  Workers     │  Escalation     │
│  4 active    │  2 calls     │  ●● healthy  │  1.2%           │
├──────────────┴──────────────┴──────────────┴─────────────────┤
│  ⚠ Attention: Temporal worker degraded since 14:02    [→]   │  ← conditional
├──────────────────────────────────────────────────────────────┤
│  [Tenants ›]      [Assistants ›]      [Releases ›]          │
│   4 active                                                  │
│  [Users ›]         [Health ›]          [Settings ›]         │
│                     All healthy         2 providers         │
└──────────────────────────────────────────────────────────────┘
```

### Sidebar Navigation

```
┌─────────────────────────────┐
│  [D] Deployment Console     │
├─────────────────────────────┤
│  Dashboard                  │
├─────────────────────────────┤
│  TENANTS & ACCESS           │
│    Tenants                  │
│    Solutions                │
│    Users                    │
├─────────────────────────────┤
│  ASSISTANTS & ROLLOUTS      │
│    Assistants               │
│    Releases                 │
│    Phone Routing            │
├─────────────────────────────┤
│  OPERATIONS                 │
│    Observability            │
│    Health                   │
├─────────────────────────────┤
│  PLATFORM                   │
│    Security                 │
│    Settings                 │
└─────────────────────────────┘
```

### Tenants Page (directory archetype)

```
┌──────────────────────────────────────────────────────────────┐
│  H1: Tenants                          [Start onboarding]    │
│  Manage tenant access, language, and retirement.             │
├──────────────────────────────────────────────────────────────┤
│  ┌─ ActionBuilderCard (onboard form, shown when open) ────┐ │
│  │  Tenant name: [___________]                             │ │
│  │  Tenant slug: [___________]  (auto-filled)              │ │
│  │  Admin email: [___________]                             │ │
│  │  [▸ Advanced setup]             [Cancel] [Create]       │ │
│  └─────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────┤
│  [Search: ________]   □ Show demo/test/E2E tenants          │
├────────┬──────┬────────┬──────┬─────────┬───────────────────┤
│ Tenant │ Env  │ Status │ Lang │ Updated │ Actions           │
├────────┼──────┼────────┼──────┼─────────┼───────────────────┤
│ North  │ Prod │ Active │ EN ▾ │ 3/19    │ [Suspend ]        │
│ Clinic │      │   ●    │      │ 2:14pm  │ [Export  ]        │
│ north_ │      │        │      │         │ [Offboard]  red   │
├────────┼──────┼────────┼──────┼─────────┼───────────────────┤
│ Demo   │ Demo │ Active │ LT ▾ │ 3/18    │ [Suspend ]        │
│ Tenant │  ○   │   ●    │      │ 9:30am  │ [Export  ]        │
│ demo_  │      │        │      │         │ [Offboard]  red   │
└────────┴──────┴────────┴──────┴─────────┴───────────────────┘
```

### Assistants Page (directory → record)

```
LIST VIEW:
┌──────────────────────────────────────────────────────────────┐
│  H1: Assistant setup                  [Create assistant]     │
│  Create, review, and publish voice assistants.               │
├──────────────────────────────────────────────────────────────┤
│  Tenant: [▾ North Clinic (north_clinic)]                     │
│  2 published · 1 draft · 0 retired · Updated 3/19           │
├──────────────────────────────────────────────────────────────┤
│  ┌─ Create panel (ActionBuilderCard) ─────────────────────┐ │
│  │  Pick a template:                                       │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │ │
│  │  │ ● Clinic    │  │   Driver    │  │   Blank     │    │ │
│  │  │ Registrator │  │   Verifier  │  │   Agent     │    │ │
│  │  │ Inbound...  │  │ Outbound... │  │ Start from  │    │ │
│  │  └─────────────┘  └─────────────┘  │ scratch     │    │ │
│  │                                     └─────────────┘    │ │
│  │  Assistant name: [clinic_registrator]                   │ │
│  │  Saved as: clinic_registrator                           │ │
│  │                         [Cancel] [Create assistant]     │ │
│  └─────────────────────────────────────────────────────────┘ │
├──────────┬──────────┬──────┬──────────┬─────────────────────┤
│ Asst.    │ Status   │ Live │ Updated  │ Actions             │
├──────────┼──────────┼──────┼──────────┼─────────────────────┤
│ clinic_  │ ● Live   │ v3   │ 3/19     │ [Edit]              │
│ registr. │          │      │          │                     │
├──────────┼──────────┼──────┼──────────┼─────────────────────┤
│ intake_  │ ○ Draft  │ --   │ 3/18     │ [Edit]              │
│ agent    │          │      │          │                     │
└──────────┴──────────┴──────┴──────────┴─────────────────────┘
```

### Observability Page (workspace, full width)

```
┌──────────────────────────────────────────────────────────────────────┐
│  H1: Observability                                     [Refresh]    │
│  Cross-tenant case queue.                                            │
├──────────────────────────────────────────────────────────────────────┤
│  [All] [Sessions] [Channel] [Workflows] [Incidents] [Runtimes] [Comp.]│
│  ┌─ Applied filters: Tenant: All · Last 24h         [▸ Filters] ─┐ │
├──────────────────────────────────────────────────────────────────────┤
│  CASE QUEUE                           │  CASE DETAIL (right rail)   │
│  ┌──────────────────────────────────┐ │  ┌────────────────────────┐ │
│  │ ● call_abc  Voice session       │ │  │ Case record            │ │
│  │   North Clinic · 2m ago         │ │  │ ID: call_abc           │ │
│  │   Duration: 4:32  Escalated     │ │  │ Status: escalated      │ │
│  ├──────────────────────────────────┤ │  │ Tenant: North Clinic   │ │
│  │ ○ wf_xyz   Workflow run         │ │  ├────────────────────────┤ │
│  │   Demo · 15m ago                │ │  │ What to do next        │ │
│  │   post_call_analysis  Running   │ │  │ ┃ Review escalation    │ │
│  ├──────────────────────────────────┤ │  │ ┃ Open call ops →      │ │
│  │ ○ inc_001  Control plane        │ │  ├────────────────────────┤ │
│  │   All tenants · 1h ago          │ │  │ Evidence rail          │ │
│  │   Worker degraded               │ │  │ ▪ 14:02 Call started   │ │
│  └──────────────────────────────────┘ │  │ ▪ 14:03 Route: intake │ │
│                                       │  │ ▪ 14:05 Escalated     │ │
│                                       │  │ ▪ 14:06 Call ended    │ │
│                                       │  └────────────────────────┘ │
└───────────────────────────────────────┴─────────────────────────────┘
```

### Releases Page (workflow archetype)

```
┌──────────────────────────────────────────────────────────────┐
│  H1: Tenant rollouts                [Create rollout package] │
│  Build a package, then apply it to a tenant.                 │
├──────────────────────────────────────────────────────────────┤
│  ① Pick tenant  ──→  ② Review package  ──→  ③ Apply         │
├──────────────────────────────────────────────────────────────┤
│  TENANT TARGET                                               │
│  Tenant: [▾ North Clinic]  □ Wait for rollout to finish      │
│  ┌──────────┬───────────┬───────────┬──────────┐            │
│  │ Live pkg │ Requested │ Status    │ Updated  │            │
│  │ march_v2 │ march_v3  │ ● Applied │ 3/19     │            │
│  └──────────┴───────────┴───────────┴──────────┘            │
├────────────────────────────────┬─────────────────────────────┤
│  AVAILABLE PACKAGES            │  PACKAGE DETAIL             │
│  ┌────────────┬───────┬─────┐ │  march_v3                   │
│  │ Package    │ Date  │     │ │  ┌─────────────────────────┐│
│  ├────────────┼───────┼─────┤ │  │ Asst: clinic_reg v3    ││
│  │ march_v3   │ 3/19  │[▸]  │ │  │ Policy: google_v1      ││
│  │ march_v2   │ 3/15  │[▸]  │ │  │ Defaults: baseline_v2  ││
│  │ february   │ 2/28  │[▸]  │ │  └─────────────────────────┘│
│  └────────────┴───────┴─────┘ │  [Apply this package]       │
└────────────────────────────────┴─────────────────────────────┘
```

### Health Page (workspace archetype)

```
┌──────────────────────────────────────────────────────────────┐
│  H1: Health                     [Open observability] [Refr.] │
│  Worker health, call pressure, slowdown hotspots.            │
├──────────────────────────────────────────────────────────────┤
│  ⚠ Slowdown summary unavailable. Open observability for...  │  ← conditional
├──────────┬──────────┬──────────┬─────────────────────────────┤
│ Error    │ Avg Dur. │ Active   │ Escalation                  │
│ 0.3%     │ 2.1s     │ 2 voice  │ 1.2%                       │
├──────────┴──────────┴──────────┴─────────────────────────────┤
│  Worker Status      Platform API: ● healthy                  │
│  Last check: 14:30  Temporal:     ● healthy                  │
├──────────────────────────────────┬───────────────────────────┤
│  SLOWDOWN SUMMARY (3 cards)      │  ROUTE NEEDING ATTENTION  │
│  ┌────────┬────────┬────────┐   │  intake · clinic_reg      │
│  │ AI     │ Speech │ Voice  │   │  p95: 1.4s                │
│  │ 340ms  │ 120ms  │ 95ms   │   │  12 calls · worst: 3.2s  │
│  │ Gemini │ Google │ Google │   │                           │
│  └────────┴────────┴────────┘   │                           │
└──────────────────────────────────┴───────────────────────────┘
```

## Component Adoption Plan (shadcn/ui → packages/ui)

### Phase 1 — Unblocks admin workflows

| Component | Radix Primitive | Use Case | Priority |
|-----------|----------------|----------|----------|
| Tabs | `@radix-ui/react-tabs` | Observability subject navigation, settings sections | Critical |
| Tooltip | `@radix-ui/react-tooltip` | Explain blocked/partial actions, metadata hints | Critical |
| Select | `@radix-ui/react-select` | Replace native `<select>` on tenant pickers | Important |
| Skeleton | CSS only | Loading states for tables and KPI cards | Important |

### Phase 2 — UX polish

| Component | Radix Primitive | Use Case | Priority |
|-----------|----------------|----------|----------|
| Separator | None (semantic HTML) | Visual grouping in forms and dropdowns | Nice |
| Alert | None (semantic HTML) | Attention blocks, degradation warnings | Nice |
| Progress | None (CSS) | Rollout status percentage | Nice |
| DropdownMenu | `@radix-ui/react-dropdown-menu` | Secondary row actions when tables get dense | Later |

### Not adopting

| Component | Why Skip |
|-----------|----------|
| Sheet/Drawer | Modal + ActionBuilderCard already cover the use cases |
| Command | Power-user search is scope creep for M20 |
| Breadcrumb | Current navigation depth doesn't require it yet |
| Accordion | Tabs + disclosure `<details>` already serve this |

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Add Tabs component to packages/ui | done | none |
| T02 | Add Tooltip component to packages/ui | done | none |
| T03 | Add Select component to packages/ui | done | none |
| T04 | Add Skeleton component to packages/ui | done | none |
| T05 | Reorganize sidebar into 4 job-groups | done | none |
| T06 | Redesign dashboard: strip explanation cards, add attention block, add status hints to nav links | done | none |
| T07 | Harden disabled button contrast across all admin pages | done | none |
| T08 | Replace native selects with Select component on tenant pickers | done | T03 |
| T09 | Add Skeleton loading states to all admin directory pages | done | T04 |
| T10 | Translate assistant lifecycle labels to business language | done | none |
| T11 | Add Tabs navigation to observability workspace for subject types | done | T01 |
| T12 | Refine observability layout and right-rail detail (already full-width) | done | T11 |
| T13 | Calm observability density: whitespace, evidence rail hierarchy, "what to do next" accent | done | T12 |
| T14 | Add Tooltip to blocked/partial actions across admin pages | done | T02 |
| T15 | Verify all pages with Playwright regression + text-fit checks | done | T05-T14, T16 |
| T16 | Replace native confirm() with Modal on settings and users pages | done | none |

## Acceptance Criteria

- [x] Sidebar shows 4 groups: "Tenants & Access", "Assistants & Rollouts", "Operations", "Platform"
- [x] Dashboard shows KPI strip + conditional attention block (no "Provider Workbench" card)
- [x] All disabled non-destructive buttons use `bg-neutral-100 text-neutral-400 border-neutral-200`; disabled destructive buttons use `bg-error-50 text-error-300 border-error-200` (muted red tint preserved); no variant uses opacity
- [x] All tenant/release/assistant pickers use `Select` component instead of native `<select>`
- [x] All directory pages show `Skeleton` during initial load instead of text "Loading..."
- [x] Assistant list-view status labels read "Draft", "Live", "Retired" (definition-level only; "Under review" only on version detail)
- [x] Observability uses `Tabs` for subject-type switching (Sessions, Channel Sessions, Workflows, Incidents, Runtimes, Composition)
- [x] Observability uses `full` width with queue/detail two-column layout
- [x] Observability default tab is "All" (mixed-kind queue, same as current behavior)
- [x] No `window.confirm` or `window.alert` calls in admin pages (use Modal component)
- [x] Blocked actions show `Tooltip` explaining why they are disabled
- [x] `pnpm -C apps/web lint` passes
- [x] `pnpm -C apps/web check-types` passes
- [x] All Playwright E2E tests pass: `pnpm -C apps/web exec playwright test --project=chromium`
- [x] `expectTextFits()` guards on dense admin action labels

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
tools/scripts/e2e/run-web-e2e.sh
# Chrome DevTools MCP verification (AGENTS.md rule 7 — required for apps/web UI changes)
# Desktop + mobile screenshots for every changed admin page
# Artifacts saved to tools/agents/artifacts/ui-harness/
```

## Non-Goals

- No backend API changes (this is pure UI)
- No new admin pages (work within existing 11 pages)
- No public chat widget or tenant-facing changes
- No outbound campaign UI
- No billing/pricing backoffice
- No Command palette or power-user search
- No mobile-first redesign (horizontal scroll for tables is acceptable)
