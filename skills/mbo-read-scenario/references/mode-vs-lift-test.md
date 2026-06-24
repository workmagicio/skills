## Detailed SOP — mbo_vs_lift_test



- **Lift test → incremental ROAS (iROAS)**: causal share of channel-driven sales over the test period
- **MBO → marginal ROAS**: return on the next dollar at the recommended spend level (forward-looking, calibrated by the lift test)

1. **Pull both**: `lift-test-list` for iROAS, `budget-optimizer-forecast` for marginal ROAS at the relevant spend point
2. **Explain the gap**:

   - iROAS 1.5x but MBO marginal ROAS 3x → iROAS = average causal contribution during the test; marginal = next-dollar return at the proposed spend (steeper if spend is below saturation)
   - iROAS > MBO marginal ROAS → channel may be near saturation in the scenario; the lift test captured a less-saturated state
3. **Never frame as "which is right"** — they're complementary measurements.
4. **Use both terms** with inline explanation on first use (see `references/term-policy.md`)

Output template → `references/output-templates.md` § mbo_vs_lift_test
