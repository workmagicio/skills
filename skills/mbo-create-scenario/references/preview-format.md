## Step 11 — Preview format spec

<callout emoji="🛑">
**HARD RULE.** Every `budget-optimizer-create` call MUST be immediately preceded by a Step 11 preview-and-confirm in the SAME turn. No exceptions.
</callout>

The preview MUST surface **all auto-applied defaults** with *(default)* annotation so the user can override before running:

- `level=tactic`
- `period=week` (or whatever was parsed)
- `goal=sales`, `goalMethod=maximum`
- `budget=100%` flat (if user didn't say)
- `outcome=totalSalesHalo` for Halo customers, else `totalSales`
- `budget_constraints=none` (if user didn't say)

Also surface baseline anchors:

- Baseline spend (`spendBase`) for the reference window — so user knows the budget anchor
- For target scenarios: baseline value of the target metric (e.g., "baseline ROAS = 2.8x")

Use the table template at templates/scenario-preview.md.

End with three action buttons: `[Confirm and run]   [Modify]   [Cancel]`.

Tell the user the scenario takes a few minutes.
