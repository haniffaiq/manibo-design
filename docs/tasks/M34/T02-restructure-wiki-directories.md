# T02: Restructure wiki directories + update SCHEMA.md terminology

> **Milestone**: M34-wiki-as-source-of-truth
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: None (runs in parallel with T01)

---

## Description

Replace the old wiki directory structure (`entities/`, `concepts/`, `sources/`, `synthesis/`) with the new domain-grouped structure (`architecture/`, `solutions/`, `systems/`, `guides/`, `history/`). Update SCHEMA.md with new terminology (`invariants` → `rules`, drop `entities` concept). Delete all LLM-generated draft pages (they'll be rewritten from scratch in T03–T06).

## Subtasks

- [ ] **Delete old wiki directories and their LLM-draft content**
  ```bash
  rm -rf wiki/entities/ wiki/concepts/ wiki/sources/ wiki/synthesis/
  ```
  These are all LLM-generated drafts from 2026-04-08. No preservation needed — T03–T06 write comprehensive replacements from source-code scans + history digests.

- [ ] **Create new directory structure**
  ```bash
  mkdir -p wiki/architecture wiki/solutions wiki/systems wiki/guides wiki/history
  ```

- [ ] **Rewrite `wiki/SCHEMA.md`** — simplified for the new structure:
  - Remove the `concept-first entity pages` section (no longer needed — there are no separate entity/source/concept page types)
  - Remove the `type:` enumeration (`concept | entity | source | query | synthesis | debug`) — pages are now just pages, grouped by directory
  - Add `## Terminology` section: **rules** (not invariants), **components** (not entities), plain language for juniors + AI agents
  - Add `## Directory Structure` matching the new layout from the milestone doc
  - Add `## Page Format` — simplified frontmatter (title, tags, last-verified, related) + required sections (what it is, rules, how it works, module map, related pages)
  - Keep the `INGEST`, `QUERY`, `LINT`, `DEBUG` operations (they still apply)
  - Keep `log.md` and `index.md` conventions
  - Keep the `queries/` and `debug/` conventions
  - Update the Zero-Memory onboarding sequence to match the new 2–3 step flow
  - Update cross-references and wikilink examples to use new paths

- [ ] **Preserve `wiki/queries/` and `wiki/debug/`** — these directories stay as-is (they have their own conventions and may have real content)

- [ ] **Preserve `wiki/log.md`** — append-only, do not modify existing entries

- [ ] **Preserve `wiki/index.md`** temporarily — it will be fully rewritten in T07 after all pages are written

- [ ] **Update `AGENTS.md`** references to old wiki paths
  - Replace `wiki/entities/` → `wiki/architecture/` or `wiki/systems/` as appropriate
  - Replace `wiki/concepts/` → `wiki/systems/` or `wiki/guides/` as appropriate
  - Replace `wiki/synthesis/` → `wiki/architecture/` or `wiki/guides/` as appropriate
  - Note: T09 does a full rewrite of the onboarding sequence; this task only prevents broken references in the interim

- [ ] **Verify no scripts or tests reference old wiki paths**
  ```bash
  rg 'wiki/entities/|wiki/concepts/|wiki/sources/|wiki/synthesis/' --type py --type sh --type yaml
  ```
  Fix any hits.

## Files to Create/Modify

| File/Dir | Action | Description |
|----------|--------|-------------|
| `wiki/entities/` | Delete (recursive) | Old LLM-draft entity pages |
| `wiki/concepts/` | Delete (recursive) | Old LLM-draft concept pages |
| `wiki/sources/` | Delete (recursive) | Old LLM-draft source pages |
| `wiki/synthesis/` | Delete (recursive) | Old LLM-draft synthesis pages |
| `wiki/architecture/` | Create dir | New — 8 pages will land here in T03 |
| `wiki/solutions/` | Create dir | New — 7 pages in T04 |
| `wiki/systems/` | Create dir | New — 8 pages in T05 |
| `wiki/guides/` | Create dir | New — 3 pages in T06 |
| `wiki/history/` | Create dir | New — 5 pages in T02a |
| `wiki/SCHEMA.md` | Rewrite | New terminology + directory structure + simplified page format |
| `AGENTS.md` | Modify | Replace old wiki path references to prevent breakage |

## Acceptance Criteria

- [ ] Old dirs (`entities/`, `concepts/`, `sources/`, `synthesis/`) do not exist under `wiki/`
- [ ] New dirs (`architecture/`, `solutions/`, `systems/`, `guides/`, `history/`) exist under `wiki/`
- [ ] `wiki/SCHEMA.md` has a `## Terminology` section defining rules/components
- [ ] `wiki/SCHEMA.md` has no `concept-first entity pages` section
- [ ] `wiki/queries/`, `wiki/debug/`, `wiki/log.md` are untouched
- [ ] `rg 'wiki/entities/|wiki/concepts/|wiki/sources/|wiki/synthesis/' AGENTS.md` returns zero hits
- [ ] `uv run pytest tests/architecture/ -q` still passes

## Verification

```bash
test ! -d wiki/entities && test ! -d wiki/concepts && test ! -d wiki/sources && test ! -d wiki/synthesis
test -d wiki/architecture && test -d wiki/solutions && test -d wiki/systems && test -d wiki/guides && test -d wiki/history
grep -q '## Terminology' wiki/SCHEMA.md
! grep -q 'concept-first entity' wiki/SCHEMA.md
! rg 'wiki/entities/|wiki/concepts/|wiki/sources/|wiki/synthesis/' AGENTS.md
test -d wiki/queries && test -d wiki/debug && test -f wiki/log.md
uv run pytest tests/architecture/ -q
```

## References

- Milestone: [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md) — Design Decision D1, D2
- User directive: "entities i would rename to component/module", "I don't understand the invariant word", "let's group wiki with dedicated sub-dirs"
