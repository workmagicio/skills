## Detailed SOP — mbo_vs_attribution

1. **Lead with "expected to differ"** — frame BEFORE showing the gap, not after. Otherwise user thinks there's a bug.
2. **Pull both numbers**:

   - MBO via `budget-optimizer-forecast` (model-estimated)
   - Attribution via `database-query-sql` (realized actuals)
3. **Explain methodology gap**:

   - MBO = model-estimated outcome at reference-period spend level; smooths historical fluctuations into a stable forecast
   - Attribution = realized actuals using last-click / iDDA within attribution window
   - Analogy: "Expecting alignment is like expecting a weather forecast to match last month's actual temperatures — the gap is logical, not a discrepancy"
4. **Don't pick a side.** Give situational guidance:

   - Day-to-day performance tracking, reconciling with Meta Ads Manager → **attribution dashboard**
   - Relative efficiency across channels, deciding allocation → **MBO**
5. **Escalate to "check data quality"** only if gap is extreme (ratio > 3×).

Output template → `references/output-templates.md` § mbo_vs_attribution
