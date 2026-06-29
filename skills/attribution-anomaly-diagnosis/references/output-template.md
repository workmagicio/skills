## Customer-facing diagnosis report template

```
# Attribution Diagnosis · {ads_platform} / {tactic_name}

**Period:** {anomaly_period}  (baseline: {baseline_period})
**Sales platform:** {sales_platform}
**Attribution model:** {idda / dda / last_click}

---

## What we found
[1–2 sentences quantifying the change: "Meta ROAS dropped from 4.2x → 2.6x (−38%) week-over-week, driven primarily by [cause]."]

## Why it happened
[Plain-language explanation of the root cause. Pick the matching scenario from references/scenario-snippets.md; do not paste two contradictory ones. If multiple causes overlap, name the dominant one first.]

## What you can do
[2–3 concrete actions. Each ≤ 1 sentence. If no action is warranted because the change is expected, say so explicitly.]

---
*Diagnosis attribution model: {model_name}. Data as of: {query_time}.*

```

### Output rules

- **Three sections only**: What we found / Why it happened / What you can do. Don't add "Background", "Methodology" — those belong in product docs.
- **Quantify the change** in the first sentence (X → Y, ±%) so reader doesn't have to scan
- **Pick one root-cause story**, not a buffet — if multiple overlap, name dominant first, mention second only if material
- **Action items are concrete**: "Review UTM config for [campaigns]" beats "improve tracking"
- **Footer always names attribution model + data-as-of time** — readers misinterpret without it
- **Never expose internal terminology**: no `model_id = 32`, no `dws_view_*` table names, no `attr_enhanced`, no Branch A/B/C labels
- **If cause is "expected behavior"** (Amazon Ads → Shopify, retroactive recalibration, etc.), lead with that — don't make customer think there's a bug
