# Board spec — what each part must say

The decision layout, independent of implementation. If you change the code, keep these
guarantees.

## Measurement identity — how the board renders it

The rule itself is canonical in `attribution-data-query`
(`references/sales-platform-scope.md` for scope + the always-state law,
`references/attribution-model.md` for the model default and aliases). Read those; do not
re-derive them here. A business-overview board sits squarely in the "totals / business
overview" case, so its scope default is **all sales platforms**.

What this board adds is *where the identity appears*, which is everywhere a number does:

> All sales platforms · Incrementality adjusted attribution

- Rendered **scope first, then model**, as one phrase, so a figure can never be read without
  both. It appears in the page header, in every section note, and in the provenance footer.
- The model half is resolved **live** from the tenant default view at page load — a board that
  hardcodes it silently disagrees with every other WorkMagic surface the day the tenant
  changes their default.
- Marketing channel (ads / email / organic) and sales platform (Shopify / Amazon / TikTok
  Shop) are different axes. Part 2 shows one of each, side by side, precisely so they are not
  confused — never present one as the other.

## Part 1 — Headline numbers

Four figures, and the distinction between the first two is the point of the part:

| KPI | Source | Polarity |
|-|-|-|
| Total revenue | store-actual, all sales platforms, **no attribution model** | up is good |
| Ads-attributed revenue | paid ads only, attributed | up is good |
| Ad spend | all ad platforms | **neutral** — meaningless without ROAS |
| ROAS | attributed revenue ÷ spend, ratio of sums | up is good |

Ad spend has no polarity of its own. Colouring a spend increase red (or green) asserts a
judgement the number does not support.

## Part 2 — Trends

Weekly buckets anchored to the settled window end, not to calendar weeks — so the current
bucket is comparable to the ones before it.

- Ads chart: attributed revenue and spend share **one** dollar axis; ROAS on a labelled
  second axis. Two dollar series on two different axes invites a false crossover reading.
- Platform chart: store-actual revenue stacked by sales platform, top platforms by revenue
  with the remainder as "other".

## Part 3 — Efficiency verdict

Classifies the week from two moves — spend and efficiency — each with a dead band so noise
does not read as a story:

| Spend | Efficiency | Verdict |
|-|-|-|
| up | down | scaling into weaker returns |
| flat | down | genuine efficiency problem, not a smaller week |
| down | up | deliberate pullback |
| up | up | scaling efficiently |
| flat | up | efficiency gain on flat spend |
| any | flat | steady week |

Then **one** watch item: the single channel/tactic above the material-spend floor with the
largest ROAS drop. One, not a list — a list is a table, and Part 4 is already the table.

If revenue fell less than spend, say so explicitly: that is an efficiency gain from pulling
back, not a demand problem, and it is the most commonly misread pattern on the board.

## Part 4 — Ad channel funnel

Channel rows, collapsed by default, expandable to tactics where a channel has more than one.
Impressions → clicks → CTR → CPC → CPM → spend → conversions → attributed orders →
attributed revenue → ROAS → NC orders → NC ROAS, plus a WoW trend pill per row.

All rates are **ratio of sums** over the window, never the average of daily ratios. The
total row must tie to the Part 1 headline.

## Part 5 — Actions

A channel appears only if it is **material** (spend above the floor) and **moved** (ROAS
beyond the dead band). Ranked by `|ROAS move| × spend`, so a large move on trivial spend
does not outrank a moderate move on the budget that matters. At most three cuts and three
scales.

Each card states the observation and the action it supports — never an action the data does
not support. "No channel at material spend moved ROAS by more than the band this week" is a
correct and complete Part 5.

## Data-anchored windows

Attribution lands 6–24h late, so the last day in the table is always partial and sometimes
empty. Clock-anchored windows therefore compare a settled week against a partial one and
report a collapse that did not happen.

The board walks back from the end of the daily series, dropping trailing days whose revenue
is far below the median of the days before them, and **names the dropped days on the page**.
Sales platforms whose own reporting lags further behind are called out separately on the
revenue card, because their lag understates total revenue rather than the window.
