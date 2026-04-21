# T03: Ship PR Cleanup and Documentation

> **Milestone**: M38.2-nfq-gcp-secret-manager-sync
> **Status**: Done
> **Estimate**: S (< 2h)
> **Depends on**: T02

## Description

Complete the milestone documentation and cleanup pass before opening the PR.

## Subtasks

- [x] **Docs**: Update milestone progress, debug log, and `wiki/log.md`.
- [x] **GC pass**: Check touched files for dead or misleading secret bootstrap
      paths.
- [x] **Verification summary**: Record exact test and live verification
      commands.

## Acceptance Criteria

- [x] `docs/tasks/M38.2/PROGRESS.md` reflects final status.
- [x] `wiki/log.md` includes the launch-readiness secret sync update.
- [x] PR body can link to the design, milestone, task, and debug log.

## Completion Evidence

- Documentation updated:
  - `wiki/debug/2026-04-20-nfq-gcp-livekit-cloud-inbound-bringup.md`
  - `docs/tasks/adhoc/AH-2026-04-20-nfq-livekit-cloud-inbound-bringup.md`
  - `docs/milestones/M38.2-nfq-gcp-secret-manager-sync.md`
  - `docs/tasks/M38.2/`
  - `docs/milestones/README.md`
  - `wiki/log.md`
- PR review follow-up:
  secret-sync alert coverage was codified in Terraform and guarded by the
  namespaced NFQ/GCP architecture tests. A second review follow-up blocked the
  legacy `gcp/production` Kubernetes Secret apply path and removed ESO's unused
  accessor on `platform-runtime-config`. A third review follow-up updated the
  dev-live native LiveKit bootstrap to call the self-hosted SIP helper contract.
- Verification recorded:
  - scoped architecture and secret-sync tests, including the post-review alert
    coverage additions
  - post-review single-writer guard:
    `uv run pytest tests/architecture/nfq/gcp/test_production_overlay_runtime_contracts.py tests/architecture/test_k8s_runtime_secrets.py tests/architecture/test_k8s_runtime_secrets_apply.py tests/architecture/test_setup_livekit_sip.py tests/architecture/test_repo_file_size.py -q`
    passed with 69 tests
  - `uv run ruff check tests/architecture/test_k8s_runtime_secrets_apply.py`
    and `uv run ruff format --check tests/architecture/test_k8s_runtime_secrets_apply.py`
    passed
  - `uv run pytest tests/architecture/test_dev_live_script.py tests/architecture/test_setup_livekit_sip.py -q`
    passed with 38 tests after the dev-live SIP helper contract fix
  - `terraform validate` for the NFQ/GCP production platform root
  - `kubectl kustomize infrastructure/kubernetes/overlays/gcp/production`
    rendered successfully
  - live ESO/ExternalSecret readiness
  - live inbound proof
  - live outbound proof to `+37062700969`
- GC pass: no committed secret payloads; kept follow-up risks as documented
  launch-readiness items instead of folding them into this PR. Removed the
  unused Secret Manager accessor for `platform-runtime-config`.
