## Budget parsing — amount vs percentage

- **amount** = absolute USD. "\$500K" → `budgetChangeType=amount`, `budget=500000`. "\$1.2M" → 1200000.
- **percentage** = % of baseline. `budgetChangeType=percentage`:

  - `budget=100` = keep flat (= 100% of baseline)
  - `budget=120` = +20% (= 120% of baseline)
  - `budget=80` = −20% (= 80% of baseline)
  - `budget=200` = 2x baseline
  - `budget=0` = \$0
- Default when user said nothing: `percentage=100` (keep flat).

<callout emoji="💡">
**Don't take the bait — percentage as delta.** `budget=100` is NOT "+100% / 2x". It IS "keep flat". `budget=120` is NOT "+120%". It IS "+20% / 1.2x of baseline". Treat percentage as **% of baseline**, not delta. Mis-parsing this is a critical failure.
</callout>

## Common phrasings → parse target

| **User said** | **Parse to** |
|-|-|
| "\$500K for next month" | `amount=500000` |
| "Keep budget flat" / "same as last month" | `percentage=100` |
| "Increase by 20%" | `percentage=120` |
| "Cut budget 10%" | `percentage=90` |
| "Double the budget" | `percentage=200` |
| "Halve the budget" | `percentage=50` |

<callout emoji="💡">
**Don't take the bait — sign on relative budget.** "cut 10%" → `budget=90`, NOT 110. The cut subtracts from baseline. Dropping the sign is a critical failure.
</callout>

## Goal parsing

- "Maximize sales" / "get the most sales for my budget" → `goal=sales`, `goalMethod=maximum`
- "Hit 3.5x ROAS" → `goal=roas`, `goalMethod=target`, `goalTarget=3.5`
- "Get to \$1M in sales" → `goal=sales`, `goalMethod=target`, `goalTarget=1000000`
- "Maximize new customer ROAS" → `goal=new_customer_roas`, `goalMethod=maximum`

<callout emoji="💡">
**Don't take the bait — maximize vs target.** If user said "hit X target", you must use `goalMethod=target` with `goalTarget=X` populated. Dropping the target value and building "maximize" is a critical failure — the scenario will not converge on what the user asked for.
</callout>
