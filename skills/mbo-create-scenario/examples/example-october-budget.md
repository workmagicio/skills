## Worked example — October 2026 budget scenario with constrained model window

**User ask:** "Build me a scenario for October budget allocation, \$500K total across Meta and Google."

**Context:** Today is 2026-06-24. The MMM model window is `2025-06-13 → 2026-06-13` (one year, ending 2026-06-13).

### Step 1 — Provisioning check

`budget-optimizer-list` → returns existing scenarios. MBO enabled. ✓

### Step 4 — knowledge-base-ask

Retrieve `ctx` + MBO conventions. ✓

### Step 5 — Parse

- "October" → optimization_period = 2026-10-01 → 2026-10-31 (31 days)
- "\$500K total" → budget=500000, budgetChangeType=amount
- "Meta and Google" → channels filtered to Meta + Google
- Implied: `goalMethod=maximum`, `goal=sales` (default)

### Step 6 — Ask for reference period (always)

Call `budget-optimizer-reference-data` first → `hyp.model_window.end = 2026-06-13`.

<callout emoji="💡">
**Bait check:** intuitive reference for October would be September 2026 (immediately prior, same length). BUT `model_window.end = 2026-06-13`. September is OUT-OF-BOUNDS. Clamp.
</callout>

Clamp: same length (31 days) ending at `model_window.end`: **2026-05-14 → 2026-06-13**.

Surface to user:

*"For the reference baseline, I'll use* ***2026-05-14 → 2026-06-13*** *(31 days, same length as October). I can't use September because the MMM model only has data through 2026-06-13. Sound good, or want a different window inside that bound?"*

User: "yes, that works."

### Step 7 — Saturation lock proposal

Run rule across all Meta + Google tactics. Flagged:

- `Google_Brand_Search` — impression share 94% over reference period
- `Meta_Retargeting` — name-matched + marginal ROAS / avg = 0.42

Surface proposal with reasons. User picks **Lock all**. Add both to `budget_constraints` at reference spend.

### Step 8 — Constraint conflict check

Lock sum (Brand_Search baseline \$45K + Retargeting baseline \$30K) = \$75K. Total budget \$500K. No conflict. ✓

### Step 9 — Validate

Optimization period 2026-10-01 → 2026-10-31 is future. Reference period inside model window. ✓

### Step 11 — Preview

**Scenario: October Meta + Google Allocation**

| **Setting** | **Value** |
|-|-|
| Level | Ad tactic *(default)* |
| Sales platform | Shopify *(default — all Ready)* |
| Optimization period | 2026-10-01 → 2026-10-31 (October, 31 days) |
| Reference period | 2026-05-14 → 2026-06-13 (prior 31 days, clamped to model window) |
| Scenario type | Outcome Maximization |
| Optimization goal | Sales (maximize) *(default)* |
| Total budget | \$500,000 (absolute) — baseline reference was \$420K |
| Outcome | totalSalesHalo *(default — Amazon integrated)* |
| Budget constraints | Google_Brand_Search locked at \$45K, Meta_Retargeting locked at \$30K *(your saturation-lock choice)* |

Reply *confirm* to run this scenario, or tell me what you'd like to change.

*"This scenario takes a few minutes to run."*

### Step 12 — Create

User confirms. Call `budget-optimizer-create`. Quote `scenarioURL` verbatim from response.

### Step 13 — Deliver

Wait \~1 min. Call `budget-optimizer-forecast`. `status=ready`. Summarize:

*"Scenario created — \[Open in MBO →\](https://app.workmagic.io/...). Recommended allocation: Meta \$310K (+12% vs baseline), Google \$190K (−15%). Expected sales lift: \~+\$240K vs reference allocation. Google_Brand_Search and Meta_Retargeting held at reference spend per saturation lock. Click the link to open the scenario in MBO — saturation curves, full per-tactic breakdown, and downloadable spreadsheet are there."*
