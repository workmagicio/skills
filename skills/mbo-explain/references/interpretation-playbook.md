# Interpretation playbook

Select a pattern **only after its evidence has been checked**. Replace every placeholder with a queried figure and drop any clause whose evidence is missing. Most scenarios need 2–4 patterns; if none fits, write the facts without one.

Pick the scenario pattern first (OM or TA), then row patterns for the material moves, plus any Every scenario check (G) that applies.

## Outcome Maximization (budget given: compare P with R)

Classify on the total the client sees, and always show it with its paid / organic split (sop-detail §6.1). When the total is worse, check paid first: the usual cause is the organic construction difference, not the allocation. At the same budget, paid itself only falls when the bounds rule out the reference plan. A budget set below reference spend lowers paid by design: split that budget effect out first (sop-detail §6.3).

| # | Pattern | Check first | Explanation |
|---|---|---|---|
| OM-1 | Optimized matches or beats Reference | 6.1 paid comparison; B vs S | "At [B], the model projects [P] in total [goal] versus [R] at reference spend: paid [R paid → P paid] and the non-media baseline [R organic → P organic], projected [higher / lower] for [optimization period] than it was in the reference period ([reference dates]). The paid gain comes mainly from moving budget from [rows] to [rows]." If B ≠ S, split the budget effect from the reallocation (sop-detail §6.3); explain the moves with R-1 to R-5 |
| OM-2 | Optimized worse than Reference | Paid first. Paid not worse → the drop is the organic construction difference (G-2). Paid worse → in order: budget below reference spend (B < S): the budget effect, split it out (sop-detail §6.3); bounds that rule out the reference plan (Reference outside this run's bounds); none of these → escalate | "At [B], the model projects [P] in total [goal] versus [R] at reference spend: paid [R paid → P paid] and the non-media baseline [R organic → P organic]. [Paid holds up; the drop comes from the non-media baseline, which is projected lower for [optimization period] than it was in the reference period ([reference dates]) / Paid is lower because [verified cause, e.g. the budget is [S − B] below reference spend / the reference plan puts [row] outside the range this scenario allows (above its cap / below its minimum / locked at another level); list every cause that applies]]." Paid lower with no verified cause → no cause offered; say it's being checked with the data team and escalate |

## Target Achievement (only T given: compare P with T, then B with S)

Status: **met** = P meets T and is within 5% of it; **exceeded** = P beats T by more than 5%; **not met** = P misses T. "Beats" follows the goal: higher for ROAS and sales, lower for CAC.

| # | Pattern | Check first | Explanation |
|---|---|---|---|
| TA-1 | Target met | Efficiency goal: does Reference meet T and is it feasible; B vs S; where spend changes. Volume goal: B vs S; where the added or removed spend goes | Efficiency goal (ROAS, CAC): "The plan picks the largest spend that keeps projected [ROAS at or above / CAC at or below] [T]: [B], [B − S] [above / below] reference spend, with budget [added to / taken from] [rows]." B below S means spending at the reference level would miss T. Volume goal (sales): "Reaching [T] in projected sales takes [B], [B − S] [above / below] reference spend; the plan is the smallest spend that gets there, with budget [added to / taken from] [rows]." |
| TA-2 | Target not met | P vs T; is_constraints_satisfied. Efficiency goal (ROAS, CAC; media only): rows at their lower bound or locked, incl. Insufficient-data rows (minimum spend pulls efficiency down); no such rows → the curves don't reach T at any allowed spend. Volume goal (sales): show total with its paid / organic split; rows at their upper bound (spend can't grow); no such rows → saturation within the allowed range; non-media baseline projected lower for the optimization period than in the reference period | "The plan projects [P] against a target of [T], leaving a gap of [D]. Limits always take priority over the target, so this is the [highest-ROAS / highest-sales] plan the settings allow. [Cause: [rows] are held at their minimum or locked spend, which pulls efficiency down / [rows] are at the top of what their settings allow, so spend can't grow further / within the allowed range the model doesn't project [T]: the next dollar returns only [x] / the non-media baseline is projected lower for [optimization period] than in the reference period ([reference dates]); list every cause that applies]." The curves not reaching T is a finding (the target sits above what the model projects), not an escalation. Never "met" / "on track" |

## Row level

| # | Pattern | Check first | Explanation |
|---|---|---|---|
| R-1 | Budget increases for a row | Spend Δ; mroi at Optimized spend vs other unconstrained rows; upper bound | "[Row] rises from [A] to [B] (+[x]%). At this spend level, each additional dollar is projected to return [figure]." Binding upper bound → R-4 |
| R-2 | Budget decreases for a row | Spend Δ; mroi at Optimized spend vs other unconstrained rows; lower bound | "[Amount] moves from [row] toward [rows]. In the recommended plan the next dollar returns about [x] on every unconstrained row, so moving more wouldn't raise the total." Never call the channel ineffective. A row on the convex part of its curve can show a low marginal return at Reference spend and still gain budget, or be cut to its lower bound |
| R-3 | High average ROAS but a reduction | Average ROAS vs mroi at Optimized spend; other unconstrained rows; ROAS relevant to goal | "Average ROAS includes earlier dollars; the next dollar at the recommended spend returns [mroi], about the same as on the other unconstrained rows. The move follows the return at the margin, not the average." |
| R-4 | A recommendation meets a bound | Recommended vs configured min / max; other receiving rows | "[Row] is at the [top / bottom] of what its [Moderate / Aggressive / Conservative strategy \| manual range] allows, at [recommended spend]. The remaining allocation is made within those settings." No unconstrained amount |
| R-5 | A row does not move | Lock / bound / insufficient data (Q6) / not optimized (zero Reference spend or zero response) / unconstrained no-change | Name only the verified condition (wording below). No change ≠ saturation |

## R-5 wording by condition

| Condition | Wording |
|---|---|
| Lock / noChange | "[Row] was held at [amount] as set in the scenario." |
| Binding bound | See R-4 |
| Insufficient data (Q6 label −1) | "The model doesn't yet have enough data to adjust [row], so its budget isn't changed in this plan." In the result with unchanged spend; only the Q6 label tells it apart from an unconstrained no-change row |
| Not optimized — zero response | "The model has no usable response for [row] in this run, so it stays at reference spend." |
| Not optimized — zero Reference spend | "[Row] had no spend in the reference period, so it isn't part of this plan." |
| Unconstrained no-change | "[Row]'s marginal return at its current spend is already level with the other rows, so it stays unchanged." |

## Others

| # | Pattern | Check first | Explanation |
|---|---|---|---|
| G-1 | Locks or multiple bounds limit movement | Locked and bound $; movable amount; decomposition first | "Only [amount / share] could be reallocated in this run, so the recommendation changes mainly [rows]." Locks are user scope, not a fault |
| G-2 | Total and paid media move in different directions | Paid vs total; organic is not comparable (Step 6.1): its change comes mostly from the construction difference, not the reallocation | "Paid media is projected to change by [D1]. The total also includes the non-media baseline, projected [higher / lower] for [optimization period] than it was in the reference period ([reference dates]), so the total changes by [D3]." Never present the organic difference as caused by the reallocation |
| G-3 | Only a subset is optimized | Included rows; whether a full baseline breakdown exists | "This scenario optimizes [scope]. Its outputs don't establish the full portfolio or the organic baseline." |

Results that change between runs: reconciliation §3.
