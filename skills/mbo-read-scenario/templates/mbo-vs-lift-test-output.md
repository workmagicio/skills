mbo_vs_lift_test output template. **The real customer confusion is usually NOT iROAS vs marginal ROAS** (most users already know those aren't comparable) — it's why the lift test's incremental ROAS doesn't match **MBO's regular channel ROAS** for the same channel. The template puts all **three numbers** side by side and explains each pairwise relationship. Structure: ① headline framing them as measuring different things — never "which is right", ② three-column table with inline explanation of each term on first use, ③ why iROAS and MBO channel ROAS aren't comparable (the core section), ④ complementarity — the lift test **calibrates** MBO, ⑤ what to do with each, ⑥ both links.

<callout emoji="🔗">
**Lift test iROAS vs MBO ROAS for {channel} — three different numbers, measuring different things**
All three are valid; they answer different questions:
</callout>

|  | **Lift test iROAS** | **MBO channel ROAS** | **MBO marginal ROAS** |
|-|-|-|-|
| Number | **{value}** | **{value}** | **{value}** |
| What it measures | Incremental ROAS — sales that would **not** have happened without the spend, measured causally during the test | Model-estimated sales from the channel ÷ spend at that level — an **average across every dollar**, from the first (most efficient) to the last | Return on the **next dollar** at the recommended spend — the slope of the curve at that point |
| Measured at | {test spend level}, {test window} | {recommended spend} for {scenario period} | Same point as channel ROAS |
| Question it answers | "Did this spend causally drive sales?" | "What does the whole budget on this channel return?" | "What does one more dollar earn here?" |

**Why the lift test iROAS and MBO's channel ROAS aren't comparable** (the pair users most often line up):

1. **Average of every dollar vs effect of the tested band.** MBO's channel ROAS averages the whole curve — the efficient early dollars pull it up. The lift test measured the causal effect of the spend the test actually varied, which sits on the flatter band near the tested level. On a diminishing-returns curve the average will read higher than the tested band almost by construction.
2. **Different spend levels.** {If test spend ≠ recommended spend: the two numbers are read at different points on the curve — returns differ with spend.}
3. **Different time windows.** The test is a snapshot of {test window}; the scenario forecasts {period} — seasonality, promos, and creative mix all differ.

*(The number conceptually closest to the test's iROAS is the* ***marginal ROAS at the tested spend level*** *— not the channel's average ROAS.)*

**These are consistent inside the model, not competing** — the lift test is what calibrated MBO's curve for {channel}. They read the same curve at different points and different aggregations, which is why the numbers differ without either being wrong.

**What to do with each**: use the lift test to trust (or re-verify) that {channel} is genuinely incremental; use MBO's channel ROAS to judge the channel's overall contribution at the planned budget; use marginal ROAS to decide the next budget move. {If the test is > 90 days old, add the re-test suggestion.}

**[Open scenario in MBO →]** · **[Open lift test →]**

## Worked example

<callout emoji="🔗">
**Lift test iROAS vs MBO ROAS for Meta — three different numbers, measuring different things**
All three are valid; they answer different questions:
</callout>

|  | **Lift test iROAS** | **MBO channel ROAS** | **MBO marginal ROAS** |
|-|-|-|-|
| Number | **\$1.50** (Significant, CI [\$1.20 \~ \$1.80]) | **3.2x** | **2.1x** |
| What it measures | Incremental ROAS — sales that would **not** have happened without the Meta spend, measured causally during the test | Model-estimated Meta-driven sales ÷ spend at \$80K/mo — an **average across every dollar** | Return on the **next dollar** at \$80K/mo |
| Measured at | \$120K/mo, Mar 5 – Mar 26 | Recommended \$80K/mo for Q3 | Same point |
| Question it answers | "Did Meta causally drive sales?" — yes, confirmed | "What does the whole Meta budget return?" | "What does one more dollar earn at \$80K/mo?" |

**Why the \$1.50 iROAS and the 3.2x channel ROAS aren't comparable**:

1. **Average of every dollar vs effect of the tested band.** The 3.2x averages Meta's whole curve at \$80K/mo — the efficient early dollars pull it up. The March test measured the causal effect of the spend band it varied around \$120K/mo, on a flatter part of the curve. The average reading higher than the tested band is exactly what a diminishing-returns curve produces.
2. **Different spend levels.** \$80K/mo (scenario) vs \$120K/mo (test) sit at different points on the curve — Meta earns more per dollar at the lower level.
3. **Different time windows.** The test is a 3-week March snapshot; the scenario forecasts all of Q3, with different seasonality and creative mix.

*(The closest cousin to the test's \$1.50 is the marginal ROAS near \$120K/mo — which the calibrated curve puts at roughly the same level. That's the consistency check, not the channel's 3.2x average.)*

**These are consistent inside the model, not competing** — this March lift test is exactly what calibrated MBO's Meta curve. All three numbers read the same curve at different points and aggregations, which is why they differ without any of them being wrong.

**What to do with each**: the test confirms Meta is genuinely incremental (CI entirely above zero); the 3.2x says Meta's overall Q3 contribution at \$80K/mo is healthy; the 2.1x marginal is what justifies where MBO capped the recommendation. The test is about 3 months old — if Q3 spend or mix shifts materially, a fresh test would tighten the calibration.

**[Open scenario in MBO →]** · **[Open lift test →]**

- *If marginal ROAS > iROAS*: {the recommended spend sits below where the test ran — on a steeper part of the curve, the next dollar earns more than the test-period average incremental return}
- *If iROAS > marginal ROAS*: {the scenario operates the channel closer to saturation than the tested state — the test captured a less-saturated moment}
