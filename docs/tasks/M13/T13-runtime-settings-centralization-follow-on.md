# T13: Runtime Settings Centralization Follow-On

> **Milestone**: M13-telephony-management
> **Status**: Parked future note
> **Estimate**: L (4-8h)
> **Depends on**: None
> **Checklist Rows**: None directly. This is follow-on technical debt discovered during M13, not active requirement closure.

---

## Rules for AI Coding Agents

**READ BEFORE IMPLEMENTING:**

1. **Parked future note** — do not implement unless the human explicitly activates this task.
2. **After activation: One Task = One Commit** — commit message: `feat: M13 T13 - centralize runtime settings`
3. **After activation: One Milestone = One PR** — reserved branch: `feat/M13-telephony-management`
4. Follow `AGENTS.md`, `docs/AGENTS.md`, and `docs/milestones/CLAUDE.md`
5. Update `docs/tasks/M13/PROGRESS.md` after completing

---

## Description

Parked future note only: centralize the platform's runtime environment contract behind one typed Pydantic Settings surface instead of scattered `os.environ.get(...)` reads across app shells, worker entrypoints, webhook handlers, and telephony bootstrap scripts.

The motivation is operational, not aesthetic. M13's local-real-call work exposed the same failure pattern repeatedly:

- local and cluster runtimes read overlapping env keys in different places
- missing credentials were discovered only after a live PSTN call or a failing webhook
- local overlay secrets, pod `envFrom`, and script defaults could drift silently
- concrete example: local `platform-runtime-secrets` kept overriding `platform-runtime-config` with a stale LiveKit Cloud `LIVEKIT_URL`, so inbound calls reached the platform but room metadata updates still went to the wrong control plane
- concrete example: `agent-worker` had the optional Google ADC volume mount in the manifest, but the live cluster still answered silently because the actual `gcp-adc` secret plus `GOOGLE_APPLICATION_CREDENTIALS` / `GOOGLE_CLOUD_PROJECT` were missing at runtime
- concrete example: local k3d was hotfixed with a `manibo-production` service-account key while `GOOGLE_CLOUD_PROJECT` still pointed at `nfq-voice-staging`, which is exactly how "the phone connected but nobody spoke" turns into debugging theater instead of a deterministic failure

The future refactor should create one authoritative settings module and migrate runtime-critical surfaces first, while leaving auxiliary scripts on explicit compatibility seams until they can be cleaned up safely.

## Hard runtime contract

Clean this up around one hard rule:

```text
one deployment
  -> one Google project
  -> one auth source
  -> one region policy
```

Not this:

```text
service account from project A
+ GOOGLE_CLOUD_PROJECT from project B
+ random local ADC fallback
```

That mixed state is the root cause behind the silent-call class we saw during T11. The right cleanup is not "remove `GOOGLE_CLOUD_PROJECT`". The right cleanup is to make the contract explicit and consistent everywhere.

## Environment matrix

### Current named environments

| Environment | Project label | Project ID | Project number | Intended auth source | Notes |
|-------------|---------------|------------|----------------|----------------------|-------|
| NFQ production | Call-platform-production | `call-platform-production` | `8230818469` | NFQ GCP identity | Use the NFQ-owned project only |
| NFQ staging | Call-platform-stage | `basic-buttress-489414-i1` | `517500543223` | NFQ GCP identity | Staging must not borrow Manibo credentials |
| Manibo production | Manibo production | `manibo-production` | `1045823958161` | Manibo GCP identity | Current developer-access key lives here |
| Local k3d / local-real-call (current policy) | Local uses NFQ production | `call-platform-production` | `8230818469` | Mounted NFQ production service-account JSON | This is the explicit local policy while NFQ inbound proof is being exercised |

### Target ownership rule

Each environment must have exactly one owning GCP project.

- NFQ prod -> NFQ prod project
- NFQ staging -> NFQ staging project
- Manibo / Hetzner prod -> Manibo prod project
- Manibo / Hetzner stage -> Manibo stage project once it exists
- local `nfq` profile -> NFQ production for the current local-real-call proof
- local `manibo` profile -> Manibo project

Rule:

- never mount a key from `manibo-production` while setting `GOOGLE_CLOUD_PROJECT=basic-buttress-489414-i1`
- never let local bootstrap choose credentials from "whatever file exists first"
- local defaults to `nfq-production`; use `GOOGLE_RUNTIME_PROFILE=local-manibo` only for Manibo-specific work

## Auth source by runtime type

Use one auth mechanism per runtime type.

- Real GKE in GCP
  - Use Workload Identity / metadata-based ADC
  - Do not mount JSON keys
  - Still set `GOOGLE_CLOUD_PROJECT`
  - Still set `GOOGLE_CLOUD_LOCATION` for Vertex
- Real k3s on Hetzner
  - Use mounted service-account JSON secret
  - Set `GOOGLE_APPLICATION_CREDENTIALS`
  - Set `GOOGLE_CLOUD_PROJECT`
  - Set `GOOGLE_CLOUD_LOCATION`
- Local k3d
  - Same as Hetzner, not GKE
  - Use mounted service-account JSON secret
  - Set `GOOGLE_APPLICATION_CREDENTIALS`
  - Set `GOOGLE_CLOUD_PROJECT`
  - Set `GOOGLE_CLOUD_LOCATION`

The runtime contract should therefore be identical between Hetzner and local. Only GKE changes the auth transport.

### Cluster auth bans

- ban user ADC inside clusters
- no `authorized_user` JSON in `gcp-adc`
- only service-account credentials in local / k3s
- only Workload Identity in GKE

## Region policy

Latency-sensitive speech paths need a boring, deterministic regional rule:

```text
same exact region if possible
otherwise same geography (EU) always
```

Recommended default:

- LLM: `vertex_ai` in one EU region
- TTS: Google Chirp3-HD in the tested voice-supported Europe region (`europe-west2` for `lt-LT-Chirp3-HD-Aoede`)
- STT: Soniox `stt-rt-v4` on the tested Lithuanian real-time endpoint unless we intentionally switch providers later

Do not chase fake purity if Google products do not line up on one literal region. "Same EU geography" is good enough if the exact product surfaces differ.

## Concrete env contract

For any deployment that can use Vertex:

```text
GOOGLE_CLOUD_PROJECT=<owning-project>
GOOGLE_CLOUD_LOCATION=<vertex-region>
```

For non-GKE runtimes only:

```text
GOOGLE_APPLICATION_CREDENTIALS=/var/secrets/google/application_default_credentials.json
```

For voice defaults:

- keep Google TTS location in voice config explicit (`europe-west2` for the current Lithuanian Chirp3-HD voice)
- keep Soniox on the tested Lithuanian real-time endpoint
- make Vertex the only Gemini path

## Operational follow-on

This task stays parked until a human activates it, but the follow-on shape is now explicit:

1. Introduce explicit deployment profiles (`nfq`, `manibo`, and any future separate profile such as `heads`)
2. Each profile owns:
   - Google project
   - Vertex region
   - credential source
   - voice region defaults
3. Local bootstrap must choose credentials by profile, not by "first file found"
4. Precheck must fail on project/key mismatch
5. Cluster boot must reject `authorized_user` JSON for `gcp-adc`

## Subtasks

- [ ] Define one authoritative runtime settings module using `pydantic-settings` with nested groups and stable aliases for existing env names
- [ ] Migrate runtime-critical app shells and workers (`platform-api`, `platform-temporal-worker`, `agent-worker` / `grove-voice-livekit`) to consume typed settings instead of ad hoc env reads
- [ ] Migrate telephony-critical `platform-core` readers and webhook paths to the shared settings contract
- [ ] Add compatibility helpers or deprecation shims for existing env names so rollout stays non-breaking
- [ ] Add focused tests for parsing, aliasing, defaults, and failure messages
- [ ] Update runbooks to describe the new single runtime settings contract and the remaining unmigrated script surfaces honestly

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `packages/grove/src/grove/config/` or `packages/platform-core/src/platform_core/config/` | Create/Modify | Single authoritative Pydantic Settings module and cache helpers |
| `apps/api/src/platform_api/main.py` | Modify | Replace direct env reads with typed settings |
| `apps/temporal-worker/src/temporal_worker/__main__.py` | Modify | Replace direct env reads with typed settings |
| `packages/grove-voice-livekit/src/grove_voice_livekit/entrypoint.py` | Modify | Replace direct env reads with typed settings without breaking Layer 1 boundaries |
| `packages/platform-core/src/platform_core/voice/webhook.py` | Modify | Replace direct env reads with typed settings |
| `tools/scripts/` | Modify selectively | Keep script compatibility explicit; do not migrate every script blindly in the first slice |
| `wiki/ops/voice-call-local-demo.md` | Modify | Document the new runtime settings source of truth |

## Implementation Notes

- Do not let this task violate the layer boundary just to force a single module into the wrong package. If Layer 1 cannot import a Layer 2 settings module, the settings contract has to live lower in the stack or be split by ownership with one public root.
- Prefer one cached settings object with nested models (`database`, `temporal`, `livekit`, `telephony`, `google`, `internal_api`, `logging`) over dozens of mini settings classes.
- Preserve existing env names through aliases or migration helpers first. A "cleaner" env taxonomy that breaks local ops is not progress.
- Runtime-critical services go first. Standalone CI and ad hoc scripts are follow-on unless the active slice proves they are on the critical path.
- The goal is one authoritative config contract, not mandatory migration of every shell script in the repo on day one.

## Acceptance Criteria

- [ ] One typed settings contract exists for runtime-critical services
- [ ] `platform-api`, `platform-temporal-worker`, and the voice worker stop reading runtime env values ad hoc
- [ ] Existing env names remain accepted through explicit aliases or migration shims
- [ ] Settings parse failures are explicit and actionable before runtime work starts
- [ ] Tests cover the typed contract, key aliases, and the migrated runtime consumers
- [ ] Docs describe the new contract and any intentionally unmigrated script debt

## References

- Milestone: [M13-telephony-management.md](../../milestones/M13-telephony-management.md)
- Related: [T11-local-real-call-profile-and-pstn-proof.md](T11-local-real-call-profile-and-pstn-proof.md)
- Related: [T12-telnyx-carrier-events-observability.md](T12-telnyx-carrier-events-observability.md)
