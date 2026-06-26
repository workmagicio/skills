## Key concepts

- **MBO provisioning**: feature flag gated; check via `budget-optimizer-list` success.
- **Saturation curve**: per-channel spend-to-incremental-return curve, calibrated by lift tests.
- **Marginal vs Average ROAS**: MBO optimizes marginal (next-dollar return). Average ROAS blends efficient + saturated spend and is misleading at allocation boundary.
- **Outcome Max vs Target Achievement**: the two scenario types. Outcome Max needs budget; Target Achievement needs target value.
- **Reference vs Optimization period**: reference = historical baseline; optimization = future window. **Same length** recommended; mismatched lengths get prorated — must disclose to user.
- **Constraint conflict**: skill pre-checks; if conflict, give 3 concrete options. Never silently adjust.
- **Halo outcome**: `totalSalesHalo` default when Amazon / TikTok Shop integrated; else `totalSales`.
