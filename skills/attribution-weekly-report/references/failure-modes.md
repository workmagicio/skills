## A. Scheduling & delivery failure modes (never do these)

- **Treat a recurring view as a one-time query** — a request for a *number* is `attribution-data-query`; a request for a **view the user will come back to** belongs here, whether or not they also want it pushed. A schedule is no longer required to be in scope (SKILL §2)
- **Skip the test run** — never activate a schedule without showing the user one rendered report first
- **Silent-activate** — every task creation needs the diff-card preview + explicit confirmation
- **Skip delivery channel confirmation** — defaulting to email when user might have meant in-app risks unintended external sends
- **Send to external email without explicit extra confirmation** — sharing attribution data outside the requester's org is a data-exposure event
- **Hard-code "Meta + Google" or any channel mix** — derive from user input; ask if missing
- **Misaligned period-over-period** — week-to-date vs full week makes every report look broken; use length-aligned windows
- **Ask "which attribution model?"** — auto-apply tenant default
- **Expose internal labels** ("Cron job", "Heartbeat", "task_id") — user sees "scheduled task" everywhere
- **Pad with "want to set up another?"** — end the turn after activation confirmation
- **Skip `database-query-ask` before SQL** — needed for `ctx` on the test run
- **Multi-question form in the clarification turn** — one pivotal question, defaults elsewhere
- **Assume a schedule** — build the board first, then ask **once** whether to also push a snapshot. Never activate a schedule the user did not ask for, and never withhold the board because they declined one
- **Add `tenant_id` filters in SQL** — platform-mcp injects it
- **Forget to include sales-platform scope + attribution model + data-as-of in the report header/footer** — readers will misinterpret without it. The numbers are all-platform by default; a footer that names only the model ships unlabeled all-platform revenue/ROAS to a CMO
- **Invent a report layout instead of copying from `templates/`** — produces inconsistent reports for the same client week-to-week


## B. Board failure modes

Ordered by how badly they mislead the customer. These apply at every cadence;
`board-<cadence>.md` adds the ones specific to one.

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

## 2b. Reading a partially-settled trailing day as a real decline

**Symptom**: the current period's revenue and ROAS look worse than they are, and recover
tomorrow.

**Cause**: the last day in the window has its spend fully recorded but its attribution still
arriving. It passes the revenue trim test (it is only ~10% light on revenue) yet its ROAS is
30% below the trailing median.

**Handling**: the board flags it ("may be partially settled — spend is in, attribution lands
6–24h later"). Do **not** "fix" this by trimming the day: a ROAS-based trim cannot tell a
still-settling day from a genuinely bad one, and hiding the latter is worse than labelling
the former. Never quote the period's ROAS as final while that flag is showing.

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
