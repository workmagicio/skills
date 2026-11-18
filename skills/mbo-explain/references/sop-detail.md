# SOP detail

## Step 1 — Resolve the scenario

Match by link against url (exact), by id, or by name. Link match → echo, then Step 2 with no question. Name with several matches, or no match → list the matching or closest scenarios, each with its link (url, verbatim), period, goal, strategy and last run time; ask which. Same-name and copied scenarios are common, so a name alone always gets a confirmation.

Echo, as text in the reply before any question: the scenario link first (budget-optimizer-list → url, verbatim, mandatory), then tenant, scenario name, period and dates, goal / method / target, outcome and sales scope, level, budget input (as set → dollars), rows included. Needs Q1 (queries.md) as well as budget-optimizer-list. Then ask for confirmation; a tappable question without the echo above it is a failed Step 1. Skip the question when the request already contained the scenario link and it matched a url exactly: echo, then Step 2. Wait for confirmation.

Ask the focus (full / one question) only if unclear. One question per turn; ask_user_input_v0 where available.

## Step 2 — Forecast status gate

| Status | Meaning | Handle |
|---|---|---|
| success | Complete | Proceed |
| running | Still computing, or failed: on an error the algorithm never updates the record, so it stays at running | Retry after ~30 s, max 3. Still running → treat as failed; route to DS with scenario name, tenant, inputs |
| No result row | Input validation failed (nothing is written), or the run never started | Report; route to DS with scenario name, tenant, inputs. Never guess which of the two it was |

The algorithm only ever writes two states: running at start, success on completion. There is no error state to wait for. Read the status from $.status of the latest result row by update_date.

## Step 5 — Sanity check

S = Reference spend · B = Optimized spend · R = Reference value of the selected metric · P = projected value (for total goals, compare the paid component on both sides; total differences go to the organic construction first; media ROAS is comparable as is) · T = target. "Worse" follows metric direction: higher is better for sales, orders, profit, ROAS; lower for CPO / CAC.

**Outcome Maximization** (goal_method = maximum, whatever the goal)

| Situation | Trigger? |
|---|---|
| P worse than R on the goal metric | Yes — explain with OM-2 (check paid first; causes in order: budget below reference spend, bounds that rule out the reference plan) |
| P matches or beats R | No — explain with OM-1 (if B ≠ S, split the budget effect from the reallocation, Step 6.3) |

**Target Achievement** (goal_method = target, whatever the goal). The target mode picks, among plans whose projected goal meets T: for efficiency goals (projected ROAS ≥ T, projected CAC ≤ T) the one with the largest spend; for volume goals such as sales (projected sales ≥ T) the one with the smallest spend.

| Situation | Trigger? |
|---|---|
| P misses T | Yes — state gap D; explain with TA-2 |
| P meets T, with B above or below S | No — explain with TA-1 (efficiency goal: largest spend meeting T; volume goal: smallest spend meeting T) |

No trigger → Step 6 light pass (top moves only), then Step 8.

## Step 6 — Diagnostic sequence

### 6.0 Result flags

Converged/success is always true: never cite them as quality evidence. Target runs: is_constraints_satisfied = 0 means the target wasn't reached within the bounds, and the plan is the best one on the goal metric within the bounds (TA-2).

### 6.1 Paid vs organic

Total goals (sales, profit, orders):

|  | Reference | Optimized | Δ |
|---|---|---|---|
| Paid media (comparable) | C | D | D − C |
| Organic (not comparable) | A | B′ | by construction |
| Total | E | F | F − E |

Paid = spend × roas (sales), spend × poas (profit), spend ÷ cac (orders), on each side. Organic = total − paid.

Only the paid comparison is like-for-like. Reference and Optimized organic are built differently (actual site-wide KPI × period factor vs a prophet-based remainder), so their difference comes from construction: show it, label it, never explain it as a reallocation effect and never treat it as a finding.

Paid and total moving in different directions → the gap is the organic construction difference; say so (G-2).

Partial-media run → playbook G-3.

Ratio goals: show numerator and denominator. Unit cost: spend ÷ orders, both components.

### 6.2 Bounds and feasibility

**Effective bound per row**, dollars for the period: manual / noChange / unlimited rows → budget_detail spendBound (percentage mode → × the row's Reference spend ÷ 100); conservative / moderate / aggressive rows → budget-optimizer-reference-data (data-map §5); their stored spendBound is a [0, 0] placeholder, never a bound. Equal low and high = lock. Rows not optimized stay at reference spend.

**Binding** = bound status at_lower_bound or at_upper_bound (tolerance in data-map §Normalise). Only binding bounds explain.

**Movable spend** = Σ non-held rows (upper − lower), capped by total budget. Report locked / held dollars and movable share.

**Reference feasibility**: each row's Reference spend inside its bound, and Σ Reference = budget (within 1%)? If not, Reference isn't an available plan here and "Optimized is worse than Reference" isn't a model fault. Name the rows.

**Budget clamp** (fixed-budget runs): an input budget below Σ row lower bounds or above Σ row upper bounds is silently clamped into that range, with no error. Check Optimized total spend against the input budget in dollars; beyond tolerance, say the budget was outside what the row limits allow, report the clamped total, and don't explain the gap as an optimization result.

**Bounds are never relaxed.** Any row outside its bound is a bug → escalate (Step 7).

### 6.3 Spend and paid allocation

**Total budget.** B vs S beyond 1% → split: *budget-level effect* (quantify only with evidence — a scenario at the other budget via compare, or saturation values summed across all rows at both levels; otherwise direction only) and *reallocation effect* (row moves).

**Material moves.** Rank by |Δ $|; take rows covering ~80% of gross dollars moved, max five, plus any row asked about. Ignore < 1%.

**Evidence per row**, in order: binding bound → mroi at Optimized spend compared with the other unconstrained rows (in an optimal plan, rows not at a bound sit at roughly the same marginal return; only rows at a bound deviate) → calibrated flag. Never explain a move by comparing marginal ROAS at Reference spend: curves are S-shaped (Hill α > 1 is convex at low spend), so the direction can be reversed. Unconstrained rows with clearly different mroi at Optimized spend are an optimizer-quality signal: put them in the escalation package. Use the goal's return; for orders / CPO goals without orders-per-dollar, say sales evidence is a proxy.

**Row impact** only from the row's own projected outcome at both spend levels — never by subtracting from the portfolio.

**Target gap**: state P vs T and D every time in a target run.

### 6.4 No-move rows

Explained only by a verified condition: lock / noChange; binding bound; insufficient data (Q6 label −1: unchanged spend, no curve); not optimized (zero Reference spend or zero response); unconstrained no-change.

## Step 7 — Escalation

Escalate to DS when **all** hold: Outcome Maximization; B ≈ S; Reference feasible; Reference paid outcome still better than Optimized paid outcome.

Also escalate: any row outside its bound (a bug: bounds are never relaxed); still running after the retries, or no result row; changed results between runs with no confirmed input or model difference.

**Package**: tenant, scenario name and url, inputs, the R / P / S / B table, is_constraints_satisfied, 6.1 paid comparison, 6.2 feasibility result, material rows with evidence, missing-field ledger, spot-check status.
