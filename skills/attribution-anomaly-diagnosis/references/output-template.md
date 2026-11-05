## Output — a static HTML diagnosis page (artifact)

A "why did X change" diagnosis is a report a CSM forwards to the client → produce it
as a **static HTML artifact** (a shareable page via the `artifacts` skill), not just a
chat message. **Static, not live** — a diagnosis is a point-in-time explanation; if it
auto-refreshed, the numbers that prompted the story would move out from under it.

### Page structure (three sections + one visual + footer)

```
# Attribution Diagnosis · {ads_platform} / {tactic_name}
{anomaly_period}  (baseline: {baseline_period})   ·   {sales_platform}   ·   {model_name}

[ ONE supporting visual — the anomaly itself: the metric's baseline → anomaly value
  (a before/after bar or a small trend with the drop/spike marked), OR the evidence
  the diagnosis rests on (e.g. spend flat while attributed sales fell). One chart,
  bounded height, per the artifacts chart method. ]

## What we found
1–2 sentences quantifying the change first: "Meta ROAS dropped 4.2x → 2.6x (−38%)
week-over-week, driven primarily by [cause]."

## Why it happened
Plain-language root cause — the matching scenario from references/scenario-snippets.md.
One story, not a buffet; if causes overlap, name the dominant one first.

## What you can do
2–3 concrete actions, each ≤ 1 sentence. If the change is expected (no action needed),
say so explicitly.

────────────────────────────────────────────
Footer: Sales platform: {sales_platform}  ·  Attribution model: {model_name}  ·  Data as of: {query_time}
```

### Rules

- **Three sections only** — What we found / Why it happened / What you can do. No
  "Background" / "Methodology" (those live in product docs).
- **Quantify the change in the first line** (X → Y, ±%) so the reader doesn't scan.
- **One root-cause story**, not a buffet — dominant first, second only if material.
- **The visual carries the same measurement identity** as the text (sales-platform
  scope + model); label it, don't leave a bare axis.
- **Concrete actions**: "Review UTM config for [campaigns]" beats "improve tracking".
- **Footer = measurement identity:** sales-platform scope + attribution model +
  data-as-of. (Diagnosis is per sales platform.)
- **Never expose internal terminology** — no `model_id = 32`, no `dws_view_*` /
  `calibrated_*` column names, no `attr_enhanced`, no Branch A/B/C labels. If a check
  used the MMM-calibrated measure, describe it in business language, never by column.
- **If the cause is expected behavior** (Amazon Ads → Shopify combo, iDDA retroactive
  recalibration, proportional spend drop), lead with "this is expected" so the client
  doesn't assume a bug.
- **Static artifact** — do not wire it to `window.agents.query` auto-refresh; bake the
  diagnosed numbers in as the point-in-time snapshot they are.
- Shared conventions (model aliases, sales-platform scope) are canonical in
  `attribution-data-query` — don't re-derive here.
