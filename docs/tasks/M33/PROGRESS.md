# M33: Grove Autonomous Runtime — Progress

## Sub-Milestone Status

| Sub-Milestone | Title | Status | Depends on |
|--------------|-------|--------|------------|
| M33.1 | Autonomous Executor Core | Not Started | — |
| M33.2 | Memory + Compression | Not Started | M33.1 |
| M33.3 | Skills + Episodic Recall | Not Started | M33.1 |
| M33.4 | Platform Integration | Not Started | M33.2, M33.3 |
| M33.5 | Execution Tools | Not Started | M33.1 |
| M33.6 | CLI + Verification | Not Started | M33.4, M33.5 |

## Task Status

### M33.1: Autonomous Executor Core

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T01 | Store protocols (MemoryStore, SkillStore) | Not Started | — |
| T02 | Config schema extension (AutonomousConfig) | Not Started | — |
| T05 | AutonomousExecutor while loop | Not Started | — |

### M33.2: Memory + Compression

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T03 | PostgreSQL memory store + migration | Not Started | — |
| T04 | Memory tool | Not Started | — |
| T06 | Context compressor (4-phase algorithm) | Not Started | — |
| T07 | Memory flush (pre-compression save) | Not Started | — |

### M33.3: Skills + Episodic Recall

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T11 | PostgreSQL skill store + migration | Not Started | — |
| T12 | Skill tools (list, view, manage) | Not Started | — |
| T13 | FTS migration on grove.messages | Not Started | — |
| T14 | Session search tool | Not Started | — |
| T15 | Background review nudge | Not Started | — |

### M33.4: Platform Integration

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T16 | AutonomousTaskWorkflow + activities | Not Started | — |
| T17 | GroveActivityContext extension + worker registration | Not Started | — |
| T18 | Bootstrap wiring | Not Started | — |
| T19 | delegate_autonomous_task tool | Not Started | — |
| T20 | Result delivery | Not Started | — |

### M33.5: Execution Tools

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T08 | Terminal tool + command approval | Not Started | — |
| T09 | PTC via UDS RPC | Not Started | — |
| T10 | Code execution tool | Not Started | — |

### M33.6: CLI + Verification

| Task | Title | Status | Completed |
|------|-------|--------|-----------|
| T21 | CLI entry point | Not Started | — |
| T22 | Architecture boundary tests | Not Started | — |
| T23 | Integration test (end-to-end) | Not Started | — |
| T24 | Documentation | Not Started | — |

## Notes

- PostgreSQL only (no SQLite backend)
- All new code in `packages/grove/src/grove/` — Grove independence maintained
- Existing AgentExecutor, LangGraph, FlowDefinition untouched
- M33.5 (execution tools) can run in parallel with M33.2/M33.3
- Terminal/PTC disabled in platform mode by default (allow_host_execution flag)
- Auxiliary model for side tasks (compression, flush, review, search)
- M32 (contact identity) is a paired dependency — should come before M33
