# Execution Plan: NFQ Source Distribution Separation

> **Status:** Active
> **Created:** 2026-03-16
> **Owner:** Jakit
> **Track:** Delivery protection

## 1. Goal

Give NFQ only the source code and tests they are supposed to receive.

That means:

- no VOX-only or other out-of-scope solution code in the NFQ source handoff
- no fake confidence from runtime-only Docker profiles
- no polluted test bundle that still drags excluded solutions back through imports

## 2. Source Anchors

- `docs/milestones/exec-plans/nfq-source-distribution-release-migration-plan.md`
- `docs/milestones/exec-plans/compose_to_k3d_migration_and_test_split_plan.md`
- `wiki/testing/regression-coverage.md`
- `wiki/ops/harness_engineering.md`
- `wiki/ops/build-profiles-artifact-exclusion.md`
- `docker/profiles/README.md`
- `tests/architecture/test_artifact_exclusion.py`
- `tests/architecture/test_build_profiles.py`
- `tests/architecture/test_profile_dockerfiles.py`
- `tools/scripts/verify_solution_profile.py`
- `tools/scripts/run_artifact_exclusion_checks.sh`

Nearest checklist anchors:

- `docs/requirements/checklist.md:51` for the missing customer source-handoff/export boundary
- `docs/requirements/checklist.md:82-83` for solution/capability gating and deployment artifact truth

Important honesty clause:

- row `51` is now the explicit checklist anchor for customer source handoff
- runtime/build artifact exclusion rows are still related, but they are not a substitute for a filtered customer source export

## 3. Current Truth

Already real:

- build-profile and artifact-exclusion mechanics exist
- CI already checks explicit solution allowlists, profile lockfiles, and selective Docker COPY behavior
- discovery is installed-only, which is the correct base primitive

Not real enough yet:

- the current `licensed-platform` and `single-tenant` profiles are examples, not NFQ contracts
- current artifact checks prove container/runtime exclusion, not NFQ source-tree exclusion
- the current CI hardcodes example solutions such as `outbound_campaigns` and `lead_capture`
- the test tree still contains many VOX/public-ingress/lead-capture/outbound-campaign references outside an NFQ boundary
- there is no active, mechanical source export lane that proves what NFQ actually receives

## 4. Decisions

1. Do not fork the repo.
2. Do not invent a second packaging system.
3. Use an allowlist, not a denylist.
4. Separate "runtime artifact exclusion" from "source handoff exclusion"; both matter and they are not the same job.
5. Do not start with a repo-wide test rewrite. Start with a mechanical export and test-allowlist slice that works.
6. Any exported runtime classification stays subordinate to the canonical regression and harness docs until a real owner file or consuming check exists.

## 5. Proposed NFQ Day-1 Allowlist

Proposed default until a human contracts something narrower:

- `packages/grove`
- `packages/grove-voice-livekit`
- `packages/platform-core`
- allowlist-filtered shared shell code from `apps/api`, `apps/temporal-worker`, `apps/agent-worker`, and `apps/web`
- `solutions/appointment_booking`
- `solutions/driver_verification`
- `solutions/telematics_ingestion`
- `solutions/call_monitoring`
- `solutions/notifications`

Current blocker truth:

- exporting the whole `apps/api`, `apps/temporal-worker`, or `apps/web` trees today would still leak VOX/private slices
- the first mechanical export lane cannot pretend it can delete directly imported shared entrypoints such as `apps/api/src/platform_api/routes/public_ingress.py`, `apps/api/src/platform_api/routes/campaigns.py`, or `apps/temporal-worker/src/temporal_worker/worker.py` and still boot the filtered apps
- until those imports are split, the day-1 export must either omit the shared app trees entirely and prove only package/solution boundaries, or ship allowlist-filtered bootable shared app entrypoints after issues `#615`, `#617`, `#618`, and `#619` land

Proposed exclusions unless the contract says otherwise:

- `solutions/lead_capture`
- `solutions/outbound_campaigns`
- VOX/public-ingress-specific slices that are not part of the NFQ contract
- upstream-only brand/distribution assets

## 6. Phase Plan

### Phase 1: Freeze the NFQ allowlist

Deliverables:

- explicit NFQ allowlist doc
- exact excluded-path list
- exact allowed test-path list for the first handoff slice

Exit condition:

- nobody is still arguing from vibes about what NFQ should or should not receive

### Phase 2: Make the profile real

Deliverables:

- an NFQ-specific profile instead of example-only profiles
- NFQ-specific lockfile and selective-copy Dockerfiles if needed
- script support so artifact checks are profile-driven, not hardcoded to the example profiles

Exit condition:

- `nfq` is a real profile target, not a sentence in a draft plan

### Phase 3: Partition tests the boring way

Immediate rule:

- do not try to reorganize the whole test tree first

Deliverables:

- an explicit NFQ test allowlist covering:
  - shared architecture/profile tests that remain valid
  - NFQ-relevant platform tests
  - NFQ solution tests
- forbidden-path/import checks for excluded tests and fixtures
- a proposed runtime classification manifest or equivalent owner file that says which shipped NFQ tests are `compose_primary`, `k3d_primary`, or `dual_runtime_required` for local runtime ownership
- a separate export allowlist or manifest field that marks which tests are actually safe to ship to NFQ
- explicit note that external proof modes remain governed separately by the harness contract

Exit condition:

- the NFQ source bundle can ship a coherent test set without VOX/other-solution leakage
- the exported test bundle does not force downstream humans to guess either the runtime lane or the customer-export boundary

### Phase 4: Build the source export

Deliverables:

- one export script that produces a filtered source tree for NFQ
- validation that forbidden paths are absent
- validation that forbidden imports are absent from shipped code and shipped tests

Exit condition:

- you can generate the NFQ source bundle mechanically and reproduce it

### Phase 5: Downstream-proof the handoff

Deliverables:

- documented NFQ CI expectations on the filtered tree
- a proof command that runs against the exported bundle, not just the upstream repo
- explicit distinction between the first package/solution-only export proof and the later bootable shared-app export proof once shared app entrypoints are split safely

Exit condition:

- upstream can prove what NFQ will actually receive, and NFQ can validate it on their side

## 7. Parallelization Rules

Can run in parallel with clinic P0:

- profile/export planning
- source allowlist definition
- test-boundary classification

Should not interfere with clinic P0:

- no broad runtime refactors
- no repo-wide path churn
- no speculative "make every test profile-aware" initiative

## 8. Completion Estimate

Manage this as roughly `30-35%` done.

Why:

- the repo already has the right low-level artifact-exclusion primitives
- but the actual NFQ source-handoff path and test separation are still not real

## 9. This Week

- [ ] Freeze the proposed NFQ allowlist and explicit exclusions
- [ ] Decide which tests are safe to ship in the first NFQ source bundle
- [ ] Define the mechanical export/check lane instead of relying on example profiles
- [ ] Keep this lane scoped to source/test separation, not product redesign
