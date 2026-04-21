# T13: Document Source Distribution Procedure

> **Milestone**: M11-solution-package-isolation
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T10

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit** — commit message: `feat: M11 T13 - document source distribution procedure`
2. **One Milestone = One PR** — branch: `feat/M11-solution-package-isolation`
3. Follow CLAUDE.md, docs/milestones/CLAUDE.md
4. Update `docs/tasks/M11/PROGRESS.md` after completing

---

## Description

Create an operations document that describes the end-to-end source distribution procedure: how to run the export, how to select a profile, what verification steps to perform, and the handoff checklist for delivering source to a client.

## Subtasks

- [x] **Create ops document** at `wiki/ops/source-distribution.md`
- [x] **Document export procedure** — step-by-step commands for running the export
- [x] **Document profile selection** — how to choose which solutions to include
- [x] **Document handoff checklist** — what to verify before delivering to a client
- [x] **Document verification steps** — build, lint, typecheck, test commands on exported source

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `wiki/ops/source-distribution.md` | Create | Operations doc with export procedure, profiles, handoff checklist |

## Acceptance Criteria

- [x] `wiki/ops/source-distribution.md` exists
- [x] Export procedure documented with step-by-step commands
- [x] Profile selection documented
- [x] Handoff checklist documented
- [x] Verification steps documented

## References

- Milestone: [completed/M11-nfq-source-distribution.md](../../milestones/M11-nfq-source-distribution.md)
- Export script: `tools/scripts/artifact/export-client.sh`
- Client manifest: `distribution/clients/nfq.yaml`
