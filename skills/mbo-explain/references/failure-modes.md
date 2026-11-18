# Failure modes

Complete catalog. Top 8 are inline in SKILL.md §7 CRITICAL; the rest are here.

## On resolving the scenario

- ❌ Parsing an ID out of a link by guesswork instead of matching url.
- ❌ Pulling figures before the CSM confirms the scenario.
- ❌ Referring to the scenario by numeric ID in output.
- ❌ Constructing a scenario URL.

## On data

- ❌ Taking Reference spend from anywhere but baseline_1 / result_overall.spend.
- ❌ Reading a result row other than the latest by update_date.
- ❌ Copying displayed percentages instead of computing from raw values.
- ❌ Reading percentage-mode budget 100 as "+100%" or 0 as "flat".
- ❌ Quoting budget_detail bounds as the model's feasible range.
- ❌ Reading a preset row's [0, 0] spendBound as a lock at zero.
- ❌ Comparing Halo figures with DTC figures, or different windows, side by side.
- ❌ Deriving figures differently from db/snapshot_builder.py.
- ❌ Reading percentage-mode bounds as dollars.

## On diagnosis order

- ❌ Explaining a total-sales drop by row moves before comparing paid components.
- ❌ Treating the organic difference as a finding or as an effect of reallocation.
- ❌ Flagging lower sales as a problem when the budget is below reference.
- ❌ Explaining "Optimized worse than Reference" without testing whether Reference is feasible under this run's bounds.
- ❌ Attributing the whole outcome change to reallocation when total spend changed.

## On reasons

- ❌ Citing a configured bound the row didn't reach.
- ❌ Inferring an unconstrained amount for a bound-limited row.
- ❌ Saying "saturated" for a row that didn't move, without curve evidence.
- ❌ Comparing average ROAS with marginal ROAS as if they were the same thing.
- ❌ Explaining a row move by comparing marginal ROAS at Reference spend.
- ❌ Assigning portfolio impact to one row by subtraction.
- ❌ Calling a reduced channel ineffective, wasted or underperforming.
- ❌ Describing locks as a fault.
- ❌ Linking a curve change to a lift test without confirming the calibration was applied.

## On targets

- ❌ Describing a missed target as met, close or on track.
- ❌ Omitting the target gap.
- ❌ Explaining an out-of-bound row instead of escalating it as a bug.
- ❌ Explaining a gap between input budget and Optimized spend as an optimization result instead of a budget clamp.

## On output

- ❌ CS explanation longer than the diagnosis, or containing unsupported claims.
- ❌ "Will deliver" / "achieves" for a projection.
- ❌ Unconditional instructions instead of "Consider …" with a tradeoff.
- ❌ Internal field or tool names in Part B.
- ❌ Offering a likely cause for an escalated gap.
- ❌ Creating, updating or re-running a scenario to "check".
