# T08: Delete ALL absorbed `docs/` content + rewrite `wiki/index.md` as pointer

> **Milestone**: M34-wiki-as-source-of-truth
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T07 (wiki must be complete and indexed before deleting docs/)

---

## Description

After T07 the wiki is comprehensive. **Delete everything in `docs/` except `docs/arch/generated/` and `wiki/index.md`.** This includes milestones, tasks, requirements, exec-plans — all of it. T02a already absorbed the execution history + requirements into `wiki/history/` digests. The wiki is now the only documentation surface; source code is the only raw source.

## What gets deleted (use `git rm -r`)

**Architecture + design:**
- `wiki/architecture/architecture.md`, `wiki/architecture/architecture.md (status section)`, `wiki/guides/core-beliefs.md`
- `docs/arch/arch_spine.md`, `docs/arch/maps/`
- `wiki/architecture/grove.md` (absorbed from former Grove docs directory)
- `wiki/design-docs/` (entire directory)

**Operations:**
- `wiki/ops/` (entire directory — includes ci-operations, harness_engineering, k3d-local-stack, local-observability, pre-pr-checklist, README, runbooks, agent-prompts, audits)

**Contributing + distribution + solutions:**
- `wiki/guides/development-workflow.md`
- `wiki/distribution/` (entire directory)
- solution docs (already removed)

**Execution history (absorbed into wiki/history/):**
- `docs/milestones/` (entire directory — all 45 milestone docs including completed/)
- `docs/tasks/` (entire directory — all 283 task files, PROGRESS files, templates)
- `docs/requirements/` (entire directory — checklist.md, ui-requirements.md, nfq.md, vox.md, SOW_MAPPING.md)
- `docs/milestones/exec-plans/` (entire directory — exec-plans previously under archived/)

**Remaining misc:**
- `wiki/queries/`, `wiki/testing/`, `wiki/diagram/`
- `docs/AGENTS.md` (if present as separate file, not symlink — check first)

## What survives

| Path | Reason |
|------|--------|
| `docs/arch/generated/` | Auto-generated from code, CI-verified. Not wiki material. |
| `wiki/index.md` | Rewritten as a 5-line pointer to `wiki/index.md` |

## Subtasks

- [ ] **Content-coverage verification (MANDATORY before any deletion)**

  File existence alone is not enough. For each `docs/` file being deleted, verify the wiki **actually absorbed its load-bearing content** — not just that a wiki page with the right name exists.

  **Procedure for each docs/ file:**
  1. Read the original `docs/` file end-to-end
  2. List every load-bearing claim: rules, design decisions, procedures, requirements, constraints, acceptance criteria
  3. For each claim, grep the wiki to confirm it appears somewhere:
     ```bash
     # Example: checking that a rule from ARCHITECTURE.md landed in the wiki
     rg "Grove never imports platform" wiki/
     ```
  4. If a claim is NOT in the wiki, add it to the relevant wiki page BEFORE deleting the source
  5. Only proceed to deletion after 100% coverage is confirmed

  **Per-area verification checklist:**

  - [ ] `wiki/architecture/architecture.md` → every numbered rule appears in `wiki/architecture/architecture.md`
    - Count rules in original: `grep -c '^[0-9]' wiki/architecture/architecture.md` or similar
    - Count rules in wiki: `grep -c '^### Rule' wiki/architecture/architecture.md`
    - If wiki count < original count, find the missing rules and add them
  - [ ] `wiki/architecture/grove.md` → every grove responsibility, internal layer rule, and extensibility seam appears in `wiki/architecture/grove.md`
  - [ ] `wiki/systems/voice.md` → every voice pipeline decision appears in `wiki/systems/voice.md`
  - [ ] `wiki/design-docs/code-style.md` → every coding rule appears in `wiki/guides/code-style.md`
    - Spot-check 5 specific rules: async-first I/O, RLS tenant_connection, StrEnum for persisted values, JsonObject not Any, no direct os.environ
    ```bash
    rg "asyncpg" wiki/guides/code-style.md
    rg "tenant_connection" wiki/guides/code-style.md
    rg "StrEnum" wiki/guides/code-style.md
    rg "JsonObject" wiki/guides/code-style.md
    rg "os.environ" wiki/guides/code-style.md
    ```
  - [ ] `wiki/design-docs/core-beliefs.md` → every belief appears in `wiki/guides/core-beliefs.md`
  - [ ] `wiki/design-docs/react-best-practices.md` → every React pattern appears in `wiki/architecture/frontend.md`
  - [ ] `wiki/architecture/ci.md` → merge-gate topology, scope routing, PR readiness checks all appear in `wiki/architecture/ci.md`
  - [ ] `wiki/ops/harness_engineering.md` → UI verification gate, Playwright + DevTools discipline appears in `wiki/systems/testing.md`
  - [ ] `wiki/ops/k3d-local-stack.md` → k3d setup, worktree isolation, k3d-up.sh appears in `wiki/architecture/infrastructure.md`
  - [ ] `wiki/ops/local-observability.md` → Tempo/Loki/Prometheus/Grafana stack appears in `wiki/systems/observability.md`
  - [ ] `wiki/ops/pre-pr-checklist.md` → every checklist item appears in `wiki/architecture/ci.md` or `wiki/guides/development-workflow.md`
  - [ ] `wiki/guides/development-workflow.md` → setup sequence, gates, commit conventions, PR process all appear in `wiki/guides/development-workflow.md`
    ```bash
    rg "uv sync" wiki/guides/development-workflow.md
    rg "pre-pr-ci" wiki/guides/development-workflow.md
    rg "conventional commit" wiki/guides/development-workflow.md
    rg "worktree" wiki/guides/development-workflow.md
    ```
  - [ ] `docs/requirements/checklist.md` → load-bearing checklist rows are captured in `wiki/history/platform-features.md` or the relevant wiki topic page
  - [ ] `docs/requirements/ui-requirements.md` → UI requirements are captured in `wiki/history/platform-features.md` or `wiki/architecture/frontend.md`
  - [ ] `docs/requirements/nfq.md` + `vox.md` + `SOW_MAPPING.md` → client-specific requirements are captured in `wiki/history/platform-features.md` and `wiki/history/telephony-distribution.md`
  - [ ] `docs/milestones/*.md` → design decisions and sequencing rationale from each milestone appear in the relevant `wiki/history/*.md` digest
  - [ ] `docs/tasks/M*/T*.md` → execution history (what was actually built, acceptance criteria, lessons) appears in the relevant `wiki/history/*.md` digest

  **If ANY claim is missing from the wiki: STOP. Add it to the wiki page. Then continue.**

  This verification is the most important step in M34. A deleted `docs/` file with un-absorbed content is lost knowledge. Take the time.

- [ ] **After verification passes — delete everything except arch/generated:**
  ```bash
  # Delete all top-level docs/ files
  git rm wiki/architecture/architecture.md wiki/architecture/architecture.md (status section) wiki/guides/core-beliefs.md wiki/guides/development-workflow.md

  # Delete all docs/ directories except arch/generated
  for dir in docs/arch/maps docs/grove docs/design-docs docs/ops docs/distribution \
             docs/solutions docs/archived docs/milestones docs/tasks docs/requirements \
             docs/research docs/testing docs/ui docs/diagram; do
    [ -d "$dir" ] && git rm -r "$dir"
  done

  # Delete arch_spine but keep generated/
  git rm docs/arch/arch_spine.md
  ```

- [ ] **Rewrite `wiki/index.md`**:
  ```markdown
  # docs/

  All documentation lives in the wiki: **[wiki/index.md](../wiki/index.md)**

  Only `arch/generated/` remains here (auto-generated from code, CI-verified).
  ```

- [ ] **Fix broken references across the repo**:
  ```bash
  rg 'docs/ARCHITECTURE|docs/milestones|docs/tasks|docs/requirements|docs/grove|docs/design-docs|docs/ops|docs/CONTRIBUTING' --type md --type py --type sh --type yaml
  ```
  Replace all hits with wiki paths or remove the references.

- [ ] **Handle AGENTS.md carefully**: `AGENTS.md` is at repo root (symlinked as `CLAUDE.md`). It heavily references `docs/` paths. T09 rewrites the onboarding sequence, but T08 should at minimum update paths that would break immediately. OR: run T08 and T09 as a single commit if needed.

## Acceptance Criteria

- [ ] **Content-coverage verification passed** — every load-bearing claim from every deleted file has a verified home in the wiki (per-area checklist above is fully checked off)
- [ ] Any missing claims were added to the wiki BEFORE deletion
- [ ] `docs/` contains ONLY `arch/generated/` and `index.md`
- [ ] `docs/milestones/`, `docs/tasks/`, `docs/requirements/` do NOT exist
- [ ] `wiki/index.md` is under 10 lines, points at wiki
- [ ] `docs/arch/generated/` still exists with its auto-generated files
- [ ] Zero broken references to deleted `docs/` paths across the repo
- [ ] `uv run pytest tests/architecture/ -q` passes (some tests may reference docs/ paths — fix them)

## Verification

```bash
# Only arch/generated and index.md survive
find docs/ -type f | sort
# Expected:
# docs/arch/generated/api_inventory.md
# docs/arch/generated/system_graph.mmd
# wiki/index.md
# (possibly a few more generated files)

# Nothing else
for dir in docs/milestones docs/tasks docs/requirements docs/grove docs/design-docs \
           docs/ops docs/archived docs/distribution docs/solutions; do
  test ! -e "$dir" && echo "OK gone: $dir" || echo "FAIL: $dir"
done

# Pointer is tiny
lines=$(wc -l < wiki/index.md)
[ "$lines" -lt 10 ] && echo "OK index.md ($lines lines)"

# No broken refs
! rg 'docs/ARCHITECTURE|docs/milestones|docs/tasks/M|docs/requirements|docs/grove|docs/design-docs|wiki/ops/ci-operations|docs/CONTRIBUTING' --type md --type py --type sh --type yaml

# CI passes
uv run pytest tests/architecture/ -q
```

## References

- Milestone: [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md)
- wiki/history/ pages (from T02a) absorbed the execution history before this deletion
