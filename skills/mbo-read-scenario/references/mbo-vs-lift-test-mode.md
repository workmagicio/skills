## Mode 7d — mbo_vs_lift_test reconciliation

**Three numbers are in play, and the pair users most often line up is NOT the one they should**:

- **Lift test → incremental ROAS (iROAS)**: causal — sales that wouldn't have happened without the spend, measured at the tested spend level during the test window
- **MBO → channel ROAS**: model-estimated channel sales ÷ spend at the scenario's spend level — an **average across every dollar**, from the most efficient first dollar to the last
- **MBO → marginal ROAS**: return on the next dollar at the recommended spend — the slope of the curve at that point

Most users already know iROAS vs marginal aren't comparable. **The real confusion is iROAS vs MBO's channel (average) ROAS.** Explain with three reasons: ① average-of-all-dollars vs effect-of-the-tested-band (on a diminishing curve the average reads higher than the band the test varied, almost by construction); ② different spend levels (test spend vs recommended spend sit at different points on the curve); ③ different time windows (test snapshot vs scenario forecast period — seasonality / promos / creative mix differ).

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
