# T08: Terminal tool + command approval

> **Milestone**: M33-grove-autonomous-runtime
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **One Task = One Commit**
   - Each task file represents exactly ONE atomic commit
   - Do NOT combine multiple tasks into a single commit
   - Commit message format: `feat: M33 T08 - {short description}`

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

Implement two components: (1) a command approval system that uses regex patterns to detect and block dangerous shell commands before execution, and (2) a terminal tool that executes shell commands via `asyncio.create_subprocess_exec` with output capture, timeout enforcement, secret redaction, and integration with the command approval system.

The command approval layer is a safety net for autonomous agents. Unlike interactive agents where a human reviews each action, autonomous agents execute in a loop without human oversight. The regex-based pattern detection catches common destructive patterns (filesystem wipes, database drops, system kills, remote code execution) before they reach the shell. This is not a security boundary — it is a guardrail against LLM mistakes.

**Platform mode restriction:** In platform mode (Temporal worker), the terminal tool is **disabled by default**. It should only be available when a future gVisor sandbox milestone provides kernel-level isolation. The bootstrap wiring (T18) must NOT register TerminalTool or CodeExecutionTool when running inside the Temporal worker unless an explicit `autonomous.allow_host_execution: true` flag is set in the agent config. CLI mode (`grove run`) always allows terminal — the user launched it on their own machine.

This means T08 builds the tool, but T18 controls when it's registered. The tool itself is deployment-mode-aware via a constructor flag `platform_mode: bool = False` that adds extra restrictions (e.g., no writes outside `/tmp`, no network commands) in platform mode.

## Subtasks

- [ ] **Create CommandApproval class**: Define in `packages/grove/src/grove/tools/system/command_approval.py`. Constructor takes no arguments. Primary method: `detect_dangerous(command: str) -> list[str]` returning a list of human-readable descriptions of matched patterns. Empty list means the command is safe.
- [ ] **Define DANGEROUS_PATTERNS**: Module-level list of `(pattern: re.Pattern, description: str)` tuples. Cover approximately 40 patterns across these categories:
  - **Filesystem**: `rm -rf /`, `rm -rf ~`, `chmod 777`, `chown root`, `mkfs`, `dd if=`, `shred`
  - **Database**: `DROP TABLE`, `DROP DATABASE`, `DELETE FROM` (without WHERE), `TRUNCATE`, `ALTER TABLE DROP`
  - **System**: `kill -9`, `killall`, `systemctl stop`, `systemctl disable`, `shutdown`, `reboot`, `init 0`, fork bomb (`:(){ :|:& };:`)
  - **Remote execution**: `curl | sh`, `curl | bash`, `wget | sh`, `bash -c` with URL, `eval $(curl`
  - **File overwrite**: writes to `/etc/`, `/dev/sd`, `/boot/`, `/proc/sys/`
  - **Self-termination**: `pkill grove`, `kill` with own PID patterns
  - **Network**: `iptables -F` (flush all rules), `ufw disable`
  - Use `re.IGNORECASE` on all patterns.
- [ ] **Implement command normalization**: Before pattern matching, normalize the command string: (1) strip ANSI escape sequences via regex `\x1b\[[0-9;]*[a-zA-Z]`, (2) remove null bytes `\x00`, (3) apply Unicode NFKC normalization via `unicodedata.normalize('NFKC', ...)`. This defeats obfuscation attempts.
- [ ] **Create TerminalTool**: Define in `packages/grove/src/grove/tools/system/terminal_tool.py` subclassing `GroveBaseTool`. Set `name = "terminal"`, `is_system = True`. Constructor takes `command_approval: CommandApproval` and optional `default_timeout: int = 300`.
- [ ] **Define TerminalTool JSON schema**: Parameters: `command` (string, required, description: "Shell command to execute"), `timeout` (integer, optional, default from constructor, description: "Timeout in seconds, max 600").
- [ ] **Implement TerminalTool.execute()**: (1) Normalize command, (2) check CommandApproval.detect_dangerous() — if patterns match, return error dict with matched pattern descriptions, (3) run command via `asyncio.create_subprocess_exec("bash", "-c", command, ...)`, (4) capture stdout/stderr, (5) enforce timeout, (6) return structured result.
- [ ] **Process group isolation**: Use `os.setsid` as `preexec_fn` (Linux/macOS only) to create a new process group. On timeout, kill the entire process group with `os.killpg()`.
- [ ] **Graceful termination**: On timeout, send SIGTERM first, wait 5 seconds, then SIGKILL if still running. Use `process.terminate()` then `asyncio.wait_for(process.wait(), timeout=5)` then `os.killpg(pgid, signal.SIGKILL)`.
- [ ] **Output capture with head+tail strategy**: Cap total output at 50KB (51200 bytes). If output exceeds cap, keep first 40% (20480 bytes) and last 60% (30720 bytes) with a `"\n... [truncated {N} bytes] ...\n"` separator. Apply to stdout and stderr independently.
- [ ] **ANSI stripping from output**: Strip ANSI escape sequences from captured stdout/stderr before returning.
- [ ] **Secret redaction**: Scan output for environment variable patterns containing `KEY`, `TOKEN`, `SECRET`, `PASSWORD`, `CREDENTIAL`, `AUTH` (case-insensitive) and redact their values. Pattern: `(KEY|TOKEN|SECRET|PASSWORD|CREDENTIAL|AUTH)\w*[=:]\s*\S+` replaced with `$1***=REDACTED`.
- [ ] **Return structured result**: Return dict with keys: `status` ("success" | "error" | "timeout" | "blocked"), `output` (str, stdout), `error` (str, stderr), `exit_code` (int | None), `duration_seconds` (float).
- [ ] **Tool description**: Include guidance about when to use terminal vs execute_code: "Execute a shell command. Use for system commands, file operations, and quick one-liners. For multi-step operations with tool access, prefer execute_code instead."
- [ ] **Unit tests**: Create `packages/grove/tests/unit/tools/system/test_command_approval.py` testing: (a) each category of dangerous patterns detected, (b) safe commands pass through, (c) normalization defeats ANSI obfuscation, (d) normalization defeats null byte injection. Create `packages/grove/tests/unit/tools/system/test_terminal_tool.py` testing: (e) successful command execution, (f) dangerous command blocked, (g) timeout handling, (h) output truncation, (i) secret redaction.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/tools/system/command_approval.py` | Create | CommandApproval class + DANGEROUS_PATTERNS (~150 lines) |
| `packages/grove/src/grove/tools/system/terminal_tool.py` | Create | TerminalTool subclassing GroveBaseTool (~200 lines) |
| `packages/grove/tests/unit/tools/system/test_command_approval.py` | Create | Pattern detection and normalization tests |
| `packages/grove/tests/unit/tools/system/test_terminal_tool.py` | Create | Tool execution, timeout, truncation, redaction tests |

## Implementation Notes

- **Reference:** `hermes-agent/tools/approval.py` (868 lines) in external reference repo. Adapt the regex patterns but skip smart/LLM-based approval — v1 uses regex only (design decision #10 in milestone doc).
- **Pattern reference:** Read `packages/grove/src/grove/tools/system/send_message.py` and `packages/grove/src/grove/tools/base.py` for the GroveBaseTool subclassing pattern. Match import style and class structure.
- **asyncio.create_subprocess_exec, not subprocess.run:** All I/O must be async. Use `asyncio.create_subprocess_exec("bash", "-c", command, stdout=PIPE, stderr=PIPE, preexec_fn=os.setsid)`.
- **No interactive commands:** Do not allocate a PTY. Commands that require interactive input will hang until timeout.
- **Pattern key system:** Each pattern has a human-readable description string (e.g., "Recursive force delete targeting root directory"). These descriptions appear in error messages when a command is blocked.
- **Logging:** Use `grove.logger.create_logger()`. Log command execution start (DEBUG level), completion (DEBUG), blocks (WARNING), and timeouts (WARNING).
- **No Windows support needed:** The `preexec_fn=os.setsid` and `os.killpg` calls are Unix-only. The autonomous runtime targets Linux/macOS containers.

## Acceptance Criteria

- [ ] Terminal tool executes commands and returns structured output (status, output, error, exit_code, duration_seconds)
- [ ] Dangerous commands blocked with clear explanation listing which pattern(s) matched
- [ ] Command normalization strips ANSI escapes, null bytes, and applies NFKC normalization
- [ ] Output capped at 50KB with head (40%) + tail (60%) strategy
- [ ] Secrets redacted from output (KEY/TOKEN/SECRET/PASSWORD/CREDENTIAL/AUTH patterns)
- [ ] Timeout enforced with SIGTERM then SIGKILL escalation
- [ ] Process group isolation via `os.setsid` / `os.killpg`
- [ ] `uv run pyright -p pyrightconfig.ci.json` passes with zero errors
- [ ] `uv run ruff check` and `uv run ruff format --check` pass on new files
- [ ] Unit tests cover pattern detection, normalization, execution, timeout, truncation, and redaction

## References

- Milestone: [M33-grove-autonomous-runtime.md](../../milestones/M33-grove-autonomous-runtime.md)
- Pattern reference: `packages/grove/src/grove/tools/base.py` (GroveBaseTool)
- Pattern reference: `packages/grove/src/grove/tools/system/send_message.py` (existing system tool)
- Design doc: `wiki/queries/research-grove-autonomous-runtime-design.md`
