## Failure modes (never do these)

- **Skip `knowledge-base-ask` before SQL** — `database-query-sql` requires the `ctx` timestamp
- **Skip Step 3a (spend check)** — most "swings" are just proportional spend changes
- **Jump straight into lift-test diagnosis on a rule-based or DDA anomaly** — lift tests only affect iDDA
- **Conclude "WM bug" without verifying against platform-reported orders** — if Meta Ads Manager also shows the drop, it's real
- **Treat retroactive change as a bug** — for iDDA it's expected; explain the mechanism instead
- **Use `attribution_model` as a SQL column** — the actual dimension is `attr_model_name`
- **Run the full 5-step tree when Step 3 already explains it** — stop early when an obvious cause is found
- **Expose internal terminology** — customers should never see "model_id = 32", table names, or Branch A/B/C labels
- **Recommend a lift-test refresh without checking environmental conditions** — refresh during a promo period just creates a second bad number
- **Add `tenant_id` filters in SQL** — platform-mcp injects it
- **Write SQL from scratch instead of copying from `templates/`** — increases risk of platform casing / Cube-syntax / aggregation errors
- **Cite ROAS as average of per-row ratios** — always `SUM(sales) / NULLIF(SUM(spend), 0)`
- **Paste two contradictory scenario snippets in one report** — pick the dominant cause, mention second only if material
