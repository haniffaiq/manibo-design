# T02a: Ingest execution history + product requirements into history/ pages

> **Milestone**: M34-wiki-as-source-of-truth
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T02 (wiki/history/ directory must exist)

---

## Description

Read ALL milestone docs (45), task files (283), exec-plans (87), and product requirements (422K across 5 files) to extract design decisions, rejected alternatives, lessons learned, and sequencing rationale. Produce 5 `wiki/history/*.md` digest pages that T03–T05 will consume as context for writing comprehensive wiki pages.

**This task is read-only on `docs/`.** Do not modify or delete any milestone/task/exec-plan/requirements files.

## Input files

| Area | Path | Files | Size |
|------|------|-------|------|
| Active milestones | `docs/milestones/*.md` | ~28 | ~300K |
| Completed milestones | `docs/milestones/*.md` | ~17 | ~200K |
| Task files | `docs/tasks/M*/*.md` | ~283 | ~150K |
| Exec plans | `docs/milestones/exec-plans/*.md` | ~87 | ~200K |
| Checklist | `docs/requirements/checklist.md` | 1 | 168K |
| UI requirements | `docs/requirements/ui-requirements.md` | 1 | 82K |
| NFQ requirements | `docs/requirements/nfq.md` | 1 | 61K |
| SOW mapping | `docs/requirements/SOW_MAPPING.md` | 1 | 64K |
| VOX requirements | `docs/requirements/vox.md` | 1 | 47K |

**Total: ~415 files, ~1.3MB of text.**

## Recommended approach — parallel agents

Use 5 parallel Explore agents, one per work area. Each reads its cluster and returns a structured report (max 2000 words). The report becomes the digest page.

| Agent | Reads | Produces |
|-------|-------|----------|
| A — Observability + voice | M1, M1.1–M1.3, M2, M8, M8.1, M8.2, M23 + tasks + `v2_observability_*.md`, `m8-voice-runtime.md`, `voice-platform-orchestration-plan.md` | `wiki/history/observability-voice.md` |
| B — UI console | M20–M22, M27, M12, M29–M31 + tasks + `nfq-clinic-and-deployment-console-ui-finish-plan.md` | `wiki/history/ui-console.md` |
| C — CI + infrastructure | M26, M26.1–M26.6 + tasks + `ci_control_plane_hardening_execution_plan.md`, `issue-*.md` | `wiki/history/ci-infrastructure.md` |
| D — Telephony + distribution | M11, M13, M14, M14.1–M14.3, M15, M19, M28 + tasks + `platformv3_wave_*.md`, `v2_phase1_schema_first_connectors.md`, `v2_public_*.md` | `wiki/history/telephony-distribution.md` |
| E — Platform features | M3–M10, M16–M18, M32, M33 + tasks + `docs/requirements/checklist.md`, `ui-requirements.md`, `nfq.md`, `vox.md`, `SOW_MAPPING.md` + `m10-outbound-plaktukai.md`, `m20-workflow-engine.md` | `wiki/history/platform-features.md` |

## Page structure (each digest)

```markdown
---
title: Execution History — {Area}
tags: [history, milestones, decisions]
last-verified: 2026-04-09
---

# Execution History — {Area}

## Timeline
| Date | Milestone | What shipped |
|------|-----------|-------------|

## Design decisions
### DD-1: {name}
- **Decision:** ...
- **Alternatives rejected:** ...
- **Why:** ...
- **Source:** [M{N}](../../docs/milestones/M{N}.md) decision #{X}

## Lessons learned
### LL-1: {lesson}
- **What happened:** ...
- **What changed:** ...
- **Source:** [M{N} T{NN}](../../docs/tasks/M{N}/T{NN}.md)

## Requirements coverage
(For platform-features.md only — how checklist.md / ui-requirements.md rows map to what was built)

## Sequencing rationale
Why milestones in this area were ordered this way. What gated what.

## Links to originals
```

## Acceptance Criteria

- [ ] 5 files exist under `wiki/history/`
- [ ] Each has a timeline table, at least 3 design decisions, at least 1 lesson learned
- [ ] Each cites original milestone/task files with relative links
- [ ] `platform-features.md` covers `checklist.md` + `ui-requirements.md` + `nfq.md` + `vox.md` + `SOW_MAPPING.md`
- [ ] No milestone/task/exec-plan/requirements files modified
- [ ] `uv run pytest tests/architecture/ -q` still passes

## Verification

```bash
for f in observability-voice ui-console ci-infrastructure telephony-distribution platform-features; do
  test -f "wiki/history/$f.md" && echo "OK: $f" || echo "FAIL: $f"
done
for f in wiki/history/*.md; do
  [ "$(grep -c '^### DD-' $f)" -ge 3 ] || echo "FAIL decisions: $f"
  [ "$(grep -c '^### LL-' $f)" -ge 1 ] || echo "FAIL lessons: $f"
done
test -f docs/requirements/checklist.md && echo "OK: requirements untouched"
```

## References

- Milestone: [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md) — Design Decision D6
- Input: all files listed in the table above
- Consumers: T03, T04, T05 (history context for wiki page writing)
