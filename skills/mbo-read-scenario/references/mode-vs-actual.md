## Detailed SOP — mbo_vs_actual

1. **Pull the scenario's forecast** + **actuals for the same optimization period** via `database-query-sql`
2. **Frame the comparison**:

   - Forecast = expected outcome from historical saturation curves
   - Actual = realized outcome influenced by market, creative quality, seasonality, competitor activity, execution variance
   - Some gap is expected; what matters is whether it's within typical model uncertainty (backtesting accuracy gives the range)
3. **Diagnose the gap at a high level**:

   - Was overall spend different from the scenario's recommended spend? (execution variance)
   - Were there market-wide shifts (seasonality, competitor)?
   - Did per-channel actuals diverge proportionally or selectively?
4. **Don't blame the model**. Frame as "actual differed from forecast by X%; here's where the divergence came from."
5. **If the gap is large + per-channel weird** → route to CSM for deeper look (could be data quality issue).

Output template → `references/output-templates.md` § mbo_vs_actual
