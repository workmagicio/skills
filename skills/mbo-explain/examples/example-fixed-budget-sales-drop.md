# Worked example — fixed budget, sales drop

**Scenario**: CSM pastes a link: the client asks why Optimized sales are lower than Reference at the same budget. Figures below are illustrative.

## Step 1 — Resolve

Link matched to scenario "Nov plan – max sales" via url. Echo: Outcome Maximization, Nov 1–30, total sales, all sales platforms, tactic level, 9 rows, budget 100% of reference, aggressive strategy, Google Brand on a manual range of $45k–$80k. CSM confirms.

## Step 2–4 — Pull and normalise

Status success. Not optimized: Pinterest (no reference spend). Constraints satisfied. Spot-check confirmed by CSM.

|  | Reference | Optimized |
|---|---|---|
| Spend | $412.0k | $412.0k |
| Paid sales (spend × ROAS) | $820.0k | $800.0k |
| Total sales | $1.84M | $1.81M |

## Step 5 — Sanity check

B = S (within 1%), P < R on the selected metric → trigger.

## Step 6 — Diagnose

**Paid vs total**: paid sales $820.0k → $800.0k. The other $10k of the total gap sits in organic, which is estimated differently for each plan: labelled, not explained.

**Bounds**: the scenario sets a manual range of $45k–$80k on Google Brand, whose Reference spend is $96k. Reference is **not feasible** under this run's bounds.

**Allocation**: Google Brand $96.0k → $80.0k (at its maximum); $16k moves to Meta Prospecting $70.0k → $86.0k, marginal ROAS 2.4x → 2.1x on the curve.

## Step 7 — Escalate or select patterns

Reference is infeasible, so the equal-spend comparison isn't a like-for-like test of the optimizer. Patterns: OM-2, R-4, R-1.

## Step 8 — CS explanation (excerpt)

At a fixed spend of $412.0k, the model projects $1.81M in total sales for November, versus $1.84M at reference spend. The Reference plan puts Google Brand at $96.0k, above the $80.0k maximum this scenario allows, so it isn't an available plan under these limits. Google Brand sits at its maximum; $16.0k moves to Meta Prospecting ($70.0k → $86.0k, +22.9%), where the next dollar is projected to return about 2.1x. Paid media accounts for $20.0k of the difference; the rest sits in the non-media baseline, which is estimated differently for the reference and optimized plans. Consider a second scenario with Google Brand's manual range widened to see how much that limit shapes the plan; the tradeoff is a larger move away from the settings the client chose.

## What this example demonstrates

- **Trigger ≠ finding**: equal spend and lower sales prompted the check; the bound explained it.
- **Reference feasibility** tested before blaming the optimizer.
- **Binding bound** cited only because the row sits at it; no "would have" amount.
- **Paid compared, organic labelled**: the organic difference isn't treated as a finding.
- **"Consider …"** next step with its tradeoff.
