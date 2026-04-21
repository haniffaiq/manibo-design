# M41: NFQ Affidea Prompt and Knowledge Foundation

Status: done
Completed: 2026-04-20
Created: 2026-04-20
Owner: Jakit
Branch: feat/M41-nfq-affidea-prompt-kb
Stream: platform
Scope: solution:nfq
Depends on: M41.0
Reference: wiki/design-docs/nfq-langgraph-affidea-voice-booking.md

## Goal

Create the solution-owned prompt and deterministic knowledge foundation for the
Affidea voice-booking agent. This milestone preserves the working demo behavior
by reusing `demo/affidea_assistant/prompts` as the source prompt text, while
moving those assets into the Manibo package structure created by M41.0 with
tests, provenance, and a loader that can later feed either the current flat
`flow_definition` or the grouped-flow runtime from M41.2.

## Design Decisions

1. The first implementation reuses the demo prompt text from:
   - `demo/affidea_assistant/prompts/global_instructions.yaml`
   - `demo/affidea_assistant/prompts/frontdesk_prompt.yaml`
   - `demo/affidea_assistant/prompts/consultation_prompt.yaml`
   - `demo/affidea_assistant/prompts/mri_prompt.yaml`
   - `demo/affidea_assistant/prompts/auth_prompt.yaml`
   - `demo/affidea_assistant/prompts/stt_keywords.yaml`
2. Prompt source text is copied into solution-owned assets with provenance
   metadata. Runtime adaptations such as tool-name aliases are handled by code
   and config around the prompt, not by silently rewriting the copied prompt.
3. Knowledge artifacts belong under `solutions/appointment_booking`, not under
   `demo/`. The demo remains reference input only.
4. The first KB pass stays deterministic and file-backed. Vector retrieval,
   chunk ranking, or new retrieval infrastructure are out of scope.
5. Live slots, patient data, authentication state, and booking results never go
   into reusable prompt or KB files. They enter through tools and graph state.

## Tasks

| Task | Title | Status | Depends on |
|------|-------|--------|------------|
| T01 | Define the Affidea prompt asset layout and provenance contract | done | none |
| T02 | Copy the demo prompt files into solution-owned prompt assets | done | T01 |
| T03 | Add a prompt loader/composer that layers shared, node, KB, and state text | done | T02 |
| T04 | Generate deterministic front desk, consultation, and MRI KB snapshots | done | T01 |
| T05 | Add an Affidea starter/profile that validates against current `AgentConfig` | done | T02, T03, T04 |
| T06 | Add focused prompt/KB/config tests and Ship-PR evidence | done | T05 |

## Acceptance Criteria

- [x] Solution-owned prompt assets exist for shared voice rules, front desk,
      consultation, MRI, auth, and STT keywords.
- [x] Each copied prompt asset records the source demo path and source hash.
- [x] Tests prove copied prompt content has not drifted except for explicitly
      declared mechanical normalization.
- [x] Prompt composition keeps behavior text, reference facts, live state, and
      tool outputs separate.
- [x] Generated KB artifacts include separate front desk, consultation, and MRI
      references and contain no live slot or patient data.
- [x] The Affidea profile validates with Grove's current `AgentConfig` parser.
- [x] Existing `clinic_registration_agent.yaml` behavior stays unchanged.

## Verification

```bash
uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q
uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q
uv run pyright solutions/appointment_booking/src/ packages/grove/src/
uv run ruff check solutions/appointment_booking/src/ solutions/appointment_booking/tests/
```

## Final Evidence

- `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 33 passed
- `uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q` -> 7 passed
- `uv run pytest solutions/appointment_booking/tests/unit/test_manifest_starters.py -q` -> 3 passed
- `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py solutions/appointment_booking/tests/unit/test_manifest_starters.py -q` -> 43 passed
- `uv run ruff check solutions/appointment_booking/src/ solutions/appointment_booking/tests/` -> passed
- `uv run pytest packages/grove/tests/unit/architecture/test_import_boundaries.py -q` -> 1 passed
- Scoped M41 pyright:
  `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_agent_profiles.py solutions/appointment_booking/src/appointment_booking/manifest.py solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py solutions/appointment_booking/tests/unit/test_manifest_starters.py` -> 0 errors
- Affidea source config parse:
  `uv run python -c 'import yaml; from pathlib import Path; from grove.config.loader import parse_agent_config; parse_agent_config(yaml.safe_load(Path("solutions/appointment_booking/configs/affidea_voice_booking_agent.yaml").read_text())); print("affidea source config parses")'` -> affidea source config parses
- Rendered starter tool-name guard:
  `uv run python -c 'from appointment_booking.voice.affidea_agent_profiles import affidea_voice_booking_agent_starter_yaml; text = affidea_voice_booking_agent_starter_yaml(); blocked = [name for name in ["search_available_slots", "select_slot", "lookup_user_by_id", "load_stt_keywords", "verify_user_identity", "proceed_to_booking", "request_human_agent", "transfer_to_mri_booking", "transfer_to_consultation_booking", "end_conversation", "check_availability(service_id", "check_availability(slot_id", "book_appointment(slot_id, service_id", "confirm_identity(vardas", "verify_user_identity(vardas"] if name in text]; assert not blocked, blocked; print("rendered starter excludes unsupported demo names and signatures")'` -> rendered starter excludes unsupported demo names and signatures
- Generated KB live-data guard:
  `rg -n "2026-02-06|932776|slot_id:\s*[0-9]+|patient_identity:|patient_phone:|booking_result:|reservation_result:" solutions/appointment_booking/src/appointment_booking/data/affidea_knowledge` -> no matches
- `git diff --check` -> passed
- Broad pyright note: `uv run pyright solutions/appointment_booking/src/ packages/grove/src/`
  currently fails on unrelated Grove Temporal files outside this branch diff:
  `packages/grove/src/grove/temporal/tool_execution.py:53` and
  `packages/grove/src/grove/temporal/tool_execution_activity.py:23`.
- GC pass: no additional M41 files removed; all new prompt provenance,
  loader/composer, KB rendering, and profile compilation paths are covered by
  focused tests and support milestone acceptance criteria.
- Review feedback follow-up: auth prompt adaptation now routes successful
  identity capture back into consultation/MRI booking instead of terminal
  `done`, and generation-only KB source dependencies are tracked separately
  from materialized runtime KB resources.
- Specialist transfer follow-up: consultation can now route to MRI and MRI can
  route back to consultation, matching rendered prompt route tokens with the
  flat starter graph's allowed routes and conditional targets.
- Auth source follow-up: the rendered auth prompt now derives from the copied
  `auth_prompt.yaml` asset preamble and replaces only the stale demo process/tool
  section with the current Grove capture process.
- Booking flow follow-up: consultation and MRI booking nodes now expose
  `route=continue` self-routes, so booking tool loops can ask the next patient
  question without forcing handoff, done, auth, or the opposite specialist path.
- Runtime KB follow-up: generated Affidea KB snapshots and rendered starter
  prompts now strip demo/provider IDs such as `service_id`, `deptId`,
  `priceId`, `cityId`, and numeric city-ID tables; booking nodes must resolve
  current runtime IDs through `search_clinic_booking_options`.
- Automatic-auth follow-up: rendered consultation and MRI booking prompts now
  strip remaining demo claims that authentication or registration happens
  automatically, and require explicit `confirm_identity` and
  `collect_patient_details` before price confirmation or booking.

## Non-Goals

- No provider API integration changes.
- No native Grove subgraph runtime changes.
- No browser or operator UI changes.
- No production call proof.
- No prompt rewriting for style preferences.
