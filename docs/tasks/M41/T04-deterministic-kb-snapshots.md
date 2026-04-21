# T04: Deterministic KB Snapshots

> **Milestone**: M41-nfq-affidea-prompt-kb-foundation
> **Status**: Done
> **Estimate**: L (4-8h)
> **Depends on**: T01

---

## Description

Generate deterministic front-desk, consultation, and MRI knowledge-base
snapshots under the appointment-booking solution. These files provide stable
reference facts for prompt composition without adding retrieval infrastructure.

## Subtasks

- [x] **Define generated KB layout**: create package/resource paths for
      `frontdesk_reference.md`, `consultation_reference.md`, and
      `mri_reference.md`.
- [x] **Port deterministic source data**: use the demo KB artifacts as source
      input and record source hashes/provenance.
- [x] **Normalize sections**: produce stable, explicit Markdown sections such
      as cities, clinics, services, practitioners, MRI preparation rules, and
      escalation rules where source data supports them.
- [x] **Add KB tests**: prove snapshots are deterministic and exclude live
      transactional/patient data.

## Verification Evidence

- `uv run pytest solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py -q` -> 18 passed
- `uv run pytest solutions/appointment_booking/tests/unit/test_clinic_registration_agent_config.py -q` -> 6 passed
- `uv run pyright solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> 0 errors
- `uv run ruff check solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` -> passed
- `rg -n "2026-02-06|932776|slot_id:\s*[0-9]+|patient_identity:|patient_phone:|booking_result:|reservation_result:" solutions/appointment_booking/src/appointment_booking/data/affidea_knowledge` -> no matches
- `git diff --check` -> passed

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `solutions/appointment_booking/src/appointment_booking/data/affidea_knowledge/frontdesk_reference.md` | Create | Generated front-desk reference facts |
| `solutions/appointment_booking/src/appointment_booking/data/affidea_knowledge/consultation_reference.md` | Create | Generated consultation reference facts |
| `solutions/appointment_booking/src/appointment_booking/data/affidea_knowledge/mri_reference.md` | Create | Generated MRI reference facts |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/knowledge.py` | Create | KB snapshot loader and metadata helpers |
| `solutions/appointment_booking/src/appointment_booking/voice/affidea_prompts/provenance.py` | Modify | Add KB source and target provenance |
| `solutions/appointment_booking/tests/unit/test_affidea_prompt_assets.py` | Modify | Add KB determinism and safety tests |
| `docs/tasks/M41/PROGRESS.md` | Modify | Mark T04 progress and evidence |
| `wiki/log.md` | Modify | Append a short T04 progress note |

## Implementation Notes

- Source reference files are under `demo/affidea_assistant/knowledge_base`.
- Do not introduce vector search, embeddings, chunk ranking, or retrieval
  service dependencies.
- If the demo KB source is already pre-generated text, keep the Manibo
  generator/normalizer small and deterministic.
- Stable reference facts are allowed; live slots, patient data, authentication
  state, and booking results are not.

## Acceptance Criteria

- [x] Front-desk, consultation, and MRI KB snapshot files exist under the
      solution package.
- [x] Snapshot output is deterministic across repeated generation.
- [x] KB provenance records source paths and hashes.
- [x] Tests prove snapshots contain no live slot availability, patient identity
      data, or booking result data.
- [x] Prompt composer tests can load and attach a selected KB snapshot.

## References

- Depends on: [T01](T01-prompt-asset-layout-and-provenance.md)
- Milestone: [M41-nfq-affidea-prompt-kb-foundation.md](../../milestones/M41-nfq-affidea-prompt-kb-foundation.md)
- Source KB: `demo/affidea_assistant/knowledge_base`
- Design section: 7.7 Knowledge Base Architecture
