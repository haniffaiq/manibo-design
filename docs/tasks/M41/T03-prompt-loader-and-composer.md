# T03: Prompt Loader And Composer

> **Milestone**: M41-nfq-affidea-prompt-kb-foundation
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T02

---

## Description

Add a solution-owned prompt loader/composer that can layer shared voice policy,
node prompt text, deterministic KB text, and compact state summaries without
mixing those data classes together.

## Subtasks

- [x] **Load packaged assets**: load copied Affidea prompt assets through
      package-resource APIs.
- [x] **Model prompt roles**: expose typed prompt roles for shared, front desk,
      consultation, MRI, auth, and STT keyword assets.
- [x] **Compose layered prompt text**: build a deterministic composer for
      shared policy, node prompt, KB reference, and caller-provided state
      summary.
- [x] **Protect data boundaries**: tests prove live data enters only through
      composer inputs, not static prompt or KB assets.

## Verification Evidence

- `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 14 passed
- `uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q` -> 6 passed
- `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> 0 errors
- `uv run ruff check solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> passed
- `git diff --check` -> passed

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/loader.py` | Create | Package-resource loader for copied prompt assets |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/composer.py` | Create | Prompt layering/composition helpers |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/__init__.py` | Modify | Export public loader/composer types |
| `solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` | Modify | Add loader/composer tests |
| `docs/tasks/M41/PROGRESS.md` | Modify | Mark T03 progress and evidence |
| `wiki/log.md` | Modify | Append a short T03 progress note |

## Implementation Notes

- Use structured return values or dataclasses for loaded prompt assets. Avoid
  raw `dict[...]` for known shapes.
- Keep this in `solutions/appointment_booking`; do not add Grove runtime
  behavior in M41.
- The composer should be deterministic. Stable input order matters for prompt
  cache behavior.
- The composer should make the four layers visually and testably distinct:
  shared policy, node prompt, reference KB, and state summary.
- State summary content is an input to the composer. Do not persist live patient
  or slot data in reusable assets.

## Acceptance Criteria

- [x] Prompt assets load from package resources.
- [x] Shared and node-specific prompt assets can be selected by explicit role.
- [x] Prompt composition output is deterministic for the same inputs.
- [x] Tests prove KB text and state summary are separate layers.
- [x] Tests prove static assets do not contain live slot or patient data.

## References

- Depends on: [T02](T02-demo-prompt-asset-copy.md)
- Milestone: [M41-nfq-affidea-prompt-kb-foundation.md](../../milestones/M41-nfq-affidea-prompt-kb-foundation.md)
- Design sections: 7.6 Prompt Architecture, 7.8 Data Boundary Rules
