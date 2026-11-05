# Board spine — what every cadence's board guarantees

The board is the **primary view**: a live artifact that re-queries on open. This file is
the part that does **not** change between a daily, weekly, monthly or quarterly board.
Each cadence then has its own spec stating only its deltas:

| Cadence | Spec | Reference implementation |
|-|-|-|
| Daily | `board-daily.md` | — |
| Weekly | `board-weekly.md` | ✅ `templates/board.tsx` ships configured for weekly |
| Monthly | `board-monthly.md` | — |
| Quarterly | `board-quarterly.md` | — |
| Alert (Heartbeat) | `board-alert.md` | **not a board** — read it before building one |

Read this file, then the one cadence file. **Never copy this content into a cadence
file** — a divergent copy is how the two drift apart.

## Measurement identity — how the board renders it

The rule itself is canonical in `attribution-data-query`
(`references/sales-platform-scope.md` for scope + the always-state law,
`references/attribution-model.md` for the model default and aliases). Read those; do not
re-derive them here. A business-review board sits squarely in the "totals / business
overview" case, so its scope default is **all sales platforms**.

What the board adds is *where the identity appears*, which is everywhere a number does:

> All sales platforms · Incrementality adjusted attribution

- Rendered **scope first, then model**, as one phrase, so a figure can never be read
  without both. It appears in the page header, in every section note, and in the
  provenance footer.
- The model half is resolved **live** from the tenant default view at page load — a board
  that hardcodes it silently disagrees with every other WorkMagic surface the day the
  tenant changes their default.
- Marketing channel (ads / email / organic) and sales platform (Shopify / Amazon / TikTok
  Shop) are different axes. Part 2 shows one of each, side by side, precisely so they are
  not confused — never present one as the other.

## Data-anchored windows — the rule that makes any cadence honest

Attribution lands 6–24h late, so the last day in the table is always partial and sometimes
empty. A window anchored to the **clock** therefore compares a settled period against a
partial one and reports a collapse that did not happen.

Every cadence's board walks back from the end of the daily series, drops trailing days
whose revenue is far below the median of the days before them, and **names the dropped days
on the page**. Two consequences that hold at every cadence:

- The **settling reference is a trailing week** regardless of what the board reports —
  ingestion lag is a daily phenomenon and does not scale with the reporting period. It is
  deliberately not derived from the period length: tying it to the period skips trimming
  entirely on any account with less history than one period, which puts a still-ingesting
  day at the end of the window.
- **A trailing day can clear the revenue test and still be unsettled.** Spend lands
  immediately; attribution lands 6–24h later. So the last kept day can sit at ~90% of median
  revenue — comfortably above the trim threshold — while its ROAS is far below the trailing
  median, because its spend is fully in and its attribution is not. Verified on a real
  account: a trailing day at **89.7% of median revenue** but only **70.2% of median ROAS**,
  on **128.6% of median spend**. The board **flags** that day; it does **not** trim it.
  🔴 Trimming on a ROAS signal would silently hide a day when efficiency genuinely
  collapsed, which is the one thing this board must never do — so the reader is told the
  window may understate revenue and gets to decide.
- **A window longer than the account's history is a defect, not a zero.** Missing days
  count as zero and read as a collapse. The board detects it and says so ("History starts
  <date> — the prior-period comparison is incomplete"). Bites hardest on monthly and
  quarterly; see those specs.

Sales platforms whose own reporting lags further behind are called out separately on the
revenue card, because their lag understates total revenue rather than the window.

## Comparing windows of different lengths

Two cadences deliberately compare windows that are not the same length: a daily board reads
against the trailing 7 days (`baselineDays`), and a calendar board can be reporting
period-to-date. The rule that keeps both honest:

- **Levels** (spend, revenue) are scaled to the current window's length before any
  comparison. A 1-day figure is never held against a 7-day total.
- **Rates** are not scaled and need no scaling — multiplying spend and revenue by the same
  factor leaves ROAS untouched, so ratio-of-sums holds exactly.
- **One exception, stated on the page**: a *complete* calendar period is compared as raw
  totals (February's 28 days against January's 31), because whole-period totals are the
  convention finance expects. The board then shows both day counts rather than normalising
  the difference away silently.
- Whichever applies, the page names the basis in the status strip. An unexplained comparison
  basis is how a reader draws the wrong conclusion.

## Naming: what the board calls things vs what the WorkMagic UI calls them

The query tool returns a `meta.field_labels` dictionary and asks callers to use it verbatim.
The board **deliberately does not**, and this is a divergence worth understanding before
anyone "fixes" it:

| Board term | WM field | WM's own label |
|-|-|-|
| Sales platform (Shopify / Amazon / TikTok Shop) | `sales_platform` | **Sales channel** |
| Marketing channel (ads / email / organic) | `src_channel` | **Channel** |
| Ads-attributed revenue | `attr_all_sales` | **Sales (All)** |
| Total revenue (store-actual) | `order_total_sales` | **Sales** |
| Ad platform (Meta / Google / …) | `ads_platform` | Ad platform |

Adopting those labels verbatim would produce exactly the confusion this file forbids
elsewhere: two different axes both called "channel", and attributed revenue and store-actual
revenue both called "Sales", separated only by an "(All)" that means *all sales platforms*
rather than *all revenue*. A board that defines its own axes has to be internally consistent
to be readable.

So the board keeps the clearer terms and **publishes this crosswalk** so a customer
reconciling a figure against the WorkMagic UI can see which label maps to which. The
verbatim-label rule the tool states is aimed at ad-hoc table dumps in chat, where the reader
has no other context to go on.

🔴 **Open with the WM side**: this is a divergence from another team's stated rendering
contract, not a settled question. If WM's user-facing vocabulary is the one customers are
expected to learn, the right fix is to change the terms *here and in the canonical scope
file together* — never only on the board, which would put the board at odds with every other
attribution surface.

## Part 1 — Headline numbers

Four figures, and the distinction between the first two is the point of the part:

| KPI | Source | Polarity |
|-|-|-|
| Total revenue | store-actual, all sales platforms, **no attribution model** | up is good |
| Ads-attributed revenue | paid ads only, attributed | up is good |
| Ad spend | all ad platforms | **neutral** — meaningless without ROAS |
| ROAS | attributed revenue ÷ spend, ratio of sums | up is good |

Ad spend has no polarity of its own. Colouring a spend increase red (or green) asserts a
judgement the number does not support. Cadence specs may **add** KPIs (a month is long
enough for new-customer share to mean something); none may drop these four.

## Part 2 — Trends

Buckets are anchored to the settled window end, not to the calendar, so the current bucket
is comparable to the ones before it. (Calendar-aligned cadences add a rule — see
`board-monthly.md`.)

- Ads chart: attributed revenue and spend share **one** dollar axis; ROAS on a labelled
  second axis. Two dollar series on two different axes invites a false crossover reading.
- Platform chart: store-actual revenue stacked by sales platform, top platforms by revenue
  with the remainder as "other".

## Part 3 — Efficiency verdict

Classifies the period from two moves — spend and efficiency — each with a dead band so
noise does not read as a story:

| Spend | Efficiency | Verdict |
|-|-|-|
| up | down | scaling into weaker returns |
| flat | down | genuine efficiency problem, not a smaller period |
| down | up | deliberate pullback |
| up | up | scaling efficiently |
| flat | up | efficiency gain on flat spend |
| any | flat | steady period |

Then **one** watch item: the single channel/tactic above the material-spend floor with the
largest ROAS drop. One, not a list — a list is a table, and Part 4 is already the table.

If revenue fell less than spend, say so explicitly: that is an efficiency gain from pulling
back, not a demand problem, and it is the most commonly misread pattern on the board.

**The dead bands are cadence-dependent** — a single day's ROAS swings far more than a
quarter's. Each cadence spec states its bands; using the weekly bands on a daily board
turns ordinary day-of-week rhythm into a verdict.

## Part 4 — Ad channel funnel

Channel rows, collapsed by default, expandable to tactics where a channel has more than
one. Impressions → clicks → CTR → CPC → CPM → spend → conversions → attributed orders →
attributed revenue → ROAS → NC orders → NC ROAS, plus a period-over-period trend pill.

All rates are **ratio of sums** over the window, never the average of daily ratios.

**The total row does NOT tie exactly to the Part 1 headline, and the board must say by how
much.** Part 4 rolls up the ad-level view; Part 1 uses the channel-level view. Attributed
revenue that cannot be resolved to a specific ad has no ad-level row, so the funnel is
always a little short — measured at **~2% of revenue** on a real account, against an earlier
claim of "under 0.1%". 🔴 Never assert a magnitude for that gap: the board **computes the
coverage it actually achieved** and renders it, so the number cannot go stale and a customer
reconciling the two parts finds the difference already explained.

## Part 5 — Actions

A channel appears only if it is **material** (spend above the floor) and **moved** (ROAS
beyond the dead band). Ranked by `|ROAS move| × spend`, so a large move on trivial spend
does not outrank a moderate move on the budget that matters. At most three cuts and three
scales.

Each card states the observation and the action it supports — never an action the data does
not support. "No channel at material spend moved ROAS by more than the band this period" is
a correct and complete Part 5.

**How strong an action may be is cadence-dependent.** One day is not evidence for a budget
decision; a quarter is not the place for "pause this ad set". Each cadence spec states what
Part 5 is allowed to recommend.

## The material-spend floor

`max(MATERIAL_SPEND_ABS, period_spend × MATERIAL_SPEND_SHARE)`. Keep the absolute term at
`0` and let the share term scale — see `instantiation.md`. The share is a share **of the
period's spend**, so it scales with the cadence automatically; do not re-tune it per
cadence.
