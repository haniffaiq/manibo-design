# T06: Ship PR

> **Milestone**: M41-nfq-affidea-prompt-kb-foundation
> **Status**: Done
> **Estimate**: M (2-4h)
> **Depends on**: T05

---

## Description

Run final M41 verification, complete the garbage-collection pass, update
progress/docs, and prepare the PR evidence. This is the required Ship-PR task
for the milestone.

## Subtasks

- [x] **Run milestone verification**: run all commands listed in the milestone
      and record exact results.
- [x] **Run focused architecture checks**: run any prompt/package/resource
      checks affected by the implementation.
- [x] **Garbage-collection pass**: remove redundant prompt helpers, stale
      copied scaffolding, or unused test fixtures introduced in M41.
- [x] **Update durable progress**: mark task/milestone status, append
      `wiki/log.md`, and update the milestone doc evidence.
- [x] **Prepare PR body**: include tests, docs, GC pass, caveats, and explicit
      non-goals.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `docs/tasks/M41/PROGRESS.md` | Modify | Final task and milestone status |
| `docs/milestones/M41-nfq-affidea-prompt-kb-foundation.md` | Modify | Final evidence and any caveats |
| `docs/milestones/README.md` | Modify | Mark M41 task/progress status if implementation completes |
| `wiki/log.md` | Modify | Append completion note |

## Implementation Notes

- This is the milestone's last task. Do not open the PR until this task is
  complete or explicitly blocked.
- Do not use this task to add new prompt behavior. Any missing implementation
  belongs in T01-T05.
- If broad Pyright fails outside the M41 surface, document the unrelated files
  and still provide scoped proof for the changed M41 surface.
- k3d proof is not required unless runtime behavior changes beyond config
  validation.

## Verification

```bash
uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q
uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q
uv run pyright solutions/appointment_booking/src/ packages/grove/src/
uv run ruff check solutions/appointment_booking/src/ solutions/appointment_booking/tests/
git diff --check
```

## Acceptance Criteria

- [x] Full M41 verification commands pass or scoped blockers are documented.
- [x] Prompt provenance and drift tests pass.
- [x] KB determinism and no-live-data tests pass.
- [x] Existing clinic-registration starter tests pass.
- [x] GC pass is complete and summarized.
- [x] PR body can cite task evidence without relying on chat.

## Evidence

- Final verification:
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 28 passed
  - `uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q` -> 7 passed
  - `uv run pytest solutions/appointment_booking/tests/unit/test_manifest_starters.py -q` -> 3 passed
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py solutions/appointment_booking/tests/unit/test_manifest_starters.py -q` -> 38 passed
  - `uv run ruff check solutions/appointment_booking/src/ solutions/appointment_booking/tests/` -> passed
  - `uv run pytest packages/grove/tests/unit/architecture/test_import_boundaries.py -q` -> 1 passed
  - `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_agent_profiles.py solutions/appointment_booking/src/appointment_booking/manifest.py solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py solutions/appointment_booking/tests/unit/test_manifest_starters.py` -> 0 errors
  - `uv run python -c 'import yaml; from pathlib import Path; from grove.config.loader import parse_agent_config; parse_agent_config(yaml.safe_load(Path("solutions/appointment_booking/configs/affidea_voice_booking_agent.yaml").read_text())); print("affidea source config parses")'` -> affidea source config parses
  - `uv run python -c 'from appointment_booking.voice.affidea_agent_profiles import affidea_voice_booking_agent_starter_yaml; text = affidea_voice_booking_agent_starter_yaml(); blocked = [name for name in ["search_available_slots", "select_slot", "lookup_user_by_id", "load_stt_keywords", "verify_user_identity", "proceed_to_booking", "request_human_agent", "transfer_to_mri_booking", "transfer_to_consultation_booking", "end_conversation", "check_availability(service_id", "check_availability(slot_id", "book_appointment(slot_id, service_id"] if name in text]; assert not blocked, blocked; print("rendered starter excludes unsupported demo names and signatures")'` -> rendered starter excludes unsupported demo names and signatures
  - `rg -n "2026-02-06|932776|slot_id:\s*[0-9]+|patient_identity:|patient_phone:|booking_result:|reservation_result:" solutions/appointment_booking/src/appointment_booking/data/affidea_knowledge` -> no matches
  - `git diff --check` -> passed
- Broad milestone pyright note:
  - `uv run pyright solutions/appointment_booking/src/ packages/grove/src/` failed on unrelated Grove Temporal files:
    `packages/grove/src/grove/temporal/tool_execution.py:53` reports unused private function
    `_tool_execution_error`, and
    `packages/grove/src/grove/temporal/tool_execution_activity.py:23` reports private usage of that helper.
  - `git diff -- packages/grove/src/grove/temporal/tool_execution.py packages/grove/src/grove/temporal/tool_execution_activity.py` -> no diff.
- GC pass:
  - Removed no additional files. Kept the prompt provenance, loader, composer,
    KB renderer, and Affidea profile compiler because each is exercised by
    focused tests and backs a task acceptance criterion.

## Review Feedback Follow-Up

- Adapted demo-only prompt tool names at Affidea profile compile time instead
  of rewriting copied source prompt assets. The rendered starter now contains
  only registered runtime tool names or current route decisions.
- Tightened the rendered starter contract so availability calls use
  `specialty_id`/`city_id`, the fake slot-lock step is removed, booking nodes
  can capture identity/details before price and booking, and auth can route back
  to consultation or MRI booking paths.
- Updated `test_manifest_starters.py` so the existing manifest unit test expects
  both `clinic_registration` and `affidea_voice_booking`.
- Fixed the NFQ Affidea Voice Booking milestone table so M41 is `done` in both
  index locations.
- Updated `wiki/solutions/appointment-booking.md` to list both manifest
  starters.
- Updated the auth prompt adaptation so successful identity capture routes back
  into consultation or MRI booking instead of ending the conversation, and
  documented the current capture fields used by `confirm_identity` and
  `collect_patient_details`.
- Split generation-only KB source inputs from materialized KB package resources
  so provenance no longer claims source YAML/scripts are shipped as runtime
  assets.
- Added reachable specialist transfer routes to the current flat starter graph
  so rendered `route=mri` and `route=consultation` prompt tokens are both
  allowed and conditionally mapped by the relevant specialist nodes.
- Added an explicit front-desk tool list so the node cannot inherit every
  runtime tool through Grove's `tools: null` semantics.
- Made auth prompt adaptation targeted so successful identity capture resumes
  consultation/MRI booking while explicit caller termination still uses
  `route=done`.
- Split rendered prompt contracts by node tool surface: non-booking nodes now
  receive route-only handoff/transfer guidance, booking nodes receive only the
  booking tools bound on those nodes, and the global mission no longer defines
  node-specific tool calls.
- Replaced the rendered auth prompt's demo lookup/name-match flow with the
  current capture flow for `confirm_identity` and `collect_patient_details`.
- Derived the rendered auth prompt from the copied `auth_prompt.yaml` asset
  preamble, replacing only the stale demo process/tool section with the current
  Grove capture process.
- Added `route=continue` self-routes to consultation and MRI booking nodes so
  the current flat starter can keep the caller in the active booking path after
  booking-tool turns.
- Stripped demo/provider IDs from generated Affidea KB snapshots and rendered
  starter prompts. Runtime instructions now keep service/clinic/price facts as
  reference text and require current ID resolution through
  `search_clinic_booking_options`.
- Removed remaining automatic-authentication claims from rendered booking
  prompts. Consultation and MRI booking instructions now require explicit
  `confirm_identity` and `collect_patient_details` before price confirmation
  or booking.
- Verification:
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 33 passed
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py solutions/appointment_booking/tests/unit/test_manifest_starters.py -q` -> 43 passed
  - `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_agent_profiles.py solutions/appointment_booking/src/appointment_booking/manifest.py solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py solutions/appointment_booking/tests/unit/test_manifest_starters.py` -> 0 errors
  - `uv run ruff check solutions/appointment_booking/src/appointment_booking/voice/affidea_agent_profiles.py solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/knowledge.py solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> passed
  - `uv run ruff format --check solutions/appointment_booking/src/appointment_booking/voice/affidea_agent_profiles.py solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/knowledge.py solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> 3 files already formatted
  - Rendered starter guard -> excludes stale demo tool/auth semantics, strips automatic-authentication claims, strips demo/provider IDs, preserves auth end/resume routes, verifies booking `route=continue` self-routes, verifies node instruction tool calls are subsets of each node's explicit `tools`, and verifies the global mission has no node-specific tool calls.
  - `rg -n "2026-02-06|932776|slot_id:\s*[0-9]+|patient_identity:|patient_phone:|booking_result:|reservation_result:" solutions/appointment_booking/src/appointment_booking/data/affidea_knowledge` -> no matches
  - `rg -n "service_id|deptId|priceId|cityId|31003\s*=|17507\s*=|18067\s*=|28338\s*=|10278\s*=|13783\s*=|23485\s*=|28500\s*=|29644\s*=" solutions/appointment_booking/src/appointment_booking/data/affidea_knowledge` -> no matches
  - `git diff --check` -> passed

## References

- Depends on: [T05](T05-affidea-starter-profile-config.md)
- Milestone: [M41-nfq-affidea-prompt-kb-foundation.md](../../milestones/M41-nfq-affidea-prompt-kb-foundation.md)
