## Step 8 — Budget constraint conflict pre-check

If user voiced any budget constraints ("Meta at least \$30K", "TikTok flat", "Pinterest cap \$5K"):

1. **Parse each constraint** into lock_budget / min / max format. **Don't miss any.**
2. **Sum the constraints** against the total budget:

   - If sum of **minimums** > total budget → conflict (total too low)
   - If sum of **locked + minimums** > total budget → conflict
   - If sum of **maximums** < total budget and all channels constrained → conflict (total too high)
3. **If conflict** — tell user where + by how much, give 3 concrete options:

   - "Increase total budget to ≥ \$X"
   - "Drop the floor on [tactic] from \$Y to \$Z or lower"
   - "Raise the cap on [tactic] from \$A to \$B or higher"
4. **NEVER silently adjust constraint numbers to make the scenario build.** If user said "Meta at least \$30K" and that conflicts, you cannot lower it to \$25K to fit — that's the worst possible failure.

<callout emoji="💡">
**Don't take the bait — "the scenario won't build, let me just shave the constraint."** User said "Meta ≥ \$30K". If \$30K + other constraints exceeds total budget, the only correct move is to surface the conflict and give 3 options. Silently adjusting to \$25K destroys user trust and produces a plan the user can't execute.
</callout>
