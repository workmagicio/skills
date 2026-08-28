# Monthly board — deltas

Read `board-spine.md` first. Monthly is where **calendar alignment** and **seasonality**
start to matter, and where the account's history is often shorter than the trend window.

## PERIOD

```js
const PERIOD = {
  key: "monthly",
  days: 30,                      // rolling; see the alignment rule below
  buckets: 12,
  baseline: "prior",
  noun: "month",
  unitPlural: "months",
  adjective: "Monthly",
  priorLabel: "prior 30 days",
  priorShort: "prior 30d",
};
const BUCKET_CHOICES = [6, 12, 18];
```

## 🔴 Rolling vs calendar — pick one and label it

The skeleton computes a **rolling** window from `PERIOD.days`: the last settled 30 days
against the 30 before it. That is length-aligned and honest, and it needs no code change —
but it is **not** "March".

When the user means calendar months (they usually do, because that is what finance reports
on), the window must come from calendar boundaries instead. This is a **documented
adaptation, not shipped code**:

- derive `curStart` / `curEnd` from the month's first and last day rather than
  `addDays(curEnd, -(PERIOD.days - 1))`;
- set the bucket edges to month starts rather than fixed `PERIOD.days` strides;
- keep the settling walk exactly as is — it operates on the daily series and is
  cadence-independent.

And the rule that makes either choice safe:

> **A calendar period is reportable only once its last day has settled.** Until then,
> label it explicitly — "March to date (through Mar 04)" — and compare it against the
> **same number of days** into the prior month. Never a partial month against a full one.

This is the board-side form of the standing failure mode "misaligned period-over-period"
in `failure-modes.md`; the snapshot side has the same rule.

## Add year-over-year

A month is long enough for seasonality to dominate month-over-month. Show **both**: MoM
next to the same month last year. A November-vs-October drop is a calendar fact, not a
performance story, and a board that shows only MoM invites exactly that misreading.

If the account has less than 13 months of history, say so rather than omitting YoY
silently — the coverage guard in the spine covers the mechanism.

## Add new-customer economics

A month is the first cadence where these are stable enough to act on, so extend Part 1
(never replacing the four spine KPIs):

- **New-customer share of revenue** (`attr_new_customer_all_sales` ÷ `attr_all_sales`)
- **CAC** (spend ÷ new-customer orders), stated with the same measurement identity

## Dead bands — tighten them

`ROAS_FLAT_BAND = 0.02` · `SPEND_FLAT_BAND = 0.02` · `TREND_BAND = 0.05` ·
`WATCH_ROAS_DROP = 0.04`.

30 days of aggregation makes a 2% move real. Keeping the weekly bands here hides genuine
structural drift.

## Part 5 — structural, not tactical

Recommendations move from "pause this ad set" to **budget reallocation between channels**
for the coming month, sized against each channel's share of spend. Name the channel and the
direction; leave campaign-level surgery to the weekly board.

## Coverage warning is likely to fire

12 monthly buckets is a year of history. Many accounts do not have it, and a board that
renders empty early buckets as zeros looks like a business that started this spring. The
spine's coverage chip must be visible, not styled away.
