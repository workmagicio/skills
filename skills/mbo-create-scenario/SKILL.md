---
name: mbo-create-scenario
description: Turn a natural-language ask about media budget optimization into a properly configured MBO scenario — collect required settings, parse budget/goal/constraints, validate provisioning + scope, propose saturation locks, and create via budget-optimizer-create. Also handles modify (rename, edit, delete) on existing scenarios.
category: mbo
risk: R1
version: 1.0.0
last-updated: 2026-06-25

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

Trigger when the user wants **forward-looking budget allocation guidance** or wants to **modify an existing scenario's inputs**. Common phrasings:

- "How should I split next month's \$500K across channels?"
- "Build me a budget scenario for Q3"
- "How much should I spend on Meta next month?" (recommendation question — must run a scenario to answer)
- "If I want to hit 3.5x ROAS next month, how much should I spend?"

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

### Step 4: Consult knowledge-base-ask (MANDATORY)

Required before any data lookup or scenario creation. `ctx` timestamp for SQL plus MBO conventions + valid goal-vs-method combinations.

### Step 5: Parse what user already gave

From the raw ask, extract everything implicit using the Budget parsing + Goal parsing rules (see references/budget-parsing.md):

- "\$500K for next month" → budget=500000, budgetChangeType=amount, period=next month, scenario_type=Outcome Max
- "Hit 3.5x ROAS in Q3" → goal=roas, method=target, target=3.5, period=Q3, scenario_type=Target Achievement
- "Optimize Meta only" → scope = Meta (filter to Meta channels only, not all)

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

**For everything not explicitly mentioned by the user, apply the UI defaults silently** and surface them in the Step 11 preview with *(default)* annotation so user can override:

- `level=tactic`
- `channels` = all available under the selected outcome + level
- `sales_platform` = all Ready platforms
- `period=week`
- `outcome` = `totalSalesHalo` if Halo model available (Amazon / TikTok Shop integrated), else `totalSales`
- `goal=sales`, `goalMethod=maximum`
- `budget=100` with `budgetChangeType=percentage` (= keep current spend flat)
- `budget_constraints` = none
- `perChannelBudgetChecked=false`

### Step 7: Saturation-prone tactic lock proposal (MANDATORY)

Some tactics are **inherently saturation-prone** — adding budget produces little or no incremental return because they've already captured the available demand or audience. Common examples: branded search, retargeting, loyalty / returning-customer campaigns, brand DPA. If MBO runs without locking these, the optimizer may waste budget on them or under-recommend channels that actually have headroom.

Detection rules (≥ 1 match flags the tactic) and Lock / Adjust / Skip behavior live in references/saturation-tactics.md. Use the template at templates/saturation-proposal.md for the user message.

<callout emoji="💡">
**Don't take the bait — saturation lock vs user scale intent.** If user explicitly named a flagged tactic as something they want to scale ("aggressive on retargeting"), **skip the lock proposal for that tactic**. Respect the user's scale intent. Don't push back with "but it's saturated" — recommend a custom max instead of a full lock if the curve is genuinely flat.
</callout>

### Step 8: Check constraint conflicts BEFORE building

If user voiced any budget constraints ("Meta at least \$30K", "TikTok flat", "Pinterest cap \$5K"):

1. **Parse each constraint** into lock_budget / min / max format. **Don't miss any.**
2. **Sum the constraints** against the total budget:

   - If sum of **minimums** > total budget → conflict (total too low)
   - If sum of **locked + minimums** > total budget → conflict
   - If sum of **maximums** < total budget and all channels constrained → conflict (total too high)
3. **If conflict** — tell user where + by how much, give 3 concrete options. Full resolution wording in references/constraint-conflicts.md.
4. **NEVER silently adjust constraint numbers to make the scenario build.** If user said "Meta at least \$30K" and that conflicts, you cannot lower it to \$25K to fit — that's the worst possible failure.

### Step 9: Validate against MBO scope

Before showing preview, check for out-of-scope inputs:

| **Invalid input** | **Action** |
|-|-|
| Past optimization period | Reject. Start date must be in future; propose next-week start. |
| Optimization period > supported max (e.g., beyond model data range) | Reject. Tell user the max horizon + suggest shortening. |
| Reference period outside MMM model window | Reject. Tell user the supported window `[hyp.model_window.start → hyp.model_window.end]`; propose clamped period. |
| Reference period length wildly different from optimization period without explicit user confirmation | Push back. Tell user MBO prorates and the proration math; ask if they still want to proceed. |
| Non-existent channel in tenant | Reject. Don't silently drop. List available. Offer to proceed without it. |
| Negative budget | Reject. |
| User questions the model itself ("why is MMM wrong?") | Don't explain MMM internals; route to CSM. |

### Step 10: Get reference period baseline budget

- `budget-optimizer-reference-data` — Ready platforms, recent spend, baseline performance, available channels/tactics, **baseline spend (`spendBase`) for the parsed period** (needed to give user a sensible budget anchor).
- For **target scenarios** (`goalMethod=target`): also capture the **baseline value of the target metric** over the reference period (e.g., baseline ROAS = 2.8x when user targets 4x). Show in preview so user knows the starting point.

### Step 11: Show preview + confirm (skill-level UX)

<callout emoji="🛑">
**HARD RULE.** Every single `budget-optimizer-create` call MUST be immediately preceded by a Step 11 preview-and-confirm in the SAME turn. No exceptions. `budget-optimizer-create` is R1 (direct execute + audit, no system block) — skill-level convention is preview + confirm because mis-parsed intent on a multi-minute scenario wastes user time.
</callout>

The preview MUST surface **all auto-applied defaults** (level=tactic, period=week, goal=sales, method=maximum, budget=100% flat if user didn't say, outcome=totalSalesHalo for Halo customers, etc.) so the user can override before running.

Use the template at templates/scenario-preview.md. Full preview format spec lives in references/preview-format.md.

### Step 12: Create

- Call `budget-optimizer-create` with resolved settings (all UI defaults explicitly populated, not omitted).
- If MBO returns a constraint conflict that the pre-check missed (rare; possible with subtle goal-constraint interactions), pass back the two options MBO provides: **Prioritize Constraints** or **Prioritize Target**. Don't pick for the user.
- Quote `scenarioURL` from create response VERBATIM. NEVER construct a URL yourself. If absent, omit the link — say only "scenario name N".

### Step 13: Deliver

After Step 12 (create) succeeds, **wait \~1 minute** then auto-call `budget-optimizer-forecast` to fetch the completed scenario. Then summarize the result for the user (top 2-3 reallocations + expected delta vs baseline + any excluded channels).

Forecast `status` handling (ready / running / error) lives in references/deliver-flow.md.

Example: "Scenario created — \[Open in MBO →\](link). Recommended allocation: Meta \$310K (+12%), Google \$190K (−15%). Expected sales lift: \~+\$240K vs reference allocation. Click the link to open the scenario in MBO — saturation curves, full per-tactic breakdown, and downloadable spreadsheet are there."

Don't pad. End the turn.

## 5. Tools used

| **Tool** | **Required?** | **System risk** | **Purpose** |
|-|-|-|-|
| `knowledge-base-ask` | Required (first) | R0 | MBO conventions, goal-method combinations, `ctx` timestamp for SQL |
| `budget-optimizer-list` | Required | R0 | Provisioning check (Step 1) + locate scenarios for modify intent |
| `budget-optimizer-reference-data` | Required | R0 | Ready platforms + baseline spend + Halo eligibility + MMM model window (for reference period bounds) |
| `tenant-list` | Optional | R0 | Verify sales platform setup if needed |
| `lift-test-list` | Optional | R0 | Reference if user asks "is this channel calibrated"; not used for eligibility (backend-gated) |
| `database-query-sql` | Optional | R0 | Check reference window for anomalies |
| `budget-optimizer-create` | Required | R1 | Create the scenario. R1 system-level; skill-level preview+confirm before firing. |
| `budget-optimizer-update-or-delete` | Conditional (modify intent) | R1 | Update fields or delete scenario. Delete requires explicit second confirmation. |
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
- Bracketed pseudo-buttons (`[Confirm and run]`, `[Lock all]`, `[Cancel]`, …) — the chat surfaces render them as literal text, not clickable buttons. Present the options in plain language and ask the user to reply. The only real interactive confirm is the system R2 card, which fires automatically for a gated tool; the skill never draws its own.

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
