# Create / update payload — field mapping

The `lift_test_group` body and where every field comes from. `lift-test-create` assembles this from structured inputs (source of truth: `src/tools/lift-test/create.ts`); on the **update** path you don't rebuild it — `lift-test-get` returns the whole body, you change only the fields the edit touches and push the rest back verbatim via `lift-test-create-or-update`. Which edits force a re-design vs a derived-field recompute → `references/sop-detail.md` Step 7 categories.

**Source legend (which tool the value comes from):**
- **scan** = lift-test-scan · **prepare** = lift-test-design-prepare (its `create_params`) · **design-result** = lift-test-design → -result (PTM/LTM design ids) · **analyze** = lift-test-design-analyze (chosen design's `geo_group` + estimator + `recommendedApproach`) · **user** = user input (Step 2/4; `impactCampaignInfos` via lift-test-impact-campaigns / tactic-list) · **derived** = computed at assembly · **const** = fixed · **system** = server / auth / tenant context

> **The Source column describes a NEW draft built through the pipeline.** When **editing an existing draft — including in a fresh session with no prior scan/prepare/design/analyze in context — the source of every field is `lift-test-get`** (the persisted draft). Load it first; keep all untouched fields **verbatim**; only re-derive a field by re-invoking, *now*, the tool its edit needs:
> - **simple edits** (name, testStartTime, other no-dependency fields) → change on the loaded body, push. No pipeline.
> - **test period change** or **method switch (PTM ↔ LTM)** → **NO re-design.** Recompute the estimator on the *existing* `geoGroup` — `expected_daily_spend`, `expect_cpa`, `minimum_daily_budget_required` — for a period change via the √ formula below, for a method switch via the target method's formula (PTM divides by the control-side order rate; LTM does not). lift-test-get supplies the `geoGroup` (MDL / control order rate); a method switch may also need the tactic CPA, the same input analyze uses.
> - **design-input changes** (locationSetting / geo size / salesChannel / metric / primaryMetric / country / geoLevel) or **cell / scope restructure** → re-run **scan → prepare → design → analyze in this session** (seed prepare with the draft's current config) to regenerate `geoGroup` / `testChannel`, then push.
>
> So the Source column tells you **which tool to (re-)invoke when an edit forces a field to change**; for everything left unchanged, the source is the existing draft from lift-test-get. Which edits fall in which bucket → `references/sop-detail.md` Step 7 categories.

## Top-level fields

| Field | Source | Assembly rule |
|---|---|---|
| `name` | derived | auto-generated from date + platform + geo size + metric + method: `YYYYMMDD - {Platform} - {geoSize%} DTC {Orders/New customers} - {PTM/LTM}` → e.g. `20260519 - Meta - 7% DTC Orders - LTM` |
| `status` | const | `"draft"` (activation to `scheduled` is a separate action) |
| `adPlatform` | user → prepare | raw platform ids `["facebookMarketing"]` |
| `salesChannel` | scan → prepare | connected channels array |
| `primaryMetric` | scan/user → prepare | `orders` / `nc_orders` |
| `country` | scan → prepare | `US` … |
| `geoLevel` | **analyze** | `geoGroup.control[0].geoLevel ?? "dma"` (taken from the design, not scan) |
| `approach` | analyze / user | `automatic` / `manual` (`recommendedApproach`) |
| `method` | user (after analyze) | `PTM` / `LTM` — matches the chosen design side |
| `testLevel` | user → prepare | `platform` / `tactic` / `campaign` |
| `testStartTime` | user | user's local date/time converted to **UTC** ISO; never a past date |
| `testEndTime` | derived | given `testEndTime` (→UTC), else `testStartTime + test_length + 7d cooling` |
| `geoGroup` | **analyze** | chosen design's `geo_group` (see below); design ids from design-result |
| `testChannel` | prepare + analyze + derived | one inner array per cell — see the per-cell table below |
| `locationSetting` | prepare | `{ locationType, locations:[{value,label}] }` — user geo + concurrent + account-geo, already merged; default `exclude/[]` |
| `dmaExclusion` | const | `[]` |
| `geoSizeValue` | derived | GEO_SIZE enum index derived from holdout_pct (**also set inside extraInfo, same value**) |
| `metricFilters` | user/config | default `[]` |
| `metricFiltersConfig` | user/config | default `[]` |
| `extraInfo` | mixed | see below |
| `additionalInfo` | mixed | see below |

## `extraInfo`

| Field | Source | Rule |
|---|---|---|
| `timezone` | scan → prepare | display form **with GMT offset**, e.g. `Eastern Time (US & Canada), Bogota, Lima (GMT-4:00)` |
| `ianaTimezone` | scan → prepare | `America/New_York` |
| `revertBeforeCooling` | const | `true` |
| `startTime` | derived | user's start in **local** offset ISO (e.g. `2026-05-18T10:53:06+08:00`), distinct from the UTC `testStartTime` |
| `geoSizeValue` | derived | same enum index as top-level `geoSizeValue` |

## `additionalInfo`

| Field | Source | Rule |
|---|---|---|
| `numberOfCells` | prepare (derived) | string `"2"`…`"5"` = (N−1) impact groups + 1 |
| `budgetRequirement` | user | `{ operator:"between", value:[min,max] }`; default `[null,null]` |
| `additionalRequests` | user | free text, default `""` |
| `includeCustomSalesChannels` | const | `false` |
| `customSalesChannels` | const | `[]` |
| `marketingChannelAdditionalInfo` | const | `[]` |

## `geoGroup` (top-level and per-cell)

**Source: analyze** — the chosen `ptm.designs[0].geo_group` or `ltm.designs[0].geo_group`. Pass its fields verbatim; only `test_length` (and, for a custom length, `estimator.custom_test_length`) may be changed by the caller.

| Field | Rule |
|---|---|
| `id` | `manual-<design_id>` or `online-<design_id>_<n>` (prefix by design source) |
| `rank` | design rank (string, e.g. `"1"`) |
| `design_id` / `group_id` / `part_date` / `designHash` | verbatim from the design row (`group_id` may be null) |
| `lift_test_group_id` | null until the group exists / attached |
| `method` | `PTM` / `LTM` |
| `country` | verbatim |
| `cooling_length` | days (may serialize as string); range 1–28 |
| `test_length` | days (default 21); **overridable** for custom period (14–60, test+cooling ≤ 60) |
| `test` | `{ code[], name[], orders, sales, geoLevel }` — treatment side, verbatim |
| `control` | **top-level = ARRAY** `[{…}]`; **inside `testChannel[].geoGroup.control` = OBJECT** `{…}`. Fields: `{ id, code[], name[], orders, sales, geoLevel, minimum_detectable_lift, shopify_daily_control_orders, factor }` |
| `estimator.experiment_days` | design's native length (~21) — never changes |
| `estimator.channel[i][j]` | `{ ad_platform, channel_index, expected_daily_spend, ads_daily_reported_spend?, origin_ads_daily_reported_spend?, cpa?, origin_cpa? }` — **`cpa`/`origin_cpa`/`ads_daily_reported_spend` are OPTIONAL, not always present** |

**Per-cell derived (only in `testChannel[].geoGroup.estimator`):** the per-cell estimator carries `expect_cpa` and `minimum_daily_budget_required` per channel, computed at the cell's `test_length`. Two edits recompute these **without a re-design**:

- **test period change** → scale the threshold with the √ formula (same as the product):
  > threshold at N days = (threshold at the design's native length) × √(native length ÷ N)

  The native length (`experiment_days`) never changes. Custom `N ∉ {14,21,28}` → set `test_length = N` and `estimator.custom_test_length = N`.
- **method switch (PTM ↔ LTM)** → recompute on the same `geoGroup` with the target method's formula (PTM divides by the control-side order rate; LTM does not); `experiment_days` / geos stay unchanged.

Changing geo size / any online-design input is NOT a recompute — it needs a fresh design (sop-detail Step 7 cat C).

## `testChannel` — one inner array per cell

`Array<Array<cell>>`; one cell per platform. Each cell:

| Field | Source | Rule |
|---|---|---|
| `name` | derived | auto-generated per-cell name (date + platform + geo size + metric, like the top-level name) |
| `status` | const | `"draft"` |
| `adPlatform` | prepare (cell tag) / user | this cell's platform |
| `testChannelIndex` | derived | 0-based cell index |
| `primaryMetric` | scan/user | same as top-level |
| `impactCampaignInfos` | user (impact-campaigns / tactic-list) → prepare | shape by `testLevel`: **platform** `{accountId, accountName, campaigns:[]}`; **tactic** `{…, tacticNames:[…]}`; **campaign** `{accountId, accountName, campaigns:[campaignId,…]}`. May also carry `excludeAudienceIds` / `includeAudienceIds` (nullable) |
| `controlGeo` | analyze | `= geoGroup.control[cell].code` (reference-side codes) |
| `testGeo` | analyze | `= geoGroup.test.code` (treatment-side codes) |
| `geoGroup` | analyze + derived | embedded per-cell geoGroup: same as the shared geoGroup, but `control` is the single OBJECT for this cell and `estimator` carries the per-cell `expect_cpa` + `minimum_daily_budget_required` |
| `extraInfo` | const | `{ completed: true, skipForNow: false }` |

> On **update via lift-test-get → create-or-update**, a persisted cell also carries system fields (`id, tenantId, accountId, createTime, updateTime, workflowId, status, testStartTime, testEndTime, executeMessage, changeRecord, affectedCampaigns, autoAffectedCampaigns, originTargeting, liftTestGroupId, dmaExclusion, testGeoLevel, controlGeoLevel, adPlatformName, adType`). These are backend-populated — **preserve them verbatim from get; never assemble or drop them.**

## System / immutable fields (never assemble or edit)

`id` / `tenantId` / `workflowId` / `createTime` and the per-cell system fields above are server-owned. On update they ride back unchanged from `lift-test-get`. `status` stays `draft` unless the user explicitly activates.
