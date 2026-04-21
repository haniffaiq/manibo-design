# T06: Write `wiki/guides/` pages (3 files)

> **Milestone**: M34-wiki-as-source-of-truth
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T02 (directory exists)

---

## Description

Write 3 guide pages under `wiki/guides/` covering development workflow, coding rules, and design philosophy. These absorb content from `wiki/guides/development-workflow.md`, `wiki/design-docs/code-style.md`, and `wiki/design-docs/core-beliefs.md`.

## Pages to write

### 1. `development-workflow.md`
- Setup: `uv sync`, `pnpm install`, `tools/scripts/dev/setup-local.sh`
- Brainstorm → plan → implement → verify → re-sync loop (ASCII diagram)
- Local gates: `ruff check`, `pyright`, `pnpm nx lint`, `pytest`
- Landing gate: `tools/scripts/review/pre-pr-ci.sh`
- PR review: `tools/scripts/review/pr-review.sh origin/main post_ci`
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `style:`
- Worktree-per-feature discipline
- One task = one commit, one milestone = one PR
- Branch naming: `feat/M{N}-{topic}`
- Wiki re-sync after merge
- Absorbs `wiki/guides/development-workflow.md` fully
- ASCII diagram: full development lifecycle
- 300–500 lines

### 2. `code-style.md`
- ALL coding rules from `wiki/design-docs/code-style.md` + `AGENTS.md` coding section:
  - Async-first I/O (asyncpg, aiohttp, aiofiles — never requests/subprocess.run/time.sleep)
  - DB: `tenant_connection(pool, tenant_id)`, no SQLAlchemy ORM
  - Config: Pydantic Settings, no `os.environ`
  - JSON: `JsonObject`/`JsonValue`, no `Any`/`object` on payload fields
  - DI: constructors wired in `bootstrap.py`
  - Types: Pydantic models / dataclasses, `StrEnum` for persisted values, no raw `dict`
  - Protocol vs ABC decision rule
  - Self-documenting names (ban vague verbs: process, handle, do_thing)
  - Comments explain *why* not *what*
  - Errors include offending value + context
  - File size <700 LOC
  - Tool schema guardrails (no `anyOf`/`oneOf`/`allOf`)
  - Observability: new behavior must emit OTLP spans + structured logs + metrics
  - STTCPW, boring technology, no AI attribution, American English
  - API design: prefixed object IDs, structured error responses
- Rewritten in plain language for non-native English juniors
- Absorbs `wiki/design-docs/code-style.md` fully
- 300–500 lines

### 3. `core-beliefs.md`
- Founding design philosophy
- Absorbs `wiki/design-docs/core-beliefs.md`
- Keep it concise — this is the "why" behind the coding rules
- 100–200 lines

## Implementation Notes

- **Read the `docs/` source files being absorbed** before writing. Preserve every load-bearing rule.
- **Plain language**: every rule must be understandable by a junior engineer whose first language is not English.
- **Don't duplicate architecture/architecture.md**: the rules page in architecture/ lists system-level rules. code-style.md lists coding rules. development-workflow.md lists process rules. Each page owns its domain.

## Acceptance Criteria

- [ ] 3 files exist under `wiki/guides/`
- [ ] `development-workflow.md` mentions: `uv sync`, `pnpm`, `pre-pr-ci.sh`, conventional commits, worktree-per-feature
- [ ] `code-style.md` covers all rules from `wiki/design-docs/code-style.md`
- [ ] `core-beliefs.md` covers all beliefs from `wiki/design-docs/core-beliefs.md`
- [ ] Each has at least 1 ASCII diagram (workflow page has the lifecycle diagram)
- [ ] No "invariant" / "entities" jargon
- [ ] `uv run pytest tests/architecture/ -q` passes

## Verification

```bash
for f in development-workflow code-style core-beliefs; do
  test -f "wiki/guides/$f.md" && echo "OK: $f" || echo "FAIL: $f"
done
grep -q 'pre-pr-ci' wiki/guides/development-workflow.md
grep -q 'asyncpg' wiki/guides/code-style.md
grep -q 'StrEnum' wiki/guides/code-style.md
! rg 'invariant' wiki/guides/
```

## References

- Milestone: [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md)
- Absorbed: wiki/guides/development-workflow.md, wiki/design-docs/code-style.md, wiki/design-docs/core-beliefs.md
