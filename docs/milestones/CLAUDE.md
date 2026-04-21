# Milestones — Agent Instructions

## Structure

```
docs/
├── arch/                 # Architecture spine + task maps (generated, do not edit)
│   ├── arch_spine.md     # Extracted sections from ARCHITECTURE.md
│   └── maps/             # Per-domain task maps
├── milestones/           # Milestone definitions (what + why + acceptance)
│   ├── CLAUDE.md         # This file — agent instructions
│   ├── M1-*.md           # Top-level milestones
│   ├── M1.1-*.md         # Sub-milestones (decompose M1 further)
│   └── ...
├── tasks/                # Task breakdowns (how + done criteria per file)
│   ├── _templates/
│   │   └── task-template.md
│   ├── M1/
│   │   ├── PROGRESS.md
│   │   ├── T01-*.md
│   │   └── T02-*.md
│   ├── M1.1/
│   │   ├── PROGRESS.md
│   │   └── T01-*.md
│   └── ...
├── requirements/         # Product requirements (checklist, UI, NFQ, VOX)
├── archived/             # Historical planning/reference material
│   └── exec-plans/       # Legacy/reference docs; consult only when active docs explicitly point here
└── ARCHITECTURE.md       # Canonical architecture (source of truth)
```

## Numbering Scheme

- **Milestones:** `M{N}` for top-level, `M{N}.{S}` for sub-milestones
  - Example: `M1-obs-ui-decompose.md`, `M1.1-obs-evidence-rail.md`
- **Tasks:** `T{NN}` within a milestone directory, zero-padded
  - Example: `docs/tasks/M1/T02-extract-case-queue.md`, `docs/tasks/M1/T04-extract-evidence-rail.md`
- Milestones are numbered globally across the project, not per-workstream
- Sub-milestones share the parent prefix: M2.1, M2.2, M2.3

## Milestone Status Values

- `not started` — no task has begun
- `in progress` — at least one task started
- `done` — all tasks complete, acceptance met, verification passed
- `parked` — intentionally paused with rationale

## How Milestones Relate to Branches and PRs

- One milestone = one branch = one PR (preferred)
- Sub-milestones may share a branch with the parent if tightly coupled
- Branch naming: `feat/M{N}-short-name` or `fix/M{N}-short-name`

## Rules for Agents

1. **Read the milestone doc before touching any task.** The milestone defines the goal. Tasks are implementation detail.
2. **Check PROGRESS.md before starting.** It tracks which tasks are done.
3. **One task = one commit.** Commit message: `feat: M{N} T{NN} - {short description}`
4. **Update PROGRESS.md after completing a task.** Mark the task done with date.
5. **Never skip a task dependency.** If T03 depends on T01 and T02, both must be done first.
6. **Acceptance criteria are not negotiable.** If the milestone says "lint must pass", lint must pass.
7. **Do not create new milestones without human approval.** You may create tasks within an approved milestone.
8. **Milestones + tasks own new work tracking.** Do not create fresh execution tracking in `docs/milestones/exec-plans/`.
9. **Some active exec-plan references still exist.** If a milestone, requirement, or ops doc explicitly points to `docs/milestones/exec-plans/**`, treat that as a legacy exception until the owning doc is migrated; otherwise use `docs/milestones/README.md`, the milestone doc, and `docs/tasks/M*/PROGRESS.md` as the live source of truth.
10. **Architecture spine is the entry point.** Always load `docs/arch/arch_spine.md` first when starting a new session. It links to the canonical architecture and per-domain task maps.
11. **Requirements are source of truth for acceptance.** `docs/requirements/checklist.md` and `docs/requirements/ui-requirements.md` define what "done" means for product features. Milestone acceptance criteria should trace back to these.

## How to Create a New Milestone

1. Get human approval for the milestone scope
2. Create `docs/milestones/M{N}-{name}.md` using the structure below
3. Create `docs/tasks/M{N}/PROGRESS.md`
4. Break the milestone into tasks: `docs/tasks/M{N}/T{NN}-{name}.md`
5. Each task uses the template from `docs/tasks/_templates/task-template.md`

## Milestone Document Structure

```markdown
# M{N}: {Title}

Status: not started | in progress | done | parked
Created: YYYY-MM-DD
Owner: {name}
Branch: {branch-name}
Stream: {obs | v2 | ci | infra | dist | ui | platform | auth}
Depends on: M{X} or none
Reference: {link to design doc or architecture doc}

## Goal

One paragraph. What this delivers and why it matters.

## Design Decisions

Numbered. Settled before execution begins.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | {title} | not started | none |
| T02 | {title} | not started | T01 |

## Acceptance Criteria

- [ ] {measurable criterion}

## Verification

\```bash
# commands that prove the milestone is done
\```

## Non-Goals

What is explicitly out of scope.
```

## Workstream Tags

Every milestone declares a stream for grouping:

| Stream | Scope |
|--------|-------|
| `obs` | Observability — backend, UI, harness, canaries |
| `v2` | V2 architecture — public ingress, channels, control plane, content |
| `ci` | CI/CD — runners, bots, regression gates |
| `infra` | Infrastructure — Hetzner, k3d, k8s, production platform |
| `dist` | Distribution — export, client delivery (NFQ, VOX) |
| `ui` | UI/UX — design system, admin console, tenant surfaces |
| `platform` | Platform core — auth, tenancy, solutions, governance |
| `auth` | Authentication — OIDC, identity, session management |


<claude-mem-context>
# Recent Activity

<!-- This section is auto-generated by claude-mem. Edit content outside the tags. -->

*No recent activity*
</claude-mem-context>
