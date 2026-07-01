---
name: lift-test-creation
description: Turn a natural-language request into an executable lift test draft.
category: lift-test
risk: R0
version: 1.0.0
last-updated: 2026-06-29

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

**Examples that should trigger this skill**:

- “Create a lift test for me”
- “Run a Meta lift test”
- “Set up a lift test on Meta at the tactic level”
- “Create a Meta lift test that finishes before July 15”
- “Run a lift test on both Meta and Google”
- “Run a Meta lift test in the US but exclude New York and California”

**Examples that should NOT trigger this skill — route to another skill instead**:

| **Input pattern** | **Route to** |
|-|-|
| Query results / progress of an existing lift test | `lift-test-readout` |
| Compare multiple completed tests | `lift-test-readout` |
| “Why did my test fail / come back inconclusive?” | `lift-test-diagnosis` |
| Conceptual questions about PTM vs. LTM / wanting documentation | `knowledge-base-ask` |

## Inputs

| **Field** | **Required?** | **Description / default** |
|-|-|-|
| adPlatform | Required | The ad platform the user named (Meta, Google, TikTok, etc.). **Apply alias mapping silently** (FB→Meta, GA→Google Ads, IG→Meta). If the user didn’t name one, **ask**. |
| testLevel | Required | platform / tactic / campaign. If the user didn’t say, **ask in business language** (“Test the entire account, a specific tactic, or particular campaigns?”). |
| impactCampaignInfos | Required | Tactic ID(s) when testLevel = tactic; campaign ID(s) when testLevel = campaign. **Must ask** (unless the user already named specific tactics/campaigns). Use lift-test-impact-campaigns to fetch the candidate list. |
| testStartTime | Required | If the user didn’t say, **ask last** — other fields can be resolved first. **Never** accept a past date. |
| salesChannel | Has default | Query DB for the tenant’s connected sales channels, show them to the user for confirmation. Default to all selected (every channel in **Ready** or **Not optimal** state). |
| primaryMetric | Has default | Default orders. Switch to new_customers when the user says “acquisition / new customer.” |
| country | Has default | Query trailing-90-day sales share, auto-pick the dominant country. Only **7 countries supported**: US / AU / CA / FR / DE / UK. **Other countries error out** — never hard-build. |
| geoLevel | Has default | Derive from country: US → DMA; others → postcode. **US state only when the user explicitly says so.** |
| method | Has default | Derive from ad spend: if PTM is Sufficient → PTM; otherwise LTM. **Honor explicit user choice exactly** — do not silently switch. |
| approach | Has default | Derive from liftTestAdsPlatformList: if the platform supports automatic → automatic; otherwise manual. **MNTN / Walmart Connect / Roku / Universal Ads / Vibe / TikTok GMV Max** are manual-only. |
| timezone | Auto | Query dwd_view_analytics_tenant_timezone. Don’t ask the user. |
| locationSetting | Auto + user override | By default, query the tenant’s currently scheduled + active tests and auto-exclude the union of their control + test geos (**to avoid colliding with running tests**). Layer the user’s explicit exclude / include on top. |
| numberOfCells | Auto | When the user names multiple platforms, automatically split into multiple 2-cell tests. **Don’t ask the user to pick this.** Explain in the summary in business language: “I’ll split this into N separate 2-cell tests, one per platform.” |
| holdoutPct | Has default | Default 0.05. **The user should never see this field name**, unless design fails and the value needs adjusting. |
| testPeriod | Design output | Computed by the design engine, 14–60 days. When the user states a constraint like “4 weeks,” check whether it’s feasible. |
| coolingPeriod | Has default | Default 7 days. Range 1–28. Suggest 14–28 when the user mentions long-consideration categories (furniture, electronics, etc.). |
| status | Default | Default draft. Don’t go straight to schedule unless the user explicitly says so. |

## SOP

### 4.1 Steps

1. **Parse the request.** Resolve every field present in user wording (aliases, time, geo). Record what’s specified — never re-ask.
2. **Ask only for missing required fields.** Just adPlatform + testLevel + (impactCampaignInfos via lift-test-impact-campaigns). At most 1–2 questions per turn.
3. **Resolve defaults.** Run lift-test-scan for: current spend, PTM Sufficient check, active tests for collision avoidance. Query DB for sales channels / country / timezone.
4. **Confirm Step 4 — the ONLY full-config confirmation gate.** Echo all collected + resolved fields in business language. Surface override conflicts once, don’t lecture. See references/output-templates.md.
5. **Call lift-test-design.** On failure (holdout too low / too many excludes / readiness insufficient), don’t silently adjust — surface and ask. Detail → references/sop-detail.md.
6. **Determine Sufficient / Insufficient via lift-test-design-analyze.** If Insufficient, offer the 4 standard levers (raise budget / increase geo size / extend period / proceed anyway). Lever detail → references/sop-detail.md.
7. **Ask for testStartTime if missing.** Account for active-test collisions (“Another test is running through [date] — suggest after that”).
8. **Call lift-test-create-or-update directly.** No second full-config confirmation. Return draft link. Payload mapping → references/sop-detail.md.

### 4.2 Validation Checkpoints

Multi-step SOP — the agent must pause and surface at these gates, never autopilot through:

| After step | Pause and surface |
|-|-|
| Step 4 | Full-config summary in business language. **This is the only full-config confirmation gate.** |
| Step 5/6 (after design) | Progress update only: test period + feasibility. Do NOT restate full config. |
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
| lift-test-scan | Required | Pull current ad spend, currently scheduled / active tests, PTM-Sufficient check |
| lift-test-impact-campaigns | Required | Fetch candidate list when testLevel = tactic / campaign |
| lift-test-design-prepare | Required | Package collected + resolved parameters into design inputs |
| lift-test-design | Required | Generate geo pair; returns testPeriod, holdoutPct, feasibility threshold |
| lift-test-design-analyze | Required | Compute expected daily spend, determine Sufficient / Insufficient, recommend PTM or LTM |
| lift-test-create-or-update | Required (final step) | Create draft / update draft |
| lift-test-list | Optional | When the user asks “what tests have I created before” |
| lift-test-get | Optional | Pull an existing draft when the user wants to modify mid-flow |

## Output format

- Business language only — no holdoutPct, numberOfCells, MDL, experiment_days, attr_model_name, facebookMarketing in chat output.
- UI-aligned field names: “Test period” (not “Experiment days”), “Feasibility threshold” (not “Expected daily spend”), “Geo size” (not “Geo coverage”).
- Method-specific treatment-side labels (matches product UI): PTM → “Holdout group”; LTM → “Exposed group”; reference side any method → “Reference group”. Never use “Holdout group” in an LTM column. Never invent a unified “Treatment group” term.
- First mention of PTM / LTM gets a one-line inline explanation: “PTM (pause-to-measure — pause ads in a subset of geos)”. After that, just “PTM” / “LTM” is fine.
- Multi-platform requests: explain the split in business language — “I’ll set up N separate 2-cell tests, one per platform.” Never ask the user to pick numberOfCells.
- All output templates (Step 4 summary, Insufficient prompt, design comparison, draft link) → references/output-templates.md.

## Edge cases & routing

See references/edge-cases.md — 17 cases covering unsupported country, manual-only platforms, modification mid-flow, ambiguous geo names, Not-ready sales channels, design failures, out-of-scope requests.

## CRITICAL rules (top 6)

1. **Never hard-build when constraints aren’t satisfiable.** State the gap. Give at least 2 actionable next steps. Unsupported country, past start date, infeasible budget — error out, never silently default.
2. **Never re-confirm the full config after Step 4.** Step 4 is the ONLY full-config confirmation gate. After design, after Insufficient, after start-date — only progress updates or specific local questions. Asking “shall I create the draft now?” is the most common regression.
3. **Never override a user’s explicit choice silently.** User picks LTM but PTM is recommended → surface the difference once, respect their decision. Manual-only platform but user said automatic → tell them, don’t switch silently.
4. **Never expose internal parameter names.** holdoutPct, numberOfCells, MDL, experiment_days, attr_model_name, raw API platform IDs (facebookMarketing) — none of these appear in chat output.
5. **Method-correct treatment-side labels.** Mislabeling LTM treatment as “Holdout group” contradicts the product UI and confuses users — see §6 Output rules.
6. **Time-parsing direction matters.** “Finish before July 15” is a deadline (back-solve start), not a start date. “Run for 4 weeks” is a duration (testPeriod = 28d), not a deadline. “Yesterday” / past dates → error, never hard-build.

Full failure-modes catalog → references/failure-modes.md.

## 9. Related skills

| **Skill** | **Relationship** |
|-|-|
| `lift-test-readout` | Downstream: how to read and act on lift test results — interpreting iROAS, confidence intervals, and making post-test decisions. |
| `lift-test-diagnosis` | Downstream: diagnosing failed or inconclusive tests — implementation drift, data readiness gaps, and underpowered designs. |
