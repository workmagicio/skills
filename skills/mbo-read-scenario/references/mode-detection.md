## Mode detection rules (Step 3)

- Single scenario reference / "explain X" / "why does it recommend Y" → **basic_read**
- Two scenarios named / "compare X and Y" / "what changed since last week" → **scenario_compare**
- "Why is MBO different from [dashboard / MTA / attribution / iDDA]" → **mbo_vs_attribution**
- "Lift test showed X but MBO shows Y" → **mbo_vs_lift_test**
- "Actual didn't match forecast" / "why didn't we hit predicted sales" → **mbo_vs_actual**
- "How much should I spend on X?" → not this skill; route to `mbo-create-scenario`
- Ambiguous → ask once with 2-3 specific options

## 2-step disambiguation for "show me my budget" (Step 2)

"What's my budget?" / "Show me my budget" / "Check my budget for Q3" — these are ambiguous. Don't silently pick.

1. **Clarify type**: give 2-4 options that match user's phrasing context:

   - "Existing scenario recommendations (you have N saved)" — if list has scenarios
   - "Build a new scenario for [period]" — route to create
   - "Actual historical spend on the attribution dashboard" — route to data-query
2. **If user picks "existing"** → continue with mode detection. If "build new" → route to `mbo-create-scenario`. If "actual" → route to `attribution-data-query`.
