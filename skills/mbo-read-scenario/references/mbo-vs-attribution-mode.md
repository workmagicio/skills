## Mode 7c — mbo_vs_attribution reconciliation

1. **Lead with "expected to differ"** — frame this BEFORE showing the gap, not after. Otherwise user thinks there's a bug.
2. **Pull both numbers**:

   - MBO via `budget-optimizer-forecast` (model-estimated)
   - Attribution via `database-query-sql` (realized actuals)
3. **Explain methodology gap**:

   - MBO = model-estimated outcome at the reference-period spend level; smooths historical fluctuations for a stable forecast
   - Attribution = realized actuals using last-click / iDDA within the attribution window
   - "Expecting these to align is like expecting a weather forecast to match last month's actual temperatures — the gap is logical, not a discrepancy"
4. **Don't pick a side**. Don't say "trust MBO" or "trust attribution". Give situational guidance:

   - "For day-to-day performance tracking and reconciling with Meta Ads Manager → attribution dashboard"
   - "For relative efficiency across channels when deciding allocation → MBO"
5. **Only escalate to "check data quality"** if the gap is extreme (ratio > 3×).
