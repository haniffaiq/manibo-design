# T09: PTC via UDS RPC

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: L (4-8h)
> **Depends on**: T08

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T09 - {short description}`

2. **One Milestone = One PR**
   - All tasks within a milestone go into a SINGLE pull request
   - PR branch naming: `feat/M33-grove-autonomous-runtime`
   - Do NOT create separate PRs for individual tasks

3. **Follow CLAUDE.md and AGENTS.md**
   - Read the root `CLAUDE.md` before starting
   - Read `docs/AGENTS.md` for documentation navigation and priority rules
   - Read `docs/milestones/CLAUDE.md` for milestone conventions
   - If a milestone, requirement, or ops doc still explicitly points to `docs/milestones/exec-plans/**`, treat that as a legacy exception until the owning doc is migrated
   - Follow all coding standards and import rules

4. **Before Starting This Task**
   - Verify all dependencies (listed above) are completed
   - Read the milestone document for full context
   - Check `docs/tasks/M33/PROGRESS.md` for current state

5. **Definition of Done**
   - All subtasks completed
   - Code compiles without errors
   - Tests pass (if tests exist for this area)
   - No stale debug code left behind
   - Code follows project conventions

6. **After Completing This Task**
   - Update `docs/tasks/M33/PROGRESS.md` to mark this task done
   - Stage only files related to this task
   - Use conventional commit format

---

## Description

Implement Programmatic Tool Calling (PTC) via Unix Domain Socket RPC. This is the infrastructure that enables the LLM to write Python scripts that call Grove tools without those tool results entering the LLM's context window. The architecture: parent process opens a UDS server, generates a Python module with tool stub functions, spawns a child process running the LLM-written script. When the script calls a stub function, the stub sends an RPC request over the UDS socket to the parent, which dispatches the tool call through ToolRegistry and returns the result. Only the script's `print()` output returns to the LLM context.

This is the key innovation for autonomous execution efficiency. A multi-step operation that would normally consume ~60KB of context (tool call + tool result per step) collapses to ~500 bytes of stdout summary.

**Platform mode restriction:** Same as T08 — PTC spawns a child process on the host. In platform mode (Temporal worker), PTC is **disabled by default** unless `autonomous.allow_host_execution: true` or a future gVisor sandbox is available. CLI mode always allows PTC. The PTCRuntime constructor accepts `platform_mode: bool = False`; when true, `execute_script()` returns an error immediately explaining that code execution requires sandbox infrastructure.

**Hermes lesson:** Hermes local backend runs scripts on the host with env filtering only. Hermes Docker backend runs in a hardened container (cap-drop ALL, read-only root, pids-limit 256). Grove platform mode should match the Docker-level safety posture at minimum. M33 builds the tool; a future gVisor milestone provides the sandbox. Until then, platform mode blocks host execution.

## Subtasks

- [ ] **Create PTCRuntime class**: Define in `packages/grove/src/grove/runtime/ptc.py` with constructor DI: `tool_registry` (from `grove.tools.registry` — the ToolRegistry or equivalent interface used to dispatch tool calls), `allowed_tools` (`list[str]`, default: `["web_search", "web_fetch", "read_file", "write_file", "search_files", "terminal"]`). Add `from __future__ import annotations` at top.
- [ ] **Define PTCResult dataclass**: `@dataclass` with fields: `status` (`str` — "success" | "error" | "timeout"), `output` (`str` — captured stdout), `error` (`str` — captured stderr), `tool_calls_made` (`int`), `duration` (`float` — seconds).
- [ ] **Implement generate_stubs()**: `def generate_stubs(self, tools: list[dict[str, Any]], socket_path: str) -> str` — auto-generates a Python module source string. For each tool in the allowed list, generate a function with the tool's parameter signature that sends a JSON RPC request over the UDS socket and returns the parsed response. Include built-in helpers: `json_parse(s: str) -> Any`, `shell_quote(s: str) -> str`, `retry(fn, max_attempts=3, delay=1.0)`. The module connects to the socket path from the `GROVE_RPC_SOCKET` environment variable.
- [ ] **Implement RPC server loop**: `async def _rpc_server_loop(self, server: asyncio.Server, context: ToolContext, max_tool_calls: int) -> None` — accepts connections on the UDS socket, reads newline-delimited JSON requests, dispatches tool calls through `tool_registry`, sends JSON responses. Tracks tool call count and rejects calls exceeding `max_tool_calls`.
- [ ] **Define RPC protocol**: Newline-delimited JSON over UDS. Request format: `{"tool": "tool_name", "args": {"param1": "value1"}}`. Response format: `{"result": <tool_result>}` or `{"error": "error message"}`. Each message is a single JSON line terminated by `\n`.
- [ ] **Implement execute_script()**: `async def execute_script(self, script: str, context: ToolContext, *, timeout: int = 300, max_tool_calls: int = 50) -> PTCResult`. Steps:
  1. Create temp directory (`tempfile.mkdtemp(prefix="grove_ptc_")`)
  2. Write LLM-provided script to `{tmpdir}/script.py`
  3. Generate stubs and write to `{tmpdir}/grove_tools.py`
  4. Create UDS socket at `/tmp/grove_rpc_{uuid4().hex}.sock`
  5. Start async UDS server (`asyncio.start_unix_server`)
  6. Build filtered environment (see subtask below)
  7. Spawn child process via `asyncio.create_subprocess_exec("python", "-c", f"import sys; sys.path.insert(0, '{tmpdir}'); exec(open('{tmpdir}/script.py').read())", ...)`
  8. Monitor stdout/stderr with head+tail capture
  9. Enforce timeout with SIGTERM/SIGKILL escalation (same pattern as T08)
  10. Return `PTCResult`
- [ ] **Environment filtering**: Build child process environment. Block variables where the name contains (case-insensitive): `KEY`, `TOKEN`, `SECRET`, `PASSWORD`, `CREDENTIAL`, `AUTH`. Allow through: `PATH`, `HOME`, `USER`, `LANG`, `PYTHONPATH`, `VIRTUAL_ENV`, `GROVE_RPC_SOCKET` (set to socket path). Start from `os.environ` and filter.
- [ ] **Output management**: stdout cap 50KB (head 40% + tail 60%, same truncation strategy as TerminalTool from T08). stderr cap 10KB (tail only). Strip ANSI escapes from both. Apply secret redaction (same patterns as T08).
- [ ] **Process lifecycle**: Create process group with `os.setsid`. On timeout: SIGTERM to process group, wait 5s, SIGKILL to process group. Clean up temp directory and UDS socket in `finally` block.
- [ ] **Tool call validation**: In the RPC server loop, validate each request: (1) `tool` field must be in `allowed_tools`, (2) total tool calls must not exceed `max_tool_calls`. Return `{"error": "Tool not allowed: <name>"}` or `{"error": "Tool call limit exceeded"}` on violations.
- [ ] **Socket cleanup**: Always remove socket file in `finally` block: `pathlib.Path(socket_path).unlink(missing_ok=True)`. Also remove temp directory with `shutil.rmtree(tmpdir, ignore_errors=True)`.
- [ ] **Emit runtime event**: After script completes, if `on_chunk` callback provided to `execute_script()`, emit `StreamChunk(type="autonomous.ptc_execution", content=json.dumps({"script_lines": line_count, "tool_calls": calls_made, "duration_ms": int(duration*1000), "status": result.status}))`. Accept `on_chunk` as optional parameter.
- [ ] **Windows guard**: At top of `execute_script()`, check `sys.platform == "win32"` and return `PTCResult(status="error", output="", error="PTC is not available on Windows", tool_calls_made=0, duration=0.0)`.
- [ ] **Unit tests**: Create `packages/grove/tests/unit/runtime/test_ptc.py` with tests: (a) generate_stubs produces valid Python module, (b) RPC request/response round-trip with mock tool, (c) tool call limit enforcement, (d) disallowed tool rejection, (e) timeout kills process, (f) environment filtering blocks secrets, (g) output truncation at 50KB, (h) socket cleanup after execution.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/runtime/ptc.py` | Create | PTCRuntime class + PTCResult dataclass (~500 lines) |
| `packages/grove/tests/unit/runtime/test_ptc.py` | Create | Unit tests with mock tool registry |

## Implementation Notes

- **Reference:** `hermes-agent/tools/code_execution_tool.py` (816 lines) in external reference repo. Adapt the UDS RPC pattern but integrate with Grove's ToolRegistry.
- **UDS socket path:** Use `/tmp` on macOS to avoid the 104-byte `AF_UNIX` path length limit. `tempfile.gettempdir()` returns `/tmp` on macOS, which is safe.
- **RPC listener threading:** The RPC server runs as an async task within the same event loop (using `asyncio.start_unix_server`), not in a separate thread. The parent's event loop handles both the RPC server and process monitoring concurrently.
- **Suppress handler stdout:** Tool handlers invoked via RPC must not print to the child's stdout. The RPC server runs in the parent process, so this is naturally isolated — tool execution output stays in the parent, only the JSON response goes over the socket.
- **Child process imports:** The generated `grove_tools.py` stub module uses only stdlib imports (`socket`, `json`, `os`, `time`, `shlex`). No dependency on Grove packages in the child process.
- **Stub function signatures:** Each stub function takes `**kwargs` to match any tool parameter combination. The function docstring includes the tool's description for IDE/LLM reference.
- **This module is RPC infrastructure only:** T10 creates the agent-facing `CodeExecutionTool` that wraps `PTCRuntime`. This module should not subclass `GroveBaseTool`.
- **Logging:** Use `grove.logger.create_logger()`. Log script execution start/end (DEBUG), tool calls dispatched (DEBUG), tool call rejections (WARNING), timeouts (WARNING), errors (ERROR).
- **Pattern reference:** Read `packages/grove/src/grove/tools/system/terminal_tool.py` (from T08) for the process group isolation and timeout patterns — reuse the same approach.

## Acceptance Criteria

- [ ] Child process can call tools via UDS RPC and receive results
- [ ] Tool results do not enter parent's LLM message context (only stdout from child)
- [ ] Environment variables containing secrets are stripped from child environment
- [ ] Output capped: stdout 50KB (head+tail), stderr 10KB (tail only)
- [ ] Timeout enforced with SIGTERM then SIGKILL escalation on process group
- [ ] Tool call limit enforced (default 50, configurable)
- [ ] Disallowed tools rejected with error message
- [ ] Socket file cleaned up on exit (no leaked sockets in `/tmp`)
- [ ] Temp directory cleaned up on exit
- [ ] Generated stub module is valid Python (importable, correct function signatures)
- [ ] Windows returns clean error (no crash)
- [ ] `uv run pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `uv run ruff check` and `uv run ruff format --check` pass on new files
- [ ] Unit tests cover RPC round-trip, limits, filtering, truncation, and cleanup

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Dependency: T08 (Terminal tool — reuse process isolation and output capture patterns)
- Pattern reference: `packages/grove/src/grove/tools/system/terminal_tool.py` (from T08)
- Pattern reference: `packages/grove/src/grove/runtime/llm_calls.py`
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
