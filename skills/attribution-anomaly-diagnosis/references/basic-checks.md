## Step 3: Basic checks (before entering model branches)

These rule out config / product-design causes. The majority of "attribution = 0" tickets stop here.

### 3a. Did spend change?

Fastest first check. If spend dropped proportionally, attribution dropping proportionally is correct — no further diagnosis. Template → `templates/02-spend-vs-attribution.sql`

| **Spend change** | **attr_orders change** | **Conclusion** |
|-|-|-|
| Spend ↓ X%, attr_orders ↓ \~X% | Proportional | ✅ **Reasonable. STOP.** Less invested → fewer attributed orders. Explain to client. |
| Spend ↓ X%, attr_orders drop >> X% | Disproportionate | Continue diagnosis |
| Spend flat/↑, attr_orders ↓ | Inverse | Continue diagnosis |

### 3b. [Attribution = 0 only] Is the platform × sales-platform combo valid?

**Known product design: Amazon Ads only attributes to Amazon Store.** If client is running Amazon Ads but looking at Shopify or TikTok Shop dashboard, attribution will always be 0 — product design, not bug.

- Amazon Ads → Amazon Store only
- Google / Meta / TikTok / Pinterest → can attribute to Shopify, TikTok Shop, etc.

Ask CS or client which sales-platform dashboard they're looking at. Known-invalid combo → stop here, explain.

### 3c. [Attribution = 0 only] Measurement Readiness

If product design is ruled out and attribution is still 0, check measurement readiness. Template → `templates/03-measurement-readiness.sql`

| **Status** | **Meaning** |
|-|-|
| `Ready` | Healthy |
| `Not Ready` | Integration incomplete; model can't run → loop in Eng |
| `Not Optimal` | Integrated but signal quality degraded (e.g., unmatch rate too high); attribution may be inaccurate but won't be 0 |

**Note**: Readiness is a one-way path: `Not Ready → Ready → Not Optimal`. Once Ready, never returns to Not Ready.

### 3d. [Row missing from dashboard] Dashboard view & channel config

Sometimes "I can't see channel X" is a config issue — the channel exists, just isn't classified into the right module.

1. **Which dashboard?** Ads dashboard vs Channel dashboard — different views, different data organization.
2. **If Ads dashboard**: channel must be classified as `ads` at the channel level. If not configured, only shows on Channel dashboard.
3. **If Ads dashboard shows an `unmatched` row**: campaign-level UTM tracking issue — some orders couldn't be matched to a campaign and fell into unmatched bucket.
