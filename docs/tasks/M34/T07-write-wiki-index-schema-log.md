# T07: Write `wiki/index.md` + update `SCHEMA.md` + append `log.md`

> **Milestone**: M34-wiki-as-source-of-truth
> **Status**: Not Started
> **Estimate**: S (< 2h)
> **Depends on**: T03, T04, T05, T06 (all pages must exist before the index lists them)

---

## Description

Write the flat scannable `wiki/index.md` matching the spec-index style (screenshot reference). Update `wiki/SCHEMA.md` if T02 left anything incomplete. Append the M34 ingest entry to `wiki/log.md`.

## Subtasks

### `wiki/index.md` — flat scannable entry point

- [ ] Count actual files per directory
- [ ] Write index with structure: heading per group, one line per page (link + one-liner per entry)
- [ ] Groups: Architecture & Infrastructure, Solutions, Cross-Cutting Systems, Guides, History, Debug, Queries
- [ ] Add "Start here" box at the top:
  ```
  ## Start here
  - First visit? → [architecture.md](architecture/architecture.md)
  - Looking for rules? → [architecture.md § Rules](architecture/architecture.md)
  - Want to contribute? → [development-workflow.md](guides/development-workflow.md)
  - Need coding rules? → [code-style.md](guides/code-style.md)
  ```
- [ ] Keep it under 80 lines. One line per page. No prose.

### `wiki/SCHEMA.md` — verify completeness

- [ ] Verify T02 updated terminology and directory structure
- [ ] If anything is missing, add it
- [ ] Simplify the Zero-Memory onboarding to: read index → read matching page → read history if needed

### `wiki/log.md` — append M34 entry

- [ ] Single entry at the bottom:
  ```
  ## [2026-04-09] ingest | M34 wiki rebuild — comprehensive source-grounded rewrite

  - Rebuilt wiki from scratch using 7 parallel source-code audit agents
  - New structure: architecture/ (8), solutions/ (7), systems/ (8), guides/ (3), history/ (5) = 31 pages
  - Deleted old directories: entities/, concepts/, sources/, synthesis/
  - Terminology: invariants → rules, entities → dropped
  - Dead code deleted: src/grove/, root grove-voice-livekit/, packages/platform-sdk/, empty examples + test dirs, solutions/outbound_campaigns/
  - docs/ absorption: ARCHITECTURE.md, grove/*, design-docs/*, ops/*, CONTRIBUTING.md, distribution/, solutions/ → wiki
  - Milestone history consolidated to Style B
  ```

## Acceptance Criteria

- [ ] `wiki/index.md` lists every page in `wiki/architecture/`, `solutions/`, `systems/`, `guides/`, `history/`
- [ ] Page counts in index match files on disk
- [ ] Index is under 80 lines
- [ ] `wiki/log.md` has a new 2026-04-09 entry (previous entries untouched)
- [ ] `uv run pytest tests/architecture/ -q` passes

## Verification

```bash
for section in architecture solutions systems guides history; do
  disk=$(ls wiki/$section/*.md 2>/dev/null | wc -l | tr -d ' ')
  idx=$(grep -c "$section/" wiki/index.md)
  [ "$disk" -eq "$idx" ] || echo "MISMATCH $section: disk=$disk idx=$idx"
done
lines=$(wc -l < wiki/index.md)
[ "$lines" -lt 80 ] && echo "OK index ($lines lines)"
tail -15 wiki/log.md | grep -q 'M34 wiki rebuild'
```

## References

- Milestone: [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md)
- Screenshot reference for index style
