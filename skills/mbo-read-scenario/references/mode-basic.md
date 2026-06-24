## Detailed SOP — basic_read (4-dimensional interpretation)

1. **Pull forecast detail** via `budget-optimizer-forecast` (`includeSaturation=true`).
2. **Identify top 2-3 reallocations** — biggest absolute / percentage changes. Don't dump all channels.
3. **Structure each top channel along 4 dimensions**:

   - **Direction**: add or cut?
   - **Reason**: marginal ROAS / saturation curve position / lift-test calibration
   - **Magnitude**: % change vs current spend (e.g., "Meta +12% from \$275K → \$310K")
   - **Impact**: effect on total sales / ROAS
4. **Flag special states explicitly** (don't bury):

   - **Zero ref-period spend** → "Channel X had zero spend in reference window — excluded"
   - **Insufficient saturation data** → "Channel Y held at baseline (noChange)"
   - **Locked-by-default channels** (e.g., branded search ≥ 90% impression share) → mention briefly
   - **User-locked tactics** → treat as fixed scope. **Do NOT use locks to "explain" projection.** Run baseline / paid decomposition first
5. **Mention baseline vs paid media split** if all channels included (else say so).
6. **Goal-vs-projection sanity check (MANDATORY)**:

   - Goal direction matches projection direction → proceed normally
   - Goal direction ≠ projection direction (e.g., maximize sales but total sales projected lower) → **decompose into baseline vs paid media before explaining**:
   
     - Pull both reference + optimized values for baseline (organic) sales, paid media sales, total sales, total ROAS, marginal ROAS
     - State the decomposition explicitly. **Paid is what MBO optimizes; baseline is organic projection.**
     - If decomposition can't be computed (scope only includes subset, baseline hidden) → say so honestly. Don't fabricate "channel mix more efficient"
7. **Caveat backtesting accuracy** only if < 70%.
8. **End with MBO link** — curves, table, downloadable spreadsheet live there.

Output template → `references/output-templates.md` § basic_read
