scenario_compare output template. Structure (in order): ① one-line header naming both scenarios, ② **input diff first** (only rows that differ — never pretend different-input scenarios are directly comparable), ③ allocation diff table with a business-language "why" per channel, ④ projected outcome comparison, ⑤ decision-oriented summary (what each scenario is suited for — no winner unless user asked), ⑥ both MBO links.

<callout emoji="🔀">
**{Scenario A name} vs {Scenario B name}**
**First, what's different about the setups** — these scenarios were built with different inputs, so read the outputs as answers to different questions:
</callout>

| **Input** | **{Scenario A}** | **{Scenario B}** |
|-|-|-|
| Total budget | {\$X} | {\$Y} ({+/−%} vs A) |
| Goal | {goal + method} | {goal + method} |
| Optimization period | {dates} | {dates} |
| Constraints | {locks / none} | {locks / none} |

*(Omit this table entirely if inputs are identical — instead open with: "Same inputs, run {N} days apart — differences below come from refreshed saturation curves and new lift-test calibration, which is expected.")*

**Where the budget goes**:

| **Channel** | **{A}** | **{B}** | **Δ** | **Why (business language)** |
|-|-|-|-|-|
| {Channel 1} | {\$} | {\$} | {+/−%} | {e.g. "B pushes further up Meta's curve — still steep at this range"} |
| {Channel 2} | {\$} | {\$} | {+/−%} | {reason} |

**What each is projected to deliver**:

| **Projected outcome** | **{A}** | **{B}** |
|-|-|-|
| Paid media sales | {\$} | {\$} ({+/−%}) |
| Paid ROAS | {X.Xx} | {X.Xx} |
| {Goal metric if different} | {value} | {value} |

**What this means**: {2-3 sentences: which one concentrates where; what the extra spend in the bigger scenario buys at the margin; what each is suited for}. Use {A} if {use case}; use {B} if {use case}.

**[Open {A} →]** · **[Open {B} →]**

## Worked example

<callout emoji="🔀">
**Q3 Conservative vs Q3 Aggressive**
**First, what's different about the setups** — these scenarios were built with different inputs, so read the outputs as answers to different questions:
</callout>

| **Input** | **Q3 Conservative** | **Q3 Aggressive** |
|-|-|-|
| Total budget | \$550K | \$690K (+25% vs Conservative) |
| Goal | Maximize sales | Maximize sales |
| Optimization period | 2026-07-01 → 2026-09-30 | 2026-07-01 → 2026-09-30 |
| Constraints | Google_Brand_Search locked at \$45K | Same lock |

**Where the budget goes**:

| **Channel** | **Conservative** | **Aggressive** | **Δ** | **Why** |
|-|-|-|-|-|
| Meta | \$310K | \$420K | +35% | Meta's saturation curve is still steep through this range — the extra budget keeps earning above-average marginal return |
| Google | \$190K | \$160K | −16% | Non-brand Google is near saturation at current spend; Aggressive shifts its increment elsewhere |
| TikTok | \$50K | \$110K | +120% | TikTok is early on its curve — small base, high marginal ROAS, most room to test bigger |

**What each is projected to deliver**:

| **Projected outcome** | **Conservative** | **Aggressive** |
|-|-|-|
| Paid media sales | \$1.54M | \$1.87M (+21%) |
| Paid ROAS | 2.8x | 2.7x |

**What this means**: Aggressive concentrates on Meta and pushes harder into TikTok at the expense of Google. The extra \$140K of budget is projected to return roughly \$330K in additional paid sales — about 2.4x at the margin, below the portfolio average of 2.8x but still well above break-even for most margin structures. Use Conservative if you're defending efficiency this quarter; use Aggressive if you have a growth target and can accept slightly diluted average ROAS while testing bigger positions on platforms still on the steep part of their curves.

**[Open Conservative →]** · **[Open Aggressive →]**
