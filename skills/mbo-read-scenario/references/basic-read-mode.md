## Mode 7a — basic_read (4-dimensional interpretation)

1. **Pull forecast detail** via `budget-optimizer-forecast` (with `includeSaturation=true` for curve data).
2. **Identify top 2-3 reallocations** — biggest absolute / percentage changes (don't dump all channels).
3. **For each top channel, structure the explanation across 4 dimensions**:

   - **Direction**: add or cut budget?
   - Reason: 对 **Maximize** 场景,重点是**相对其他渠道**的边际效率(为什么此刻这一美元投这里比投别处更值),而非仅自身曲线位置;对 **Target** 场景才主要看自身 marginal ROAS / 饱和曲线位置 / lift test 校准影响
   - **Magnitude**: % change vs current spend ("Meta +12% from \$275K → \$310K")
   - **Impact**: effect on total sales / ROAS ("contributes \~\$180K of the expected +\$240K sales lift")
4. **Check for special states** and flag explicitly (don't bury in channel list):

   - **Reference period spend = 0** on a channel → flag: "Channel X had zero spend in the reference window — MBO can't model it and excluded it from the recommendation"
   - **Insufficient data for saturation curve** → flag: "Channel Y has insufficient historical data, so MBO held its budget at noChange (baseline)"
   - **Locked-by-default channels** (e.g., branded search near 90% impression share) → mention briefly so user knows why these don't shift
   - **User-locked tactics** (locks set by the user in the scenario constraints) → treat as fixed scope, NOT as something to explain or justify. Do not say "because you locked these, the model couldn't do X." If the total projection moved unexpectedly, do the baseline / paid media decomposition first; locks are almost never the right explanation.
5. **Mention baseline vs paid media split** if all channels included in scenario (otherwise this section isn't shown — say so).
6. **Goal-vs-projection sanity check (MANDATORY)** — before writing the reading, compare projected total movement to the user's goal direction:

   - If **goal direction matches** projection direction (e.g., maximize sales + total sales up) → proceed normally.
   - If **goal direction does NOT match** projection direction (e.g., maximize sales but total sales projected lower; minimize CAC but CAC projected up) → **decompose into baseline vs paid media before explaining**.
   
     - Pull both reference and optimized values for: **baseline (organic) sales**, **paid media sales**, total sales, total ROAS, marginal ROAS
     - State the decomposition explicitly in the reading. The paid component is what MBO actually optimizes; the baseline is the model's organic projection (seasonality + trend), which MBO does NOT control.
     - See interpretation-playbook.md row "Total projected sales is LOWER than reference" for the canonical framing.
     - If decomposition can't be computed (e.g., scenario only covers a subset of channels and baseline section is hidden), say so honestly — don't fabricate a generic "channel mix is more efficient" answer.
7. **Caveat backtesting accuracy** only if < 70%.
8. **Link to MBO** — full curves, table, download live there.

<callout emoji="💡">
**Don't take the bait — "more efficient channel mix" as a default explanation.** When goal direction and projection direction disagree, the default-sounding "MBO found a more efficient channel mix" is almost always WRONG. The real cause is usually the baseline (organic) component dropping while the paid component is actually improving. Always decompose first.
</callout>

<callout emoji="💡">
**Don't take the bait — blaming user's locks.** If the user locked Meta, Google, TikTok at custom values and total sales projected drops, do NOT say "because you locked these, the model couldn't optimize overall — that's why sales drop." The locks are user intent, not a flaw. Run baseline decomposition; the drop is usually baseline-driven.
</callout>
