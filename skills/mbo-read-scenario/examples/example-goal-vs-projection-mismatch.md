## Worked example — goal-vs-projection mismatch (baseline decomposition)

**User ask:** "I built a scenario to maximize Q3 sales, but the recommendation shows total sales projected \$50K lower than my reference period. What's going on?"

### Step 1-6 — Provisioning, locate scenario, knowledge-base, forecast status

All pass. Forecast status = `ready`. Mode = **basic_read**.

### Step 7a — Goal-vs-projection sanity check

Goal direction: **maximize sales** (positive). Projection direction: **total sales DOWN \$50K**. **MISMATCH.**

<callout emoji="💡">
**Bait check:** the default-sounding explanation is "MBO found a more efficient channel mix, total dollars dropped but ROAS improved." This is almost always wrong. Decompose first.
</callout>

### Decomposition

Pull from `budget-optimizer-forecast`:

| **Component** | **Reference** | **Recommended** | **Δ** |
|-|-|-|-|
| Baseline (organic) sales | \$600K | \$520K | **−\$80K** |
| Paid media sales | \$400K | \$430K | **+\$30K** |
| Total sales | \$1,000K | \$950K | −\$50K |
| Paid ROAS | 2.0x | 2.15x | +0.15x |
| Marginal ROAS (paid) | 1.4x | 1.6x | +0.2x |

### Reading (what to tell the user)

<callout emoji="📊">
**Q3 Maximize Sales scenario — why total is projected lower**
**Short answer**: the reallocation is working as intended on the paid component. The drop in total is from the baseline (organic) component, which MBO doesn't control.
**Decomposition**:
- **Paid media sales: +\$30K (+7.5%)**. Paid ROAS improved from 2.0x → 2.15x; marginal ROAS — return on the next dollar at the recommended spend — improved from 1.4x to 1.6x. **This is the part MBO optimizes, and it IS improving.**
- **Baseline (organic) sales: −\$80K (−13%)**. MBO projects baseline (organic) demand to be \~13% lower in Q3 vs the reference window — a seasonal / organic decline. **MBO can't optimize baseline; this drop is outside the recommendation's control.**
- **Net**: −\$50K total, but the paid reallocation is doing its job.
**What this means for you**: the recommendation IS the best maximize-sales plan given the projected Q3 baseline. If you think the baseline projection is too conservative (e.g., you have planned organic campaigns / PR / promo not captured in the model), that's worth flagging to CS — but the paid reallocation isn't the issue.
**[Open scenario in MBO →]** for the full per-tactic breakdown and saturation curves.
</callout>

### What NOT to say

- "MBO found a more efficient channel mix — total dollars are down but ROAS is up." (Generic; doesn't decompose; misleads user into thinking MBO is making things worse.)
- "Because you locked Meta and Google at custom values, this isn't the overall optimum — that's why sales drop." (Blames user's locks; condescending; the drop is baseline-driven anyway.)
- "The model is solving best plan given these constraints, not best plan overall, that's why total sales drop." (Tautological; doesn't tell the user anything useful.)
