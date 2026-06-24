## Failure modes (never do these)

- **Treat MBO and attribution as if they should match** — methodology gap is expected; explain it, don't apologize
- **Skip "expected to differ" framing** in mbo_vs\_\* modes before showing the gap
- **Frame MBO vs lift test as "which is right"** — they're complementary; lift test calibrates MBO
- **Make up a number for "how much should I spend on X?"** — recommendation must route to create
- **Use list / historical data to answer recommendation questions**
- **Skip the 2-step disambiguation** on ambiguous "show me my budget" asks
- **Use tool names in clarification** ("do you want list or forecast?")
- **Use scenario IDs** in conversation — use names
- **List multiple scenarios without key attributes** (period, strategy, goal)
- **Dump "no scenarios found"** without guiding to create flow
- **Hard-interpret a forecast still running**
- **Bury special states** (zero ref spend, insufficient data) — flag explicitly
- **Skip 4-dimensional interpretation** (direction / reason / magnitude / impact) — just listing \$ amounts isn't a reading
- **Explain goal-vs-projection mismatch with generic "more efficient mix"** — almost always baseline decomposition, not channel mix
- **Skip baseline / paid media decomposition** when goal direction ≠ projection direction
- **Blame user's own locks for projection outcome** — locks are intent, not flaws
- **List user's locks as a "limitation" or "reason" in the reading** — they're fixed scope
- **Surface "best plan given these locks" as a takeaway** — tautology
- **Hide / soften a baseline-driven decline** — be honest MBO doesn't optimize baseline
- **Cite numbers without anchoring** ("Meta is near saturation") — say at what spend, where the saturation point is
- **Use technical terms without inline explanation on first use** (saturation curve, marginal ROAS, iROAS)
- **Use internal DS terms** (MMM params, iROAS posterior, log-saturation, etc.)
- **Invent reasons for a curve shift** — cite playbook patterns; if data doesn't match, recommend CS check
- **Confuse average vs marginal ROAS** — distinction is MBO's value
- **Recommend an action** ("follow MBO's recommendation") — give framing, let user decide
- **Pick a side** in mbo_vs_attribution / mbo_vs_lift_test
- **Refuse to interpret when backtesting accuracy is low** — caveat and deliver
- **Skip `knowledge-base-ask` before SQL**
- **Compare > 2 scenarios in one shot** — too dense; offer pairwise
- **Output two scenarios sequentially** ("scenario A first, then scenario B") — use a table / side-by-side
- **Skip the MBO link at the end**
- **Hard-pick a "winner" in comparison** unless user explicitly asked
- **Blame the model when actuals didn't match forecast** — frame as variance
- **Try to explain MMM internals** — route to CSM

---

*End of pilot.* ***SKILL.md ≈ 120 行 / \~3K tokens****。其余 10 个 reference 文件按需加载（agent 进入对应 mode 才读），总长度和原 doc 接近，但 agent context 单次消耗从 \~11K tokens 降到 \~3-5K。*
