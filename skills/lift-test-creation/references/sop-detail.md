- Step 2 — Asking rules (full)

  - At most 1–2 questions per turn.
  - Use business language — never expose numberOfCells, holdoutPct, MDL, experiment_days.
  - Don’t ask for country / salesChannel / primaryMetric / timezone / coolingPeriod — these have defaults or can be inferred. Let user confirm in Step 4.
  - testLevel asked in business language: “Test the entire Meta account, a specific tactic, or just a few campaigns?”
- Step 3 — Default-resolution detail

  - **salesChannel** — query DB for tenant’s connected channels (Ready / Not optimal only), default all selected.
  - **country** — query trailing-90-day sales share, auto-pick dominant country. Pass the UK as `GB` (supported: US / GB / CA / DE / FR / AU / ES / SE).
  - **geoLevel** — derive from country (US → DMA, every other country → postcode; DMA / state are US-only). Overriding country to a non-US one without a geoLevel falls back to postcode; passing dma / state with a non-US country is an error.
  - **approach** — not resolved here: lift-test-design-analyze returns `recommendedApproach` after the design (automatic only when every platform supports automatic in that country).
  - **method** — not resolved here: lift-test-design-analyze returns `recommended` after the design (PTM when supported and Sufficient, else LTM). Honor explicit user choice; ask once if the recommendation differs.
  - **timezone** — query dwd_view_analytics_tenant_timezone.
  - **locationSetting** — lift-test-design-prepare does this: it auto-excludes every geo held by the tenant’s scheduled + active tests (same country + geo level) and reports `concurrentTestInfo { concurrentTestCount, rangeEndTime, geoCodes }` + `autoExcludedGeoCodes`. When concurrentTestCount > 0, offer the user both options in Step 4: (a) keep the start date, design on the remaining geos (default); (b) start after `rangeEndTime` with full geo coverage — re-call prepare with `restrictStartDate: true` + `startTime`. If a large share of geos is excluded (e.g. most DMAs), recommend (b) — the design will likely find no feasible split otherwise.
  - **holdoutPct** — default 0.05.
  - **status** — default draft.
- Step 3 — Building `testChannel` for lift-test-design-prepare

  `testChannel` is the cell structure — an array of arrays: **outer array = test cells** (the shared reference group is implicit, not listed — numberOfCells = cells + 1), **inner array = the platforms in that cell**, each entry `{adPlatform, impactCampaignInfos}`. prepare derives numberOfCells, testChannelIndex and extraInfo — never pass them, and never pass the old flat `adPlatform` + `impactCampaignInfos`.

  Rules: one cell = one lift result. Separate results → separate cells; explicitly “together / combined” → the same cell; several things named with no grouping stated → one cell each (default — don’t ask). Each platform at most once per cell, all its targets in that one entry. Max 4 test cells — more → ask which to drop or combine.

  | User says | testChannel |
  |-|-|
  | “Test Meta Prospecting” | `[[{adPlatform:"facebookMarketing", impactCampaignInfos:[{tacticNames:["Prospecting"]}]}]]` (2-cell) |
  | “Meta and Google” / “Meta vs Google” | `[[{adPlatform:"facebookMarketing", …}], [{adPlatform:"googleAds", …}]]` (3-cell) |
  | “Meta and Google together as one” | `[[{adPlatform:"facebookMarketing", …}, {adPlatform:"googleAds", …}]]` (2-cell) |
  | “Prospecting and Retargeting, separate results” | `[[{adPlatform:"facebookMarketing", impactCampaignInfos:[{tacticNames:["Prospecting"]}]}], [{adPlatform:"facebookMarketing", impactCampaignInfos:[{tacticNames:["Retargeting"]}]}]]` (3-cell) |
  | “Prospecting + Retargeting combined” | `[[{adPlatform:"facebookMarketing", impactCampaignInfos:[{tacticNames:["Prospecting"]}, {tacticNames:["Retargeting"]}]}]]` (2-cell) |
  | “Meta vs TikTok” and TikTok has no selectable tactic | TikTok entry `impactCampaignInfos: []` → saved as “skip for now”, scope set in the draft |

  Target shapes by testLevel: tactic `{tacticNames:[name]}` (one object per tactic, `''` = Default tactic); platform `{accountId, accountName}`; campaign `{accountId, accountName, campaignId, campaignName}`. prepare rejects targets of the wrong shape for the testLevel (e.g. account objects at tactic level) — fix the targets or switch testLevel. Read prepare’s summary “Cells” row back to the user in Step 4.

- Step 5 — Design failures (full table)

  | Failure | Handle |
  |-|-|
  | holdoutPct too low, not enough data | Don’t silently raise — ask: “We’d need a larger holdout (more geos in the holdout side) — OK?” |
  | No feasible solution (the raw error is a Chinese solver message plus solver parameters — never show it raw) | Usually too few geos left. Check prepare’s `autoExcludedGeoCodes`: if running tests took many geos, offer starting after them (re-call prepare with `restrictStartDate: true` + `startTime` after `concurrentTestInfo.rangeEndTime`, then re-run the design); if the user’s own excludes are large, recommend loosening them. |
  | Sales-channel readiness insufficient | Name the channel + which readiness check is failing; suggest removing or fixing in Settings. |
  | Country not supported / data volume too low | Name the limit; offer ≥ 2 next steps. |
- Step 6 — Insufficient: the 4 levers

When lift-test-design-analyze returns Insufficient (expected daily spend > current daily spend):

1. **Raise daily spend** to \$Y (keep current geo size + test period).
2. **Increase geo size** — re-run the design chain at the next geo-size bracket (Minimum → 5% → 10% → 15%): re-call lift-test-design-prepare with the same `testChannel` and the scan result in which **only `suggested.holdout_pct` is changed** to the new bracket (prepare has no holdout parameter — this is the one field of the scan result you may edit), then lift-test-design → lift-test-design-result → lift-test-design-analyze. More orders per geo lowers the feasibility threshold; current daily spend may already clear it.
3. **Extend test period** to N+2 weeks (longer tests reduce the daily-spend requirement).
4. **Proceed with current config** (result may come back inconclusive).

Only #2 requires a new design run. Surface concrete numbers, not vague language.

- Step 7 — Active-test collision logic

Before suggesting testStartTime, use prepare’s `concurrentTestInfo` (or lift-test-scan’s running tests). If the user chose to start after the running tests (`restrictStartDate: true`), the start date must be after `concurrentTestInfo.rangeEndTime`. Otherwise:

1. “Another test is running through [end date] — suggest starting after that.”
2. For active tests in different channels: typically OK to overlap; only flag if user’s locationSetting collides with their geos (already handled in Step 3 location auto-exclude).

- Step 8 — Create payload field mapping

| API field | Source |
|-|-|
| adPlatform | prepare create_params (distinct platforms across cells) |
| testLevel | user input (prepare create_params) |
| testChannel | prepare create_params.testChannel, as-is (one array per test cell; each entry carries its impactCampaignInfos) |
| salesChannel, primaryMetric, country, geoLevel | confirmed in Step 4 |
| method | confirmed in Step 4 |
| approach | confirmed in Step 4 |
| locationSetting | auto-resolved + user overrides from Step 4 |
| testStartTime | from Step 7 — may be omitted (draft saved “to be scheduled”) |
| geoGroup | analyze's chosen method `designs[0].geo_group`, verbatim — only `test_length` may change when the user asks for a different test period |
| ptmDesignId, ltmDesignId | lift-test-design-result (null for a side that failed) |
| testPeriod | from design (Step 5) — carried in geoGroup.test_length; testEndTime is derived from it |
| coolingPeriod | default 7d unless user-specified |
| holdoutPct | prepare create_params.holdout_pct — never shown to user |
| numberOfCells | prepare create_params (cells + 1) — never shown as a field name |
| timezone | auto (lift-test-scan) — must carry a GMT offset, e.g. `America/New_York (GMT-4:00)` |
| status | draft (unless user explicitly asked to schedule) |
