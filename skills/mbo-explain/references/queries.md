# Queries

All reads go through workmagic_query. Table names are fixed here: never look them up with chat2sql (it suggests tables that don't exist). Placeholders: {tenant_id}, {scenario_id}, {row_id} (from Q2), {i} (row index from Q4).

Never pull the whole response_json: one result is 125–400 KB, mostly response curves. The engine doesn't support [*] in JSON paths, so rows are expanded with a sequence join (Q4).

## Q1 — Scenario

```sql
SELECT tenant_id, id, name, level, outcome, period, goal, goal_target, goal_method,
       budget, budget_change_type, budget_detail, channels, model_refresh_date,
       model_reference_start_date, model_reference_end_date,
       period_start_date, period_end_date
FROM platform.ads_budget_optimizer_scenario
WHERE tenant_id = {tenant_id} AND id = {scenario_id}
LIMIT 1
```

## Q2 — Status gate (latest row, any status)

Differs from snapshot_builder on purpose: it filters status = success, but Step 2 needs to see a running row or no row.

```sql
SELECT id AS row_id, update_date,
       json_unquote(json_extract(response_json, '$.status')) AS status
FROM workmagic_bi.ods_mmm_result_prod_v2
WHERE tenant_id = {tenant_id} AND forecast_id = {scenario_id}
ORDER BY update_date DESC, id DESC
LIMIT 1
```

No row → no result row. status = running → retry rules in sop-detail §Step 2. Continue only on success, with that row_id.

## Q3 — Portfolio and constraints

```sql
SELECT json_extract(response_json, '$.is_constraints_satisfied') AS is_constraints_satisfied,
       json_extract(response_json, '$.result_overall') AS result_overall
FROM workmagic_bi.ods_mmm_result_prod_v2
WHERE id = {row_id}
```

## Q4 — Rows, without curves

```sql
WITH r AS (
  SELECT response_json FROM workmagic_bi.ods_mmm_result_prod_v2 WHERE id = {row_id}
),
seq AS (
  SELECT row_number() OVER (ORDER BY id) - 1 AS i
  FROM platform.ads_budget_optimizer_scenario LIMIT 200
)
SELECT seq.i,
  json_unquote(json_extract(r.response_json, concat('$.result[', seq.i, '].channel'))) AS channel,
  json_unquote(json_extract(r.response_json, concat('$.result[', seq.i, '].tactic'))) AS tactic,
  json_extract(r.response_json, concat('$.result[', seq.i, '].baseline_1')) AS baseline_1,
  json_extract(r.response_json, concat('$.result[', seq.i, '].baseline_1r')) AS baseline_1r,
  json_extract(r.response_json, concat('$.result[', seq.i, '].calibrated')) AS calibrated
FROM r JOIN seq ON seq.i < json_length(json_extract(r.response_json, '$.result'))
ORDER BY seq.i
```

The seq CTE only needs a table with at least as many rows as the result has; the scenario table is used because it is always readable. baseline_1 / baseline_1r = [spend, sales, profit, mroi, orders]; mroi can be null.

## Q5 — One row's response curve (material rows only)

```sql
SELECT json_extract(response_json, '$.result[{i}].spend') AS spend_grid,
       json_extract(response_json, '$.result[{i}].sales_mean') AS response_mean,
       json_extract(response_json, '$.result[{i}].sales_lower') AS response_lower,
       json_extract(response_json, '$.result[{i}].sales_upper') AS response_upper,
       json_extract(response_json, '$.result[{i}].roas') AS roi_curve,
       json_extract(response_json, '$.result[{i}].mroas') AS mroi_curve
FROM workmagic_bi.ods_mmm_result_prod_v2
WHERE id = {row_id}
```

Not for Insufficient-data rows (Q6 label −1): they have no saturation curve.

## Q6 — Data-sufficiency label (hyp table)

The table is large: always filter on tenant and refresh date, or the query times out. Not yet run end to end.

```sql
SELECT id, update_date,
       json_extract(model_json_t, '$.media_parameters.params') AS params
FROM platform_offline.ods_mmm_hyp_v0
WHERE tenant_id = {tenant_id}
  AND target = {target} AND is_halo = {is_halo} AND is_new_customer = {is_new_customer}
  AND date(update_date) = {model_refresh_date}
ORDER BY update_date DESC
LIMIT 1
```

Channel-level scenarios read model_json_c instead. target / is_halo / is_new_customer come from the scenario's outcome. Label per row: coef = 0 → Insufficient data (-1); otherwise calibrated (0 / 0.5 / 1). The outcome-to-filter mapping and the params element keys (row name, coef, calibrated) are to be confirmed on the first real run.
