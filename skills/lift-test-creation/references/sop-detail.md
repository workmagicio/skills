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
- **locationSetting** — lift-test-scan's `runningTests` (scheduled / executing / active) is auto-excluded; a draft is excluded only when the user names it, pulled via lift-test-get. Layer the user's own geo includes / excludes and any concurrency instruction on top → references/constraints.md. The account-level geo limitation comes back on `scan.geoExclusion` — design-prepare folds it into the design, and you surface `geoExclusionSummary` in the Step 4 table's account-geo row.
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
|**Account geo settings**|The account-level geo configuration the test inherits — the baseline pool before any exclusion. Name the setting, not the full geo list|Only if the account geo settings are set|
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

## Input-quality routing

|User provided|Path|Expected quality|
|---|---|---|
|Full spec (platform + level + tactic/campaign)|Resolve defaults → Step 4 → design → create|high|
|Cell count only ("3-cell test")|Resolve defaults → Step 4 (scope left open) → design → create|high|
|Partial spec (platform only)|Ask for the missing structure piece; defaults for the rest, surfaced in Step 4|medium-high|
|"Create a lift test for me"|One structure question offering both framings; defaults elsewhere; cap at ≤ 3 turns|medium|
|Spec + constraints ("Meta, under $3k/day, finish by Jul 15, avoid my running test")|Parse all constraints; conflicts → clarify once; infeasible → solve loop with quantified gaps|medium — depends on feasibility|
|Constraints only, no structure|Resolve structure first (Step 2), then apply constraints|medium|
|Ambiguous geo / time / budget-unit references|Clarify once (not a loop)|depends on clarification|
|Out of boundary (creative test, custom metric)|Don't build; route to DS with handoff|n/a|

## Step 8 — Design deck

When the user wants a client-facing test plan ("design deck", "test plan deck", "slides I can walk the client through"), don't narrate the design in chat — run the deck skill on the Step 7 draft: a 2-cell draft → 2-cell-test-design-deck; a 3-cell or larger draft → multicell-design-deck, which expands the cells from that one draft. Two intake answers before building: show the feasibility threshold on the deck (yes / no), and for 3 cells or more, add the PTM-vs-LTM comparison page (yes / no). Output — the same two files whatever the cell count: two editable Google Slides in the client's Partnership-drive folder › Lift Test Design — the client design deck, and a validation deck whose filename ends _INTERNAL-Validation. The validation deck leads with a verdict page, then the design-validation section, then the deck-check section. The .pptx, .html and .pdf written locally are intermediates, not deliverables. If the skill refuses the draft, relay its reason and the choice the user has to make. Never rebuild the deck by hand, and never paste its MDL or geo lists into chat (§7). → references/output-templates.md, Step 8

**Design-deck skills (Step 8).** 2-cell-test-design-deck and multicell-design-deck are Claude Code / Cowork skills, not MCP tools. They read the warehouse through the workmagic_query connector, need Python 3.10+ and Google Chrome, run their own verification, and publish to Google Drive with a bundled service account. Input is the Step 7 draft link plus the two intake answers — nothing else; what comes back is in Step 8.

**Step 8’s two files are where the banned figures appear.** Chat keeps the rules above — no MDL, no reference-group geo list. Both files carry what chat must not, and neither is ever retyped back into chat. On the client design deck: a 3-cell or larger deck prints each cell’s MDL as a percentage (two-sided, at the test’s planned length) under a red framed "ONLY SHARE ON CLIENT’S REQUEST" tag and gives every cell two Geos pages — market names, then the DMA / geo codes; a 2-cell deck prints no MDL. Every client deck lists the Reference group beside the treatment markets, labels the cost figure by the test’s own primary metric (cost per incremental order / incremental CAC / cost per incremental sale) rather than a blanket "iCAC", and states the feasibility threshold, when shown, as a floor for the planned window rather than a spend cap. The validation deck is internal end to end — the verdict, the gate results, the MDL basis, provenance, and anything stale — and goes to no one outside the team. Treatment-side labels follow the method exactly as in chat. Send the link, never the contents.
