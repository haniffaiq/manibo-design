# M15: Workflow Client UX

Status: not started
Created: 2026-03-20
Owner: Jakit
Branch: feat/M15-workflow-client-ux
Stream: ui
Depends on: M20 (components: Select, Skeleton, Tooltip)
Reference: wiki/design-docs/workflow-client-ux-spec.md
Prior art: docs/requirements/checklist.md section 16, docs/requirements/nfq.md WF1-WF8

## Goal

Align the tenant automations page (`/automations`) with the M20/M21 UX grammar: PageFrame, Select, Skeleton, Tooltip, Modal confirmation for retry, and Chrome DevTools verification. Then extend with workflow template catalog and trigger configuration UI so tenant admins can self-service automation setup without interpreting Temporal internals.

## Design Decisions

1. **Automations page archetype is directory → record** — list/detail split in two columns. Same pattern as M20 releases page and M21 call-history. Width: `standard`.

2. **Status filter uses Select component** — replaces native `<select>` with `@grove/ui/select` per M20 decision.

3. **Skeleton loading replaces "Loading..." text** — all three loading states (executions list, detail, step timeline) use Skeleton placeholders.

4. **Retry action requires Modal confirmation** — creating a new Temporal execution is irreversible. Modal shows workflow name, current status, and "This will start a new run" before confirming.

5. **Disabled retry button gets Tooltip** — when retry is in progress, Tooltip says "Starting a new run...". When status doesn't support retry, the button is hidden (not disabled).

6. **Workflow templates are read-only catalog items** — tenants instantiate from templates, do not author arbitrary workflows. Visual builder is a future milestone.

7. **Trigger editor is a structured form, not a visual graph** — keeps scope manageable.

8. **Execution monitoring queries Temporal directly** — no separate execution log table; uses Temporal visibility API via existing platform endpoints.

## Wireframes

### Automations Page (directory → record, standard width)

```
┌──────────────────────────────────────────────────────────────┐
│  H1: Automations                                 [Refresh]   │
│  Monitor workflow runs and configure triggers.               │
├──────────┬──────────┬────────────────────────────────────────┤
│ Needs    │ In       │ Completed                              │
│ attention│ progress │ recently                               │
│ 2        │ 1        │ 14                                     │
├──────────┴──────────┴────────────────────────────────────────┤
│                                                               │
│  RECENT RUNS                      │  RUN DETAIL               │
│  Status: [▾ All runs]  ← Select   │  Booking: Post Call       │
│  ┌──────────────────────────────┐ │  ● Needs attention        │
│  │ ● Booking: Post Call Analysis│ │                           │
│  │   Started 10:42 · Failed     │ │  Current: extract_data   │
│  ├──────────────────────────────┤ │  Problem: send_to_crm    │
│  │ ○ Driver: Verify Location    │ │  Steps: 2 of 4           │
│  │   Started 10:38 · Completed  │ │  Retries: 1              │
│  ├──────────────────────────────┤ │                           │
│  │ ○ Booking: Confirm SMS       │ │  ⚠ CRM connector timed   │
│  │   Started 10:35 · Completed  │ │    out after 30s          │
│  └──────────────────────────────┘ │                           │
│                                   │  [Open in observability]  │
│                                   │  [Try again] ← Modal      │
│                                   │                           │
│                                   │  STEP TIMELINE            │
│                                   │  1. Extract data ✓ 0.8s  │
│                                   │  2. Send to CRM ✗ 30.0s  │
│                                   │  3. Send SMS (queued)     │
│                                   │  4. Schedule reminder     │
│                                   │                           │
│                                   │  ▸ Support reference      │
│                                   ├───────────────────────────┤
└───────────────────────────────────┘                           │
```

### Retry Confirmation Modal

```
┌─────────────────────────────────────────┐
│  Try again: Post Call Analysis          │
│                                         │
│  This will start a new run of           │
│  Booking: Post Call Analysis.           │
│  The failed run will stay in history.   │
│                                         │
│               [Cancel]  [Start new run] │
└─────────────────────────────────────────┘
```

### Workflow Template Catalog (future section, below execution list)

```
┌──────────────────────────────────────────────────────────────┐
│  AVAILABLE TEMPLATES                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Post-Call        │  │ Reminder        │  │ Record Sync  │ │
│  │ Analysis         │  │ Scheduler       │  │              │ │
│  │ Extract data →   │  │ Time-based SMS  │  │ Patient →    │ │
│  │ CRM + SMS        │  │ before appt     │  │ CRM update   │ │
│  │ [Configure]      │  │ [Configure]     │  │ [Configure]  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

## Component Adoption

| Component | Source | Use |
|-----------|--------|-----|
| PageFrame | `@grove/ui` (existing) | Wrap automations page with `width="standard"` |
| Select | `@grove/ui/select` (M20 T03) | Status filter dropdown |
| Skeleton | `@grove/ui/skeleton` (M20 T04) | Loading states for list, detail, steps |
| Tooltip | `@grove/ui/tooltip` (M20 T02) | Disabled retry button explanation |
| Modal | `@grove/ui/modal` (existing) | Retry confirmation |

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Wrap automations page in PageFrame | not started | none |
| T02 | Replace native select with Select component | not started | M20 T03 |
| T03 | Add Skeleton loading states | not started | M20 T04 |
| T04 | Add Modal confirmation for retry | not started | none |
| T05 | Add Tooltip to disabled retry button | not started | M20 T02 |
| T06 | Workflow template catalog API + UI | not started | T01 |
| T07 | Trigger configuration form UI | not started | T06 |
| T08 | Data mapping editor UI | not started | T06 |
| T09 | Error notification configuration UI | not started | T06 |
| T10 | Playwright regression + Chrome DevTools verification | not started | T01-T09 |

## Acceptance Criteria

- [ ] Automations page uses `<PageFrame width="standard">`
- [ ] Status filter uses `Select` component (no native `<select>`)
- [ ] All loading states show `Skeleton` placeholders (no "Loading..." text)
- [ ] Retry action opens `Modal` confirmation before creating new execution
- [ ] Disabled retry button has `Tooltip`: "Starting a new run..."
- [ ] Tenant admin can view workflow templates in a catalog
- [ ] Tenant admin can configure triggers for a workflow instance
- [ ] Tenant admin can map data fields between trigger payload and workflow input
- [ ] `pnpm -C apps/web lint` passes
- [ ] `pnpm -C apps/web check-types` passes
- [ ] All Playwright E2E tests pass
- [ ] Chrome DevTools MCP desktop + mobile screenshots for automations page

## Verification

```bash
source ~/.nvm/nvm.sh && nvm use 22 >/dev/null
pnpm -C apps/web lint
pnpm -C apps/web check-types
pnpm -C apps/web test
NEXT_E2E_PORT=3110 PLAYWRIGHT_WEB_BASE_URL=http://localhost:3110 pnpm -C apps/web exec playwright test --project=chromium
tools/scripts/e2e/run-web-e2e.sh
# Chrome DevTools MCP verification (AGENTS.md rule 7)
# Desktop + mobile screenshots for automations page
```

## Non-Goals

- No visual drag-and-drop workflow builder
- No custom workflow authoring (template-based only)
- No cross-tenant workflow sharing
- No Temporal runtime changes — T06 adds one read-only API endpoint (`GET /workflows/templates`) that derives templates from installed solution entry points; no Temporal worker or workflow code changes

## M33 Impact

**Enables new scope.** Autonomous agents create procedural memory ("skills") that function as agent-authored automation templates. M15 UI could expose the skill library as a new class of templates alongside platform-defined workflow templates. Workflow triggering can shift to autonomous agents that listen and act on events. This is additive — platform templates remain primary.
