# T05: Affidea Starter Profile Config

> **Milestone**: M41-nfq-affidea-prompt-kb-foundation
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T02, T03, T04

---

## Description

Add an Affidea starter/profile that validates with the current Grove
`AgentConfig` parser and consumes the M41 prompt/KB foundation without replacing
the existing clinic-registration starter.

## Subtasks

- [x] **Add Affidea starter config**: create a new Affidea voice-booking YAML
      config that validates with current `AgentConfig`.
- [x] **Wire profile loading**: add solution-owned loader/profile helpers for
      the Affidea starter while keeping the clinic-registration loader stable.
- [x] **Use prompt foundation**: compose or reference the copied prompt and KB
      foundation in the starter path without duplicating copied prompt text.
- [x] **Protect existing starter**: prove `clinic_registration_agent.yaml`
      behavior and manifest starter loading remain unchanged.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/configs/affidea_voice_booking_agent.yaml` | Create | New Affidea starter config validating against current `AgentConfig` |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_agent_profiles.py` | Create | Affidea starter/profile loading helpers |
| `solutions/appointment_booking/src/appointment_booking/manifest.py` | Modify | Add the Affidea starter only if it can be loaded without breaking existing starters |
| `solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` | Modify | Add Affidea prompt/profile validation tests where appropriate |
| `solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py` | Modify | Assert existing starter/profile behavior remains unchanged |
| `docs/tasks/M41/PROGRESS.md` | Modify | Mark T05 progress and evidence |
| `wiki/log.md` | Modify | Append a short T05 progress note |

## Implementation Notes

- M41 may validate the Affidea config against the current flat
  `flow_definition`; it must not require the grouped-flow runtime from M41.2.
- If current `AgentConfig` cannot directly reference external prompt assets,
  use a solution-owned loader/build step and keep the generated YAML
  deterministic.
- Tool aliases for demo prompt wording are allowed only as explicit config/code
  mapping. Do not silently rewrite copied prompt text.
- The existing `clinic_registration_agent.yaml` must stay behaviorally stable.

## Acceptance Criteria

- [x] Affidea starter config validates with `parse_agent_config`.
- [x] The appointment-booking manifest can expose both clinic-registration and
      Affidea starters without disabling either.
- [x] Tests prove the existing clinic-registration starter still uses the same
      tool surface and voice-channel settings.
- [x] Tests prove the Affidea starter does not reference unavailable provider
      API tools or grouped-flow runtime behavior.
- [x] No production routing, phone-number assignment, or provider API calls are
      added.

## Evidence

- Added a new Affidea source starter config at
  `solutions/appointment_booking/configs/affidea_voice_booking_agent.yaml`.
- Added `affidea_agent_profiles.py` to compile copied prompt assets, generated
  KB snapshots, and STT keyword context into a deterministic current
  `AgentConfig`.
- Updated the appointment-booking manifest so the existing
  `clinic_registration` starter remains unchanged and the new
  `affidea_voice_booking` starter is exposed independently.
- Verification:
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q` -> 29 passed
  - `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_agent_profiles.py solutions/appointment_booking/src/appointment_booking/manifest.py solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py` -> 0 errors
  - `uv run ruff check solutions/appointment_booking/src/appointment_booking/voice/affidea_agent_profiles.py solutions/appointment_booking/src/appointment_booking/manifest.py solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py` -> passed
  - `uv run python -c 'import yaml; from pathlib import Path; from grove.config.loader import parse_agent_config; parse_agent_config(yaml.safe_load(Path("solutions/appointment_booking/configs/affidea_voice_booking_agent.yaml").read_text())); print("affidea source config parses")'` -> affidea source config parses
  - `git diff --check` -> passed

## References

- Depends on: [T02](T02-demo-prompt-asset-copy.md), [T03](T03-prompt-loader-and-composer.md), [T04](T04-deterministic-kb-snapshots.md)
- Milestone: [M41-nfq-affidea-prompt-kb-foundation.md](../../milestones/M41-nfq-affidea-prompt-kb-foundation.md)
- Current config test: `solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py`
