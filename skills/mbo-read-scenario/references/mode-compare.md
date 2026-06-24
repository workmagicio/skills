## Detailed SOP — scenario_compare

1. **Pull both** via `budget-optimizer-compare` (or two forecast calls)
2. **Identify what changed**: inputs differ vs outputs differ (same inputs)

   - Inputs differ → explain how the input change propagates (e.g., Outcome Max vs Target Achievement reframes optimization)
   - Inputs same, outputs differ → underlying-data drift: curves refresh daily, new lift tests recalibrate. **Expected.**
   - Channel shift > 30% with same inputs → flag for CS check (potential data quality / structural change)
3. **Output structure rules**:

   - **Comparison format** (table / side-by-side), NOT "scenario A first then B"
   - Highlight key differences; brush over what's same
   - Numbers with units + % change
   - Decision-oriented summary: what each scenario is suited for
   - **Don't push one as winner** unless user explicitly asked "which is better"
   - Use scenario **names** in conversation, never IDs
   - Use business language for diffs ("more aggressive", "concentrated on Meta"), not "strategy=aggressive, Meta +60%"
4. **If > 2 scenarios requested** → cap at 2 per comparison, offer pairwise

Output template → `references/output-templates.md` § scenario_compare
