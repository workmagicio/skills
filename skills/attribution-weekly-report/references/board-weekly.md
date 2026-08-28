# Weekly board — the reference implementation

Read `board-spine.md` first; this file states only the weekly deltas.

`templates/board.tsx` **ships configured for weekly**, and the weekly path is the one whose
numbers have been verified end to end. Every other cadence is that skeleton with the
`PERIOD` block changed plus the deltas in its own spec.

## PERIOD

```js
const PERIOD = {
  key: "weekly",
  days: 7,
  buckets: 8,
  noun: "week",
  unitPlural: "weeks",
  adjective: "Weekly",
  priorLabel: "prior 7 days",
  priorShort: "prior 7d",
};
const BUCKET_CHOICES = [6, 8, 12];
```

## Window and comparison

- Last **settled 7 days** against the **prior 7 days**. Length-aligned by construction.
- 8 weekly buckets in the trend charts (6 / 12 selectable).
- Deliberately **not** calendar weeks: the window ends on the last settled day, so the
  current bucket is always a full 7 days and always comparable. A user asking for "Mon–Sun"
  specifically is asking for a calendar-aligned board — apply the alignment rule from
  `board-monthly.md`.

## Dead bands

`ROAS_FLAT_BAND = 0.03` · `SPEND_FLAT_BAND = 0.03` · `TREND_BAND = 0.08` ·
`WATCH_ROAS_DROP = 0.05`. Seven days of aggregation is enough to make a 3% ROAS move
readable, which is why the weekly bands are the tightest of any cadence.

## KPI set

The four spine KPIs, unchanged. A week is long enough for ROAS to be stable and too short
for new-customer mix or CAC to move meaningfully — leave those to monthly.

## Part 5 — what it may recommend

Full tactical range: cut / restructure / scale / take budget back, naming the channel or
tactic. A week at material spend is enough evidence for a budget decision going into the
next week, which is exactly the decision this board exists to inform.
