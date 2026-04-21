# AH-2026-04-20: Rotate operator `gh` PAT after M26.11 T01-T04 branch squash

> **Status**: Pending operator action (post-merge)
> **Owner**: simjak

---

## Context

During iteration on PR #949 (`feat/M26.11-staging-bootstrap`) the
`gh auth token` from the operator workstation was briefly pasted into
`platform-runtime-secrets.sops.yaml` as the value of `GHCR_PULL_PASSWORD`.
That token carries scopes beyond what an image-pull credential needs:
`repo` + `write:packages` + `admin:org` + `admin:repo_hook` + …

The commit that contained the SOPS-encrypted ciphertext (`2e18fa259`
through `b6fb19eb3` on the branch) was removed by a `git rebase`
squash before merge. The final branch tip is a single commit that ships
`GHCR_PULL_PASSWORD` as a `STAGING-TODO` placeholder and the
authoritative image-pull credential at `ghcr-pull-secret.sops.yaml` as a
separate dockerconfigjson Secret (operator fills in with a
`read:packages`-only PAT before `flux bootstrap`).

## Residual exposure

- The ciphertext can still be reached on GitHub by directly addressing
  those commit SHAs (until GitHub garbage collects the dangling refs,
  typically ~2 weeks). Decrypting requires the staging age private key
  at `~/.config/sops/age/manibo-staging.txt` or the cluster `sops-age`
  Secret — neither is in any git history.
- Practical risk is low: there is no public disclosure path for either
  the SOPS ciphertext OR the age key, but defense-in-depth calls for
  rotating any credential that was ever pushed to a reachable git ref.

## Action

After PR #949 merges, the operator:

1. On the workstation, run one of:
   ```bash
   # Fastest: log out + log in again with a scope-narrowed set.
   gh auth logout --hostname github.com
   gh auth login --hostname github.com --git-protocol ssh --scopes "repo,read:org"
   ```
   …or, if using a classic PAT directly,
   `https://github.com/settings/tokens` → find the token → **Regenerate**
   (or **Delete** and mint a fresh one with only the scopes actually
   needed for local dev — typically `repo`).
2. Verify the new token scopes:
   ```bash
   gh auth status
   # Token scopes should NOT include admin:org / admin:enterprise / write:packages.
   ```
3. Record completion in `wiki/log.md` with the date and that the
   hygiene rotation ran.

## Non-action

The image-pull credential on the staging cluster does NOT need
rotation via this step — it is a separate dedicated
`read:packages`-only PAT provisioned by the operator in
`ghcr-pull-secret.sops.yaml` as part of M26.11 T01 Step 4b. That
token was never the `gh auth token`.
