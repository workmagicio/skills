```
# {Tenant} Quarterly Marketing Performance · {Quarter} {Year}

> **Period:** {quarter_start} – {quarter_end}  ·  **Comparison:** vs {prior_quarter}

---

## Quarter at a Glance

|                | This {Quarter}  | Prior {Quarter} | Δ        |
|----------------|-----------------|-----------------|----------|
| **Total Spend**| ${tot_spend}    | ${prev_spend}   | {±pct}%  |
| **Revenue**    | ${tot_rev}      | ${prev_rev}     | {±pct}%  |
| **ROAS**       | {tot_roas}      | {prev_roas}     | {±delta} |
| **NC ROAS**    | {nc_roas}       | {prev_nc_roas}  | {±delta} |

---

## Channel Performance

| Channel  | Spend     | Revenue   | ROAS    | QoQ ROAS | NC ROAS |
|----------|-----------|-----------|---------|----------|---------|
| Meta     | ${m_sp}   | ${m_rv}   | {m_roas}| {±pct}%  | {m_ncroas} |
| Google   | ${g_sp}   | ${g_rv}   | {g_roas}| {±pct}%  | {g_ncroas} |
| TikTok   | ${t_sp}   | ${t_rv}   | {t_roas}| {±pct}%  | {t_ncroas} |

---

## Key Movements

(2-3 sentences of business-language commentary on the biggest moves. Channel-level only — no campaigns.)

- {Channel} grew/contracted by {pct}% QoQ, driven by {strategic factor}.
- New-customer share shifted from {prev}% to {curr}% — the team's {audience strategy / lift-test calibration} is the likely driver.

---

## Strategic Recommendations Next Quarter

(2-3 strategic recs. Each ≤ 2 sentences. Budget reallocation level, not campaign-level.)

1. **Rebalance budget toward {channel}** — iDDA shows {pct}% incremental ROAS lift; reallocate {dollar amount} from {underperforming channel}.
2. **Run {lift test type} on {channel}** before Q+1 — current calibration is {days_old} days old.
3. **{Strategic move}**.

---

*Attribution model: {model_name}  ·  Data as of: {query_time}*

📊 [Full quarterly review in WorkMagic]({dashboard_url})

```

**Notes for executive variant**:

- **No campaign-level detail** — CMO doesn't want to drill that far
- **Channel table caps at 5 rows** — if > 5 ad platforms, group long tail as "Other"
- Recommendations should sound like the user (or their CSM) saying it, not like agent output — "Rebalance budget" beats "Recommendation: budget rebalancing"
- If email + PDF delivery, render as 1-page PDF; HTML if in-app
