# T01: Prompt Asset Layout And Provenance

> **Milestone**: M41-nfq-affidea-prompt-kb-foundation
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: None

---

## Description

Define the solution-owned layout and provenance contract for Affidea prompt
assets before copying prompt text. This keeps prompt import auditable and gives
later tasks one stable place to load prompt source metadata.

## Subtasks

- [x] **Define asset layout**: create the package/resource layout for Affidea
      prompt assets under `solutions/appointment_booking`.
- [x] **Define provenance shape**: record the required metadata for each copied
      source file: source path, source hash, normalization policy, target path,
      and owner.
- [x] **Add contract tests**: add tests that prove the layout/provenance schema
      is explicit before prompt text is copied.
- [x] **Document source inventory**: list all demo prompt and KB source files
      that M41 is allowed to copy.

## Verification Evidence

- `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 6 passed
- `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> 0 errors
- `uv run ruff check solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> passed
- `git diff --check` -> passed

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/__init__.py` | Create | Public package marker for Affidea prompt assets |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/provenance.py` | Create | Typed provenance record and source inventory constants |
| `solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` | Create | Prompt asset layout and provenance contract tests |
| `docs/tasks/M41/PROGRESS.md` | Modify | Mark T01 in progress/done and record evidence |
| `wiki/log.md` | Modify | Append a short T01 progress note |

## Implementation Notes

- Do not copy prompt content in T01 except tiny fixture strings needed for
  contract tests.
- Use package-resource friendly paths so later tasks can load assets from an
  installed wheel, not only from the repository checkout.
- Use SHA-256 for source hashes.
- Keep the provenance contract solution-owned. Do not add Grove code for this.

## Acceptance Criteria

- [x] Target prompt asset layout is represented in code.
- [x] Provenance records include source path, target path, source hash, and
      normalization policy.
- [x] Source inventory includes all approved demo prompt and KB files.
- [x] Unit tests fail closed for missing provenance fields.
- [x] `clinic_registration_agent.yaml` is unchanged.

## References

- Milestone: [M41-nfq-affidea-prompt-kb-foundation.md](../../milestones/M41-nfq-affidea-prompt-kb-foundation.md)
- Design: [nfq-langgraph-affidea-voice-booking.md](../../../wiki/design-docs/nfq-langgraph-affidea-voice-booking.md)
- Source prompts: `demo/affidea_assistant/prompts`
- Source KB: `demo/affidea_assistant/knowledge_base`
