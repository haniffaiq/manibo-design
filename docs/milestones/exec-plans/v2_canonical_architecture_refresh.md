# V2 Canonical Architecture Refresh

Date: 2026-03-15
Owner: Codex
Status: Completed

## Checklist anchors

- `docs/requirements/checklist.md:54` — pre-V2 contract prep is real, but the repo still needs one canonical architecture document that matches the V2 target contract.

## Objective

Replace the old canonical architecture spec in `wiki/architecture/architecture.md` with the confirmed V2 architecture target, keep it
cleanly normative, regenerate `docs/arch/arch_spine.md`, and leave the execution-plan details in
`docs/milestones/exec-plans/v2_canonical_architecture_refresh.md`.

## Scope

1. update `wiki/architecture/architecture.md` so it becomes the new architecture source of truth
2. keep section numbering and generated-spine extraction contracts valid
3. include the required ASCII diagrams directly in the canonical doc
4. regenerate `docs/arch/arch_spine.md`
5. keep implementation sequencing/status out of the canonical spec

## Constraints

- `wiki/architecture/architecture.md` is canonical; implementation phases and migration sequencing stay in exec plans
- `docs/arch/arch_spine.md` must remain generated from `wiki/architecture/architecture.md`
- the canonical vocabulary remains `organization`
- the architecture may describe package families beyond `solutions/*`, but it must not lie about current enforcement or proof obligations

## Outcome

1. `wiki/architecture/architecture.md` was rewritten as the V2 canonical source of truth for platform architecture.
2. The canonical doc now includes the V2 layering model, package-family model, public-ingress contract, control-plane contract, governed content, workflow binding model, privacy traversal, and proof-backed observability.
3. `docs/milestones/exec-plans/v2_canonical_architecture_refresh.md` was synchronized into the branch so the execution plan no longer competes with the canonical spec.
4. `docs/arch/arch_spine.md` was regenerated from the new canonical architecture doc.
5. Verification passed:
   - `uv run python tools/scripts/sync_arch_spine.py --check`
   - `uv run pytest tests/architecture/test_arch_spine_sync.py -q --tb=short`
   - `git diff --check`
