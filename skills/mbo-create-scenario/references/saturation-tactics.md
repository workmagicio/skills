## Step 7 — Saturation-prone tactic lock proposal (MANDATORY)

Some tactics are **inherently saturation-prone** — adding budget produces little or no incremental return because they've already captured the available demand or audience. Common examples: branded search, retargeting, loyalty / returning-customer campaigns, brand DPA. If MBO runs without locking these, the optimizer may waste budget on them or under-recommend channels that actually have headroom.

### Detection rules — flag if ≥ 1 of:

- **Name pattern match** (lower-cased tactic / campaign name contains): `brand` · `branded` · `retarget` · `remarket` · `rt` (whole word) · `loyalty` · `rc` · `returning customer` · `existing customer` · `dpa-brand` / `brand dpa`
- **Impression share heuristic**: ≥ 80% over the reference period → no inventory headroom
- **Saturation curve flat at current spend**: marginal ROAS / average ROAS < 0.5
- **Steady-state historical pattern**: spend stable over last 60–90 days AND attributed orders / sales also stable
- **MBO model's own "locked-by-default" flag** (if returned in reference-data): respect it

### Behavior

1. Run the rule against every tactic in scope after Step 6.
2. **Never silently lock**. Always surface the proposal with reason per tactic (use templates/saturation-proposal.md).
3. **Wait for user confirmation**. Don't proceed to Step 8 until user picks one of the three options.
4. If **Lock all** → add each flagged tactic to `budget_constraints` as a lock at reference-period spend.
5. If **Adjust per tactic** → allow tactic-by-tactic decisions (lock / leave free / custom min-max).
6. If **Skip locks** → proceed without locks; record decision in scenario notes.
7. If rule flags **zero tactics** → no message; proceed silently to Step 8.

### Caveats

- If user explicitly named a flagged tactic as something they want to scale ("aggressive on retargeting"), **skip the lock proposal for that tactic** — respect the user's scale intent, don't push back.
