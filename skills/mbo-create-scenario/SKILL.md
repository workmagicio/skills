---
name: mbo-create-scenario
description: Turn a natural-language ask about media budget optimization into a configured MBO scenario — "how should I split my budget", "how much should I spend on X". Also handles rename, edit and delete on existing scenarios.
category: mbo
risk: R1
version: 1.1.0
last-updated: 2026-09-23

references:
  - references/inputs-detail.md
  - references/reference-period-rules.md
  - references/budget-parsing.md
  - references/saturation-tactics.md
  - references/constraint-conflicts.md
  - references/preview-format.md
  - references/deliver-flow.md
  - references/modify-flow.md
  - references/edge-cases.md
  - references/failure-modes.md
  - references/key-concepts.md

templates:
  - templates/scenario-preview.md
  - templates/saturation-proposal.md

examples:
  - examples/example-october-budget.md
---

## 1. Purpose

Take a user's natural-language ask about media budget optimization ("how should I split \$500K across Meta and Google next month?") and turn it into a properly configured **MBO scenario** — collecting required settings, parsing budgets / goals / constraints from natural language, validating provisioning + scope, and creating the scenario via `budget-optimizer-create`. Also handles **modify** intents (rename, change inputs, delete) on existing scenarios.

Different from `mbo-read-scenario` (interpret existing results) and from attribution skills (historical data / why questions). MBO is **forward-looking** — it produces a plan.

## 2. When to trigger

Trigger when the user wants **forward-looking budget allocation guidance** or wants to **modify an existing scenario's inputs**.

## 3. Inputs

MBO has 9 scenario settings. The skill must mirror UI defaults — if UI has a default, the skill applies it automatically and surfaces it via `appliedDefaults` in the preview so the user can override.

Top-level summary of each setting (required vs default):

| **Field** | **Required vs default** | **Default value** |
|-|-|-|
| `level` | Has default | `tactic` |
| `channels` | Has default | All available under outcome + level |
| `sales_platform` | Has default | All Ready platforms (combined) |
| `optimization_period` | Required | Next ISO week (Mon → Sun) |
| `reference_period` | **Required (always ask)** | Propose same-length window immediately prior, clamped to MMM model window |
| `goalMethod` | Has default | `maximum` |
| `optimization goal` | Has default | `sales` |
| `budget` + `budgetChangeType` | Conditional (when `goalMethod=maximum`) | `percentage=100` (keep flat) |
| `goalTarget` | Conditional (when `goalMethod=target`) | No default — must ask |
| `budget_constraints` | Has default | None (model runs free) |
| `perChannelBudgetChecked` | Has default | `false` |

Full per-field semantics, parsing rules and budget percentage math live in references/inputs-detail.md. Reference-period rules including the HARD PRECONDITION on `model_window.end` live in references/reference-period-rules.md.

## 4. SOP

### Step 1: Check that MBO is provisioned

- MBO is feature-gated; check the tenant's provisioning status directly. Don't re-derive eligibility at runtime from lift tests + iDDA calibration — that's the backend's job.
- One call: `budget-optimizer-list`. Success → MBO is enabled; 403 / not-provisioned → not enabled, exit.
- If not provisioned → don't collect settings. One-line message: "MBO isn't enabled on your account yet — contact your CSM to turn it on."

### Step 2: Detect intent type

- **Create new scenario** — most common
- **"How much should I spend on X?"** — recommendation question; only honest answer requires running a scenario. Do not search list, do not pull historical. Lead with: "The optimal budget depends on your total spend, time window, and goal — let me build a scenario to answer that." Then collect inputs.
- **Modify existing scenario** — user names an existing scenario + wants to change something. Locate via `budget-optimizer-list`, branch to modify flow (see references/modify-flow.md).
- **Ambiguous** — see Step 3.

### Step 3: Disambiguate vague asks (2 steps if needed)

"What's my budget?" / "Show me my budget" type asks are ambiguous. Don't silently pick. Two-step:

1. **Clarify type**: give 2-4 options matching the user's phrasing context, e.g.:

   - "Existing scenario recommendations (you have 3 saved)"
   - "Build a new scenario for [period if user mentioned one]"
   - "Actual spend on the attribution dashboard"
2. **If user picks "build new"** → continue this skill. If "existing recommendations" → route to `mbo-read-scenario`. If "actual spend" → route to `attribution-data-query`.

### Step 4: Consult database-query-ask (MANDATORY)

Required before any data lookup or scenario creation. `ctx` timestamp for SQL plus MBO conventions + valid goal-vs-method combinations.

### Step 5: Parse what user already gave

From the raw ask, extract everything implicit using the Budget parsing + Goal parsing rules, incl. the worked parse examples (see references/budget-parsing.md).

Fewer fields you ask about, the better.

### Step 6: Ask for missing required fields

Lead with the most pivotal missing field. Order:

1. **Scenario type + budget/target** (if not implied) — inseparable
2. **Optimization period** (if no time window) — apply default "next week" if user just says "build a scenario"
3. **Reference period (ALWAYS ask, even if user said nothing)** — propose per reference-period-rules.md
4. **Sales platform** (only if multiple Ready and user didn't specify)
5. **Optimization goal** (only if maximize/target intent is implied but metric is unclear; if user said nothing, default to sales/maximum and surface)

**If user said something wrong / inconsistent → push back and tell them what's wrong; don't silently coerce.**

- If user named a channel that **isn't connected** → tell them explicitly, list what is available, don't silently drop
- If user named a channel that's not **Ready** → tell them, point to Settings → Platform Integrations, offer to proceed without it (held fixed by the model)

**For everything not explicitly mentioned by the user, apply the UI defaults silently** and surface them in the Step 11 preview with *(default)* annotation so user can override. Default values → §3 Inputs table (full per-field semantics in references/inputs-detail.md).

### Step 7: Saturation-prone tactic lock proposal (MANDATORY)

What counts as saturation-prone, the detection rules (≥ 1 match flags the tactic), the Lock / Adjust / Skip behavior and the user-scale-intent caveat live in references/saturation-tactics.md. Use the template at templates/saturation-proposal.md for the user message.

### Step 8: Check constraint conflicts BEFORE building

If user voiced any budget constraints ("Meta at least \$30K", "TikTok flat", "Pinterest cap \$5K"):

1. **Parse each constraint** into lock_budget / min / max format. **Don't miss any.**
2. **Sum the constraints** against the total budget. Conflict conditions → references/constraint-conflicts.md.
3. **If conflict** — tell user where + by how much, give 3 concrete options. Full resolution wording in references/constraint-conflicts.md.
4. **NEVER silently adjust constraint numbers to make the scenario build.** If user said "Meta at least \$30K" and that conflicts, you cannot lower it to \$25K to fit — that's the worst possible failure.

### Step 9: Validate against MBO scope

Before showing preview, check for out-of-scope inputs — the reject / push-back table (past period, over-long horizon, reference period outside the MMM model window, mismatched reference length, non-existent channel, negative budget, questions about the model itself) lives in references/edge-cases.md.

### Step 10: Get reference period baseline budget

- `budget-optimizer-reference-data` — Ready platforms, recent spend, baseline performance, available channels/tactics, **baseline spend (`spendBase`) for the parsed period** (needed to give user a sensible budget anchor).
- For **target scenarios** (`goalMethod=target`): also capture the **baseline value of the target metric** over the reference period (e.g., baseline ROAS = 2.8x when user targets 4x). Show in preview so user knows the starting point.

### Step 11: Show preview + confirm (skill-level UX)

<callout emoji="🛑">
**HARD RULE.** Every single `budget-optimizer-create` call MUST be immediately preceded by a Step 11 preview-and-confirm in the SAME turn. No exceptions.
</callout>

Use the template at templates/scenario-preview.md. Full preview format spec lives in references/preview-format.md.

### Step 12: Create

- Call `budget-optimizer-create` with resolved settings (all UI defaults explicitly populated, not omitted).
- If MBO returns a constraint conflict that the pre-check missed (rare; possible with subtle goal-constraint interactions), pass back the two options MBO provides: **Prioritize Constraints** or **Prioritize Target**. Don't pick for the user.
- Quote `scenarioURL` from create response VERBATIM. NEVER construct a URL yourself. If absent, omit the link — say only "scenario name N".

### Step 13: Deliver

After Step 12 (create) succeeds, **wait \~1 minute** then auto-call `budget-optimizer-forecast` to fetch the completed scenario. Then summarize the result for the user (top 2-3 reallocations + expected delta vs baseline + any excluded channels). **The summary is an interpretation — run the goal-vs-projection sanity check and baseline / paid-media decomposition per references/deliver-flow.md before writing it** (same discipline as mbo-read-scenario).

Forecast `status` handling (ready / running / error) and the result-message wording live in references/deliver-flow.md.

## 5. Tools used

| **Tool** | **Required?** | **System risk** | **Purpose** |
|-|-|-|-|
| `database-query-ask` | Required (first) | R0 | MBO conventions, goal-method combinations, `ctx` timestamp for SQL |
| `budget-optimizer-list` | Required | R0 | Provisioning check (Step 1) + locate scenarios for modify intent |
| `budget-optimizer-reference-data` | Required | R0 | Ready platforms + baseline spend + Halo eligibility + MMM model window (for reference period bounds) |
| `tenant-list` | Optional | R0 | Verify sales platform setup if needed |
| `lift-test-list` | Optional | R0 | Reference if user asks "is this channel calibrated"; not used for eligibility (backend-gated) |
| `database-query-run` | Optional | R0 | Check reference window for anomalies |
| `budget-optimizer-create` | Required | R1 | Create the scenario. |
| `budget-optimizer-update-or-delete` | Conditional (modify intent) | R1 | Update fields or delete scenario. |
| `budget-optimizer-forecast` | Required | R0 | Fetch completed scenario in Step 13 |

## 6. Output format

Three turns max:

1. **Disambiguation / clarification** — only if needed; ambiguous "show me my budget" gets 2-4 options; missing required field gets one question (reference period proposal counts as the pivotal question)
2. **Preview + confirm** — table of all settings (resolved + defaulted, with *(default)* annotations) + confirm/modify/cancel; warn run takes a few minutes
3. **Result** — MBO link + 1-2 sentence brief reading (top reallocation + expected lift)

**What never appears**:

- Raw JSON of the `budget-optimizer-create` payload
- Multi-question forms ("which level? which sales platform? which period? which type? which goal? which budget?")
- Asking about budget constraints when user didn't mention them (default = none)
- Silently defaulting reference period without surfacing — reference period proposal must always be visible to user
- Internal terminology (`attr_model_name`, table names, model IDs)
- Tool names exposed to user ("do you want list or forecast?")
- Scenario IDs in conversation (use scenario names)

## 7. CRITICAL rules (top 8)

1. **Always preview before create.** Every `budget-optimizer-create` call must be preceded by Step 11 preview-and-confirm in the same turn.
2. **Reference period: always ask explicitly**, and propose ONLY within `[model_window.start, model_window.end]`. Never propose dates after `model_window.end`, even if they look intuitive. See reference-period-rules.md.
3. **Budget percentage semantics are % of baseline, NOT delta.**`budget=100` = keep flat. `budget=120` = +20%. `budget=80` = −20%. Mis-parsing is critical.
4. **Mis-parse budget unit = critical failure.** "\$100k" is 100000, not 100.
5. **Never silently adjust constraint numbers to make scenario fit.** Conflict → 3 concrete options + ask user.
6. **Default outcome = `totalSalesHalo` if Halo model available** (Amazon / TikTok Shop integrated); else `totalSales`.
7. **Never silently lock saturation-prone tactics.** Always surface the proposal with reasons + 3 options (Lock all / Adjust per tactic / Skip).
8. **Quote `scenarioURL` verbatim** from create response. Never construct URLs yourself.

Full failure-mode catalog (\~30 items) lives in references/failure-modes.md. Edge cases & routing live in references/edge-cases.md.

## 8. Output artifacts

- **Preview message** — table from templates/scenario-preview.md
- **Saturation lock proposal** (when ≥ 1 flagged tactic) — message from templates/saturation-proposal.md
- **Result message** — MBO link + top 2-3 reallocations + expected lift

## 9. Related skills

- **Sibling**: `mbo-read-scenario` — interpret existing scenario results
- **Sibling**: `attribution-data-query` — historical actuals (when user wanted "actual spend" instead of a plan)
- **Sibling**: `attribution-edge-routing` — when MBO not provisioned
- **Worked example**: examples/example-october-budget.md — October 2026 scenario with model_window.end=2026-06-13
