# Output templates

## Part A — Diagnosis (internal)

```
MBO explanation: [Scenario name] · [Client] · [date]
Draft for CS review · Spot-check confirmed: [yes / no — figures unverified]
Scenario link: [url, verbatim]

Scope: [Outcome Maximization / Target Achievement] · [period] · [outcome], [all sales platforms / DTC only]
· [tactic / channel] · [n] rows · model [modelRefreshDate] · reference window [dates] · strategy [x]
· budget input [as set → $ for the period]

Portfolio
| | Reference | Optimized | Δ | Δ% |
| Spend | S | B | | |
| [Goal metric] | R | P | | |
| [Components] | | | | |
Target: T · gap D (Target Achievement only)

Sanity check: [no trigger / which trigger]

Findings
0. Constraints satisfied (target runs): [yes / no]
1. Paid vs total: paid [C → D]; organic difference [B′ − A] is by construction, not a finding
2. Bounds: locked/held [x], movable [y]; binding rows [list]; Reference [feasible / infeasible because …]; budget clamp [none / input → clamped]
3. Spend and allocation: budget effect [direction / evidenced figure]; reallocation [summary]
4. Escalation: [none / reason + package]

Rows
| Row | Ref | Opt | Δ $ | Δ% | Marginal return ref → opt | Bound | Flag | Pattern |

Not optimized: [..]

Missing-field ledger
| Field | Needed for | Blocked |
```

## Part B — CS explanation

```
Scenario and objective. [Type], [optimization period], [sales scope], [platform/tactic level], [goal].
Input: [fixed budget or target]. Reference budget: [amount, same window].

Portfolio result.
Outcome Maximization: "At a fixed spend of [B], the model projects [P] for [goal], versus [R] at reference spend [S]."
Target Achievement: "For a target of [T], estimated spend is [B] and the projected result is [P], [meeting / missing] the target by [gap]."

Sanity-check finding. (only if a trigger fired or the CSM asked)
Paid media [C → D], the comparable part; total [E → F], which also includes a non-media baseline estimated differently for each plan. Ratio/cost: [components].
Then the verified budget and constraint effect. If a component couldn't be decomposed, say which.

Top moves. Per material row: direction, [ref] → [opt] ([%]), reason (marginal return or binding limit),
impact (only if attributable from the output).

Guardrails and next step. Binding bounds, locks, exclusions, budget clamp if it applied.
"Consider …" + tradeoff.
```

## Say / don't say

| Say | Don't say |
|---|---|
| "The model projects / estimates …" | "will deliver", "achieves", "guaranteed"; "met" for a missed target |
| "At this spend level, the next dollar on [row] is projected to return …" | "[Channel] is ineffective / wasted / underperforming" |
| "[Row] is at the top of what the Moderate setting allows in this scenario." | What a row "would have" received without its bound; a computed bound figure for a preset strategy |
| "This part isn't available in the scenario output, so we can't break it down yet." | Saturation as the reason a row didn't move, without curve evidence |
| "We're checking this with our data team." | "The model is wrong", or a guessed cause |
| "Consider a second scenario with Meta's lock removed; the tradeoff is a larger change from current spend." | "You should move $20k to Google." |

## Glossary — first use only

- *Reference*: the spend plan the scenario starts from, for the same window.
- *Marginal ROAS*: sales each extra dollar produces at that spend level.
- *Saturation*: the point where extra spend on a channel returns less and less.

## Numbers

Money rounded to what matters ($48.2k); ratios one decimal (3.1x); percentages one decimal (+12.4%); always with the period; dollar and percent together.

## Never output

- Internal field or tool names (budget_detail, spendBound, baseline_1, response_json, table names)
- Numeric scenario IDs, tenant IDs, constructed URLs
- Raw full-precision floats from tool output
