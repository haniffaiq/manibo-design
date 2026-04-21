# T02: Demo Prompt Asset Copy

> **Milestone**: M41-nfq-affidea-prompt-kb-foundation
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T01

---

## Description

Copy the approved Affidea demo prompt files into solution-owned prompt assets
without changing their behavior text. This task establishes the source prompt
baseline that later loader/config work can consume.

## Subtasks

- [x] **Copy prompt files**: copy the six approved YAML prompt/STT files from
      `demo/affidea_assistant/prompts`.
- [x] **Record hashes**: add source SHA-256 hashes for each copied file.
- [x] **Keep normalizations mechanical**: declare any newline, encoding, or key
      ordering normalization explicitly.
- [x] **Add drift tests**: prove copied prompt content matches source input
      except for declared mechanical normalization.

## Verification Evidence

- `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 9 passed
- `uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q` -> 6 passed
- `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> 0 errors
- `uv run ruff check solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> passed
- `git diff --check` -> passed

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/assets/global_instructions.yaml` | Create | Copied shared Affidea voice policy |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/assets/frontdesk_prompt.yaml` | Create | Copied front-desk prompt |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/assets/consultation_prompt.yaml` | Create | Copied consultation prompt |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/assets/mri_prompt.yaml` | Create | Copied MRI prompt |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/assets/auth_prompt.yaml` | Create | Copied auth prompt |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/assets/stt_keywords.yaml` | Create | Copied STT keyword hints |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/provenance.py` | Review | Copied prompt target paths and hashes were added in T01 |
| `solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` | Modify | Add content/hash drift tests |
| `docs/tasks/M41/PROGRESS.md` | Modify | Mark T02 progress and evidence |
| `wiki/log.md` | Modify | Append a short T02 progress note |

## Implementation Notes

- The source files are:
  - `demo/affidea_assistant/prompts/global_instructions.yaml`
  - `demo/affidea_assistant/prompts/frontdesk_prompt.yaml`
  - `demo/affidea_assistant/prompts/consultation_prompt.yaml`
  - `demo/affidea_assistant/prompts/mri_prompt.yaml`
  - `demo/affidea_assistant/prompts/auth_prompt.yaml`
  - `demo/affidea_assistant/prompts/stt_keywords.yaml`
- Do not rewrite prompt copy for tone or style in this milestone.
- Runtime tool-name aliasing belongs in T03/T05 code/config, not by silently
  changing copied prompt text.

## Acceptance Criteria

- [x] All approved prompt files exist under solution-owned package assets.
- [x] Every copied file has a provenance record with source path and SHA-256.
- [x] Drift tests compare copied content to the source files.
- [x] No copied prompt file contains live slot data, patient data, or booking
      results.
- [x] Existing clinic-registration config tests still pass.

## References

- Depends on: [T01](T01-prompt-asset-layout-and-provenance.md)
- Milestone: [M41-nfq-affidea-prompt-kb-foundation.md](../../milestones/M41-nfq-affidea-prompt-kb-foundation.md)
- Source prompts: `demo/affidea_assistant/prompts`
