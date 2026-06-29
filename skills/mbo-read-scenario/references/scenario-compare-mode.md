## Mode 7b — scenario_compare

1. **Pull both** via `budget-optimizer-compare` (or two forecast calls).
2. **Identify what changed**: inputs differ vs outputs differ (with same inputs).
3. **Explain**:

   - Inputs differ → explain how the input change propagates (e.g., switching from Outcome Max to Target Achievement reframes the optimization)
   - Inputs same, outputs differ → underlying-data drift: curves refresh daily, new lift tests recalibrate, reference period pacing matters. **This is expected.**
   - Channel shift > 30% with same inputs → flag as something to verify with CS (potential data quality / structural change)
4. **Output structure rules** (this matters):

   - **Comparison format** (table / side-by-side), **not** "scenario A first then B"
   - **Highlight key differences**, brush over what's same
   - **Numbers with units and % change**: "Meta: \$50K → \$80K (+60%)"
   - **Decision-oriented summary**: what each scenario is suited for
   - **Don't push one as winner** unless user explicitly asked "which is better"
   - **Use scenario names** in conversation, never IDs
   - **Use business language** for differences ("more aggressive", "concentrated on Meta") not "strategy=aggressive, Meta +60%"
5. **If > 2 scenarios** requested → cap at 2 per comparison, offer pairwise.
