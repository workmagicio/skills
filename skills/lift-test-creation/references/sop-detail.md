## Step 2 — Asking rules (full)

- At most **1–2 questions per turn** — in practice, zero or one is the norm.
- Business language — never expose holdoutPct, MDL, experiment_days.
- **Don't ask for**: country, salesChannel, primaryMetric, coolingPeriod, **start date**. These have defaults or are unset by design. The user confirms them in Step 4.
- **Don't ask for a cell count when the user named a scope**, and **don't ask for a scope when the user named a cell count** — a cell count is a complete request on its own.
- testLevel is asked in business language: "Test the entire Meta account, a specific tactic, or just a few campaigns?"
- **Don't front-load constraint questions. **No budget / deadline / geo questions in Step 2 — the single open constraint ask belongs at the end of the Step 4 summary, where the user can see the config it would modify.

## Step 3 — Default-resolution detail

- **salesChannel** — query connected channels (Ready / Not optimal only); default all selected.
- **country** — trailing-90-day sales share; auto-pick the dominant country.
- **geoLevel** — derive from country (US → DMA; others → postcode).
- **locationSetting** — lift-test-scan for scheduled + active tests; auto-exclude the union of their geos, then layer user geo constraints on top → references/constraints.md
- **status** — draft.

## Step 4 — What the summary must contain

The Step 4 confirmation is a **two-column table** — label on the left, value on the right — followed by the closing line. Not a bullet list, not a paragraph.

|**Row label**|**Value**|**Shown when**|
|---|---|---|
|**Test scope**|Platform + level + the named tactics / campaigns. When the user gave only a cell count: "left open — you'll set each cell's scope in the draft"|Always|
|**Shape**|"N-cell — [N−1] test cells measured against one shared reference group"|Always|
|**Country**|Country + geo level, e.g. "United States (DMA level)"|Always|
|**Sales channels**|The channel list, noting "all your connected channels" when it's all of them|Always|
|**Primary metric**|Orders, or New customers|Always|
|**Your constraints**|One line, every stated constraint in the user's own terms, separated by ·|Always, if there is none, display "none"|
|**Also**|The concurrency note — which running test's geos are being avoided, and through what date|Only if the geo pool was reduced|

## Step 5 — Design failures

All of these now route into the solve loop rather than terminating:

|Failure|Round-1 framing|
|---|---|
|Geo size too low for the data volume|"We'd need more geos on the holdout side than your current setting allows" — then the geo-size lever|
|Too many locationSetting excludes|Name the count and the share of orders removed; offer the geo-exclusion lever|
|Sales-channel readiness insufficient|Name the channel + the failing check; offer to drop it or fix it in Settings (not a solve-loop lever — a prerequisite)|
|Country not supported / data volume too low|Name the limit. Unsupported country is a hard stop, not a loop.|

## Step 7 — Create / update payload field mapping

**One draft per test** — a multi-cell test is not split into one draft per cell.

- **New test → lift-test-create (default).** Pass the structured fields, not a hand-built body: the collected fields from SKILL.md §4 plus the design outputs (method, the geoGroup and design IDs from analyze, testPeriod, coolingPeriod, and the final locationSetting), testChannel derived from the platform + cell config, and status = draft unless the user explicitly asked to schedule. The tool assembles the payload (incl. timezone conversion) and returns the draft.
- **Modifying an existing draft → lift-test-create-or-update.** Pull it with lift-test-get, change the fields, and push the full `body` back **with its `id`** (the tool forwards the body as-is, so the caller owns its shape). Say which draft was updated rather than implying a new one was made.

**Which fields an edit may touch — pick the right path** (field-level detail → `references/create-update-params.md`):

- **A — direct edit** (no dependency): `name`, `testStartTime`, and other label fields → change on the loaded body and push. The **write tool** enforces the guards — it rejects a past `testStartTime` (date before today, UTC) and runs the concurrent geo-conflict check (scheduled / active / executing), returning `geoConflict` if the start + geos overlap a running test. The agent doesn't pre-compute geo overlap — only the tool knows it at write time. `testEndTime` shifts with `testStartTime`.
- **B — immutable / gated**: `id` / `tenantId` / `workflowId` / `createTime` and the per-cell system fields are server-owned — keep them verbatim from lift-test-get, never set. `status` stays `draft`; flipping to `scheduled` is a separate activation, only on explicit request.
- **C — re-design** (online-design inputs): `locationSetting` / geo size (holdout) / `salesChannel` / metric filters / `primaryMetric` / `country` / `geoLevel` → re-run scan → prepare → design → analyze (seed prepare with the draft's current config), then rebuild `geoGroup` / `testChannel`.
- **D — recompute estimator, no re-design**: **test period** (√ scaling) and **method PTM ↔ LTM** (target-method formula) → recompute `expected_daily_spend` / `expect_cpa` / `minimum_daily_budget_required` on the existing `geoGroup`; geos unchanged.
- **E — testChannel change**: ask the user whether to regenerate, then:
  - **Swapping the platform (e.g. Meta → Google)** — not a plain field patch. **Must** re-fetch `impactCampaignInfos` for the new platform (lift-test-impact-campaigns / tactic-list — the old platform's ids are invalid) and recompute the estimator for the new platform's spend / CPA (via analyze; the geo pair is order-geography-based and can be reused). Also regenerate `name`, and re-check `approach` and PTM support for the new platform. Fields touched: `adPlatform`, `name`, `approach`, `testChannel` (`adPlatform` / `adPlatformName` / `impactCampaignInfos` / cell `name`), and each cell's `geoGroup.estimator`. Unchanged: `country` / `geoLevel` / `salesChannel` / `primaryMetric` / `locationSetting` / `numberOfCells` / start+end times.
  - **Adding / removing a cell or platform** (changes cell count / the shared reference group) → re-design (path C).
  - **Same-platform scope tweak** (a different tactic / campaign selection, same platform) → recompute the estimator (path D); geos unchanged.
