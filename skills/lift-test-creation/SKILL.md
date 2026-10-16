---
name: lift-test-creation
description: Turn a natural-language request into an executable lift test draft — geo lift tests, holdout and incrementality tests, and the PTM / LTM market split they need. Use when someone asks to set up, design or run a test to measure incrementality.
category: lift-test
risk: R0
version: 1.2.0
last-updated: 2026-10-16

references:
  - references/input-parsing.md
  - references/sop-detail.md
  - references/output-templates.md
  - references/edge-cases.md
  - references/failure-modes.md
---

## Purpose

Turn the user’s natural-language request into a **well-configured, executable lift test draft** and land it in the platform. Do not make undisclosed key decisions on the user’s behalf, do not expose internal parameter names, do not create a test when conditions aren’t met. Default creation skill in the Lift Test domain.

## When to trigger

**Trigger condition**: The user’s request contains a verb like “create / set up / run / launch / start” plus an object that points to “experiment / lift test / incrementality test / measure incrementality.”

**Examples that should NOT trigger this skill — route to another skill instead**:

| **Input pattern** | **Route to** |
|-|-|
| Query results / progress of an existing lift test | `lift-test-readout` |
| Compare multiple completed tests | `lift-test-readout` |
| “Why did my test fail / come back inconclusive?” | `lift-test-diagnosis` |
| Conceptual questions about PTM vs. LTM / wanting documentation | `database-query-ask` |

## Inputs

| **Field** | **Required?** | **Description / default** |
|-|-|-|
| adPlatform | Required | If the user didn’t name one, **ask**. One or more platforms; each is bound to a test cell (see numberOfCells). Amazon Ads is not a lift-test platform — say so, don’t map it. |
| testLevel | Required | platform / tactic / campaign — ONE level for the whole test (every cell). If the user didn’t say, **ask in business language**. |
| impactCampaignInfos | Required | Each platform’s selected targets, shaped by testLevel: tactic → one object per tactic `{tacticNames:[name]}` from **tactic-list** (`''` = the Default tactic); platform → accounts `{accountId, accountName}`, campaign → `{accountId, accountName, campaignId, campaignName}`, both from **lift-test-impact-campaigns**. **Must ask** (unless the user already named them). A platform with nothing selectable → `[]` (saved as “skip for now”, scope set later in the draft). |
| testStartTime | Optional | If the user didn’t say, **ask last**. **Never** accept a past date. If the user wants to schedule later, create the draft without it (“to be scheduled”). |
| salesChannel | Has default | Default to all selected (every channel in **Ready** or **Not optimal** state). |
| primaryMetric | Has default | Default orders. |
| country | Has default | Query trailing-90-day sales share, auto-pick the dominant country. Only **8 countries supported**: US / UK / CA / DE / FR / AU / ES / SE — the UK is passed as **`GB`**. **Other countries error out** — never hard-build. |
| geoLevel | Has default | Derive from country: US → DMA; every other country → postcode only (DMA / state are US-only). |
| method | Design output | lift-test-design-analyze `recommended` — PTM when PTM is supported and Sufficient, else LTM. Not known before the design runs (lift-test-scan does not return it). Honor an explicit user choice. |
| approach | Design output | lift-test-design-analyze `recommendedApproach` — automatic only when every platform supports automatic in that country; otherwise manual. Not known before the design runs. Honor an explicit user choice (surface manual-only platforms). |
| timezone | Auto | Query dwd_view_analytics_tenant_timezone. Don’t ask the user. |
| locationSetting | Auto + user override | lift-test-design-prepare **auto-excludes every geo occupied by the tenant’s scheduled + active tests** (same country + geo level) — the default, keeps the start date. The alternative is to start after those tests end (`restrictStartDate: true`): no auto-exclusion, full geo coverage. The user’s explicit exclude / include is layered on top. |
| numberOfCells | Auto | **One cell = one lift result.** Each thing the user wants measured separately is its own test cell; things the user explicitly wants measured *together* share one cell. Several things named with no grouping stated → one cell each (default — don’t ask). numberOfCells = test cells + 1 shared reference group, max 5 (4 test cells). **One test (one draft) holds all its cells** — never split into separate tests. **Don’t ask the user to pick this** — ask only if more than 4 test cells would be needed. |
| holdoutPct | Has default | Default 0.05. **The user should never see this field name**, unless design fails and the value needs adjusting. |
| testPeriod | Design output | Computed by the design engine, 14–60 days. When the user states a constraint like “4 weeks,” check whether it’s feasible. |
| coolingPeriod | Has default | Default 7 days. Range 1–28. |
| status | Default | Default draft. Don’t go straight to schedule unless the user explicitly says so. |

Per-field parsing and resolution rules (alias mapping, time direction, geo parsing, supported countries, manual-only platforms) → references/input-parsing.md.

## SOP

### 4.1 Steps

1. **Parse the request.** Resolve every field present in user wording (aliases, time, geo). Record what’s specified — never re-ask.
2. **Ask only for missing required fields.** Just adPlatform + testLevel + targets (tactics via tactic-list; accounts / campaigns via lift-test-impact-campaigns). Derive the cell structure from the wording (§Inputs numberOfCells) — don’t ask about it. At most 1–2 questions per turn.
3. **Resolve defaults, then call lift-test-design-prepare.** Run lift-test-scan for current spend, active tests and suggested defaults. Query DB for sales channels / country / timezone. Then call **lift-test-design-prepare** with the lift-test-scan result verbatim, testLevel, and **`testChannel` — grouped by cell: one array per test cell, listing that cell’s platforms as `{adPlatform, impactCampaignInfos}`** (never the old flat `adPlatform` + `impactCampaignInfos`; never pass numberOfCells). prepare auto-excludes the geos held by running / scheduled tests; when its `concurrentTestInfo.concurrentTestCount` > 0, Step 4 must offer both options — keep the start date with fewer geos (default), or start after `concurrentTestInfo.rangeEndTime` with full geo coverage (re-call prepare with `restrictStartDate: true` + `startTime`). Detail + testChannel examples → references/sop-detail.md.
4. **Confirm Step 4 — the ONLY full-config confirmation gate.** Echo prepare’s summary in business language — including its Cells row and any auto-excluded geos (how many, and why). Method and setup are not known yet (they come from analyze) — show them only if the user already stated them. Surface override conflicts once, don’t lecture. If the user changes anything → re-call prepare and show the new summary. See references/output-templates.md.
5. **Run the design: lift-test-design → lift-test-design-result → lift-test-design-analyze.** design takes prepare’s `lift_test_group` and returns a task id; poll design-result until it settles; pass prepare’s create_params (incl. testLevel) to analyze. On failure, don’t silently adjust — surface and ask. A “no feasible solution” failure after many geos were auto-excluded → offer starting after the running tests (`restrictStartDate: true`) or loosening the user’s excludes. Failure table → references/sop-detail.md.
6. **Read lift-test-design-analyze: Sufficient / Insufficient, recommended method and setup.** Present the recommended method (PTM / LTM) and setup (automatic / manual) as a single decision, not a re-confirmation of the config. If Insufficient, offer the 4 standard levers (raise budget / increase geo size / extend period / proceed anyway). Lever detail → references/sop-detail.md.
7. **Ask for testStartTime if missing.** Account for active-test collisions (“Another test is running through [date] — suggest after that”).
8. **Call lift-test-create directly** (lift-test-create-or-update only to modify an existing draft, with its `id`). No second full-config confirmation. One draft carries all cells. Return draft link. Payload mapping → references/sop-detail.md.

### 4.2 Validation Checkpoints

Multi-step SOP — the agent must pause and surface at these gates, never autopilot through:

| After step | Pause and surface |
|-|-|
| Step 4 | Full-config summary in business language. **This is the only full-config confirmation gate.** |
| Step 5/6 (after design) | Progress update: test period + feasibility, plus the recommended method / setup as one decision. Do NOT restate full config. |
| Step 6 (Insufficient) | Concrete numbers + 4 levers. User picks; don’t pick for them. |
| Step 7 | Single question: start date. Surface active-test collisions if any. |
| Step 8 | Draft link. Done. No final-confirm table. |

**Autopilot is forbidden at these gates.** The Step 4 single-confirmation rule and the no-double-confirm rule (Step 8) are the most-violated invariants — see §7 CRITICAL.

### 4.3 Input-quality routing

| User provided | Path | Expected quality |
|-|-|-|
| Full spec (platform + level + tactic/campaign + start) | Resolve defaults → Step 4 → design → create | high |
| Partial spec (e.g. platform only) | Ask for missing required + use defaults for the rest, surface in Step 4 | medium-high |
| “Create a lift test for me” (no detail) | Ask adPlatform + testLevel; defaults for everything else; cap at ≤ 4 turns | medium |
| Multi-constraint (“finish by July 15 + under \$3k/day + Meta”) | Parse all constraints; if conflict, clarify; if infeasible, give ≥ 3 next steps | medium — depends on feasibility |
| Ambiguous geo/time references | Clarify once (not loop) | depends on clarification |
| Out-of-scope (“compare creatives”, “15 countries”, “offline traffic”) | Don’t hard-build; route to CSM | n/a |

## Tools used

| **Tool** | **Required?** | **Purpose** |
|-|-|-|
| lift-test-scan | Required | Pull current ad spend, currently scheduled / active tests, suggested defaults (country, geo level, holdout) |
| tactic-list | Required (tactic level) | Fetch candidate tactics — lift-test-impact-campaigns does not return tactics |
| lift-test-impact-campaigns | Required (platform / campaign level) | Fetch candidate accounts (level=account) or campaigns (level=campaign) |
| lift-test-design-prepare | Required (before Step 4) | Package scan result + testLevel + `testChannel` (one array per test cell) into design inputs; derives numberOfCells and per-entry fields; auto-excludes geos held by running / scheduled tests (`restrictStartDate: true` skips that). Its summary feeds Step 4 |
| lift-test-design | Required | Submit the geo-pair design solve; returns a task id |
| lift-test-design-result | Required | Poll the task id until the design settles (~3–4 min); returns PTM / LTM design ids |
| lift-test-design-analyze | Required | Compute expected daily spend, determine Sufficient / Insufficient, recommend PTM or LTM (`recommended`) and automatic or manual (`recommendedApproach`) |
| lift-test-create | Required (final step) | Create the draft from prepare’s create_params + analyze’s chosen design — one draft, all cells |
| lift-test-create-or-update | Optional | Update an existing draft (with its `id`) |
| lift-test-list | Optional | When the user asks “what tests have I created before” |
| lift-test-get | Optional | Pull an existing draft when the user wants to modify mid-flow |

## Output format

- Business language only — no holdoutPct, numberOfCells, MDL, experiment_days, attr_model_name, facebookMarketing in chat output.
- UI-aligned field names: “Test period” (not “Experiment days”), “Feasibility threshold” (not “Expected daily spend”), “Geo size” (not “Geo coverage”).
- Method-specific treatment-side labels (matches product UI): PTM → “Holdout group”; LTM → “Exposed group”; reference side any method → “Reference group”. Never use “Holdout group” in an LTM column. Never invent a unified “Treatment group” term.
- First mention of PTM / LTM gets a one-line inline explanation: “PTM (pause-to-measure — pause ads in a subset of geos)”. After that, just “PTM” / “LTM” is fine.
- Multi-cell requests: explain the cell shape once in business language — “A 3-cell test means Meta and Google are each measured separately against one shared reference group”; things measured together: “Meta and Google run as one combined group against the reference.” Never ask the user to pick numberOfCells.
- All output templates (Step 4 summary, Insufficient prompt, design comparison, draft link) → references/output-templates.md.

## Edge cases & routing

See references/edge-cases.md — 19 cases covering unsupported country, manual-only platforms, modification mid-flow, ambiguous geo names, Not-ready sales channels, design failures, multi-cell structure (more than 4 cells, platforms with nothing selectable), out-of-scope requests.

## CRITICAL rules (top 7)

1. **Never hard-build when constraints aren’t satisfiable.** State the gap. Give at least 2 actionable next steps. Unsupported country, past start date, infeasible budget — error out, never silently default.
2. **Never re-confirm the full config after Step 4.** Step 4 is the ONLY full-config confirmation gate. After design, after Insufficient, after start-date — only progress updates or specific local questions. Asking “shall I create the draft now?” is the most common regression.
3. **Never override a user’s explicit choice silently.** User picks LTM but PTM is recommended → surface the difference once, respect their decision. Manual-only platform but user said automatic → tell them, don’t switch silently.
4. **Never expose internal parameter names.** `holdoutPct`, `numberOfCells`, `MDL`, `experiment_days`, `attr_model_name`, raw API platform IDs (`facebookMarketing`), and the raw design-engine fields `design_id`, `minimum_detectable_lift`, `factor` — none of these ever appear in chat output.
5. **Method-correct treatment-side labels.** Mislabeling LTM treatment as “Holdout group” contradicts the product UI and confuses users — see §6 Output rules.
6. **Time-parsing direction matters.** “Finish before July 15” is a deadline (back-solve start), not a start date. “Run for 4 weeks” is a duration (testPeriod = 28d), not a deadline. “Yesterday” / past dates → error, never hard-build.
7. **`minimum_detectable_lift` is an internal field, NOT the user-facing MDL.** It may be used in internal step calculations, but it must never appear in chat and must never be presented or labeled as the test’s MDL. Its name is misleading — showing its value to the user, or passing it off as MDL, gives a wrong number.

Full failure-modes catalog → references/failure-modes.md.

## 9. Related skills

| **Skill** | **Relationship** |
|-|-|
| `lift-test-readout` | Downstream: how to read and act on lift test results — interpreting iROAS, confidence intervals, and making post-test decisions. |
| `lift-test-diagnosis` | Downstream: diagnosing failed or inconclusive tests — implementation drift, data readiness gaps, and underpowered designs. |
