## Mode 7d — mbo_vs_lift_test reconciliation

1. **Critical framing**: lift test is **used to calibrate** MBO, not opposed to it. These measure different things:

   - **Lift test → incremental ROAS** (iROAS): the share of channel-driven sales that would not have happened without the spend (causal)
   - **MBO → marginal ROAS** at a given spend level: the return on the next dollar at the recommended allocation (forward-looking, calibrated by the lift test)
2. **Pull both**: `lift-test-list` for iROAS, `budget-optimizer-forecast` for marginal ROAS at the relevant spend point.
3. **Explain**:

   - If iROAS = 1.5x and MBO marginal ROAS = 3x → that's because iROAS measures average incremental contribution across the test period, while marginal ROAS measures what the next dollar earns at the proposed spend level (which can be steeper if spend is below saturation)
   - If iROAS > MBO marginal ROAS → the channel may be near saturation in the scenario; the lift test captured a less-saturated state
4. **Never frame as "which is right"** — they're complementary measurements, both right at different questions.
5. **Use both terms** with inline explanation on first use (see term-usage.md).

<callout emoji="💡">
**Don't take the bait — "which is right".** When user asks "lift test says 1.5x but MBO says 3x, which is right?", the question itself is wrong. Both are right; they answer different questions (causal incremental vs marginal at recommended spend). Reframe before answering.
</callout>
