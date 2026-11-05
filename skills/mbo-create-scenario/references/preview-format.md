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

End by asking the user to confirm in plain language — e.g. "Reply *confirm* to run, or tell me what to change." Do NOT emit bracketed pseudo-buttons like `[Confirm and run]` / `[Modify]` / `[Cancel]`: the chat surfaces (Slack, embedded web) render them as literal text, not clickable buttons — it looks broken and invites a redundant confirmation. The only real interactive confirm prompt is the system R2 card, which fires automatically when a gated tool runs; the skill never draws its own.

Tell the user the scenario takes a few minutes.
