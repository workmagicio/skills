- Step 2 — Asking rules (full)

  - At most 1–2 questions per turn.
  - Use business language — never expose numberOfCells, holdoutPct, MDL, experiment_days.
  - Don’t ask for country / salesChannel / primaryMetric / timezone / coolingPeriod — these have defaults or can be inferred. Let user confirm in Step 4.
  - testLevel asked in business language: “Test the entire Meta account, a specific tactic, or just a few campaigns?”
- Step 3 — Default-resolution detail

  - **salesChannel** — query DB for tenant’s connected channels (Ready / Not optimal only), default all selected.
  - **country** — query trailing-90-day sales share, auto-pick dominant country.
  - **geoLevel** — derive from country (US → DMA, others → postcode).
  - **approach** — derive from liftTestAdsPlatformList (whether platform supports automatic).
  - **method** — call lift-test-scan to check if current ad spend makes PTM Sufficient. Honor explicit user choice; ask once if recommendation differs.
  - **timezone** — query dwd_view_analytics_tenant_timezone.
  - **locationSetting** — call lift-test-scan to fetch currently scheduled + active tests, auto-exclude union of their control + test geos.
  - **holdoutPct** — default 0.05.
  - **status** — default draft.
- Step 5 — Design failures (full table)

  | Failure | Handle |
  |-|-|
  | holdoutPct too low, not enough data | Don’t silently raise — ask: “We’d need a larger holdout (more geos in the holdout side) — OK?” |
  | Too many locationSetting excludes | “Too many geos excluded — the engine can’t form enough candidate pairs.” Recommend loosening. |
  | Sales-channel readiness insufficient | Name the channel + which readiness check is failing; suggest removing or fixing in Settings. |
  | Country not supported / data volume too low | Name the limit; offer ≥ 2 next steps. |
- Step 6 — Insufficient: the 4 levers

When lift-test-design-analyze returns Insufficient (expected daily spend > current daily spend):

1. **Raise daily spend** to \$Y (keep current geo size + test period).
2. **Increase geo size** — re-run lift-test-design with a higher geo-size bracket (Minimum → 5% → 10% → 15%). More orders per geo lowers the feasibility threshold; current daily spend may already clear it.
3. **Extend test period** to N+2 weeks (longer tests reduce the daily-spend requirement).
4. **Proceed with current config** (result may come back inconclusive).

Only #2 requires a new design call. Surface concrete numbers, not vague language.

- Step 7 — Active-test collision logic

Before suggesting testStartTime, call lift-test-scan to check for currently scheduled / active tests in the same channel. If found:

1. “Another test is running through [end date] — suggest starting after that.”
2. For active tests in different channels: typically OK to overlap; only flag if user’s locationSetting collides with their geos (already handled in Step 3 location auto-exclude).

- Step 8 — Create payload field mapping

| API field | Source |
|-|-|
| adPlatform | user input / alias-mapped |
| testLevel | user input |
| impactCampaignInfos | selected tactic / campaign IDs |
| testChannel | derived from ad platform + cell config (multi-platform → multi-cell) |
| salesChannel, primaryMetric, country, geoLevel | confirmed in Step 4 |
| method | confirmed in Step 4 |
| approach | confirmed in Step 4 |
| locationSetting | auto-resolved + user overrides from Step 4 |
| testStartTime | from Step 7 |
| testPeriod | from design (Step 5) |
| coolingPeriod | default 7d unless user-specified |
| holdoutPct | from design — never shown to user |
| numberOfCells | system-determined — never shown |
| timezone | auto |
| status | draft (unless user explicitly asked to schedule) |
