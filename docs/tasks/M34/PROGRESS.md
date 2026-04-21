# M34 — Wiki as Source of Truth — Progress

**Status:** not started
**Branch:** `feat/M34-wiki-as-source-of-truth`
**Milestone doc:** [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md)

## Phases

| Phase | Tasks | Purpose |
|-------|-------|---------|
| 0 — Foundation | T01, T02, T02a | Dead code cleanup + wiki restructure + ingest execution history |
| C — Build wiki | T03, T04, T05, T06, T07 | Write all 31 comprehensive pages + index + schema + log |
| A — Delete docs | T08, T09 | Delete ALL docs/ (except arch/generated) + repoint AGENTS.md |
| Verify | T10 | Full pre-PR CI + arch tests + spot check |

## Tasks

| Task | Description | Status | Date | Commit |
|------|-------------|--------|------|--------|
| T01 | Dead code cleanup + .gitignore/.dockerignore | done | 2026-04-09 | — |
| T02 | Restructure wiki dirs + update SCHEMA.md terminology | done | 2026-04-09 | — |
| T02a | Ingest execution history + requirements into history/ (5 files) | done | 2026-04-09 | — |
| T03 | Write wiki/architecture/ (8 comprehensive pages) | done | 2026-04-09 | — |
| T04 | Write wiki/solutions/ (7 pages) | done | 2026-04-09 | — |
| T05 | Write wiki/systems/ (8 pages) | done | 2026-04-09 | — |
| T06 | Write wiki/guides/ (3 pages) | done | 2026-04-09 | — |
| T07 | Write wiki/index.md + update SCHEMA.md + append log.md | done | 2026-04-09 | — |
| T08 | Delete ALL docs/ (except arch/generated) + pointer index.md | not started | — | — |
| T09 | Update AGENTS.md onboarding to wiki-first | not started | — | — |
| T10 | Verification — pre-PR CI + arch tests + spot check | not started | — | — |

## Execution order

```
T01 (dead code) ─────────────────────┐
T02 (restructure wiki) ──┐           │
                          v           │
                        T02a          │
                  (ingest history     │
                   + requirements)    │
                          │           │
              ┌───────────┼───────────┤
              v           v           v
        T03 (arch)  T04 (sol)  T05 (sys)  T06 (guides)
              │           │       │           │
              └─────┬─────┘───────┘───────────┘
                    v
              T07 (index + schema + log)
                    v
              T08 (delete ALL docs/)
                    v
              T09 (update AGENTS.md)
                    v
              T10 (verification)
```

T03, T04, T05, T06 can run in parallel (separate directories).

## Post-M34 state

```
Raw sources:  packages/, solutions/, apps/, tools/,
              infrastructure/, .github/, tests/
              (source code only — the actual truth)

Wiki:         wiki/
              ├── architecture/  (8)
              ├── solutions/     (7)
              ├── systems/       (8)
              ├── guides/        (3)
              ├── history/       (5)
              ├── debug/         (TBD)
              ├── queries/       (existing + new)
              ├── index.md
              ├── SCHEMA.md
              └── log.md

docs/:        docs/
              ├── arch/generated/  (auto-generated, CI-verified)
              └── index.md         (3-line pointer to wiki)

AGENTS.md:    points at wiki/index.md as step 1
```
