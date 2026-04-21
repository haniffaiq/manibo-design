# M33: Grove Autonomous Runtime

Status: not started
Created: 2026-04-04
Owner: TBD
Branch: feat/M33-grove-autonomous-runtime
Stream: platform
Depends on: M32 (contact identity — memory tools need contact_id for meaningful cross-session recall)
Reference: wiki/queries/research-grove-autonomous-runtime-design.md

## Goal

Add a second execution mode to Grove: autonomous agent execution (Hermes-style while loop) alongside the existing rail agent execution (LangGraph flow/react). The agent YAML determines which mode runs — `flow_definition:` selects AgentExecutor (existing, untouched), `autonomous:` selects AutonomousExecutor (new). Both share ToolRegistry, Temporal, PostgreSQL, and streaming protocol. This also introduces a three-layer memory architecture within Grove (hot memory, episodic recall, procedural skills), context compression, programmatic tool calling (PTC), and a standalone CLI mode. A fourth layer (contact/user profiles) is owned by Platform Core via M32 and consumed by Grove as an injected context snapshot — not built here.

## Design Decisions

1. **While loop, NOT LangGraph, for autonomous execution** — Autonomous agents have no predefined graph. The LLM IS the control flow. LangGraph adds dependency weight without value for open-ended loops. Two engines to maintain; they share tools, streaming, Temporal.

2. **Same ToolRegistry** — Autonomous agents use the same tool infrastructure. New system tools (memory, skills, terminal, execute_code) register alongside existing tools. No parallel tool system.

3. **Protocol-based stores** — MemoryStore, SkillStore as protocols in `core/`. Constructor-injected. Same pattern as CheckpointStore and ConversationStore.

4. **PostgreSQL only** — Single backend. No SQLite. Standalone CLI connects to PostgreSQL. Simpler build, one implementation per store. Session search uses tsvector/GIN, not FTS5.

5. **Same Temporal worker** — AutonomousTaskWorkflow registered on the same `grove-agent` task queue. Same retry policies, same worker setup. One new workflow, two new activities.

6. **Context compression (4-phase)** — Prune old tool results (no LLM), determine boundaries (head/tail protection), summarize middle (auxiliary LLM call), assemble compressed list. Iterative: re-compression updates previous summary instead of recreating.

7. **Memory flush before compression** — Extra LLM call with only memory tool before compression discards context. Agent saves durable facts. Flush artifacts stripped from history.

8. **PTC via Unix Domain Socket RPC** — Child process runs LLM-written Python scripts. Tool calls route through UDS back to parent's ToolRegistry. Only stdout returns to context. Collapses multi-step tool chains from ~60KB to ~500 bytes.

9. **Skills are agent-created procedural memory** — Progressive disclosure: Level 0 (index in prompt, ~50 tokens/skill), Level 1 (full content on demand via skill_view), Level 2 (reference files). 15KB limit per skill. Versioned with change history.

10. **Dangerous command patterns (regex-based)** — Approval before terminal execution. Covers filesystem, database, system, remote code, self-termination patterns. Command normalization (ANSI strip, null bytes, Unicode NFKC) prevents obfuscation. No LLM-based approval in v1.

11. **Standalone CLI** — `grove run --goal "..."`, `grove chat`, `grove memory`, `grove skills`. Connects to PostgreSQL. Same AutonomousExecutor, no Temporal, direct execution. Uses a deterministic UUID for standalone tenant (`STANDALONE_TENANT_ID = UUID("00000000-0000-0000-0000-000000000001")`, `STANDALONE_USER_ID = UUID("00000000-0000-0000-0000-000000000002")`) — existing stores cast tenant_id to `::uuid`, so string sentinels break at runtime.

15. **Tool risk classes for autonomous mode** — Autonomous agents must NOT get the full ToolRegistry. `AutonomousConfig.tools` defines the allowlist. Bootstrap creates a filtered registry via `create_filtered()` for each autonomous executor. Side-effect tools (send_message, complete_action, handoff) excluded unless explicitly listed. Risk classes: `safe` (read-only), `mutation` (writes data), `side_effect` (messages users), `dangerous` (terminal/code execution, gated by CommandApproval).

16. **Prompt builder gets memory/skills slots** — Current `prompts/builder.py` has no memory or skills injection point. M33 adds slots for frozen memory snapshot and skill index to the system prompt assembly. Without this, the model starts every turn amnesiac — stores alone are useless.

12. **Frozen prompt snapshots** — Hot memory and skill index injected into system prompt at session start, frozen for the session. Mid-session writes persist to DB immediately but don't update system prompt until next session or compression. Preserves prefix cache stability.

13. **Rail agents consume skills** — Skills created by autonomous agents appear in rail agent system prompts. Autonomous agents learn, rail agents apply. Skills are the bridge between runtimes.

14. **Fire-and-forget delegation** — `delegate_autonomous_task` tool returns immediately with task_id. Autonomous agent runs in background via Temporal. Results delivered via pluggable `ResultDeliverer` protocol (chat, voice, webhook in M33 v1).

## Architecture

```
ENTRY POINTS
─────────────────────────────────────────────────────────────────────────

  ┌──────────────────┐   ┌──────────────────────────┐
  │  FastAPI (exist)  │   │  CLI [T21]               │
  │  /completions     │   │  grove run --goal "..."   │
  │  /invoke          │   │  grove chat               │
  │  /webhooks        │   │  grove memory / skills    │
  └────────┬─────────┘   └────────────┬──────────────┘
           │                          │
           └──────────┬───────────────┘
                      ▼
         ┌────────────────────────┐
         │  Agent YAML [T02]     │
         │  autonomous: → new    │
         │  flow_definition: →   │
         │           existing    │
         └──────────┬────────────┘
                    │
TEMPORAL            ▼
─────────────────────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────┐
  │  Temporal Worker [T17]                                       │
  │                                                              │
  │  ConversationWorkflow (existing)                             │
  │  InvokeWorkflow (existing)                                   │
  │  AutonomousTaskWorkflow [T16]                                │
  │    ├─ execute_autonomous_task activity [T16]                 │
  │    └─ deliver_result activity [T20]                          │
  └──────────────────────────────────────────────────────────────┘
                    │
RUNTIME             ▼
─────────────────────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────┐
  │  AutonomousExecutor [T05]                                    │
  │  while iteration < max_iterations:                           │
  │    │                                                         │
  │    ├─ CONTEXT PRESSURE CHECK                                 │
  │    │    ├─ MemoryFlusher [T07]                               │
  │    │    │   (LLM call with memory tool only, save facts)     │
  │    │    └─ ContextCompressor [T06]                           │
  │    │        Phase 1: prune old tool results                  │
  │    │        Phase 2: determine boundaries                    │
  │    │        Phase 3: summarize middle (aux LLM)              │
  │    │        Phase 4: assemble compressed list                │
  │    │                                                         │
  │    ├─ LLM CALL (litellm.acompletion)                         │
  │    │                                                         │
  │    ├─ TOOL CALLS? ──yes──► execute via ToolRegistry          │
  │    │                       append results, continue          │
  │    └─ NO TOOLS? ──────────► done, break                      │
  │                                                              │
  │  POST-EXECUTION:                                             │
  │    └─ BackgroundReviewer [T15]                               │
  │        (async: review conversation, save memory/skills)      │
  │                                                              │
  │  ┌────────────────────────────────────────────────────────┐  │
  │  │  PTCRuntime [T09]                                      │  │
  │  │  ┌──────────────┐    UDS RPC     ┌──────────────────┐ │  │
  │  │  │ Parent       │◄──────────────►│ Child process    │ │  │
  │  │  │ (RPC server) │  socket        │ (Python script)  │ │  │
  │  │  │ dispatches   │                │ calls tools via  │ │  │
  │  │  │ tool calls   │                │ grove_tools stub │ │  │
  │  │  └──────────────┘                └───────┬──────────┘ │  │
  │  │                                    only stdout ↓       │  │
  │  │                              returns to context        │  │
  │  └────────────────────────────────────────────────────────┘  │
  └──────────────────────────────────────────────────────────────┘
                    │
TOOLS               ▼
─────────────────────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────┐
  │  ToolRegistry (shared) [T18 wires all]                       │
  │                                                              │
  │  EXISTING:  get_current_time, send_message, handoff,         │
  │             complete_action, subscribe_to_event               │
  │                                                              │
  │  NEW:                                                        │
  │    memory [T04]            add/replace/remove hot memory     │
  │    session_search [T14]    FTS on past conversations         │
  │    skill_list [T12]        list available skills             │
  │    skill_view [T12]        load full skill content           │
  │    skill_manage [T12]      create/patch/delete skills        │
  │    terminal [T08]          command exec + approval           │
  │    execute_code [T10]      PTC wrapper                       │
  │    delegate_autonomous     fire-and-forget to Temporal       │
  │      _task [T19]                                             │
  │                                                              │
  │  CommandApproval [T08]     regex patterns for dangerous cmds │
  └──────────────────────────────────────────────────────────────┘
                    │
MEMORY              ▼
─────────────────────────────────────────────────────────────────────────

  ┌────────────────────┐ ┌───────────────────┐ ┌─────────────────────┐
  │ HOT MEMORY (L1)    │ │ EPISODIC (L2)     │ │ SKILLS (L3)         │
  │                    │ │                   │ │                     │
  │ Protocols [T01]    │ │ FTS migration     │ │ Protocols [T01]     │
  │ PG store [T03]     │ │   [T13]           │ │ PG store [T11]      │
  │ Tool [T04]         │ │ Search tool [T14] │ │ Tools [T12]         │
  │                    │ │                   │ │                     │
  │ MEMORY: 2200 chr   │ │ tsvector + GIN    │ │ L0: index in prompt │
  │ USER:   1375 chr   │ │ on grove.messages │ │ L1: full via view   │
  │ Frozen snapshot    │ │ Aux LLM summarize │ │ Versioned history   │
  └────────┬───────────┘ └────────┬──────────┘ └──────────┬──────────┘
           │                      │                       │
STORAGE    ▼                      ▼                       ▼
─────────────────────────────────────────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────┐
  │  PostgreSQL                                                  │
  │                                                              │
  │  EXISTING:  grove.chats, grove.messages, grove.checkpoints   │
  │                                                              │
  │  NEW:                                                        │
  │    grove.agent_memories [T03]         RLS tenant isolation   │
  │    grove.agent_skills [T11]           RLS tenant isolation   │
  │    grove.agent_skill_versions [T11]   RLS tenant isolation   │
  │    tsvector GIN index [T13]           on grove.messages      │
  └──────────────────────────────────────────────────────────────┘

CROSS-CUTTING
─────────────────────────────────────────────────────────────────────────
  Bootstrap wiring [T18]            connects all pieces
  Architecture boundary tests [T22] enforces layering rules
  Integration test [T23]            end-to-end verification
  Documentation [T24]               ARCHITECTURE.md updates
```

## Sub-Milestones

```
M33.1 (executor core)
  │
  ├──► M33.2 (memory + compression)
  │       │
  │       └──► M33.3 (skills + search)
  │               │
  │               └──► M33.4 (platform integration)
  │                       │
  │                       └──► M33.6 (CLI + verification)
  │
  └──► M33.5 (execution tools)  ← independent, can parallel with M33.2/M33.3
          │
          └──► M33.6 (CLI + verification)
```

### M33.1: Autonomous Executor Core

Everything depends on this. The bare minimum: an autonomous while loop that can call tools and return structured output.

| Task | Title | Status | Depends on | Estimate |
|------|-------|--------|------------|----------|
| T01 | Store protocols (MemoryStore, SkillStore) | not started | none | S |
| T02 | Config schema extension (AutonomousConfig) | not started | none | S |
| T05 | AutonomousExecutor while loop | not started | T01, T02 | L |

**CHECKPOINT:** Executor loops with mocked LLM, calls tools via ToolRegistry, returns `ExecutorOutput` with metrics. `autonomous:` config section validates. No memory, no skills, no compression yet.

### M33.2: Memory + Compression

Agent remembers across sessions and handles long-running tasks (50+ iterations).

| Task | Title | Status | Depends on | Estimate |
|------|-------|--------|------------|----------|
| T03 | PostgreSQL memory store + migration | not started | T01 | M |
| T04 | Memory tool | not started | T01 | M |
| T06 | Context compressor (4-phase algorithm) | not started | T05 | L |
| T07 | Memory flush (pre-compression save) | not started | T04, T06 | M |

**CHECKPOINT:** Agent saves facts via memory tool → entries persist in PostgreSQL → entries appear frozen in system prompt on next session. 50+ iteration task runs with compression firing at least once. Memory flush saves durable facts before context is lost.

### M33.3: Skills + Episodic Recall

Agent creates reusable procedures and recalls past conversations. The learning loop.

| Task | Title | Status | Depends on | Estimate |
|------|-------|--------|------------|----------|
| T11 | PostgreSQL skill store + migration | not started | T01 | M |
| T12 | Skill tools (list, view, manage) | not started | T11 | M |
| T13 | FTS migration on grove.messages | not started | none | S |
| T14 | Session search tool | not started | T13 | M |
| T15 | Background review nudge | not started | T04, T12 | M |

**CHECKPOINT:** Agent creates a skill after a complex task via background review. `skill_list` returns the skill. `skill_view` loads full content. `session_search` finds relevant past conversations via tsvector FTS. Learning loop works: do → review → save skill → recall next time.

### M33.4: Platform Integration

Autonomous agents run inside Manibo via Temporal. Rail agents can delegate to autonomous.

| Task | Title | Status | Depends on | Estimate |
|------|-------|--------|------------|----------|
| T16 | AutonomousTaskWorkflow + activities | not started | T05, T03, T11 | M |
| T17 | GroveActivityContext extension + worker registration | not started | T01, T16 | S |
| T18 | Bootstrap wiring | not started | T03, T04, T08, T10, T11, T12, T14, T17 | M |
| T19 | delegate_autonomous_task tool | not started | T16 | M |
| T20 | Result delivery | not started | T16 | M |

**CHECKPOINT:** Autonomous agent runs via Temporal workflow with heartbeat. `delegate_autonomous_task` starts background task from rail agent and returns immediately. Result delivered via `ResultDeliverer` (chat, voice, webhook in v1). Bootstrap wires all stores, tools, and deliverers. Fail-closed when stores unavailable.

### M33.5: Execution Tools

Terminal and PTC for shell commands and Python scripts. Disabled in platform mode without gVisor.

| Task | Title | Status | Depends on | Estimate |
|------|-------|--------|------------|----------|
| T08 | Terminal tool + command approval | not started | none | M |
| T09 | PTC via UDS RPC | not started | T08 | L |
| T10 | Code execution tool | not started | T09 | S |

**CHECKPOINT:** Terminal tool executes commands, blocks dangerous patterns (rm -rf, DROP TABLE). PTC script calls 5+ tools via UDS RPC — only stdout returns to context. `platform_mode=True` blocks host execution in Temporal worker. CLI mode always allowed.

### M33.6: CLI + Verification

Standalone CLI and comprehensive testing.

| Task | Title | Status | Depends on | Estimate |
|------|-------|--------|------------|----------|
| T21 | CLI entry point | not started | T05, T03, T04, T08, T10, T11, T12 | M |
| T22 | Architecture boundary tests | not started | T05 | M |
| T23 | Integration test (end-to-end) | not started | T03-T20 | L |
| T24 | Documentation | not started | T01-T23 | S |

**CHECKPOINT:** `grove run --goal "..."` executes standalone against PostgreSQL (no Temporal). Architecture boundary tests pass — autonomous runtime does not import upward. E2E test proves: rail delegates → autonomous executes → result delivered. ARCHITECTURE.md documents autonomous runtime.

## Milestone Impact on Existing Milestones

M33 affects 15 of 21 existing milestones. Rail agents keep working unchanged — all impact is additive.

| Impact | Milestones |
|--------|-----------|
| **No impact** | M7, M13, M16, M28, M14.1, M14.3 |
| **Simplifies** | M5 (guardrail learning via memory), M9 (FNA autonomous replaces hardcoded workflow) |
| **Requires adaptation** | M4 (autonomous chat option), M6 (async CRM delegation), M8 (control plane envelope), M14 (async adapter delegation), M17 (erasure covers memory+skills), M18 (tool catalog + health rollups), M02 (autonomous case types), M32 (paired dependency), M14.2 (runtime health) |
| **Enables new scope** | M10 (SMA/OMA continuous learning), M15 (skill library as templates), M8.1 (autonomous latency sources), M23 (test autonomous agents) |

**Critical sequencing:** M32 (contact identity) → M33 (autonomous runtime) → M9/M10 (VOX agents go autonomous)

## Per-Task Verification

| Task | What to verify | Command / Evidence |
|------|---------------|-------------------|
| T01 | Protocols compile, structural typing | `uv run pyright packages/grove/src/grove/core/memories.py packages/grove/src/grove/core/skills.py` |
| T02 | Config validates, mutual exclusion | `uv run pytest packages/grove/tests/unit/config/test_autonomous_config.py -v` |
| T03 | Memory store CRUD, RLS, injection block | `uv run pytest packages/grove/tests/unit/backends/postgres/test_memory_store.py -v` |
| T04 | Memory tool add/replace/remove | `uv run pytest packages/grove/tests/unit/tools/system/test_memory_tool.py -v` |
| T05 | Executor loop completes with tools | `uv run pytest packages/grove/tests/unit/runtime/test_autonomous.py -v` |
| T06 | 4-phase compression pipeline | `uv run pytest packages/grove/tests/unit/runtime/test_compressor.py -v` |
| T07 | Flush saves memories, strips artifacts | `uv run pytest packages/grove/tests/unit/runtime/test_memory_flush.py -v` |
| T08 | Terminal runs cmds, blocks dangerous | `uv run pytest packages/grove/tests/unit/tools/system/test_terminal_tool.py -v` |
| T09 | UDS RPC tool calls, output isolation | `uv run pytest packages/grove/tests/unit/runtime/test_ptc.py -v` |
| T10 | Code execution wraps PTC correctly | `uv run pytest packages/grove/tests/unit/tools/system/test_code_execution_tool.py -v` |
| T11 | Skill store CRUD, versioning, RLS | `uv run pytest packages/grove/tests/unit/backends/postgres/test_skill_store.py -v` |
| T12 | Skill tools list/view/manage | `uv run pytest packages/grove/tests/unit/tools/system/test_skill_tools.py -v` |
| T13 | FTS column + GIN index exist | Migration runs; `plainto_tsquery` returns results |
| T14 | Session search returns grouped results | `uv run pytest packages/grove/tests/unit/tools/system/test_session_search_tool.py -v` |
| T15 | Background review saves memory/skills | `uv run pytest packages/grove/tests/unit/runtime/test_background_review.py -v` |
| T16 | Temporal workflow executes task | `uv run pytest packages/grove/tests/unit/temporal/test_autonomous_workflow.py -v` |
| T17 | Context fields + worker registration | `uv run pytest packages/grove/tests/unit/temporal/test_activity_context.py -v` |
| T18 | Bootstrap wires all, fail-closed | `uv run pytest packages/grove/tests/unit/test_bootstrap_autonomous.py -v` |
| T19 | Delegation starts workflow, returns | `uv run pytest packages/grove/tests/unit/tools/system/test_delegate_autonomous_tool.py -v` |
| T20 | Result delivered to channel | `uv run pytest packages/grove/tests/unit/temporal/test_result_delivery.py -v` |
| T21 | CLI commands work | `uv run pytest packages/grove/tests/unit/cli/ -v` |
| T22 | No upward imports, Grove independent | `uv run pytest packages/grove/tests/unit/architecture/test_import_boundaries.py -v` |
| T23 | Full round-trip works | `uv run pytest packages/grove/tests/integration/test_autonomous_workflow.py -v` |
| T24 | Docs accurate, no stale refs | Manual: ARCHITECTURE.md has autonomous section, YAML example, tables, CLI |

## Acceptance Criteria

- [ ] `autonomous:` section in agent YAML selects AutonomousExecutor; `flow_definition:` still selects AgentExecutor (zero regression)
- [ ] Autonomous agent completes a 30+ iteration task with context compression firing at least once
- [ ] Memory tool persists entries to PostgreSQL; entries appear in system prompt on next session
- [ ] Skill created by autonomous agent appears in rail agent's system prompt skill index
- [ ] PTC script executes 5+ tool calls via UDS RPC; only stdout enters context
- [ ] Terminal tool blocks dangerous commands (rm -rf /, DROP TABLE) via regex patterns
- [ ] Session search returns relevant results from past conversations via tsvector FTS
- [ ] delegate_autonomous_task fires Temporal workflow; result delivered via send_message
- [ ] `grove run --goal "..."` executes without Temporal (direct execution, PostgreSQL backend)
- [ ] All new files pass pyright strict, ruff format, ruff lint
- [ ] Architecture boundary tests pass: autonomous runtime does not import upward
- [ ] End-to-end integration test: rail agent delegates → autonomous executes → result delivered

## Verification

```bash
# Type checking (strict, zero errors)
uv run pyright -p pyrightconfig.ci.json

# Lint + format
uv run ruff check packages/grove/src/ packages/grove/tests/
uv run ruff format packages/grove/src/ packages/grove/tests/ --check

# Architecture boundary tests
uv run pytest packages/grove/tests/unit/architecture/ -v --tb=short

# Autonomous runtime unit tests
uv run pytest packages/grove/tests/unit/runtime/test_autonomous.py -v
uv run pytest packages/grove/tests/unit/runtime/test_compressor.py -v
uv run pytest packages/grove/tests/unit/runtime/test_memory_flush.py -v
uv run pytest packages/grove/tests/unit/runtime/test_ptc.py -v

# Store tests
uv run pytest packages/grove/tests/unit/backends/postgres/test_memory_store.py -v
uv run pytest packages/grove/tests/unit/backends/postgres/test_skill_store.py -v

# Tool tests
uv run pytest packages/grove/tests/unit/tools/system/ -v

# Integration test
uv run pytest packages/grove/tests/integration/test_autonomous_workflow.py -v
```

## Isolation & Sandboxing

### M33 Scope: Process-Level Isolation (PTC)

M33 uses **process-level isolation** via PTC (Programmatic Tool Calling):

```
AutonomousExecutor (parent process)
  │
  ├─ LLM writes Python script
  ├─ PTCRuntime spawns child process (os.setsid, isolated process group)
  │    ├─ Environment filtered (KEY/TOKEN/SECRET/PASSWORD stripped)
  │    ├─ Timeout enforced (300s, SIGTERM → SIGKILL)
  │    ├─ Tool calls limited (50 max)
  │    ├─ Output capped (50KB stdout, 10KB stderr)
  │    └─ Only stdout returns to LLM context
  ├─ CommandApproval blocks dangerous terminal commands (regex patterns)
  └─ All tool calls route through parent's ToolRegistry (RLS enforced)
```

This is sufficient for M33 because:
- The executor runs inside the Temporal worker (trusted process)
- Terminal commands are gated by regex approval patterns
- PTC child processes can't access DB credentials or API keys
- RLS enforces tenant isolation at the database layer
- No arbitrary container/VM spawning

### Future Milestone: gVisor Kernel-Level Isolation

A future milestone adds **gVisor sandbox pods** for stronger isolation when running untrusted autonomous tasks. gVisor is a user-space kernel (written in Go, memory-safe) that reimplements the Linux syscall interface.

```
FUTURE ARCHITECTURE (post-M33):

  Orchestrator Pod (trusted)              Sandbox Pod (gVisor RuntimeClass)
  ┌────────────────────────┐              ┌────────────────────────────┐
  │ Temporal Activity      │              │ AutonomousExecutor         │
  │                        │   gRPC       │                            │
  │ Receives task input    │◄────────────►│ Runs while loop            │
  │ Creates sandbox pod    │   proxy      │ All tool calls via gRPC    │
  │ Proxies tool calls     │              │ NO direct DB access        │
  │ Enforces RLS           │              │ NO API keys                │
  │ Tracks token budget    │              │ NO Temporal credentials    │
  │ OTEL spans from here   │              │ Read-only root filesystem  │
  │ Kill switch via        │              │ cap-drop ALL               │
  │   heartbeat timeout    │              │ pids-limit 256             │
  └────────────────────────┘              └────────────────────────────┘

  WHY gVisor (not standard containers):
    Standard container: [App] --exploit--> [Linux Kernel] --> [Host]
    gVisor:             [App] --exploit--> [Sentry/Go] AND [Kernel] --> [Host]
    Two independent codebases. Must chain both exploits. Go is memory-safe.

  OVERHEAD (agent workload):
    CPU-bound:    <1%     (negligible)
    Network I/O:  ~5-15%  (dominated by LLM API latency)
    File I/O:     10-30%  (acceptable)
    Verdict:      negligible for AI agents (LLM inference is the bottleneck)
```

**How it changes tool flow:**

| Aspect | M33 (process isolation) | Future (gVisor) |
|--------|------------------------|-----------------|
| LLM calls | Direct via litellm | gRPC proxy to orchestrator |
| DB access | Direct via asyncpg (RLS) | gRPC proxy (no DB credentials in sandbox) |
| Tool calls | Direct via ToolRegistry | gRPC proxy (orchestrator dispatches) |
| API keys | In parent process env | Never enter sandbox |
| Kill switch | Temporal heartbeat timeout | Temporal heartbeat + pod deletion |
| Isolation | Process group + env filtering | User-space kernel + network policy |
| Where executor runs | Temporal worker process | Dedicated gVisor pod |

**gVisor is NOT in M33 scope** because:
1. M33 executor runs inside the trusted Temporal worker — same trust boundary as existing AgentExecutor
2. Process-level isolation (PTC) + command approval + RLS is sufficient for controlled autonomous tasks
3. gVisor requires Kubernetes RuntimeClass setup, warm pool management, gRPC proxy infrastructure
4. Build the executor first (M33), sandbox it later (future milestone)

### Standalone CLI: No Isolation

CLI mode (`grove run`) runs on the user's machine — same trust model as running any local tool. No sandbox, no gVisor, no process isolation beyond PTC. The user trusts the agent because they launched it.

```
Platform mode:   Temporal worker → RLS → process isolation → (future: gVisor)
CLI mode:        User's terminal → PostgreSQL → direct execution → user trusts agent
```

## Observability

### What Already Works for Autonomous (zero changes)

The existing observability stack (M1, M1.1-1.3, M8, M8.1, M21, M23, M29) covers most autonomous agent needs because the AutonomousExecutor uses the same streaming callback and pg_notify pipeline as the rail agent:

```
REALTIME (chat/voice):
  AutonomousExecutor → on_chunk callback → pg_notify → SSE → browser
  Same pipeline as AgentExecutor. Operators see live transcript, tool calls, phases.

VOICE (in-process):
  LiveKit worker → AutonomousExecutor → on_chunk → TTS → audio
  No pg_notify. Same in-process path as rail voice agent.
```

What works as-is:
- SSE streaming (text, tool_call, tool_result, done chunks)
- Live transcript in operator console
- Tool execution OTEL spans (`grove.tools`)
- LLM completion OTEL spans (`grove.llm`)
- Voice turn latency collection (29 fields per turn)
- Prometheus TTFT metrics
- Operator actions (take over, transfer, listen in)
- Escalation handling
- Post-call evidence rail and timeline
- Browser voice test workbench (M23)
- Test call review flow (M29)

### What M33 Adds: Autonomous Runtime Events

The AutonomousExecutor emits new event types through the same `on_chunk` / runtime event pipeline. No new infrastructure — just new event types in the existing `call_runtime_events` table:

```python
# Emitted via on_chunk callback (same as existing text/tool_call chunks)
"autonomous.iteration"         # {iteration: 23, max: 50, tool_calls_this_iter: 2}
"autonomous.compression"       # {phase: "complete", tokens_before: 45000, tokens_after: 18000, summary_preview: "..."}
"autonomous.memory_flush"      # {entries_saved: 2, targets: ["memory", "user"]}
"autonomous.memory_mutation"   # {action: "add", target: "memory", content_preview: "Russian speakers..."}
"autonomous.skill_mutation"    # {action: "create", name: "vox-sales-flow", version: 1}
"autonomous.ptc_execution"     # {script_lines: 15, tool_calls: 3, duration_ms: 4500, status: "success"}
"autonomous.budget_warning"    # {iterations_remaining: 8, percent_used: 84}
"autonomous.goal_complete"     # {iterations_used: 23, response_preview: "..."}
```

These flow through:
- **pg_notify** → existing SSE pipeline → live in operator console
- **call_runtime_events** table → existing evidence rail renders them as timeline items
- **OTEL spans** → existing trace infrastructure

### Observability by Mode

| Capability | Realtime (chat/voice) | Background (cron/delegated) |
|------------|----------------------|----------------------------|
| Live transcript | SSE via pg_notify | No live listener (background) |
| Tool execution spans | OTEL `grove.tools` | Same |
| LLM completion spans | OTEL `grove.llm` | Same |
| Iteration progress | SSE `autonomous.iteration` events | Temporal workflow query |
| Compression events | SSE + runtime event table | Runtime event table |
| Memory/skill mutations | SSE + runtime event table | Runtime event table |
| Voice turn latency | Per-turn collector (29 fields) | N/A (no voice in background) |
| Operator actions | Take over, transfer, etc. | N/A (no operator in loop) |
| Post-task evidence | Evidence rail (same as post-call) | Evidence rail via observability queue |
| Test workbench | Browser voice (M23) | Future: "run goal" admin page |

### What's NOT in M33 (future observability)

- Background task admin UI ("run autonomous goal" page, like test workbench for chat)
- Background task live progress dashboard (iteration count, tool calls, ETA)
- Skills dashboard (operator view of learned skills, approval flow)
- Autonomous case type in observability queue (separate from voice/chat)
- Cross-session learning visualization (skill evolution over time)

These are future milestone scope. M33 emits the data; future milestones build the UI.

## Non-Goals

- gVisor sandbox pods (future milestone — run autonomous executor in gVisor RuntimeClass)
- Warm pool management for sandbox pods
- gRPC proxy for sandbox ↔ orchestrator communication
- Skill governance UI (platform-core concern, future milestone)
- Cross-agent skill sharing within tenant (future)
- Platform skill templates (future)
- RL training integration (Atropos/GPA — not a platform concern)
- Smart/LLM-based command approval (start with regex only)
- Voice-specific autonomous features (channels are just channels)
- SQLite backend (PostgreSQL only)
- Skill usage tracking and self-improvement loop (future)
- Subagent spawning from autonomous executor (depth > 1, future)
