---
name: mbo-create-scenario
description: Take a natural-language ask about media budget optimization and turn it into a properly configured, forward-looking MBO (Media Budget Optimizer) scenario — parsing budgets, goals, and constraints, validating scope, and creating the scenario. Also handles modify intents on existing scenarios. Use for forward-looking budget allocation questions (e.g. "How should I split $500K across Meta and Google next month?"). Not for interpreting existing results.
---

# mbo-create-scenario

## 1. Purpose
Take a user's natural-language ask about media budget optimization ("how should I split $500K across Meta and Google next month?") and turn it into a properly configured **MBO scenario** — collecting required settings, parsing budgets / goals / constraints from natural language, validating provisioning + scope, and creating the scenario via `budget-optimizer-create`. Also handles **modify** intents (rename, change inputs) on existing scenarios.  Different from `mbo-read-scenario` (interpret existing results) and from attribution skills (historical data / why questions). MBO is **forward-looking** — it produces a plan.
## 2. When to trigger
Trigger when the user wants **forward-looking budget allocation guidance** or wants to **modify an existing scenario's inputs**. Common phrasings:
- "How should I split next month's $500K across channels?"
- "Build me a budget scenario for Q3"
- "How much should I spend on Meta next month?" (recommendation question — must run a scenario to answer)
- "If I want to hit 3.5x ROAS next month, how much should I spend?"
## 3. Inputs
MBO has 9 scenario settings. The skill must mirror UI defaults — if UI has a default, the skill applies it automatically and surfaces it via `appliedDefaults` in the preview so the user can override.

<lark-table rows="12" cols="4" header-row="true" column-widths="198,241,223,444">

  <lark-tr>
    <lark-td>
      **Field**
    </lark-td>
    <lark-td>
      **Required from user or use default value**
    </lark-td>
    <lark-td>
      **Default value**
    </lark-td>
    <lark-td>
      **Notes**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `level`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      **tactic**
    </lark-td>
    <lark-td>
      Switch to `channel` only if user explicitly manages budget at platform level.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `channels`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      **All available** channels/tactics under selected outcome + level
    </lark-td>
    <lark-td>
      If user named a subset ("Meta only"), respect scope. Don't expand.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `sales_platform`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      All Ready platforms selected (combined)
    </lark-td>
    <lark-td>
      Default selects all Ready platforms. Only narrow to a subset if user explicitly says ("only Shopify", "exclude Amazon").
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `optimization_period` (`periodStartDate` + `periodEndDate`)
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      Next ISO week (Monday → Sunday)
    </lark-td>
    <lark-td>
      Future planning window. Parse "next month" / "Q3" / "next 30 days" → explicit dates. **Past dates invalid**. If user didn't say a window, apply default (next week) and surface in preview.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `reference_period` (`modelReferenceStartDate` + `modelReferenceEndDate`)
    </lark-td>
    <lark-td>
      **Required (always ask user)**
    </lark-td>
    <lark-td>
      **Propose**: same length as `optimization_period`, immediately prior within the MMM model window
    </lark-td>
    <lark-td>
      1. Always ask the user explicitly. 
      1. **HARD PRECONDITION**: BEFORE proposing any reference period, fetch the MMM model window (`hyp.model_window.start` → `hyp.model_window.end`) from `budget-optimizer-reference-data`. **Every proposed window MUST fall entirely within these bounds — including **`**model_window.end**`. Do NOT suggest dates after `model_window.end` even if they look "intuitive" (e.g., do NOT suggest September as reference for an October optimization if the model only has data through June 13).
      1. Reference period **length should match **`**optimization_period**`** length exactly** (e.g., 31-day October optimization → 31-day reference window). If the immediately-prior same-length window would extend past `model_window.end`, **clamp** to end at `model_window.end` and start at `model_window.end − optimization_period_length`. Example: October 2026 (31 days) + model_window.end = 2026-06-13 → propose **2026-05-14 → 2026-06-13**, NOT 2026-09-01 → 2026-09-30.
      1. If model window is too short to fit a same-length reference (e.g., user wants 90-day optimization but only 60 days of model data left), tell the user the constraint and offer: (a) use the longest available window inside model_window with prorated baseline, or (b) shorten the optimization_period to match available data. **Never silently propose a longer or out-of-window reference.**
      1. Surface known anomalies in the proposal window (BFCM, major outages, tracking gaps, blowout sales) and suggest a clean alternative.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `goalMethod`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      Maximum
    </lark-td>
    <lark-td>
      Prases from users intent, `maximum` (under a budget cap) or `target` (hit a specific metric value).
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `optimization goal`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      **sales**
    </lark-td>
    <lark-td>
      One of 12 metric — prases from user intent,  `sales` / `roas` / `profit` / `poas` / `orders` / `cost_per_order` / `new_customer_sales` / `new_customer_roas` / `new_customer_profit` / `new_customer_poas` / `new_customer_orders` / `cac`
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `budget` + `budgetChangeType`
    </lark-td>
    <lark-td>
      Conditional Required  (only when `goal method`=maximum)
    </lark-td>
    <lark-td>
      `budgetChangeType=percentage`, `budget=100` (= keep current spend flat)
    </lark-td>
    <lark-td>
      **amount** = absolute USD ("$500K" → budget=500000). **percentage** = % of baseline (100 = keep flat, 120 = +20%, 80 = −20%, 200 = 2x, 0 = $0). Default when user said nothing: `percentage=100` (keep flat).
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `goalTarget`
    </lark-td>
    <lark-td>
      Conditional Required  (only when `goal method`=target)
    </lark-td>
    <lark-td>
      No default
    </lark-td>
    <lark-td>
      Must ask users explicitly
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `budget_constraints`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      None (model runs free)
    </lark-td>
    <lark-td>
      **Don't ask proactively**. Honor if user mentions. Pre-check sum vs total budget.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `perChannelBudgetChecked`
    </lark-td>
    <lark-td>
      Has default
    </lark-td>
    <lark-td>
      **false**
    </lark-td>
    <lark-td>
      Per-tactic budget lock panel — default closed; only set `true` if user explicitly locks tactics.
    </lark-td>
  </lark-tr>
</lark-table>

## 4. SOP
### **Step 1: Check that MBO is provisioned**
- MBO is feature-gated; check the tenant's provisioning status directly. Don't re-derive eligibility at runtime from lift tests + iDDA calibration — that's the backend's job.
- One call: `budget-optimizer-list`. Success → MBO is enabled; 403 / not-provisioned → not enabled, exit.
- If not provisioned → don't collect settings. A one-line message: "MBO isn't enabled on your account yet — contact your CSM to turn it on."
### **Step 2: Detect intent type**
- **Create new scenario** — most common
- **"How much should I spend on X?"** — recommendation question; only honest answer requires running a scenario; do not search list, do not pull historical. Lead with: "The optimal budget depends on your total spend, time window, and goal — let me build a scenario to answer that." Then collect inputs.
- **Modify existing scenario** — user names an existing scenario + wants to change something. Locate via `budget-optimizer-list`, branch to modify flow (§ 4.7).
- **Ambiguous** — see Step 3
### **Step 3: Disambiguate vague asks (2 steps if needed)**
"What's my budget?" / "Show me my budget" type asks are ambiguous. Don't silently pick. Two-step:
1. **Clarify type**: give 2-4 options matching the user's phrasing context, e.g.:
  - "Existing scenario recommendations (you have 3 saved)"
  - "Build a new scenario for [period if user mentioned one]"
  - "Actual spend on the attribution dashboard"
1. **If user picks "build new"** → continue this skill. If "existing recommendations" → route to `mbo-read-scenario`. If "actual spend" → route to `attribution-data-query`.
### **Step 4: Consult **`**knowledge-base-ask**`** (MANDATORY)**
Required before any data lookup or scenario creation. `ctx` timestamp for SQL plus MBO conventions + valid goal-vs-method combinations.
### **Step 5: Parse what user already gave**
From the raw ask, extract everything implicit using the Budget parsing + Goal parsing rules from § 3:
- "$500K for next month" → budget=500000, budgetChangeType=amount, period=next month, scenario_type=Outcome Max
- "Hit 3.5x ROAS in Q3" → goal=roas, method=target, target=3.5, period=Q3, scenario_type=Target Achievement
- "Optimize Meta only" → scope = Meta (filter to Meta channels only, not all)
Fewer fields you ask about, the better.
### **Step 6: Ask for missing required fields  **
Lead with the most pivotal missing field. ** **Order:
1. **Scenario type + budget/target** (if not implied) — inseparable
1. **Optimization period** (if no time window) — apply default "next week" if user just says "build a scenario"
1. **Reference period (ALWAYS ask, even if user said nothing)** — see below
1. **Sales platform** (only if multiple Ready and user didn't specify)
1. **Optimization goal** (only if maximize/target intent is implied but metric is unclear; if user said nothing, default to sales/maximum and surface)

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

### **Step 7: Saturation-prone tactic lock proposal (MANDATORY)**
Some tactics are **inherently saturation-prone** — adding budget produces little or no incremental return because they've already captured the available demand or audience. Common examples: branded search, retargeting, loyalty / returning-customer campaigns, brand DPA. If MBO runs without locking these, the optimizer may waste budget on them or under-recommend channels that actually have headroom.
**Rule — flag a tactic as saturation-prone if it meets ≥ 1 of:**
- **Name pattern match** (lower-cased tactic / campaign name contains): `brand` · `branded` · `retarget` · `remarket` · `rt` (whole word) · `loyalty` · `rc` · `returning customer` · `existing customer` · `dpa-brand` / `brand dpa`
- **Impression share heuristic**: ≥ 80% over the reference period → no inventory headroom
- **Saturation curve flat at current spend**: marginal ROAS / average ROAS < 0.5
- **Steady-state historical pattern**: spend stable over last 60–90 days AND attributed orders / sales also stable
- **MBO model's own "locked-by-default" flag** (if returned in reference-data): respect it
**Behavior:**
1. Run the rule against every tactic in scope after Step 6.
1. **Never silently lock**. Always surface the proposal with reason per tactic:`I noticed [N] tactics that are typically saturation-prone — locking them at reference spend is usually a better idea than letting the optimizer move budget there:• Google_Brand_Search — impression share ~95% over the reference period; no inventory headroom even if budget were higher• Meta_Retargeting — saturation curve is flat at current spend (marginal ROAS ~0.4× average); audience pool is small• Pinterest_RC_Loyalty — name-matched as a returning-customer tactic; closed audienceLock these at reference spend? [Lock all]  [Adjust per tactic]  [Skip locks]`
1. **Wait for user confirmation**. Don't proceed to Step 8 until user picks one of the three options.
1. If **Lock all** → add each flagged tactic to `budget_constraints` as a lock at reference-period spend.
1. If **Adjust per tactic** → allow tactic-by-tactic decisions (lock / leave free / custom min-max).
1. If **Skip locks** → proceed without locks; record decision in scenario notes.
1. If rule flags **zero tactics** → no message; proceed silently to Step 8.
**Caveats:**
- If user explicitly named a flagged tactic as something they want to scale ("aggressive on retargeting"), **skip the lock proposal for that tactic** — respect the user's scale intent, don't push back.

### **Step 8 : Check constraint conflicts BEFORE building (if user mentioned constraints)**
If user voiced any budget constraints ("Meta at least $30K", "TikTok flat", "Pinterest cap $5K"):
1. **Parse each constraint** into lock_budget / min / max format. **Don't miss any.**
1. **Sum the constraints** against the total budget:
  - If sum of **minimums** > total budget → conflict (total too low)
  - If sum of **locked + minimums** > total budget → conflict
  - If sum of **maximums** < total budget and all channels constrained → conflict (total too high)
1. **If conflict** — tell user where + by how much, give 3 concrete options:
  - "Increase total budget to ≥ $X"
  - "Drop the floor on [tactic] from $Y to $Z or lower"
  - "Raise the cap on [tactic] from $A to $B or higher"
1. **NEVER silently adjust constraint numbers to make the scenario build.** If user said "Meta at least $30K" and that conflicts, you cannot lower it to $25K to fit — that's the worst possible failure.
### **Step 9: Validate against MBO scope**
Before showing preview, check for out-of-scope inputs:

<lark-table rows="8" cols="2" header-row="true" column-widths="328,431">

  <lark-tr>
    <lark-td>
      **Invalid input**
    </lark-td>
    <lark-td>
      **Action**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Past optimization period
    </lark-td>
    <lark-td>
      Reject. Start date must be in future; propose next-week start.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Optimization period > supported max (e.g., beyond model data range)
    </lark-td>
    <lark-td>
      Reject. Tell user the max horizon + suggest shortening.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Reference period outside MMM model window
    </lark-td>
    <lark-td>
      Reject. Tell user the supported window `[hyp.model_window.start → hyp.model_window.end]`; propose clamped period.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Reference period length wildly different from optimization period without explicit user confirmation
    </lark-td>
    <lark-td>
      Push back. Tell user MBO prorates and the proration math; ask if they still want to proceed.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Non-existent channel in tenant
    </lark-td>
    <lark-td>
      Reject. Don't silently drop. List available. Offer to proceed without it.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Negative budget
    </lark-td>
    <lark-td>
      Reject.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User questions the model itself ("why is MMM wrong?")
    </lark-td>
    <lark-td>
      Don't explain MMM internals; route to CSM.
    </lark-td>
  </lark-tr>
</lark-table>

### **Step 10: Get reference period baseline budget**
- `budget-optimizer-reference-data` — Ready platforms, recent spend, baseline performance, available channels/tactics, **baseline spend (**`**spendBase**`**) for the parsed period** (needed to give user a sensible budget anchor), 
- For **target scenarios** (`goalMethod=target`): also capture the **baseline value of the target metric** over the reference period (e.g., baseline ROAS = 2.8x when user targets 4x). Show in preview so user knows the starting point.

### **Step 11:  Show preview + confirm (skill-level UX)**
`budget-optimizer-create` is R1 (direct execute + audit, no system block). Skill-level convention: preview + confirm because mis-parsed intent on a multi-minute scenario wastes user time.
The preview MUST surface **all auto-applied defaults** (level=tactic, period=week, goal=sales, method=maximum, budget=100% flat if user didn't say, outcome=totalSalesHalo for Halo customers, etc.) so the user can override before running.
Example:
`**Scenario: Q3 Meta + Google Allocation**`

<lark-table rows="10" cols="2" column-widths="207,520">

  <lark-tr>
    <lark-td>
      **Setting**
    </lark-td>
    <lark-td>
      **Value**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Level
    </lark-td>
    <lark-td>
      Ad tactic *(default)*
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Sales platform
    </lark-td>
    <lark-td>
      Shopify
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Optimization period
    </lark-td>
    <lark-td>
      2026-07-01 → 2026-09-30 (Q3, 92 days)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Reference period
    </lark-td>
    <lark-td>
      2026-03-31 → 2026-06-30 (prior 92 days, same length)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Scenario type
    </lark-td>
    <lark-td>
      Outcome Maximization
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Optimization goal
    </lark-td>
    <lark-td>
      Sales (maximize) *(default)*
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Total budget
    </lark-td>
    <lark-td>
      $500,000 (absolute) — baseline reference was $420K
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Target
    </lark-td>
    <lark-td>
      ROAS 1.5 - baseline reference was 1.3
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Budget constraints
    </lark-td>
    <lark-td>
      Meta locked at ≥ $200K *(your constraint)*
    </lark-td>
  </lark-tr>
</lark-table>

`[Confirm and run]   [Modify]   [Cancel]`
Tell the user the scenario takes a few minutes.

### **Step 12: Create**
- Call `budget-optimizer-create` with resolved settings (all UI defaults explicitly populated, not omitted)
- If MBO returns a constraint conflict that the pre-check missed (rare; possible with subtle goal-constraint interactions), pass back the two options MBO provides: **Prioritize Constraints** or **Prioritize Target**. Don't pick for the user.
- Quote scenarioURL from create response VERBATIM. NEVER construct a URL yourself. If absent, omit the link — say only "scenario name N".
### **Step 13: Deliver**
After Step 11 (create) succeeds, **wait ~1 minute** then auto-call `budget-optimizer-forecast` to fetch the completed scenario. Then summarize the result for the user (top 2-3 reallocations + expected delta vs baseline + any excluded channels).
*"Scenario created — [Open in MBO →](link). Recommended allocation: Meta $310K (+12%), Google $190K (−15%). Expected sales lift: ~+$240K vs reference allocation. Click the link to open the scenario in MBO — saturation curves, full per-tactic breakdown, and downloadable spreadsheet are there."*
Don't pad. End the turn.
#### Modify existing scenario
If user wants to change an existing scenario instead of creating new:
1. **Locate the scenario** via `budget-optimizer-list`. Use scenario name in conversation, never scenario_id.
1. **Identify what field changes**: rename / budget / channels / strategy / outcome / level / period / goal / constraints / etc.
1. **Rename only** → do **not** trigger forecast re-run. Just update the name.
1. **Any other field change** → triggers re-run. Tell user: "This change will recompute the recommendations, takes a few minutes."
1. **If reference period or optimization period changes**, re-check that lengths match. Re-propose reference period if length now mismatched.
1. **Show preview + confirm** (same diff-card pattern as create)
1. **Apply via**`budget-optimizer-update-or-delete`
1. **For delete** → require **explicit second confirmation** with consequences ("this will delete the scenario and its history; cannot be undone")
## 5. Tools used

<lark-table rows="9" cols="4" header-row="true" column-widths="314,169,86,169">

  <lark-tr>
    <lark-td>
      **Tool**
    </lark-td>
    <lark-td>
      **Required?**
    </lark-td>
    <lark-td>
      **System risk**
    </lark-td>
    <lark-td>
      **Purpose**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `knowledge-base-ask`
    </lark-td>
    <lark-td>
      Required (first)
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      MBO conventions, goal-method combinations, `ctx` timestamp for SQL
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `budget-optimizer-list`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Provisioning check (Step 1) + locate scenarios for modify intent (§ 4.7)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `budget-optimizer-reference-data`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Ready platforms + baseline spend + Halo eligibility + MMM model window (for reference period bounds)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `tenant-list`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Verify sales platform setup if needed
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `lift-test-list`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Reference if user asks "is this channel calibrated"; not used for eligibility (backend-gated)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `database-query-sql`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Check reference window for anomalies
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `budget-optimizer-create`
    </lark-td>
    <lark-td>
      Required
    </lark-td>
    <lark-td>
      R1
    </lark-td>
    <lark-td>
      Create the scenario. R1 system-level; skill-level preview+confirm before firing.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `budget-optimizer-update-or-delete`
    </lark-td>
    <lark-td>
      Conditional (modify intent)
    </lark-td>
    <lark-td>
      R1
    </lark-td>
    <lark-td>
      Update fields or delete scenario. Delete requires explicit second confirmation.
    </lark-td>
  </lark-tr>
</lark-table>

## 6. Output format
Three turns max:
1. **Disambiguation / clarification** — only if needed; ambiguous "show me my budget" gets 2-4 options; missing required field gets one question (reference period proposal counts as the pivotal question)
1. **Preview + confirm** — table of all settings (resolved + defaulted, with *(default)* annotations) + confirm/modify/cancel; warn run takes a few minutes
1. **Result** — MBO link + 1-2 sentence brief reading (top reallocation + expected lift)
**What never appears**:
- Raw JSON of the `budget-optimizer-create` payload
- Multi-question forms ("which level? which sales platform? which period? which type? which goal? which budget?")
- Asking about budget constraints when user didn't mention them (default = none)
- Silently defaulting reference period without surfacing — reference period proposal must always be visible to user
- Internal terminology (`attr_model_name`, table names, model IDs)
- Tool names exposed to user ("do you want list or forecast?")
- Scenario IDs in conversation (use scenario names)
## 7. Edge cases & routing

<lark-table rows="22" cols="2" header-row="true" column-widths="320,410">

  <lark-tr>
    <lark-td>
      **Edge case**
    </lark-td>
    <lark-td>
      **Handling**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Tenant not provisioned
    </lark-td>
    <lark-td>
      Don't collect settings. "MBO isn't enabled on your account yet — CSM can turn it on." Route to `attribution-edge-routing`.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "How much should I spend on X?" (recommendation question)
    </lark-td>
    <lark-td>
      Only honest answer: run a scenario. Don't search list, don't pull historical, don't make up a number. Lead with: "Optimal budget depends on total budget, period, and goal — let me build a scenario." Then collect inputs.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "What's my budget?" / "Show me my budget" (ambiguous)
    </lark-td>
    <lark-td>
      2-step disambiguation: clarify type (existing scenarios / build new / attribution actuals), then route or continue.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Channel not in tenant integration
    </lark-td>
    <lark-td>
      Tell user, list available. Don't silently drop. Offer to proceed without it.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Channel exists but not MBO Ready
    </lark-td>
    <lark-td>
      Tell user, point to Settings → Platform Integrations. Offer to run without it.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User says "Meta only" / "exclude Amazon"
    </lark-td>
    <lark-td>
      Respect scope. Don't expand.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User specifies tactic names ("Meta's video and prospecting")
    </lark-td>
    <lark-td>
      Set level=tactic, filter to named tactics.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Past optimization period
    </lark-td>
    <lark-td>
      Reject. Tell user start must be in future. Propose next-week start.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Optimization period beyond max supported horizon
    </lark-td>
    <lark-td>
      Reject. Tell user the max + suggest shortening.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Reference period exceeds MMM model window
    </lark-td>
    <lark-td>
      Clamp to `[hyp.model_window.start → hyp.model_window.end]`. Tell user and offer the clamped period.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Reference period length ≠ optimization period length
    </lark-td>
    <lark-td>
      Default: re-propose to match. If user insists on a different length, tell them MBO prorates (e.g., 30d ref → 14d opt = baseline halved). Don't silently proceed without explaining.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Offline / un-integrated channel ("retail stores")
    </lark-td>
    <lark-td>
      Reject. MBO only supports digital. Route to CSM.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Mixed in-scope + out-of-scope
    </lark-td>
    <lark-td>
      Handle in-scope half. Tell user the offline half needs CSM. Don't silently drop.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Negative or zero budget
    </lark-td>
    <lark-td>
      Reject.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Constraint sum > total budget
    </lark-td>
    <lark-td>
      Flag pre-create. Tell user where + by how much. Give 3 concrete options. **Never** silently adjust.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Reference period contains known anomaly (BFCM, outage)
    </lark-td>
    <lark-td>
      Surface in proposal. Suggest a clean alternative window.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Goal unsupported by MBO ("maximize impression share")
    </lark-td>
    <lark-td>
      Tell user the 12 supported goals. Suggest closest match. Don't substitute silently.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User questions MMM model itself ("why is MMM wrong?")
    </lark-td>
    <lark-td>
      Don't explain model internals. Route to CSM.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Modify intent: rename only
    </lark-td>
    <lark-td>
      Update name. Don't trigger forecast re-run.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Modify intent: change any other field
    </lark-td>
    <lark-td>
      Tell user the change will recompute. Show preview, confirm, apply. If period changes, re-validate reference period length match.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Delete intent
    </lark-td>
    <lark-td>
      Require explicit second confirmation with consequences ("can't be undone").
    </lark-td>
  </lark-tr>
</lark-table>

## 8. Failure modes (never do these)
- **Skip the provisioning check** — running create on a non-provisioned tenant fails; check feature flag first
- **Silently lock saturation-prone tactics** — never apply locks without explicit user confirmation
- **Flag a tactic as saturation-prone without giving the reason**
- **Insist on locking a tactic the user explicitly said they want to scale** — surface the saturation signal as a caution, recommend manual max instead of full lock
- **Fan out into a multi-question form** — one pivotal question per round
- **Skip asking about reference period** — reference period MUST always be surfaced with explicit proposed dates + length match check
- **Propose a reference period whose length doesn't match optimization period** without flagging to the user that MBO will prorate
- **Auto-default reference period silently** (without surfacing dates to user)
- **Propose a reference period that extends past **`**model_window.end**` — always clamp to `[model_window.start, model_window.end]`. If the immediately-prior same-length window falls outside, propose the same-length window ending at `model_window.end` instead. Suggesting "intuitive" dates (e.g., September as ref for October opt) without checking the model window is a critical failure.
- **Default **`**outcome**`** to **`**totalSales**`** when tenant is a Halo customer** (Amazon / TikTok Shop integrated) — must default to `totalSalesHalo`
- **Default a budget or target value to a number you invented** — only acceptable budget default is `budgetChangeType=percentage, budget=100` (keep flat) and only when user explicitly didn't say anything
- **Mis-parse budget unit** ("$100k" → 100 not 100000) — critical failure
- **Mis-map percentage semantics** — `budget=100` is "keep flat", NOT "+100% / 2x". `budget=120` is "+20% / 1.2x". Treat percentage as **% of baseline**, not delta. Mis-parsing this is a critical failure.
- **Drop a sign on relative budget** ("cut 10%" → budget=110 instead of 90) — critical failure
- **Build "maximize" when user said "hit X target"** (dropping the target value) — critical failure
- **Build goal=ROAS when user said "maximize sales"** (or vice versa) — critical failure
- **Misinterpret total vs period budget** ("$300K for the quarter" treated as monthly) — critical failure
- **Ask about budget constraints when user didn't mention them** — default is none
- **Silently adjust constraint numbers to make scenario fit** — worst possible failure
- **Skip constraint sum vs total budget pre-check**
- **Silently drop a channel that doesn't exist in tenant integration**
- **Expand scope beyond what user said** ("Meta only" → build with all channels)
- **Hard-code a budget anchor without consulting reference data**
- **Build a scenario with past start date**
- **Build a scenario with negative budget**
- **Treat offline / un-integrated channels as if they're supported**
- **Try to explain MMM model internals when user questions model** — route to CSM
- **Silently substitute an unsupported goal**
- **Skip preview-and-confirm** — every single `budget-optimizer-create` call MUST be immediately preceded by a Step 11 preview-and-confirm in the SAME turn. No exceptions.
- **Omit auto-applied defaults from the preview** — every UI default the skill applied (level, period, goal, method, outcome, budgetChangeType, budget=100 etc.) must be visible to the user with *(default)* annotation
- **Use scenario IDs in conversation** — use scenario names
- **Use tool names in clarification questions** ("do you want list or forecast?")
- **Refuse delivery because backtesting accuracy is low** — deliver with caveat
- **Use "60s undo" or countdown timer language** — deprecated
- **Trigger forecast re-run on a rename-only modify**
- **Skip second confirmation on delete**
- **Run scenario without telling user it takes a few minutes**
- **Deliver without the MBO link** — saturation curves and full breakdown live in MBO
- **Pad with "want to compare against another scenario?" / "should I schedule this?"** — UI exposes both
## 9. References 
**Key concepts**:
- **MBO provisioning**: feature flag gated; check via `budget-optimizer-list` success.
- **Saturation curve**: per-channel spend-to-incremental-return curve, calibrated by lift tests.
- **Marginal vs Average ROAS**: MBO optimizes marginal (next-dollar return). Average ROAS blends efficient + saturated spend and is misleading at allocation boundary.
- **Outcome Max vs Target Achievement**: the two scenario types. Outcome Max needs budget; Target Achievement needs target value.
- **Reference vs Optimization period**: reference = historical baseline; optimization = future window. **Same length** recommended; mismatched lengths get prorated — must disclose to user.
- **Constraint conflict**: skill pre-checks; if conflict, give 3 concrete options. Never silently adjust.
