# Verified Cube.dev SQL templates

**This file is a guide** — when to use each template, pitfalls, and notes. **The actual SQL lives in `templates/*.sql`**. Each template below has a corresponding `templates/0X-<name>.sql` file. Agent MUST copy from `templates/`, not from the code blocks below.

## 1. Channel-level ROAS for one ad platform

**Use case**: "What is my Meta ROAS for the last 7 days?" / "Google ROAS last week."

**DataSet**: `channel_attribution`

```sql
SELECT
  SUM(attr_shopify_sales) AS sales,
  SUM(ad_spend)           AS ad_spend,
  SUM(attr_shopify_sales) / NULLIF(SUM(ad_spend), 0) AS attr_roas
FROM dws_view_copilot_attr_channel_level_daily_latest
WHERE tenant_id        = <tenant_id>
  AND attr_model_name  = '<attr_model>'
  AND src_channel      = 'ads'
  AND ads_platform     = 'Meta'
  AND event_date      >= '<start_date>'
  AND event_date       < '<end_date>'
HAVING SUM(ad_spend) > 0
```

**Common pitfalls**:

- Writing `src_channel = 'meta'` — `'meta'` is NOT a value of `src_channel` (valid values: `ads / email / sms / social / affiliate / organic / organic_search / 3rd_party / referral / direct / hidden / other`). Meta lives inside the `ads` bucket and requires BOTH `src_channel = 'ads' AND ads_platform = 'Meta'`.
- `ads_platform` values are case-sensitive — use `'Meta'`, `'Google'`, `'TikTok'`, never `'meta'` / `'facebook'` / `'tiktok ads'`.
- Computing ROAS by averaging per-day or per-campaign ROAS values — that is "average of ratios" and is mathematically wrong. Always use `SUM(sales) / NULLIF(SUM(spend), 0)`.

## 2. Top-N campaigns by ROAS

**Use case**: "Which campaigns had the highest ROAS last week?" / "Top 10 campaigns by ROAS."

**DataSet**: `ads_attribution`

```sql
SELECT
  campaign_name,
  SUM(ad_spend)           AS ad_spend,
  SUM(attr_shopify_sales) AS sales,
  SUM(attr_shopify_sales) / NULLIF(SUM(ad_spend), 0) AS attr_roas
FROM dws_view_copilot_attr_ads_ad_level_daily_latest
WHERE tenant_id        = <tenant_id>
  AND attr_model_name  = '<attr_model>'
  AND event_date      >= '<start_date>'
  AND event_date       < '<end_date>'
GROUP BY campaign_name
HAVING SUM(ad_spend) > 0
ORDER BY attr_roas DESC
LIMIT 10
```

**Common pitfalls**:

- Skipping `HAVING SUM(ad_spend) > 0` — zero-spend campaigns produce NULL ratios that sort to the top in DESC, and tiny-spend campaigns with one lucky order produce 100+ ROAS that buries real top performers. (Observed: per-campaign ROAS `[1.46, 122.76]` from a \$64-spend dummy campaign vs the correct overall ratio-of-sums `3.44`.)
- Using `ROW_NUMBER() OVER (...)` or any window function — rejected by Cube SQL. Use `ORDER BY` + `LIMIT`.
- Querying `campaign_type` or `tactic_name` on `channel_attribution` — those columns do NOT exist on the channel-level table. They only exist on `ads_attribution` (`tactic_name`) and on both `ads_attribution` + `creative_attribution` (`campaign_type`). For YouTube specifically, filter `ads_platform = 'Google' AND campaign_type = 'VIDEO'` on `ads_attribution`.

## 3. Period-over-period comparison (WoW / MoM)

**Use case**: "Last 7 days vs the prior 7 days for Meta." / "This month vs last month."

Cube SQL does NOT support CTEs (`WITH`), `UNION`, subqueries, `LAG`, or window functions. Run **two separate queries** with length-aligned windows and compute the delta client-side.

**DataSet**: `channel_attribution`

```sql
-- Query 1: current period
SELECT
  SUM(attr_shopify_sales) AS sales,
  SUM(ad_spend)           AS ad_spend,
  SUM(attr_shopify_sales) / NULLIF(SUM(ad_spend), 0) AS attr_roas
FROM dws_view_copilot_attr_channel_level_daily_latest
WHERE tenant_id        = <tenant_id>
  AND attr_model_name  = '<attr_model>'
  AND src_channel      = 'ads'
  AND ads_platform     = 'Meta'
  AND event_date      >= '<current_start>'
  AND event_date       < '<current_end>'
```

```sql
-- Query 2: prior period — identical filters, shifted dates
SELECT
  SUM(attr_shopify_sales) AS sales,
  SUM(ad_spend)           AS ad_spend,
  SUM(attr_shopify_sales) / NULLIF(SUM(ad_spend), 0) AS attr_roas
FROM dws_view_copilot_attr_channel_level_daily_latest
WHERE tenant_id        = <tenant_id>
  AND attr_model_name  = '<attr_model>'
  AND src_channel      = 'ads'
  AND ads_platform     = 'Meta'
  AND event_date      >= '<prior_start>'
  AND event_date       < '<prior_end>'
```

**Common pitfalls**:

- Trying to combine the two periods with `WITH ... AS`, `UNION ALL`, a subquery, or a `LAG()` window function — all rejected by Cube SQL. There is no single-statement form; always issue two queries.
- Recomputing date boundaries twice and producing windows of different length (e.g. 7 days vs 8 days, or filters that differ between the two queries) — compute the boundaries and filters once, substitute into both queries.
- Comparing full month vs full month when the current month is mid-period (e.g. May 1–31 vs Apr 1–30 on May 15) — that makes the partial current period look like a ~50% drop that isn't real. Use MTD vs same-day prior MTD.

## 4. Creative-level headline performance (JSON-array dimension)

**Use case**: "Top 5 headlines by sales last week on Meta."

**DataSet**: `creative_attribution`

```sql
SELECT
  creative_text_headline,
  SUM(impressions)        AS impressions,
  SUM(attr_shopify_sales) AS sales,
  SUM(ad_spend)           AS ad_spend
FROM dws_view_copilot_attr_ads_creative_level_daily_latest
WHERE tenant_id        = <tenant_id>
  AND attr_model_name  = '<attr_model>'
  AND ads_platform     = 'Meta'
  AND event_date      >= '<start_date>'
  AND event_date       < '<end_date>'
GROUP BY creative_text_headline
HAVING SUM(impressions) > 0
ORDER BY sales DESC
LIMIT 5
```

`creative_text_headline` is returned as a JSON-array string, e.g. `["We NEVER do this. Shop & save up to 55%...", "Last chance to save..."]`. Parse it client-side and reformat (join items with " / ", or render as bullets) before showing.

**Common pitfalls**:

- Calling `JSON_EXTRACT(creative_text_headline, '$[0]')`, `element_at(creative_text_headline, 1)`, or `creative_text_headline[1]` — all JSON / array functions are rejected by Cube SQL. SELECT the raw column and parse client-side.
- Showing the raw JSON-array string to the user with surrounding brackets and quotes — always parse and reformat.
- Routing to `creative_attribution` for a channel-level question. Only use this DataSet when the user explicitly mentions creative / headline / asset / image / body / landing page.

## 5. Actual store sales (not attribution)

**Use case**: "What sales did Shopify actually report last week?" Triggers: `actual`, `store-reported`, `Shopify dashboard`, `Shopify backend`, `platform-reported`, `Meta-reported`.

**DataSet**: `order_sales`

```sql
SELECT
  sales_platform,
  SUM(order_total_orders) AS orders,
  SUM(order_total_sales)  AS sales,
  SUM(order_net_sales)    AS net_sales
FROM dws_view_copilot_sales_channel_daily_latest
WHERE tenant_id    = <tenant_id>
  AND event_date  >= '<start_date>'
  AND event_date   < '<end_date>'
GROUP BY sales_platform
ORDER BY sales DESC
```

When returning the result, prepend a scope warning: *"⚠️ Data scope: store-reported actuals — not WorkMagic attribution. Numbers may differ from your attribution dashboard."*

**Common pitfalls**:

- Adding `attr_model_name = '...'` to an `order_sales` query — that column does NOT exist on `dws_view_copilot_sales_channel_daily_latest`. The query will fail.
- Silently defaulting to `order_*` fields when the user did NOT say "actual" — phrases like "total sales" default to `attr_shopify_sales` on `channel_attribution`, not `order_total_sales`. The word "total" alone is not a trigger.
- `sales_platform` values are lowercase (`shopify`, `amazon`, `other`) — capitalize when rendering to the user.
