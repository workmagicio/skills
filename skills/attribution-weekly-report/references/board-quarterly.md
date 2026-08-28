# Quarterly board — deltas

Read `board-spine.md` first, then `executive-variant.md` — a quarterly board is almost
always read by an executive, and that file already owns what an executive read excludes.

## PERIOD

```js
const PERIOD = {
  key: "quarterly",
  days: 91,
  baselineDays: 91,
  unit: "quarter",
  align: "calendar",
  buckets: 8,
  noun: "quarter",
  unitPlural: "quarters",
  adjective: "Quarterly",
  priorLabel: "prior quarter",
  priorShort: "prior qtr",
};
const BUCKET_CHOICES = [4, 8, 12];
```

Calendar alignment matters more here than anywhere else — "Q1" is a fixed thing to the
reader, so `align: "calendar"` is not optional at this cadence. Both branches described in
`board-monthly.md` apply unchanged: a complete quarter is compared as raw totals with both
day counts stated, and an incomplete one is reported quarter-to-date against the same number
of days into the prior quarter. A rolling 91-day window labelled "Q1" is wrong even when the
arithmetic is right.

## Show QoQ and YoY together, and lead with YoY

Quarter-over-quarter is heavily seasonal (Q4 against Q3 is a holiday artifact). The
year-over-year comparison is the one an executive should read first; QoQ is the supporting
figure, not the headline.

## Part 4 — channel level only

Collapse the funnel to **channel rows and remove the tactic expansion**, matching
`executive-variant.md`'s "strip campaign-level detail". At a quarter's scale a tactic row is
noise to the reader who is deciding next quarter's budget.

## Dead bands — tightest of any cadence

`ROAS_FLAT_BAND = 0.015` · `SPEND_FLAT_BAND = 0.015` · `TREND_BAND = 0.04` ·
`WATCH_ROAS_DROP = 0.03`.

## Part 5 — three strategic items, maximum

Strategic and forward-looking: where the next quarter's budget should sit, which channels
have earned expansion, which need a measurement decision (a lift test) rather than a budget
change. Three items maximum — an executive page with six recommendations has none.

When the recommendation is really "we don't know whether this channel is incremental",
route to `lift-test-creation` instead of inventing a budget number.

## Coverage warning will fire on most accounts

8 quarters is two years. Most accounts do not have it. Show the coverage chip and consider
dropping to 4 buckets rather than rendering a page half-full of zeros.

## Format

1-page printable, per `executive-variant.md`. PDF if the snapshot goes out by email.
