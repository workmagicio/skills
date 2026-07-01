UI labels are the source of truth — every DB field renders using its UI-visible name.

Metrics — Orders group (when primary metric = orders)

| DB field | UI label | Format |
|-|-|-|
| iorders | “Incr. orders” | integer count (≥ 1,000 → 1,234; < 1,000 → 146) |
| lift_pct | “Lift %” | percentage, 1 decimal — 13.5%, 0.2% |
| icpa | “Cost per incr. order” | \$XX.XX |
| isales | “Incr. sales” | \$X,XXX |
| iroas | “Incr. ROAS” | \$X.XX always 2 decimals — \$2.10, \$0.58 |

Metrics — New customers group (when primary metric = new_customers, or for halo readouts)

| DB field | UI label | Format |
|-|-|-|
| nc_iorders | “Incr. new customer orders” | integer count |
| nc_icpa | “Incr. CAC” | \$XX.XX (UI says “Incr. CAC” — use that, not bare “CAC”) |
| nc_isales | “Incr. new customer sales” | \$X,XXX |
| nc_iroas | “Incr. new customer ROAS” | \$X.XX 2 decimals |

UI labels not directly from lift-test-readout — source and rendering

| UI label | Source | Skill handling |
|-|-|-|
| Ad spend | NOT from lift-test-readout — comes from lift-test-get config or aggregated platform spend | Required to interpret any iROAS / CAC value. Pull from config source, not the readout response. |
| Confidence interval (lift %) | In extra_info JSON in the readout response | Render as [X% \~ Y%] matching UI format. |
| Significance | If extra_info contains CI → derive from CI crossing zero. If extra_info does not contain CI → significant by default. | Render as “Significant” / “Not significant” matching UI badge. |

Fields NOT exposed in the readout

- ctrl_orders, test_orders, nc_ctrl_orders, nc_test_orders — counterfactual / treatment-side raw counts; inputs to the lift % calc, not user-facing.
- iaov, nc_iaov — UI doesn’t surface these by default; do not render unless user explicitly asks.
- summable, update_time, test_channel_index — metadata.
- ads_platform_data JSON — out-of-scope (attribution comparison view).
- start_date, end_date, cooldown_end_date — reference as phrases (“test window: Mar 5 – Mar 26”), don’t dump raw.

Store-family labels (always apply)

| DB field family | Render as |
|-|-|
| shopify\_\* | “DTC” (never “Shopify” — store may be custom site) |
| amazon\_\* | “Amazon” |
| tiktok\_\* | “TikTok Shop” |
| combined\_\* | “Combined” or “combined across all stores” |

Number formatting (always apply)

| Type | Format |
|-|-|
| Per-order count | ≥ 1,000 → 1,234; < 1,000 → integer 146 |
| ROAS / iROAS / NC iROAS values | \$X.XX always 2 decimals — \$2.10, \$0.58 |
| Percentages | X.X% one decimal — 13.5%, 0.2% |
| Dollar amounts ≥ \$1,000 \| \`\$X,XXX—\$10,989\| \| Per-unit costs < \$1,000 \|\$XX.XX—\$76.31\| \| Confidence intervals \|[X% \~ Y%]\` matching UI format |  |
| Significance flag | “Significant” / “Not significant” (match UI badge exactly) |

**Always round** — never carry source precision through. \$2.1287643 is wrong, \$2.13 is right.
