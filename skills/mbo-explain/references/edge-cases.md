# Edge cases

| Edge case | Handle |
|---|---|
| Only some channels in the scenario (partial-media run) | Full baseline may not exist; outputs don't describe the full portfolio (G-3) |
| Fixed budget differs from reference spend, sales lower | Trigger → OM-2. Budget below reference spend: split that budget effect out first (sop-detail §6.3). Budget above: paid shouldn't fall, so check paid, then bounds; paid lower with no verified cause → escalate |
| Locks / noChange cover most of the spend | Quantify movable spend first (G-1); then explain remaining moves |
| Reference violates this run's bounds | Reference isn't an available plan here; name the rows; not a model fault |
| Any row outside its bound | Bounds are never relaxed: a bug, escalate |
| Target already met at Reference, plan asks for more budget | No trigger; explain with TA-1 |
| Rows not optimized (zero response) | Held at reference spend, projected outcome 0; say so (R-5). |
| Insufficient data (Q6 label −1) | No budget change and no saturation curve; nothing in the result marks it, so check Q6 before reading it as an unconstrained no-change. Skip Q5; say so (R-5) |
| Rows not optimized (zero Reference spend) | Not part of the plan; say so before interpreting the rest |
| Forecast running or no result row | Status gate — sop-detail §Step 2 |
| Organic differs between Reference and Optimized | Expected by construction; label it, compare paid only (G-2) |
| Scenario changed since last time | reconciliation §3; name confirmed changes only |
| CSM asks about one row only | Brief portfolio check first, then the row |
| Client compares MBO ROAS to attribution or a lift test | reconciliation §1 / §2: not comparable; explain what each figure rests on, no gap |
| CSM asks to "fix" the scenario | Out of scope; suggest the what-if with its tradeoff; CSM runs it |
