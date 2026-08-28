# Daily board — deltas

Read `board-spine.md` first. A daily board is the hardest cadence to make honest: one day
carries the least signal and the most seasonality, and the ingestion lag is a large
fraction of the window rather than a rounding error.

## PERIOD

```js
const PERIOD = {
  key: "daily",
  days: 1,
  buckets: 30,
  noun: "day",
  unitPlural: "days",
  adjective: "Daily",
  priorLabel: "trailing 7-day median",
  priorShort: "vs 7d median",
};
const BUCKET_CHOICES = [14, 30, 60];
```

## 🔴 Compare against the trailing median, never against yesterday

Day-over-day is dominated by **day-of-week seasonality**. Monday against Sunday reads as a
collapse; Saturday against Friday reads as a win. Neither is a signal.

So the daily board's comparison baseline must be the **trailing 7-day median of the same
metric**, and the KPI deltas labelled as such.

> 🔴 **This is a code change, not a setting.** The skeleton hardcodes "compare against the
> immediately preceding period" — there is no `baseline` knob (one existed briefly and was
> removed precisely because nothing read it). In `win`, the daily board must replace the
> `priStart`/`priEnd` pair with a trailing-median baseline computed from the days before
> `curStart`, and Part 1 / Part 3 / Part 5 must read that baseline instead of `adsWindows.pri`.
> Until you make that change, a "daily" board is silently doing day-over-day.

**Measured on a real account** to show why this matters: comparing the last settled day
against the day before gave spend **+40.7%**, sales **−10.3%**, ROAS **−36.3%** — a reading
that looks like a collapse and is entirely day-of-week rhythm plus a partially-settled
trailing day. Nothing about the business changed.

If the account's volume is high enough that day-of-week rhythm is small relative to the
metric, day-over-day *may* be added as a secondary figure — never as the primary delta.

## The as-of date is a headline, not a footnote

With a 6–24h lag the last settled day is routinely **two days back**, and on a one-day
window that is the whole story. State the window's date prominently next to the title, not
only in the status strip.

If the last settled day is more than two days old, that is a data-health signal, not a
board problem — say so and route to `attribution-anomaly-diagnosis` rather than rendering a
stale board as if it were current.

## Dead bands — widen them

`ROAS_FLAT_BAND = 0.08` · `SPEND_FLAT_BAND = 0.08` · `TREND_BAND = 0.15` ·
`WATCH_ROAS_DROP = 0.12`.

Roughly 2–3× the weekly bands. A single day's ROAS moves several percent on nothing;
carrying the weekly 3% band over turns ordinary noise into a verdict every single day,
which trains the reader to ignore the board.

## Part 5 — watch items only, no budget actions

**Suppress cut / scale recommendations.** One day at material spend is not evidence for a
budget decision, and a board that says "cut Meta" on Tuesday and "scale Meta" on Wednesday
destroys its own credibility.

Instead render the same qualifying movements as **watch items**: state the movement, state
that it is a one-day signal, and point at the weekly board for the decision. Concretely,
the action copy changes from "cut or restructure this before the next budget cycle" to
"one-day signal — confirm on the weekly board before moving budget".

## Part 4 — expect thin rows

At one day, many channel × tactic cells are zero or near-zero. Rows below the material
floor drop out as usual; do not compensate by lowering the floor, and do not read an empty
tactic expansion as missing data.

## Part 2 — the sawtooth is seasonality

30 daily buckets will show a visible weekly rhythm. Say so in the section note, so nobody
reads the weekend trough as a decline.
