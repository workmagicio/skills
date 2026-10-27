## Step 2 — Asking rules (full)

- At most **1–2 questions per turn** — in practice, zero or one is the norm.
- Business language — never expose holdoutPct, MDL, experiment_days.
- **Don't ask for**: country, salesChannel, primaryMetric, coolingPeriod, **start date**. These have defaults or are unset by design. The user confirms them in Step 4.
- **Don't ask for a cell count when the user named a scope**, and **don't ask for a scope when the user named a cell count** — a cell count is a complete request on its own.
- testLevel is asked in business language: "Test the entire Meta account, a specific tactic, or just a few campaigns?"
- **Don't front-load constraint questions. **No budget / deadline / geo questions in Step 2 — the single open constraint ask belongs at the end of the Step 4 summary, where the user can see the config it would modify.

## Step 3 — Default-resolution detail

- **salesChannel** — lift-test-scan's `salesChannel` (already filtered to lift-test-ready channels; a channel missing from it isn't ready); default all selected.
- **country** — trailing-90-day sales share; auto-pick the dominant country. Pass the UK as `GB` (supported: US / GB / CA / DE / FR / AU / ES / SE).
- **geoLevel** — derive from country (US → DMA; every other country → postcode). DMA / state are US-only: overriding country to a non-US one without a geoLevel falls back to postcode; passing dma / state with a non-US country is an error from prepare.
- **locationSetting** — the user's own include / exclude, binding the **treatment side only**. Concurrent tests and the account limitation are not merged into it: lift-test-design-prepare asks platform-api for them and returns the per-group lists `treatmentExclusion` / `controlExclusion` in `lift_test_group`, plus `geoConstraints.occupancy` (`concurrentTestCount`, `rangeEndTime`, `geoCodes`, `treatmentGeoCodes`, `releaseTimeline`) and the account limitation as top-level `geoExclusion` (same shape as scan's, at the design's geo level). Concurrent rule (per group, scheduled / executing / active tests, only what is still occupied on `startTime`; a DMA design also counts state-level tests converted to DMAs) → references/constraints.md. scan's `runningTests` lists those tests for awareness. To reuse a concurrent test's geos, re-call prepare with a `startTime` after it ends — the sequenced-reuse form in references/constraints.md. Pass `liftTestGroupId` when re-designing an existing test so it and its sibling cells don't count as occupancy. A draft is excluded only when the user names it, pulled via lift-test-get (its geos go in as user excludes, so they only keep the treatment side clear). Layer the user's own geo includes / excludes and any concurrency instruction on top → references/constraints.md. The account-level geo limitation first comes back on `scan.geoExclusion` (for Step 3 awareness); design-prepare folds it into the design and returns it again as `geoExclusion` at the design's own geo level — use prepare's for the Step 4 account-geo row (scan's is computed at the country's default level, so it can differ for a state-level test).
- **status** — draft.

## Step 3 — Building `testChannel` for lift-test-design-prepare

`testChannel` is the cell structure — an array of arrays: **outer array = test cells** (the shared reference group is implicit, not listed — numberOfCells = cells + 1), **inner array = the platforms in that cell**, each entry `{adPlatform, impactCampaignInfos}`. prepare derives numberOfCells, testChannelIndex and extraInfo — never pass them, and never pass the old flat `adPlatform` + `impactCampaignInfos`.

Rules: one cell = one lift result. Separate results → separate cells; explicitly “together / combined” → the same cell; several things named with no grouping stated → one cell each (default — don’t ask). Each platform at most once per cell, all its targets in that one entry. Max 4 test cells.

|User says|testChannel|
|---|---|
|“Test Meta Prospecting”|`[[{adPlatform:"facebookMarketing", impactCampaignInfos:[{tacticNames:["Prospecting"]}]}]]` (2-cell)|
|“Meta and Google” / “Meta vs Google”|`[[{adPlatform:"facebookMarketing", …}], [{adPlatform:"googleAds", …}]]` (3-cell)|
|“Meta and Google together as one”|`[[{adPlatform:"facebookMarketing", …}, {adPlatform:"googleAds", …}]]` (2-cell)|
|“Prospecting and Retargeting, separate results”|`[[{adPlatform:"facebookMarketing", impactCampaignInfos:[{tacticNames:["Prospecting"]}]}], [{adPlatform:"facebookMarketing", impactCampaignInfos:[{tacticNames:["Retargeting"]}]}]]` (3-cell)|
|“Prospecting + Retargeting combined”|`[[{adPlatform:"facebookMarketing", impactCampaignInfos:[{tacticNames:["Prospecting"]}, {tacticNames:["Retargeting"]}]}]]` (2-cell)|
|“Meta vs TikTok” and TikTok has no selectable tactic|TikTok entry `impactCampaignInfos: []` → saved as “skip for now”, scope set in the draft|

Target shapes by testLevel: tactic `{tacticNames:[name]}` (one object per tactic, `''` = Default tactic); platform `{accountId, accountName}`; campaign `{accountId, accountName, campaignId, campaignName}`. prepare rejects targets of the wrong shape for the testLevel (e.g. account objects at tactic level) — fix the targets or switch testLevel.

## Step 4 — What the summary must contain

The Step 4 confirmation is a **two-column table** — label on the left, value on the right — followed by the closing line. Not a bullet list, not a paragraph.

|**Row label**|**Value**|**Shown when**|
|---|---|---|
|**Test scope**|Platform + level + the named tactics / campaigns, **per cell** — the level is always written out ("Google — tactic level: Non-Brand Search, Non-Brand Shopping", "ChatGPT — platform level (whole account)"); the Default tactic (`tacticNames: ['']`) reads "Default tactic", never "(none)"; a level the user never stated is asked here, never taken from prepare's silent `tactic` default or from an earlier test. When the user gave only a cell count: "left open — you'll set each cell's scope in the draft"|Always|
|**Shape**|"N-cell — [N−1] test cells measured against one shared reference group"|Always|
|**Country**|Country + geo level, e.g. "United States (DMA level)"|Always|
|**Sales channels**|The channel list, noting "all your connected channels" when it's all of them|Always|
|**Primary metric**|Orders, or New customers|Always|
|**Your constraints**|One line, every stated constraint in the user's own terms, separated by ·|Always, if there is none, display "none"|
|**Account geo settings**|The account-level geo configuration the test inherits — the baseline pool before any exclusion. Name the setting, not the full geo list|Only if the account geo settings are set — or when prepare's `geoConstraints` is `null` (couldn't be checked; say so, don't treat it as "none")|
|**Also**|The concurrency note — which running test's geos are being avoided, and through what date|Only if the geo pool was reduced — or when prepare's `geoConstraints` is `null` (concurrent tests weren't checked; say so and offer to retry)|

## Step 5 — Design failures

All of these now route into the solve loop rather than terminating:

|Failure|Round-1 framing|
|---|---|
|Geo size too low for the data volume|"We'd need more geos on the holdout side than your current setting allows" — then the geo-size lever|
|Too many locationSetting excludes / no feasible solution (the raw error is a Chinese solver message plus solver parameters — never show it raw)|Name the count and the share of orders removed — split into the user's own excludes and what concurrent tests hold (`geoConstraints.occupancy`); offer the geo-exclusion lever and, when concurrent tests took the geos, the sequenced-reuse lever (re-call prepare with a later `startTime`; if `rangeEndTime` is empty a holding test has no end date, so only the batches in `releaseTimeline` can be waited out). If prepare itself refuses before design because one group has too few geos left (it returns an error, not a summary), it's the same gap — show which constraint ate the pool (user excludes vs. concurrent vs. account) and offer those levers; the error itself says which group ran short|
|Sales-channel readiness insufficient|Name the channel and say it isn't lift-test ready yet; point to the data-health / Settings page for the reason; offer to drop it (not a solve-loop lever — a prerequisite)|
|Country not supported / data volume too low|Name the limit. Unsupported country is a hard stop, not a loop.|
|Engine `data_gate` (the solve died before pairing; telemetry only says `data_gate`, the backup table's `error_message` names the gate)|Not a solve-loop failure — no lever fixes it. The gate that bites in practice is single-geo concentration: one geo carries more than 30 % of in-scope orders over the engine's 121-day fit window, usually a geo-coding defect. Say that the data itself blocks the design (name the geo and its share when the error gives them), hand off to DS, and never resubmit the same request.|

## Step 7 — Create / update payload field mapping

**One draft per test** — a multi-cell test is not split into one draft per cell.

- **New test → lift-test-create (default).** Pass the structured fields, not a hand-built body: the collected fields from SKILL.md §4 plus the design outputs (method, the geoGroup and design IDs from analyze, testPeriod, coolingPeriod, and the final locationSetting), testChannel = prepare's `create_params.testChannel`, as-is (one array per test cell; analyze / create add the geos and estimator), and status = draft unless the user explicitly asked to schedule. The tool assembles the payload (incl. timezone conversion) and returns the draft.
- **Modifying an existing draft → lift-test-create-or-update.** Pull it with lift-test-get, change the fields, and push the full `body` back **with its `id`** (the tool forwards the body as-is, so the caller owns its shape). Say which draft was updated rather than implying a new one was made.

**Which fields an edit may touch — pick the right path** (field-level detail → `references/create-update-params.md`):

- **A — direct edit** (no dependency): `name`, `testStartTime`, and other label fields → change on the loaded body and push. The **write tool** enforces the guards — it rejects a past `testStartTime` (date before today, UTC) and runs the concurrent geo-conflict check (scheduled / active / executing), returning `geoConflict` if the start + geos overlap a running test. The agent doesn't pre-compute geo overlap — only the tool knows it at write time. `testEndTime` follows automatically: when the start, `geoGroup.test_length` or `geoGroup.cooling_length` changes, lift-test-create-or-update recomputes it (start + test_length + cooling_length − 1 days, same as the UI) — **drop `testEndTime` from the pushed body** so the tool can do so; don't compute it yourself. Only keep / set `testEndTime` when the user explicitly names an end date (any `testEndTime` in the body, `null` included, is written as given).
- **B — immutable / gated**: `id` / `tenantId` / `workflowId` / `createTime` and the per-cell system fields are server-owned — keep them verbatim from lift-test-get, never set. `status` stays `draft`; flipping to `scheduled` is a separate activation, only on explicit request.
- **C — re-design** (online-design inputs): `locationSetting` / geo size (holdout) / `salesChannel` / metric filters / `primaryMetric` / `country` / `geoLevel` → re-run scan → prepare → design → analyze (seed prepare with the draft's current config), then rebuild `geoGroup` / `testChannel`. Pass `liftTestGroupId` (the draft's id) to prepare so the draft and its sibling cells don't count as occupancy, and its `testStartTime` (local date) as `startTime` when it has one.
- **D — no re-design**: **test period**, **method PTM ↔ LTM** or a **CPA** change → change only that input (`geoGroup.test_length` / `method` / shared `estimator.channel[i][j].cpa`) and push; lift-test-create-or-update recomputes every cell's `expect_cpa` / `minimum_daily_budget_required` on save. Geos unchanged; never hand-edit the derived fields.
- **E — testChannel change**: ask the user whether to regenerate, then:
    - **Swapping the platform (e.g. Meta → Google)** — not a plain field patch. **Must** re-fetch `impactCampaignInfos` for the new platform (lift-test-impact-campaigns / tactic-list — the old platform's ids are invalid), re-call prepare with that cell's entry swapped in `testChannel` and recompute the estimator for the new platform's spend / CPA (via analyze; the geo pair is order-geography-based and can be reused). Also regenerate `name`, and re-check `approach` and PTM support for the new platform. Fields touched: `adPlatform`, `name`, `approach`, `testChannel` (`adPlatform` / `adPlatformName` / `impactCampaignInfos` / cell `name`), and each cell's `geoGroup.estimator`. Unchanged: `country` / `geoLevel` / `salesChannel` / `primaryMetric` / `locationSetting` / `numberOfCells` / start+end times.
    - **Adding / removing a cell or platform** (changes cell count / the shared reference group) → re-design (path C).
    - **Same-platform scope tweak** (a different tactic / campaign selection, same platform) → recompute the estimator (path D); geos unchanged.
