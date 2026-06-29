## Mode 7e — mbo_vs_actual (forecast vs realized results)

1. **Pull the scenario's forecast** + **actuals for the same optimization period** via `database-query-sql`.
2. **Frame the comparison**:

   - Forecast = expected outcome based on historical saturation curves
   - Actual = realized outcome influenced by market conditions, creative quality, seasonality, competitor activity, and execution variance
   - Some gap is expected; what matters is whether the gap is within typical model uncertainty (backtesting accuracy gives the range)
3. **Diagnose the gap** at a high level:

   - Was overall spend different from the scenario's recommended spend? (execution variance)
   - Were there market-wide shifts (seasonality, competitor)?
   - Did per-channel actuals diverge proportionally or selectively?
4. **Don't blame the model** blindly. Don't say "MBO was wrong". Frame as: "Actual differed from forecast by X%; here's where the divergence came from."
5. **If the gap is large + per-channel weird** → route to CSM for a deeper look; this could indicate a data quality issue.
