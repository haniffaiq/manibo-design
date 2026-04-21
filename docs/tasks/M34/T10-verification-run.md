# T10: Verification — full pre-PR CI + arch tests + spot check

> **Milestone**: M34-wiki-as-source-of-truth
> **Status**: Not Started
> **Estimate**: M (2-4h)
> **Depends on**: T01, T09 (all previous tasks must be complete)

---

## Description

Final verification gate before opening the M34 PR.

## Automated gates

```bash
tools/scripts/review/pre-pr-ci.sh
uv run pytest tests/architecture/ -q
uv run pytest packages/grove/tests/unit/architecture/ -q
uv run pyright -p pyrightconfig.ci.json
uv run ruff check
python3 tools/scripts/check_pr_readiness.py --template-sync
python3 tools/scripts/check_payload_types.py
python3 tools/scripts/check_api_inventory.py
```

## Wiki hygiene

```bash
# Structure correct
test -d wiki/architecture && test -d wiki/solutions && test -d wiki/systems && test -d wiki/guides && test -d wiki/history
test ! -d wiki/entities && test ! -d wiki/concepts && test ! -d wiki/sources && test ! -d wiki/synthesis

# Page counts
echo "architecture: $(ls wiki/architecture/*.md | wc -l)"  # 8
echo "solutions:    $(ls wiki/solutions/*.md | wc -l)"     # 7
echo "systems:      $(ls wiki/systems/*.md | wc -l)"       # 8
echo "guides:       $(ls wiki/guides/*.md | wc -l)"        # 3
echo "history:      $(ls wiki/history/*.md | wc -l)"       # 5

# No jargon
! rg 'invariant' wiki/ | grep -v SCHEMA.md | grep -v log.md

# No PR numbers in architecture/systems pages
! rg 'PR #[0-9]+' wiki/architecture/ wiki/systems/

# Every page has ASCII diagram
for f in wiki/architecture/*.md wiki/systems/*.md wiki/solutions/*.md; do
  grep -q '^+\-\|^|.*|' "$f" || echo "MISSING DIAGRAM: $f"
done

# Index matches disk
for section in architecture solutions systems guides history; do
  disk=$(ls wiki/$section/*.md 2>/dev/null | wc -l | tr -d ' ')
  idx=$(grep -c "$section/" wiki/index.md)
  [ "$disk" -eq "$idx" ] || echo "INDEX MISMATCH $section: disk=$disk idx=$idx"
done
```

## docs/ is clean

```bash
# Dead code gone
for p in src/grove grove-voice-livekit packages/platform-sdk \
         examples/logistics_driver tests/unit solutions/outbound_campaigns wiki/entities; do
  test ! -e "$p" || echo "STILL EXISTS: $p"
done

# ALL docs/ gone except arch/generated and index.md
find docs/ -type f | sort
# Expected: only docs/arch/generated/* and wiki/index.md

for p in docs/milestones docs/tasks docs/requirements docs/grove \
         docs/design-docs docs/ops docs/archived docs/distribution \
         docs/solutions wiki/architecture/architecture.md wiki/guides/development-workflow.md; do
  test ! -e "$p" || echo "STILL EXISTS: $p"
done

# Only arch/generated survives
test -d docs/arch/generated
test -f wiki/index.md
lines=$(wc -l < wiki/index.md)
[ "$lines" -lt 10 ]

# .artifacts/ ignored
grep -q '^\.artifacts/' .gitignore && grep -q '^\.artifacts/' .dockerignore
```

## Manual spot check

- [ ] Pick 10 random pages from wiki/architecture/, solutions/, systems/, guides/
- [ ] Each must have: valid title, at least 1 ASCII diagram, cross-links to other pages, plain language, no TODO/TBD/WIP markers, no broken links

## PR readiness

- [ ] Git status is clean
- [ ] Branch: `feat/M34-wiki-as-source-of-truth`
- [ ] Each commit follows `feat: M34 T{NN} - {desc}` format
- [ ] No merge commits

## References

- Milestone: [M34-wiki-as-source-of-truth.md](../../milestones/M34-wiki-as-source-of-truth.md)
