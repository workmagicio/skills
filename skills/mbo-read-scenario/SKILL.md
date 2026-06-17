---
name: mbo-read-scenario
description: Interpret the results of an existing MBO (Media Budget Optimizer) scenario — purely interpretation, no writes. Use when the user wants to understand existing MBO scenario results. Not for creating or modifying scenarios (use mbo-create-scenario) or diagnosing attribution swings.
---

# mbo-read-scenario

## 1. Purpose
Help users **interpret existing MBO scenario results** — four modes:
1. **Basic interpretation** — explain a single scenario's recommended allocation: direction / reason / magnitude / impact for the top channels, plus marginal-vs-average ROAS, baseline vs paid media, special states
1. **Scenario comparison** — diff two scenarios and explain why recommendations shifted (input changes vs underlying-data drift)
1. **MBO vs Attribution reconciliation** — when user asks "why is MBO showing different ROAS than my dashboard?", pull both numbers, explain the methodology gap, advise against direct comparison
1. **MBO vs Lift Test reconciliation** — when user asks "lift test showed 1.5x but MBO shows 3x marginal ROAS, which is right?", explain that lift test calibrates MBO and these measure different things (incremental vs marginal)
Different from `mbo-create-scenario` (creates / modifies a scenario) and from `attribution-anomaly-diagnosis` (diagnoses historical attribution swings). This skill is purely interpretation — no writes.
## 2. When to trigger
Trigger when the user wants to **understand existing MBO results**. Common phrasings:
- "Explain my Q3 MBO scenario" / "Walk me through what's changing in this scenario"
- "Why is MBO recommending I cut Pinterest?" / "Why should Meta get more budget?"
- "What changed between the scenario I ran last week and this week?"
- "What's the biggest move the model is making?"
- "Why does MBO show Meta ROAS as 2.1x when my dashboard says 3.5x?"
- "My lift test showed 1.5x but MBO shows marginal ROAS of 3x — why?"
- "Why didn't actual results match the forecast?"
**Do NOT trigger** when:
- User wants to **create** a new scenario → `mbo-create-scenario`
- **"How much should I spend on X?"** — this is a recommendation question; the only honest answer requires running a scenario → `mbo-create-scenario`. Don't use historical or list data to make up a number.
- User wants to **modify** an existing scenario (rename, change inputs, delete) → `mbo-create-scenario` (modify is part of that skill)
- User wants why historical attribution moved (no MBO involved) → `attribution-anomaly-diagnosis`
- User wants historical attribution numbers without MBO context → `attribution-data-query`
- Tenant not provisioned for MBO → exit, route to `attribution-edge-routing`
## 3. Inputs

<lark-table rows="7" cols="3" column-widths="189,274,275">

  <lark-tr>
    <lark-td>
      **Field**
    </lark-td>
    <lark-td>
      **Required?**
    </lark-td>
    <lark-td>
      **Description / default**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `mode`
    </lark-td>
    <lark-td>
      Detected, not asked
    </lark-td>
    <lark-td>
      One of: **basic_read** / **scenario_compare** / **mbo_vs_attribution** / **mbo_vs_lift_test** / **mbo_vs_actual**. See § 4 Step 2.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `scenario_id`
    </lark-td>
    <lark-td>
      Required for basic_read / mbo_vs_*
    </lark-td>
    <lark-td>
      Which scenario to read. Multi-scenario tenant → use scenario name in conversation, never the ID. 1 scenario → use it (tell user). 0 scenarios → tell user, guide to create.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `scenario_ids[2]`
    </lark-td>
    <lark-td>
      Required for scenario_compare
    </lark-td>
    <lark-td>
      Two scenarios. Cap at 2 — more is unreadable.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `attribution_metric`
    </lark-td>
    <lark-td>
      Required for mbo_vs_attribution
    </lark-td>
    <lark-td>
      Which attribution metric user is comparing against (ROAS / orders / sales). Validate via `dashboard-metrics-list`.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `lift_test_id`
    </lark-td>
    <lark-td>
      Required for mbo_vs_lift_test
    </lark-td>
    <lark-td>
      Which lift test to reconcile against. Pull via `lift-test-list`.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `focus_dimension`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      Zoom on a specific channel / tactic. Default: summary across all (top 2-3 moves).
    </lark-td>
  </lark-tr>
</lark-table>

## 4. SOP
**Step 1: Check provisioning**
Call `budget-optimizer-list`. Not provisioned → exit with CSM bridge, don't attempt to interpret.
**Step 2: Handle ambiguous "show me my budget" asks (2-step disambiguation)**
"What's my budget?" / "Show me my budget" / "Check my budget for Q3" — these are ambiguous. Don't silently pick.
1. **Clarify type**: give 2-4 options that match user's phrasing context:
  - "Existing scenario recommendations (you have N saved)" — if list has scenarios
  - "Build a new scenario for [period]" — route to create
  - "Actual historical spend on the attribution dashboard" — route to data-query
1. **If user picks "existing"** → continue with mode detection. If "build new" → route to `mbo-create-scenario`. If "actual" → route to `attribution-data-query`.
**Step 3: Detect mode**
- Single scenario reference / "explain X" / "why does it recommend Y" → **basic_read**
- Two scenarios named / "compare X and Y" / "what changed since last week" → **scenario_compare**
- "Why MBO different from [dashboard / MTA / attribution / iDDA]" → **mbo_vs_attribution**
- "Lift test showed X but MBO shows Y" → **mbo_vs_lift_test**
- "Actual didn't match forecast" / "why didn't we hit predicted sales" → **mbo_vs_actual**
- "How much should I spend on X?" → not this skill; route to `mbo-create-scenario`
- Ambiguous → ask once with 2-3 specific options
**Step 4: Locate scenario(s)**
- `budget-optimizer-list` to find scenarios
- **1 scenario** matching context → use it, tell user which one
- **Multiple scenarios** → list them with **name + key attributes** (period, strategy, goal) for user to choose; never list scenario IDs
- **0 scenarios** → tell user none exist, guide to create flow
- If user named a scenario precisely ("my Q3 conservative plan") → use it, don't re-ask
**Step 5: Consult **`**knowledge-base-ask**`** (MANDATORY)**
Required for `ctx` timestamp (any SQL) + canonical interpretation language.
**Step 6: Pull data and check forecast status**
Before interpreting, always check the forecast state:

<lark-table rows="4" cols="2" column-widths="269,469">

  <lark-tr>
    <lark-td>
      **State**
    </lark-td>
    <lark-td>
      **Action**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      status = `running` / `not_started`
    </lark-td>
    <lark-td>
      Don't interpret stale data. Tell user the forecast is still computing, give the link, suggest coming back when ready.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      status =`ready`
    </lark-td>
    <lark-td>
      Proceed with interpretation.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      status = `error`
    </lark-td>
    <lark-td>
      Tell user the forecast failed, surface the failure reason if available, suggest re-running or CSM.
    </lark-td>
  </lark-tr>
</lark-table>

**Step 7 — Branch by mode**
### 7a. basic_read — 4-dimensional interpretation
1. **Pull forecast detail** via `budget-optimizer-forecast` (with `includeSaturation=true` for curve data)
1. **Identify top 2-3 reallocations** — biggest absolute / percentage changes (don't dump all channels)
1. **For each top channel, structure the explanation across 4 dimensions**:
  - **Direction**: add or cut budget?
  - **Reason**: marginal ROAS / saturation curve position / lift test calibration impact
  - **Magnitude:** % change vs current spend ("Meta +12% from $275K → $310K")
  - **Impact**: effect on total sales / ROAS ("contributes ~$180K of the expected +$240K sales lift")
1. **Check for special states** and flag explicitly (don't bury in channel list):
  - **Reference period spend = 0** on a channel → flag: "Channel X had zero spend in the reference window — MBO can't model it and excluded it from the recommendation"
  - **Insufficient data for saturation curve** → flag: "Channel Y has insufficient historical data, so MBO held its budget at noChange (baseline)"
  - **Locked-by-default channels** (e.g., branded search near 90% impression share) → mention briefly so user knows why these don't shift
  - **User-locked tactics** (locks set by the user in the scenario constraints) → treat as fixed scope, NOT as something to explain or justify. Do not say "because you locked these, the model couldn't do X." If the total projection moved unexpectedly, do the baseline / paid media decomposition first; locks are almost never the right explanation.
1. **Mention baseline vs paid media split** if all channels included in scenario (otherwise this section isn't shown — say so).
1. **Goal-vs-projection sanity check (MANDATORY)** — before writing the reading, compare projected total movement to the user's goal direction:
  - If **goal direction matches** projection direction (e.g., maximize sales + total sales up) → proceed normally.
  - If **goal direction does NOT match** projection direction (e.g., maximize sales but total sales projected lower; minimize CAC but CAC projected up) → **decompose into baseline vs paid media before explaining**.
    - Pull both reference and optimized values for: **baseline (organic) sales**, **paid media sales**, total sales, total ROAS, marginal ROAS
    - State the decomposition explicitly in the reading. The paid component is what MBO actually optimizes; the baseline is the model's organic projection (seasonality + trend), which MBO does NOT control.
    - See § 5 playbook row "Total projected sales is LOWER than reference" for the canonical framing.
    - If decomposition can't be computed (e.g., scenario only covers a subset of channels and baseline section is hidden), say so honestly — don't fabricate a generic "channel mix is more efficient" answer.
1. **Caveat backtesting accuracy** only if < 70%.
1. **Link to MBO** — full curves, table, download live there.
### 7b. scenario_compare
1. **Pull both** via `budget-optimizer-compare` (or two forecast calls)
1. **Identify what changed**: inputs differ vs outputs differ (with same inputs)
1. **Explain**:
  - Inputs differ → explain how the input change propagates (e.g., switching from Outcome Max to Target Achievement reframes the optimization)
  - Inputs same, outputs differ → underlying-data drift: curves refresh daily, new lift tests recalibrate, reference period pacing matters. **This is expected.**
  - Channel shift > 30% with same inputs → flag as something to verify with CS (potential data quality / structural change)
1. **Output structure rules** (this matters):
  - **Comparison format** (table / side-by-side), **not** "scenario A first then B"
  - **Highlight key differences**, brush over what's same
  - **Numbers with units and % change**: "Meta: $50K → $80K (+60%)"
  - **Decision-oriented summary**: what each scenario is suited for
  - **Don't push one as winner** unless user explicitly asked "which is better"
  - **Use scenario names** in conversation, never IDs
  - **Use business language** for differences ("more aggressive", "concentrated on Meta") not "strategy=aggressive, Meta +60%"
1. **If > 2 scenarios** requested → cap at 2 per comparison, offer pairwise
### 7c. mbo_vs_attribution reconciliation
1. **Lead with "expected to differ"** — frame this BEFORE showing the gap, not after. Otherwise user thinks there's a bug.
1. **Pull both numbers**:
  - MBO via `budget-optimizer-forecast` (model-estimated)
  - Attribution via `database-query-sql` (realized actuals)
1. **Explain methodology gap**:
  - MBO = model-estimated outcome at the reference-period spend level; smooths historical fluctuations for a stable forecast
  - Attribution = realized actuals using last-click / iDDA within the attribution window
  - "Expecting these to align is like expecting a weather forecast to match last month's actual temperatures — the gap is logical, not a discrepancy"
1. **Don't pick a side**. Don't say "trust MBO" or "trust attribution". Give situational guidance:
  - "For day-to-day performance tracking and reconciling with Meta Ads Manager → attribution dashboard"
  - "For relative efficiency across channels when deciding allocation → MBO"
1. **Only escalate to "check data quality"** if the gap is extreme (ratio > 3×)
### 7d. mbo_vs_lift_test reconciliation
1. **Critical framing**: lift test is **used to calibrate** MBO, not opposed to it. These measure different things:
  - **Lift test → incremental ROAS** (iROAS): the share of channel-driven sales that would not have happened without the spend (causal)
  - **MBO → marginal ROAS** at a given spend level: the return on the next dollar at the recommended allocation (forward-looking, calibrated by the lift test)
1. **Pull both**: `lift-test-list` for iROAS, `budget-optimizer-forecast` for marginal ROAS at the relevant spend point
1. **Explain**:
  - If iROAS = 1.5x and MBO marginal ROAS = 3x → that's because iROAS measures average incremental contribution across the test period, while marginal ROAS measures what the next dollar earns at the proposed spend level (which can be steeper if spend is below saturation)
  - If iROAS > MBO marginal ROAS → the channel may be near saturation in the scenario; the lift test captured a less-saturated state
1. **Never frame as "which is right"** — they're complementary measurements, both right at different questions
1. **Use both terms** with inline explanation on first use (see term-usage policy in § 6)
### 7e. mbo_vs_actual (forecast vs realized results)
1. **Pull the scenario's forecast** + **actuals for the same optimization period** via `database-query-sql`
1. **Frame the comparison**:
  - Forecast = expected outcome based on historical saturation curves
  - Actual = realized outcome influenced by market conditions, creative quality, seasonality, competitor activity, and execution variance
  - Some gap is expected; what matters is whether the gap is within typical model uncertainty (backtesting accuracy gives the range)
1. **Diagnose the gap** at a high level:
  - Was overall spend different from the scenario's recommended spend? (execution variance)
  - Were there market-wide shifts (seasonality, competitor)?
  - Did per-channel actuals diverge proportionally or selectively?
1. **Don't blame the model** blindly. Don't say "MBO was wrong". Frame as: "Actual differed from forecast by X%; here's where the divergence came from."
1. **If the gap is large + per-channel weird** → route to CSM for a deeper look; this could indicate a data quality issue.
## 5. Interpretation playbook (canonical language)

<lark-table rows="14" cols="2" column-widths="328,410">

  <lark-tr>
    <lark-td>
      **Pattern**
    </lark-td>
    <lark-td>
      **Business-language explanation**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      MBO recommends increasing channel X
    </lark-td>
    <lark-td>
      "Channel X's saturation curve is still steep at current spend — there's headroom for additional dollars to keep producing meaningful incremental returns. The recommendation moves you closer to the equilibrium where every channel's next dollar produces a similar incremental outcome."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      MBO recommends cutting channel X
    </lark-td>
    <lark-td>
      "Channel X is near saturation — its curve is flat at current spend, meaning each additional dollar adds little incremental return. The model reallocates that spend to channels still on the steep part of their curves."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      High average ROAS but low marginal ROAS
    </lark-td>
    <lark-td>
      "Average ROAS blends efficient early spend with saturated late spend into one number. Channel X's average ROAS looks healthy, but at its current spend level the marginal ROAS — return on the next dollar — has collapsed. That's why MBO is suggesting a cut."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Baseline (organic) sales are large vs paid media sales
    </lark-td>
    <lark-td>
      "A big share of your sales are organic / recurring demand that exists independently of paid media. MBO doesn't optimize that baseline — it only reallocates the paid portion. Reading the recommendation requires looking at the paid component separately."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **Total projected sales is LOWER than reference, even though the goal is "maximize sales" (or similar positive direction)**
    </lark-td>
    <lark-td>
      **This is almost always a baseline issue, not a recommendation issue.** Total sales = baseline (organic) sales + paid media sales. Decompose before explaining:
      • **Paid media component**: is it up or down vs reference? If up (and ROAS / marginal ROAS improved) → **the reallocation IS working as intended**; this is the part MBO optimizes.
      • **Baseline component**: if down → that's where the total drop comes from. MBO doesn't optimize baseline — it's projected from organic trend + seasonality.
      • **Net**: surface the decomposition explicitly. Say something like "Paid media sales are up $X (+Y%) and ROAS improved from A → B — the reallocation is doing its job. Total is down $Z because the model projects baseline (organic) demand to be Q% lower next period (seasonal / organic decline). MBO can't optimize baseline, so this drop is outside the recommendation's control."
      • **If low backtesting confidence flag is present**, additionally note: "Treat the absolute projection as directional rather than literal."
      **Never say** "the reference baseline reflects channel mix" or "the optimizer finds a more efficient distribution" without first checking baseline — that explanation is generic and often misleads.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      **User has manually locked several tactics; total projected sales is lower than reference**
    </lark-td>
    <lark-td>
      **Don't blame the user's own locks for the drop.** The locks are the user's intent, not a limitation to explain away. Saying "because you locked X, Y, Z, this isn't the best plan overall" is condescending and unhelpful — the user already knows what they locked.
      Correct framing:
      • Treat locks as fixed boundary conditions; don't list them as the cause
      • Run the baseline / paid media decomposition (see row above) — the drop is usually baseline, not the locks
      • Within the unlocked tactics, explain what MBO did do (which got more, which got less, why)
      • Only mention the locks if the user explicitly asks "why didn't the model optimize tactic X" — and even then, name them neutrally as scope, not as a problem
      **Never say**: "the model is solving best plan given these locks, not best plan overall, that's why total sales drop" — this is the anti-pattern Iris flagged.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Recommendations differ from a run a few days ago (same inputs)
    </lark-td>
    <lark-td>
      "Saturation curves refresh daily. Even a few days can shift a channel's curve, particularly near the saturation inflection. New lift test results also recalibrate the affected channels. Expected behavior."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      MBO vs attribution dashboard for same period
    </lark-td>
    <lark-td>
      "MBO shows model-estimated outcomes at the reference spend; dashboard shows realized actuals using last-click / iDDA. Two different methodologies, expected to differ. Dashboard for performance tracking, MBO for allocation."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      iDDA strong recently, MBO forecast lower
    </lark-td>
    <lark-td>
      "iDDA shows realized iROAS — fluctuates with promos, creative, seasonality. MBO fits a stable saturation curve to smooth those spikes, predicting the sustainable future. The gap is logical, not a discrepancy."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Backtesting accuracy < 70%
    </lark-td>
    <lark-td>
      "Backtesting accuracy is [X]%, below recommended 70%. Use these recommendations as directional guidance. Your CS team can review what's driving the lower accuracy."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Lift test iROAS vs MBO marginal ROAS differ
    </lark-td>
    <lark-td>
      "Lift test measures incremental ROAS (causal contribution at the tested spend). MBO marginal ROAS measures return on the next dollar at the recommended spend. They're complementary measurements, not competing ones — lift test is actually used to calibrate MBO."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Reference period spend = 0 for a channel
    </lark-td>
    <lark-td>
      "Channel X had zero spend in the reference window — MBO can't model what it would do at zero baseline, so it's excluded from the recommended allocation. To include it, run a scenario with a reference window where you actually spent on it."
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Insufficient data for saturation curve
    </lark-td>
    <lark-td>
      "Channel Y doesn't have enough historical data to build a reliable saturation curve, so MBO held its budget at the baseline (no change). Once more history accumulates, future scenarios can optimize it."
    </lark-td>
  </lark-tr>
</lark-table>

## 6. Term usage policy
MBO has technical terms that show up in the product UI (saturation curve, marginal ROAS, incremental ROAS). Use them, but with care:
- **OK to use**: saturation curve / marginal ROAS / incremental ROAS / baseline (organic) sales / paid media sales / reference period / optimization period
- **First time a term appears in a message**: **include a one-line inline explanation**. E.g., "marginal ROAS — return on the next dollar at the recommended spend level — has collapsed for Meta."
- **Subsequent uses**: term alone is fine, no need to re-explain
- **If user asks "what does X mean"**: be ready to expand, don't just repeat the same one-liner
- **Never use**: MMM model parameters, iROAS posterior, calibration weight, log-saturation function, counterfactual model, lift coefficient — these are internal DS terms; they don't belong in customer-facing output
## 7. Tools used

<lark-table rows="10" cols="4" column-widths="299,195,85,185">

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
      Canonical interpretation language + `ctx` timestamp
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
      Provisioning check + locate scenarios
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `budget-optimizer-forecast`
    </lark-td>
    <lark-td>
      Required (basic_read, mbo_vs_*)
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Per-channel forecast + saturation curve data (pass `includeSaturation=true`)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `budget-optimizer-compare`
    </lark-td>
    <lark-td>
      Required (scenario_compare)
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Diff two scenarios programmatically
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `budget-optimizer-accuracy`
    </lark-td>
    <lark-td>
      Required (basic_read)
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Backtesting accuracy; caveat if < 70%
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `budget-optimizer-reference-data`
    </lark-td>
    <lark-td>
      Optional
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Ready-platform context + baseline spend (useful when explaining excluded channels)
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `dashboard-metrics-list`
    </lark-td>
    <lark-td>
      Required (mbo_vs_attribution)
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Validate attribution metric names
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `database-query-sql`
    </lark-td>
    <lark-td>
      Required (mbo_vs_attribution, mbo_vs_actual)
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Pull attribution actuals / realized outcome for the scenario period
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      `lift-test-list`
    </lark-td>
    <lark-td>
      Required (mbo_vs_lift_test)
    </lark-td>
    <lark-td>
      R0
    </lark-td>
    <lark-td>
      Pull iROAS data + identify recent calibrations (also useful in scenario_compare to explain curve shifts)
    </lark-td>
  </lark-tr>
</lark-table>

## 8. Output format
Structure depends on mode. Always end with the **MBO link**.
### basic_read
<callout emoji="bar_chart" background-color="light-gray" border-color="gray">
**Q3 Meta + Google scenario — top moves**
- **Meta: +12% ($275K → $310K)**
*Why*: still on the steep part of its saturation curve — marginal ROAS (return on the next dollar) is 3.2x, well above the portfolio average.
*Impact*: contributes ~$180K of the expected +$240K sales lift.
- **Google: −15% ($224K → $190K)**
*Why*: near saturation — average ROAS is 4.1x but marginal ROAS has dropped to 1.8x; each additional dollar adds little.
*Impact*: the freed $34K is redistributed to channels with higher marginal returns.
**Worth knowing**: baseline (organic) sales are ~60% of total; MBO only reallocates the paid 40%. Backtesting accuracy is 78% (within recommended range).
**Heads-up**: Snapchat had zero reference-period spend, so it's excluded from this scenario.
**[Open scenario in MBO →]** for full saturation curves and per-tactic detail.
</callout>

### scenario_compare
<callout emoji="twisted_rightwards_arrows" background-color="light-gray" border-color="gray">
**Q3 Conservative vs Q3 Aggressive**
</callout>


<lark-table rows="4" cols="4" column-widths="142,210,183,120">

  <lark-tr>
    <lark-td>
      **Channel**
    </lark-td>
    <lark-td>
      **Conservative**
    </lark-td>
    <lark-td>
      **Aggressive**
    </lark-td>
    <lark-td>
      **Δ**
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Meta
    </lark-td>
    <lark-td>
      $310K
    </lark-td>
    <lark-td>
      $420K
    </lark-td>
    <lark-td>
      +35%
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Google
    </lark-td>
    <lark-td>
      $190K
    </lark-td>
    <lark-td>
      $160K
    </lark-td>
    <lark-td>
      −16%
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      TikTok
    </lark-td>
    <lark-td>
      $50K
    </lark-td>
    <lark-td>
      $110K
    </lark-td>
    <lark-td>
      +120%
    </lark-td>
  </lark-tr>
</lark-table>

**What this means**: Aggressive concentrates on Meta and pushes harder into TikTok at the expense of Google. Use Conservative if you want to stay close to current channel mix; use Aggressive if you're willing to test bigger shifts into platforms still on the steep saturation curve.
**[Open Conservative →]** · **[Open Aggressive →]**
### mbo_vs_attribution
<callout emoji="bulb" background-color="light-gray" border-color="gray">
**Why MBO and the attribution dashboard show different Meta ROAS — expected, here's why**
These measure different things and are expected to differ:
- **Dashboard (3.5x)**: realized iDDA from your actual conversions over the reference period.
- **MBO (2.1x)**: what the saturation curve predicts your outcome would be at that spend level. Smooths short-term fluctuations into a stable forecast.
If iDDA shows a strong recent month, MBO predicting lower isn't a bug — it's predicting the probable future, not the best-case past.
**How to use each**: dashboard for performance tracking and reconciling with Meta Ads Manager. MBO for relative efficiency when deciding allocation. **Don't expect direct alignment.**
**[Scenario in MBO →]** · **[Meta in dashboard →]**
</callout>

### mbo_vs_lift_test
<callout emoji="link" background-color="light-gray" border-color="gray">
**Lift test vs MBO marginal ROAS — measuring different things**
Both numbers are valid; they answer different questions:
- **Lift test (iROAS 1.5x)**: incremental ROAS — the share of channel-driven sales that wouldn't have happened without your Meta spend, measured causally during the test.
- **MBO (marginal ROAS 3.0x)**: return on the next dollar at the recommended spend level. Forward-looking, calibrated by your lift test.
The gap likely means Meta was tested at a more saturated spend level than where MBO is recommending you operate. At the lower spend MBO suggests, each next dollar still produces a steeper return — that's why marginal > incremental in this case.
These are complementary, not competing: the lift test is what made the MBO calibration possible. **[Open scenario in MBO →]** · **[Open lift test →]**
</callout>

### Output rules (all modes)
- **Always end with the MBO link**
- **Lead with the takeaway**, not methodology — readers skim
- **For mbo_vs_* modes: lead with "expected to differ"** before showing the gap
- **Use scenario names** in conversation, never IDs
- **Use business language for diffs** ("more aggressive") not parameter syntax ("strategy=aggressive")
- **Pick top 2-3 channels worth naming** — full table is in MBO
- **Numbers with units + % change** in comparisons
- **Flag special states explicitly** (zero ref spend, insufficient data) — don't bury
- **Cite backtesting accuracy** only when < 70% or user specifically asks
- **First use of technical terms** needs an inline explanation; subsequent uses don't
## 9. Edge cases & routing

<lark-table rows="22" cols="2" column-widths="328,410">

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
      Exit with CSM bridge.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Ambiguous "what's my budget?" / "show me my budget"
    </lark-td>
    <lark-td>
      2-step disambiguation: clarify type (existing scenario / build new / actual spend), then route. Don't silently pick.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "How much should I spend on X?"
    </lark-td>
    <lark-td>
      Recommendation question — not this skill. Route to `mbo-create-scenario`. Don't make up a number from list / historical.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      1 scenario in account, user says "explain my scenario"
    </lark-td>
    <lark-td>
      Use it, tell user which one.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Multiple scenarios, user says "explain my scenario"
    </lark-td>
    <lark-td>
      List scenarios with **name + key attributes** (period, strategy, goal); never IDs. Ask user to pick.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      0 scenarios in account
    </lark-td>
    <lark-td>
      Tell user no scenarios exist, guide to create flow. Don't dump "no scenarios found".
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Scenario was deleted
    </lark-td>
    <lark-td>
      Tell user. Offer to interpret most recent live scenario instead.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Forecast still running
    </lark-td>
    <lark-td>
      Don't hard-interpret stale data. Tell user it's computing, give link, suggest coming back.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Forecast failed
    </lark-td>
    <lark-td>
      Surface failure reason if available; suggest re-running or CSM.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Reference period spend = 0 for a channel
    </lark-td>
    <lark-td>
      Flag explicitly, don't bury in channel list. Explain the exclusion.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Insufficient data for saturation curve on a channel
    </lark-td>
    <lark-td>
      Flag explicitly. Explain noChange / baseline fallback.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Locked-by-default channels (branded search ≥ 90% impression share, etc.)
    </lark-td>
    <lark-td>
      Mention briefly; user should know why these don't shift.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Backtesting accuracy < 70%
    </lark-td>
    <lark-td>
      Caveat in delivery, don't refuse.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      Compare more than 2 scenarios
    </lark-td>
    <lark-td>
      Cap at 2 per comparison; offer pairwise.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User compares scenarios with different inputs
    </lark-td>
    <lark-td>
      Surface input diff first, then output diff. Don't pretend they're directly comparable.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User says "MBO is wrong, my dashboard shows X"
    </lark-td>
    <lark-td>
      Don't agree it's wrong. Explain methodology gap; advise against direct comparison.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks "should I follow MBO's recommendation?"
    </lark-td>
    <lark-td>
      Decision question. Give framing (backtesting accuracy, recent lift tests, business constraints), let user decide.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      MBO vs attribution gap > 3×
    </lark-td>
    <lark-td>
      Surface as potential data quality issue alongside methodology explanation. Recommend CS check.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      MBO vs lift test framing as "which is right"
    </lark-td>
    <lark-td>
      Refuse the framing. Lift test calibrates MBO; they measure different things. Explain complementarity.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      "Why didn't actual results match the forecast?"
    </lark-td>
    <lark-td>
      mbo_vs_actual mode. Frame as "actuals influenced by market / creative / seasonality"; don't blame the model. Large weird gaps → CSM.
    </lark-td>
  </lark-tr>
  <lark-tr>
    <lark-td>
      User asks why MMM model itself is wrong
    </lark-td>
    <lark-td>
      Don't try to explain DS internals. Route to CSM.
    </lark-td>
  </lark-tr>
</lark-table>

## 10. Failure modes (never do these)
- **Treat MBO and attribution numbers as if they should match** — methodology gap is expected; explain it, don't apologize for it
- **Skip "expected to differ" framing** in mbo_vs_* modes before showing the gap — leading with the gap makes user think there's a bug
- **Frame MBO vs lift test as "which is right"** — they're complementary; lift test calibrates MBO
- **Make up a number for "how much should I spend on X?"** — this is a recommendation question, must route to create
- **Use list / historical data to answer recommendation questions** — these don't substitute for running a scenario
- **Skip the 2-step disambiguation** on ambiguous "show me my budget" asks
- **Use tool names in clarification** ("do you want list or forecast?")
- **Use scenario IDs in conversation** — use names
- **List multiple scenarios without key attributes** (period, strategy, goal) — user needs context to pick
- **Dump "no scenarios found"** without guiding to create flow when account has 0 scenarios
- **Hard-interpret a forecast that's still running**
- **Bury special states** (zero ref spend, insufficient data) inside the channel list — flag explicitly
- **Skip the 4-dimensional interpretation** (direction / reason / magnitude / impact) — just listing recommended dollar amounts isn't a reading
- **Explain a goal-vs-projection mismatch with a generic "more efficient channel mix" answer** — when the projected total moves opposite to the user's goal (e.g., maximize sales but total sales projected lower), the explanation is **almost always baseline (organic) vs paid media decomposition**, not channel mix. Skipping the decomposition produces a misleading answer.
- **Skip the baseline / paid media decomposition** when goal direction and projection direction disagree — this is the case where users most often misread the recommendation as "MBO is making things worse"
- **Blame the user's own budget locks for the projection outcome** — saying "because you locked X, Y, Z, this isn't the best plan overall, that's why sales drop" is condescending; the user knows what they locked. Locks are intent, not a flaw to call out.
- **List the user's locks as a "limitation" or "reason"** in the reading — they're fixed scope, not an explanation. The actual explanation is usually baseline decomposition (per the row above).
- **Treat "best plan given these locks" as a takeaway worth surfacing** — it's a tautology and adds nothing for the reader.
- **Hide / soften a baseline-driven decline** — be honest that MBO does not optimize baseline; the decline is a model projection of organic / seasonal trend, not a result of the reallocation
- **Cite numbers without anchoring** ("Meta is near saturation") — say at what spend, where the saturation point is
- **Use technical terms without inline explanation on first use** (saturation curve, marginal ROAS, iROAS)
- **Use internal DS terms** (MMM parameters, iROAS posterior, calibration weight, log-saturation function)
- **Invent reasons for a curve shift** — cite playbook patterns; if data doesn't match, recommend CS check
- **Confuse average ROAS with marginal ROAS** in interpretation — these are different and the distinction is MBO's value
- **Recommend an action** ("follow MBO's recommendation") — give framing, let user decide
- **Pick a side** in mbo_vs_attribution or mbo_vs_lift_test — give situational guidance
- **Refuse to interpret when backtesting accuracy is low** — caveat and deliver
- **Skip **`**knowledge-base-ask**`** before SQL**
- **Compare more than 2 scenarios in one shot** — too dense; offer pairwise
- **Output two scenarios sequentially instead of as a comparison** ("scenario A first, then scenario B") — use a table / side-by-side
- **Skip the MBO link at the end** — curves and full detail live in MBO
- **Hard-pick a "winner" in comparison** unless user explicitly asked "which is better"
- **Blame the model when actuals didn't match forecast** — frame as market / execution / seasonality variance
- **Try to explain MMM model internals** — route to CSM
## 11. References & related skills
**Related skills**:
- **Sibling**: `mbo-create-scenario` (build / modify scenarios), `attribution-data-query` (historical numbers without MBO)
- **Upstream**: `attribution-intent-clarification` (if ask is too vague to detect mode even after 2-step)
- **Routes out to**: `attribution-edge-routing` (not provisioned), `attribution-anomaly-diagnosis` (if user wanted historical attribution diagnosis not MBO interpretation), `mbo-create-scenario` ("how much should I spend?" + modify + create intents)
**Risk class**: all tools used are R0. No system-level or skill-level confirmation needed.
**Key concepts**:
- **Saturation curve**: per-channel spend-to-incremental-return curve, calibrated by lift tests
- **Marginal vs Average ROAS**: marginal = return on next dollar; average = realized blend. MBO operates on marginal
- **Baseline vs Paid Media sales**: only shown when all channels in scenario; baseline = organic demand, paid = what reallocation affects
- **MBO ≠ Attribution**: model-estimated vs realized actuals; two methodologies, expected to differ
- **Lift test ≠ Opposed to MBO**: lift test is the calibration input to MBO; they're complementary measurements (iROAS vs marginal ROAS) of related but different things
- **Backtesting accuracy**: 70% threshold; below = caveat, don't refuse
- **Forecast status**: running / completed / failed — don't interpret stale or incomplete forecasts
- **Special channel states**: zero ref-period spend → excluded; insufficient data → held at baseline (noChange); locked by default (branded search) → not optimized
**Reference docs**: the Media Budget Optimizer knowledge base — Reading Your Results + FAQ.
