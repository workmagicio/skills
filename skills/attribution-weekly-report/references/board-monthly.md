# Monthly board — deltas

Read `board-spine.md` first. Monthly is where **calendar alignment** and **seasonality**
start to matter, and where the account's history is often shorter than the trend window.

## PERIOD

```js
const PERIOD = {
  key: "monthly",
  days: 30,                      // rolling; see the alignment rule below
  buckets: 12,
  noun: "month",
  unitPlural: "months",
  adjective: "Monthly",
  priorLabel: "prior 30 days",
  priorShort: "prior 30d",
};
const BUCKET_CHOICES = [6, 12, 18];
```

## 🔴 Calendar alignment — shipped, and it changes what the comparison means

`align: "calendar"` + `unit: "month"` makes the windows **real calendar months**, not a
rolling 30 days. Use it: finance reports on months, and a rolling 30-day window labelled
"March" is wrong even when the arithmetic is right. (`align: "rolling"` remains available and
is what the weekly and daily cadences use.)

Two branches, both handled by the skeleton:

**The month is complete** (its last day has settled) → current month vs the whole prior
month, **as raw totals**. February's 28 days against January's 31 are *not* normalised,
because whole-month totals are the convention finance expects; instead the page states both
day counts ("Whole-month totals — 28 days vs 31 in the prior month, compared as-is") so the
~10% length difference is visible rather than silent.

**The month is not complete** → the board reports **month-to-date** and cuts the prior month
to the *same number of days*:

> Mar 1–4 against **Feb 1–4**, never Mar 1–4 against all of February.

The page says so ("Monthly to date — 4 of 31 days, against the same 4 days of the prior
month"). This is the board-side form of the standing failure mode "misaligned
period-over-period" in `failure-modes.md`; the snapshot side has the same rule.

The trend buckets become real calendar months too, and the newest bucket is partial when the
board is to-date. The settling walk is untouched — it works on the daily series and is
cadence-independent.

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
