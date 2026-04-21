# M41 Progress: NFQ Affidea Prompt and Knowledge Foundation

Milestone: `docs/milestones/M41-nfq-affidea-prompt-kb-foundation.md`
Status: Done
Branch: `feat/M41-nfq-affidea-prompt-kb`
Created: 2026-04-20
Depends on: M41.0

## Task Summary

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Prompt asset layout and provenance contract | Done | None |
| T02 | Demo prompt asset copy | Done | T01 |
| T03 | Prompt loader and composer | Done | T02 |
| T04 | Deterministic KB snapshots | Done | T01 |
| T05 | Affidea starter/profile config | Done | T02, T03, T04 |
| T06 | Ship PR | Done | T05 |

## Current State

- M41.0 is done and the appointment-booking package has the target package
  structure needed by this milestone.
- T01 is complete. Prompt/KB provenance records the approved source inventory,
  target package-resource paths, source hashes, normalization policies, and
  owner metadata.
- T02 is complete. The six approved demo prompt/STT files are copied under
  solution-owned prompt assets with declared repository whitespace
  normalization, drift tests, and serialized-live-state guards.
- T03 is complete. Prompt assets now load through package resources, explicit
  role enums select shared/node/STT assets, and the composer keeps shared
  policy, node prompt, KB reference text, state summary, and tool outputs in
  deterministic layers.
- T04 is complete. Front-desk, consultation, and MRI KB references are
  generated Markdown package resources with deterministic regeneration tests
  and live transactional-data guards.
- T05 is complete. The Affidea starter source YAML validates with the current
  Grove `AgentConfig`, and the solution-owned profile compiler injects copied
  prompt assets, deterministic KB snapshots, and STT keyword context without
  replacing the existing clinic-registration starter.
- T06 is complete. Final ship evidence is recorded, the GC pass found no
  redundant M41 scaffolding to remove, and the only broad verification blocker
  is an unrelated Grove Temporal pyright issue outside this branch's diff.
- The approved prompt source is `demo/affidea_assistant/prompts`.
- The approved deterministic KB reference source is
  `demo/affidea_assistant/knowledge_base`.

## Scope Guard

- Copy prompt behavior and prompt assets into solution-owned files.
- Keep copied prompt provenance explicit with source paths and hashes.
- Keep stable reference facts in generated deterministic KB files.
- Keep live slots, patient data, authentication state, and booking results out
  of prompt and KB files.
- Do not introduce Affidea provider API calls, Grove grouped-flow runtime
  changes, browser/operator UI, or production call routing in M41.

## Required Reading Before T01

- `docs/milestones/M41-nfq-affidea-prompt-kb-foundation.md`
- `wiki/design-docs/nfq-langgraph-affidea-voice-booking.md`
- `demo/affidea_assistant/prompts/global_instructions.yaml`
- `demo/affidea_assistant/prompts/frontdesk_prompt.yaml`
- `demo/affidea_assistant/prompts/consultation_prompt.yaml`
- `demo/affidea_assistant/prompts/mri_prompt.yaml`
- `demo/affidea_assistant/prompts/auth_prompt.yaml`
- `demo/affidea_assistant/prompts/stt_keywords.yaml`
- `demo/affidea_assistant/knowledge_base/README.md`

## Verification Plan

```bash
uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q
uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q
uv run pyright solutions/appointment_booking/src/ packages/grove/src/
uv run ruff check solutions/appointment_booking/src/ solutions/appointment_booking/tests/
```

## Notes

- The existing `clinic_registration_agent.yaml` starter must remain unchanged
  unless a task explicitly states otherwise.
- The Affidea starter can be added as a new starter/profile, but it must not
  replace the current clinic-registration starter.

## T01 Evidence

- Added `appointment_booking.voice.affidea_prompts` with typed provenance
  records for approved demo prompt and KB source files.
- Recorded source paths, package-resource target paths, source SHA-256 hashes,
  normalization policies, asset kind, and owner.
- Added unit tests for source inventory, uniqueness, relative target paths,
  source hash drift, and fail-closed construction.
- Verification:
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 6 passed
  - `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> 0 errors
  - `uv run ruff check solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> passed
  - `git diff --check` -> passed

## T04 Evidence

- Added deterministic Markdown KB snapshots for front desk, consultation, and
  MRI under `appointment_booking.data.affidea_knowledge`.
- Added `knowledge.py` with snapshot roles, metadata, package-resource loading,
  and a deterministic source-text-to-Markdown renderer.
- The renderer keeps stable source facts and removes the demo's sample live
  slot/date block before writing reusable KB assets.
- Added tests for package-resource loading, deterministic regeneration,
  live transactional-data exclusion, and prompt composer attachment of a
  selected KB snapshot.
- Verification:
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 18 passed
  - `uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q` -> 6 passed
  - `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> 0 errors
  - `uv run ruff check solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> passed
  - `rg -n "2026-02-06|932776|slot_id:\s*[0-9]+|patient_identity:|patient_phone:|booking_result:|reservation_result:" solutions/appointment_booking/src/appointment_booking/data/affidea_knowledge` -> no matches
  - `git diff --check` -> passed

## T05 Evidence

- Added `affidea_voice_booking_agent.yaml` as a compact source starter for the
  current flat Grove `flow_definition`.
- Added `affidea_agent_profiles.py` to compile the source starter into a
  deterministic `AgentConfig` by layering shared/node prompt assets, generated
  KB snapshots, and STT keyword context.
- Updated the appointment-booking manifest to expose both
  `clinic_registration` and `affidea_voice_booking` starters independently.
- Extended tests to prove the Affidea starter validates, uses only existing
  runtime tool names, avoids grouped-flow/provider API assumptions, and keeps
  the clinic-registration starter behavior stable.
- Verification:
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q` -> 29 passed
  - `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_agent_profiles.py solutions/appointment_booking/src/appointment_booking/manifest.py solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py` -> 0 errors
  - `uv run ruff check solutions/appointment_booking/src/appointment_booking/voice/affidea_agent_profiles.py solutions/appointment_booking/src/appointment_booking/manifest.py solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py` -> passed
  - `uv run python -c 'import yaml; from pathlib import Path; from grove.config.loader import parse_agent_config; parse_agent_config(yaml.safe_load(Path("solutions/appointment_booking/configs/affidea_voice_booking_agent.yaml").read_text())); print("affidea source config parses")'` -> affidea source config parses
  - `git diff --check` -> passed

## T06 Evidence

- Final verification:
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 28 passed
  - `uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q` -> 7 passed
  - `uv run pytest solutions/appointment_booking/tests/unit/test_manifest_starters.py -q` -> 3 passed
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py solutions/appointment_booking/tests/unit/test_manifest_starters.py -q` -> 38 passed
  - `uv run ruff check solutions/appointment_booking/src/ solutions/appointment_booking/tests/` -> passed
  - `uv run pytest packages/grove/tests/unit/architecture/test_import_boundaries.py -q` -> 1 passed
  - `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_agent_profiles.py solutions/appointment_booking/src/appointment_booking/manifest.py solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py` -> 0 errors
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
  availability lookup, identity capture, detail capture, price confirmation, or
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

## T03 Evidence

- Added `loader.py` with package-resource YAML loading for shared, front-desk,
  consultation, MRI, auth, and STT keyword assets.
- Added typed prompt/STT asset dataclasses and explicit
  `AffideaPromptAssetRole` values instead of passing raw resource names around.
- Added `composer.py` with deterministic layer ordering for shared policy,
  node prompt, reference KB, live state summary, and tool outputs.
- Added tests for package-resource loading, STT keyword parsing, deterministic
  composition, explicit role selection, non-node rejection, and live data only
  entering through composer inputs.
- Verification:
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 14 passed
  - `uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q` -> 6 passed
  - `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> 0 errors
  - `uv run ruff check solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> passed
  - `git diff --check` -> passed

## T02 Evidence

- Copied the six approved `demo/affidea_assistant/prompts` YAML prompt/STT
  files into `appointment_booking.voice.affidea_prompts` package assets.
- Added drift tests proving copied prompt bytes match the source demo prompt
  bytes after declared repository whitespace normalization.
- Added a prompt asset guard for serialized live-state markers so reusable
  prompt files do not absorb slot, patient, auth, or booking-result payloads.
- Verified the existing clinic-registration starter still validates.
- Verification:
  - `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 9 passed
  - `uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q` -> 6 passed
  - `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> 0 errors
  - `uv run ruff check solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> passed
  - `git diff --check` -> passed
