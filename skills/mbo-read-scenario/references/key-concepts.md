## Key concepts

- **Saturation curve**: per-channel spend-to-incremental-return curve, calibrated by lift tests
- Marginal vs Average ROAS: marginal = 下一美元的回报;average = 已实现混合值。MBO 优化的是 marginal。**Maximize 的核心机制 = 跨渠道边际拉平**:把预算从边际回报低的渠道挪到高的,直到各渠道下一美元回报大致相等(此时组合总产出最大)——所以"砍某渠道"常是机会成本,不代表它差。**Target** 则是在给定目标下按各渠道曲线位置分配。
- **Baseline vs Paid Media sales**: only shown when all channels in scenario; baseline = organic demand, paid = what reallocation affects
- **MBO ≠ Attribution**: model-estimated vs realized actuals; two methodologies, expected to differ
- **Lift test ≠ Opposed to MBO**: lift test is the calibration input to MBO; they're complementary measurements (iROAS vs marginal ROAS) of related but different things
- **Backtesting accuracy**: 70% threshold; below = caveat, don't refuse
- **Forecast status**: running / completed / failed — don't interpret stale or incomplete forecasts
- **Special channel states**: zero ref-period spend → excluded; insufficient data → held at baseline (noChange); locked by default (branded search) → not optimized
