# Data map

Source of truth: optimizer_ai **db/snapshot_builder.py**. This file maps the framework's logical records to the two tables it reads, and to the derivations it makes. Read through workmagic_query with the SQL in references/queries.md. Anything marked **not available** goes into the missing-field ledger when needed — never estimated.

| Table | Key | What it holds |
|---|---|---|
| platform.ads_budget_optimizer_scenario | tenant_id, id | Scenario inputs |
| workmagic_bi.ods_mmm_result_prod_v2 | tenant_id, forecast_id (= scenario id) | response_json (JSON). Each run writes a running row, then a separate success row: take the latest row by update_date (tie-break on id); status in $.status. Table identified from the data (807 of 833 scenarios, updated daily; ods_mmm_result_prod stopped in September); confirm against optimizer_ai config.get_result_table("prod") |

JSON columns (period, budget_detail, channels, response_json and its result / result_overall) are parsed best-effort; a value that isn't valid JSON is kept as a raw string, not treated as an error.

## Identity and scope

| Field | Source | Note |
|---|---|---|
| Scenario name, link | budget-optimizer-list → name, url | Speak by name; quote url verbatim |
| Scenario ID | scenario.id | forecast_id in the result table |
| Type | derived from goal + goal_method | sop-detail §Step 5; to align with exec_summary._classify_scenario |
| Optimization goal | goal, goal_method, goal_target | goal_target is a multiplier: 4 = 4x ROAS |
| Outcome / sales scope | outcome | sales / profit / orders; …Halo = all sales platforms, non-Halo = DTC only |
| Level | level | tactic or channel; decides whether rows match on tactic or channel |
| Included media | channels |  |
| Model version | model_refresh_date |  |
| Run time | not available | Not needed: status gate uses retries |

## Inputs

| Field | Source | Note |
|---|---|---|
| Optimization dates | period_start_date, period_end_date | period is kept raw |
| Reference dates | model_reference_start_date, model_reference_end_date |  |
| Fixed budget | budget + budget_change_type | See §Normalise |
| Target | goal_target |  |
| Row bounds | budget_detail[] → spendBound [low, high] | See §5 Constraints |

## Portfolio results (result_overall)

| Field | Reference | Optimized | Note |
|---|---|---|---|
| Spend | spend | spend_r |  |
| Sales, profit, orders | sales, profit, orders | sales_r, profit_r, orders_r | Totals, incl. organic |
| ROAS, POAS, CAC | roas, poas, cac | roas_r, poas_r, cac_r | Media-only on both sides |
| Paid component | spend × roas (sales), spend × poas (profit), spend ÷ cac (orders) | same with _r | Comparable across sides |
| Organic component | total − paid | total − paid | Not comparable (organic_comparable = false) |

Why organic isn't comparable: Reference total = actual site-wide KPI in the reference window × period factor; Optimized total = modeled paid + prophet_ratio × (recent actual − recent attributed). The organic difference is built in by construction.

## Allocation rows (result[])

| Field | Source | Note |
|---|---|---|
| Row | channel, tactic |  |
| Reference point | baseline_1 = [spend, sales, profit, mroi, orders] | orders may be absent |
| Optimized point | baseline_1r, same layout |  |
| Average return | derived per outcome: sales ÷ spend, profit ÷ spend, or spend ÷ orders (orders = cost per order) |  |
| Marginal return | Marginal ROAS in the scenario’s outcome: the slope of the row’s mean response curve (sales_mean) at that spend, i.e. outcome dollars per extra $1 for the period. Equals the mroas curve at the same spend point. | At that spend level |
| Deltas | computed: optimized − reference, % of reference (0 when reference is 0) | Spend, sales, profit, orders, roi, mroi |
| Optimized? | reference spend > 0 and optimized sales or orders ≠ 0 | Not optimized → kept at reference spend, projected outcome 0. Insufficient-data rows are in result[] with unchanged spend: identify them with the data-sufficiency label below |
| Calibrated | calibrated (0/1) |  |
| Confidence | confidence |  |
| Response curve | spend (grid), sales_mean, sales_lower, sales_upper, roas, mroas | Interpolate only between grid points, and say so |
| Bound status | derived — §Normalise | at_lower_bound / at_upper_bound / interior / none |

**Data-sufficiency label (not in the result):** platform_offline.ods_mmm_hyp_v0, row chosen by the scenario's outcome (target, is_halo, is_new_customer) and date(update_date) = model_refresh_date, latest first. Per row, $.media_parameters.params[] in model_json_t (tactic level) or model_json_c (channel level). coef = 0 → Insufficient data (-1); otherwise calibrated (0 / 0.5 / 1). These rows do appear in result[], with no budget change (Optimized spend = Reference spend) and no saturation curve. Nothing in the result marks them, so identify them by this label: skip Q5 for them and never cite a curve or marginal return. SQL: queries.md Q6.

## Constraints

| Field | Source | Note |
|---|---|---|
| Row strategy | budget_detail[].strategy | manual / noChange / unlimited / conservative / moderate / aggressive. Decides where the bound comes from; Part B names the setting, not the bound. Confirmed in budget_detail (entries also carry isDefault, spendBase and moderate / aggressive / conservativeSpendBound). Not parsed by snapshot_builder |
| Bounds: manual / noChange / unlimited | budget_detail[].spendBound [low, high] | The backend turns these into per-row bounds; the algorithm only sees bounds, never strategy names. Percentage mode → % of the row's Reference spend. Equal low and high = lock |
| Bounds: conservative / moderate / aggressive | budget-optimizer-reference-data → perChannel[] | budget_detail holds \[0, 0\] placeholders for these rows in spendBound and in moderate / aggressive / conservativeSpendBound: ignore them, never read them as a lock at zero. Computed live by the bound service (reference-period spend + min / max spend over historical windows of the same length); not stored. Call with this scenario's own outcome, level, period dates, reference window and model_refresh_date. Recomputed now, so it can differ from what the run used if history changed: check one binding row against the scenario page |
| Binding limits | derived: bound status at_lower_bound / at_upper_bound | §Normalise; sop-detail §6.2 |
| Constraint-vs-target priority | Constraints always win | Bounds are never relaxed. A target run that can't reach the target returns the highest-ROAS plan within bounds |
| Target reached | is_constraints_satisfied | Target runs: 0 = target not reached |
| Budget clamp | derived: input budget vs Σ row lower / upper bounds | A budget outside that range is silently clamped into it, with no error, so Optimized spend ≠ input budget. sop-detail §6.2 |

## Normalise

- **Budget to dollars.** amount → period total. percentage → % **of** Reference spend (100 = equal, 120 = +20%, 75 = −25%). Cross-check against result_overall.spend_r; a difference means the budget was clamped (sop-detail §6.2).
- **Bounds to dollars.** budget_change_type = percentage → bound × the row's Reference spend ÷ 100. Otherwise the bound is already dollars.
- **Bound status.** Tolerance = max($1, 0.5% × max(|low|, |high|)). Optimized spend within tolerance of low → at_lower_bound; of high → at_upper_bound; else interior.
- **Metric type.** Total: compare levels. Ratio (ROAS, POAS): also show numerator and denominator. Unit cost (CAC, cost per order): lower is better; show both components.
- **Other tolerances** (working defaults, not in the code): totals *equal* within 1% of Reference spend; a row *didn't move* if |change| < 1%. State the tolerance when a conclusion depends on it.

## Missing-field ledger

Field · why it was needed · what it blocked. Goes at the end of Part A; blocked items become "couldn't be diagnosed" lines in Part B.
