# NFQ GCP Immediate Next Steps

1. Finish T01 by adding a Slack-safe notification-channel contract, with a
   redundant non-Slack route.
2. Finish T02 by adding the missing public API latency alert and dashboard
   panel. Public HTTPS 5xx alerting already exists.
3. Apply or re-apply the internal-safe and public-edge observability roots with
   real production inputs, then verify the Cloud Monitoring alert policies and
   time series exist.
4. Propose and approve the successor milestone for synthetic NFQ booking
   canary parity and booking-completion SLO parity before creating task files.
   The current waiver names platform/infra as owner and expects M39.1 or the
   next explicitly activated NFQ GCP launch-observability milestone.
5. If staging parity is required, create the GCP staging runtime overlay before
   claiming staging scrape/alert proof.

## Notes

- `nfq.jakitlabs.com` and `api.nfq.jakitlabs.com` are the current production
  public hostnames recorded by M38.1.
- GCP production now renders `platform-api`, `platform-temporal-worker`, and
  `agent-worker` scrape resources.
- The remaining proof gaps are live Cloud Monitoring apply/inspection and live
  scrape endpoint verification, not Kubernetes render coverage.
