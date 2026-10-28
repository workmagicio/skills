The `lift_test_group` body and where every field comes from. `lift-test-create` assembles this from structured inputs (source of truth: `src/tools/lift-test/create.ts`); on the **update** path you don't rebuild it — `lift-test-get` returns the whole body, you change only the fields the edit touches and push the rest back verbatim via `lift-test-create-or-update`. Which edits force a re-design vs a derived-field recompute → `references/sop-detail.md` Step 7 categories.

**Source legend (which tool the value comes from):**

- **scan** = lift-test-scan · **prepare** = lift-test-design-prepare (its `create_params`) · **design-result** = lift-test-design → -result (PTM/LTM design ids) · **analyze** = lift-test-design-analyze (chosen design's `geo_group` + estimator + `recommendedApproach`) · **user** = user input (Step 2/4; `impactCampaignInfos` via lift-test-impact-campaigns / tactic-list) · **derived** = computed at assembly · **const** = fixed · **system** = server / auth / tenant context

> **The Source column describes a NEW draft built through the pipeline.** When **editing an existing draft — including in a fresh session with no prior scan/prepare/design/analyze in context — the source of every field is `lift-test-get`** (the persisted draft). Load it first; keep all untouched fields **verbatim**; only re-derive a field by re-invoking, *now*, the tool its edit needs:
>
> - **simple edits** (name, testStartTime, other no-dependency fields) → change on the loaded body, push. No pipeline.
>
> - **test period change**, **method switch (PTM ↔ LTM)** or **CPA change** → **NO re-design.** Change only the input — `geoGroup.test_length`, the group's `method`, or the shared `geoGroup.estimator.channel[i][j].cpa` — and push with lift-test-create-or-update. The tool recomputes every cell's `expect_cpa` / `minimum_daily_budget_required` (and keeps `estimator.custom_test_length` in step) on save, like the product UI. Never hand-edit those derived fields.
>
> - **design-input changes** (locationSetting / geo size / salesChannel / metric / primaryMetric / country / geoLevel) or **cell / scope restructure** → re-run **scan → prepare → design → analyze in this session** (seed prepare with the draft's current config, plus `liftTestGroupId` = the draft's id and, as `startTime`, its stored restriction `extraInfo.restrictStartTime` (only when it is still later than today) — else its start date — as a customer-local date, not the first 10 chars of the stored UTC time) to regenerate `geoGroup` / `testChannel`, then push with create-or-update's top-level `restrictStartTime` = that `startTime` (omit it if prepare had none — the new design then clears the stored restriction).
>
> So the Source column tells you **which tool to (re-)invoke when an edit forces a field to change**; for everything left unchanged, the source is the existing draft from lift-test-get. Which edits fall in which bucket → `references/sop-detail.md` Step 7 categories.
>
>

## Top-level fields

|Field|Source|Assembly rule|
|---|---|---|
|`name`|derived|auto-generated from date + platform + geo size + metric + method: `YYYYMMDD - {Platform} - {geoSize%} DTC {Orders/New customers} - {PTM/LTM}` → e.g. `20260519 - Meta - 7% DTC Orders - LTM`|
|`status`|const|`"draft"` (activation to `scheduled` is a separate action)|
|`adPlatform`|prepare|distinct raw platform ids across all cells of `testChannel`, e.g. `["facebookMarketing"]`|
|`salesChannel`|scan → prepare|connected channels array|
|`primaryMetric`|scan/user → prepare|`orders` / `nc_orders`|
|`country`|scan → prepare|`US` …|
|`geoLevel`|**analyze**|`geoGroup.control[0].geoLevel ?? "dma"` (taken from the design, not scan)|
|`approach`|analyze / user|`automatic` / `manual` (`recommendedApproach`)|
|`method`|user (after analyze)|`PTM` / `LTM` — matches the chosen design side|
|`testLevel`|user → prepare|`platform` / `tactic` / `campaign`|
|`testStartTime`|user|user's local date/time converted to **UTC** ISO; never a past date; never earlier than `restrictStartTime`|
|`restrictStartTime`|prepare (the run whose design is saved)|that run's `startTime` (customer-local YYYY-MM-DD); omit if it had none. A tool arg, not a body field: stored as `extraInfo.restrictStartDate` / `restrictStartTime`; a date not later than today records nothing|
|`testEndTime`|derived|given `testEndTime` (→UTC), else computed by the tool like the UI: `testStartTime + test_length + cooling_length − 1` days (start day = day 1; `cooling_length` read from `geoGroup`, default 7; customer-local dates). On update, `lift-test-create-or-update` recomputes it when the start / `test_length` / `cooling_length` changes — omit it unless the user names a specific end date|
|`geoGroup`|**analyze**|chosen design's `geo_group` (see below); design ids from design-result|
|`testChannel`|prepare + analyze + derived|one inner array per cell — see the per-cell table below|
|`locationSetting`|prepare|`{ locationType, locations:[{value,label}] }` — the user's own include / exclude only (binds the treatment side); concurrent and account-geo exclusions are not merged in (they live in the design request's `treatmentExclusion` / `controlExclusion`); default `exclude/[]`|
|`dmaExclusion`|const|`[]`|
|`geoSizeValue`|derived|GEO_SIZE enum index derived from holdout_pct (**also set inside extraInfo, same value**)|
|`metricFilters`|user/config|default `[]`|
|`metricFiltersConfig`|user/config|default `[]`|
|`extraInfo`|mixed|see below|
|`additionalInfo`|mixed|see below|

## `extraInfo`

|Field|Source|Rule|
|---|---|---|
|`timezone`|scan → prepare|display form **with GMT offset**, e.g. `Eastern Time (US & Canada), Bogota, Lima (GMT-4:00)`|
|`ianaTimezone`|scan → prepare|`America/New_York`|
|`revertBeforeCooling`|const|`true`|
|`startTime`|derived|user's start in **local** offset ISO (e.g. `2026-05-18T10:53:06+08:00`), distinct from the UTC `testStartTime`|
|`geoSizeValue`|derived|same enum index as top-level `geoSizeValue`|

## `additionalInfo`

|Field|Source|Rule|
|---|---|---|
|`numberOfCells`|prepare (derived)|string `"2"`…`"5"` = `testChannel.length` (test cells) + 1 shared reference group|
|`budgetRequirement`|user|`{ operator:"between", value:[min,max] }`; default `[null,null]`|
|`additionalRequests`|user|free text, default `""`|
|`includeCustomSalesChannels`|const|`false`|
|`customSalesChannels`|const|`[]`|
|`marketingChannelAdditionalInfo`|const|`[]`|

## `geoGroup` (top-level and per-cell)

> **Side naming — read the field, never the word.** In the platform's `lift_test_group` model `control` is the **treated** cell (Holdout for PTM, Exposed for LTM) and `test` is the **Reference** group — the opposite of the statistical convention. Verified 2026-10-21 against the product setup page on three drafts (manual PTM, online PTM, online LTM): the DMA count and order share shown under "Geo for Holdout / Exposed group" equal the `control` side every time, and `test` is byte-identical across the cells of one multi-cell design. Consistent with `lift-test-design-analyze` (`order_share_pct` = control-side share) and `lift-test-create` (`holdout_pct` = control-group ratio). Any treatment-geo list or count shown to the user (Step 5 tables, handoffs) comes from `geoGroup.control[cell]`, never from `geoGroup.test`. The readout follows the same map, not the statistical convention: in `lift-test-readout`, `ctrl_orders` is the treated side (the Holdout / Exposed group) and `test_orders` is the Reference group. Verified 2026-10-26 on three completed tests (2795 PTM, 2442 PTM, 1908 LTM): `test_orders ÷ ctrl_orders` equals the Reference share ÷ treated share of the design, and `ctrl_orders` per day matches the design's `shopify_daily_control_orders`.

**Source: analyze** — the chosen `ptm.designs[0].geo_group` or `ltm.designs[0].geo_group`. Pass its fields verbatim; only `test_length` (and, for a custom length, `estimator.custom_test_length`) may be changed by the caller.

|Field|Rule|
|---|---|
|`id`|`manual-<design_id>` or `online-<design_id>_<n>` (prefix by design source)|
|`rank`|design rank (string, e.g. `"1"`)|
|`design_id` / `group_id` / `part_date` / `designHash`|verbatim from the design row (`group_id` may be null)|
|`lift_test_group_id`|null until the group exists / attached|
|`method`|`PTM` / `LTM`|
|`country`|verbatim|
|`cooling_length`|days (may serialize as string); range 1–28 — **0 is invalid** (the tool refuses it); absent → 7|
|`test_length`|days (default 21); **overridable** for custom period (14–60, test+cooling ≤ 60)|
|`test`|`{ code[], name[], orders, sales, geoLevel }` — the **Reference group** (business-as-usual side; in a multi-cell test it is shared by every cell), verbatim. ⚠️ Despite the name, `test` is NOT the treated side|
|`control`|the **treated cell** (PTM → Holdout group, LTM → Exposed group); its `orders` share is the % the product shows for that group. **top-level = ARRAY**`[{…}]`; **inside `testChannel[].geoGroup.control` = OBJECT**`{…}`. Fields: `{ id, code[], name[], orders, sales, geoLevel, minimum_detectable_lift, shopify_daily_control_orders, factor }`|
|`estimator.experiment_days`|the design's native length D (usually 21 — read it, never assume) — never changes|
|`estimator.channel[i][j]`|`{ ad_platform, channel_index, ads_daily_reported_spend?, origin_ads_daily_reported_spend?, cpa?, origin_cpa?, expected_daily_spend }` — the shared per-platform inputs; `cpa` is the CPA every cell's threshold is computed from. **`cpa`/`origin_cpa`/`ads_daily_reported_spend` are OPTIONAL**. `expected_daily_spend` is a deprecated geo-pairing snapshot — never read it as a threshold|

**Per-cell derived (only in `testChannel[].geoGroup.estimator`):** `expect_cpa` and `minimum_daily_budget_required` — the saved draft's feasibility threshold for that cell's platform, at the group's `test_length`, from the group's `method` and the shared `cpa`. lift-test-create and lift-test-create-or-update compute them on every save; read them from lift-test-get, never compute or edit them by hand. For a quick answer in chat (e.g. "what would 35 days need?"): threshold(N) = threshold at D × √(D ÷ N), D = `estimator.experiment_days` — the saved value comes from the tool.

Changing geo size / any online-design input is NOT a recompute — it needs a fresh design (sop-detail Step 7 cat C).

## `testChannel` — one inner array per cell

`Array<Array<entry>>` — **outer = test cells, inner = that cell's platform entries** (a cell may hold several platforms measured together; a platform may appear in several cells). The caller builds it as prepare's `testChannel` input (`{adPlatform, impactCampaignInfos}` per entry — rules in sop-detail Step 3); prepare stamps testChannelIndex + extraInfo; analyze / create add the geos and estimator. Each entry:

|Field|Source|Rule|
|---|---|---|
|`name`|derived|auto-generated per-cell name (date + platform + geo size + metric, like the top-level name)|
|`status`|const|`"draft"`|
|`adPlatform`|user → prepare|this entry's platform|
|`testChannelIndex`|prepare (derived)|0-based cell index (= outer index)|
|`primaryMetric`|scan/user|same as top-level|
|`impactCampaignInfos`|user (impact-campaigns / tactic-list) → prepare|shape by `testLevel` — as passed to prepare: **platform**`{accountId, accountName}`; **tactic** one object per tactic `{tacticNames:[name]}` (`''` = Default tactic); **campaign**`{accountId, accountName, campaignId, campaignName}`. A persisted draft may carry the stored form (`campaigns:[…]`) — keep it verbatim on update. `[]` = skip for now. May also carry `excludeAudienceIds` / `includeAudienceIds` (nullable)|
|`controlGeo`|analyze|`= geoGroup.control[cell].code` — this cell's **treated** geos (Holdout for PTM / Exposed for LTM; what the product's setup page lists under "Geo for Holdout / Exposed group")|
|`testGeo`|analyze|`= geoGroup.test.code` — the **Reference group** geos (shared across cells)|
|`geoGroup`|analyze + derived|embedded per-cell geoGroup: same as the shared geoGroup, but `control` is the single OBJECT for this cell and `estimator` carries the per-cell `expect_cpa` + `minimum_daily_budget_required`|
|`extraInfo`|prepare (derived)|`{ completed: true, skipForNow: impactCampaignInfos is empty }` — an empty target list is a skip-for-now placeholder, scope set later in the draft|

> On **update via lift-test-get → create-or-update**, a persisted cell also carries system fields (`id, tenantId, accountId, createTime, updateTime, workflowId, status, testStartTime, testEndTime, executeMessage, changeRecord, affectedCampaigns, autoAffectedCampaigns, originTargeting, liftTestGroupId, dmaExclusion, testGeoLevel, controlGeoLevel, adPlatformName, adType`). These are backend-populated — **preserve them verbatim from get; never assemble or drop them.**
>
>

## System / immutable fields (never assemble or edit)

`id` / `tenantId` / `workflowId` / `createTime` and the per-cell system fields above are server-owned. On update they ride back unchanged from `lift-test-get`. `status` stays `draft` unless the user explicitly activates.
