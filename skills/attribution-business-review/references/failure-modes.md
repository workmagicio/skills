# Failure modes & edge cases

Ordered by how badly they mislead the customer.

## 1. Seed shown as if it were live — the worst one

**Symptom**: the page renders plausible numbers, the customer believes them, and they belong
to nobody (or to another account).

**Causes**: a query name or column that drifted, so the mapping silently falls through to
seed; a seed copied from another account's board; a viewer without tool access.

**Guards**: the status strip must always show Live vs Sample; the seed must be synthetic
until replaced by probed values; the Step 5 diff must be run against a live result. Never
remove the Sample-data chip to make the page "look cleaner".

## 2. A non-zero absolute spend floor on a small account

**Symptom**: Parts 3 and 5 are permanently empty and the board looks calm on an account that
is not calm.

**Cause**: `MATERIAL_SPEND_ABS` carried over from a larger account, sitting above 1% of this
account's weekly spend.

**Fix**: keep it at 0 and let the share floor scale. See `instantiation.md` Edit 4.

## 3. Clock-anchored comparison against a partial week

**Symptom**: a dramatic week-over-week collapse that vanishes the next day.

**Cause**: comparing a still-ingesting window against a settled one.

**Fix**: the settled-window walk, and naming the trimmed days on the page. If an account's
lag is unusually long, the walk handles it automatically — do not hardcode a lag.

## 4. Missing sales-platform data

**Symptom**: Part 1's total revenue is lower than the customer's own figure, or the platform
chart is empty.

**Causes**: the account sells only through Shopify (normal — one stacked band); a marketplace
integration is not connected; a marketplace reports on a multi-day lag.

**Handling**: an account with one sales platform is fine and needs no special case. A
late-reporting platform is called out on the revenue card, since it understates the total
rather than invalidating it. A missing integration is not this board's problem to solve —
say what is missing and route to `attribution-anomaly-diagnosis`.

## 5. Single-channel accounts

**Symptom**: Part 4 has one row and Part 5 is thin.

**Handling**: correct, not broken. Do not pad the board with tactic rows that are really one
channel, and do not invent comparisons. If the account genuinely has one channel, the
efficiency verdict in Part 3 is carrying the whole board — make sure its dead bands are not
swallowing real movement.

## 6. Ratio-of-averages creeping in

**Symptom**: the board's ROAS disagrees with the same window queried directly.

**Cause**: averaging daily ratios instead of dividing summed revenue by summed spend.

**Fix**: every rate goes through the `ratioOfSums` helper. This includes CTR, CPC, CPM and
NC ROAS in the funnel table.

## 7. Numbers arriving as strings

**Symptom**: blank charts, `NaN`, or a page stuck on seed while queries succeed.

**Cause**: warehouse cells are serialised as strings; a `typeof v === "number"` guard rejects
every live value.

**Fix**: `num` (missing → `—`, for display) and `num0` (missing → `0`, for maths). Never one
zero-returning helper for both, or "no data" becomes an invisible fake zero.

## 8. A volatile query input

**Symptom**: the board hammers the warehouse, then the host's circuit breaker pauses
auto-refresh and the board stops updating.

**Cause**: `new Date()` / `Date.now()` inside the query input, changing it by value on every
render.

**Fix**: the `ctx` timestamp is computed once at module scope. Keep it there.

## 9. Mid-week runs

**Symptom**: the customer opens the board on Wednesday and asks why it shows last week.

**Handling**: this is correct — the board reports the last **settled** 7 days, not
week-to-date. The header states the window explicitly. If the customer wants week-to-date,
that is a different board, not a change to this one.

## 10. Revising an existing board

**Symptom**: an edit truncates or rewrites the file and loses parts of it.

**Cause**: the file is large; a full rewrite is expensive and error-prone.

**Fix**: revise with `bt_artifact_manage` `action='edit'` (targeted replacements) rather than
re-saving the whole document, and read the saved `context` note first so the edit honours the
account-specific thresholds already chosen.
