# Example A — "Meta ROAS last 7 days" (channel-level single-platform)

An anonymized end-to-end walkthrough of the simplest happy-path query. Use this as a copy-pattern for any single-platform channel-level ROAS question.

## User input

*"Show me Meta ROAS for the last 7 days"*

## Step-by-step

### Step 1 — Parse

- Today's date (re-fetched): `2026-06-17`
- Time window: "last 7 days" → `2026-06-10` to `2026-06-17` (exclusive end)
- Tenant lift-test status: ran lift tests → default to `idda`
- DataSet: by channel-level filter (Meta) → `channel_attribution`
- Dimensions: none (single channel)
- Metric: ROAS

### Step 2 — Pick DataSet

`channel_attribution` (we're filtering to one ads_platform, not breaking by campaign)

### Step 3 — knowledge-base-ask

Ask: *"How to query channel_attribution with filter on ads_platform for the last N days?"* → returns ctx timestamp.

### Step 4 — dashboard-metrics-list

Confirm fields exist: `attr_shopify_sales`, `ad_spend`, `ads_platform`, `attr_model_name`, `src_channel`, `event_date` ✓

### Step 5 — Copy from template

This is a single-platform channel-level ROAS query → match to `templates/01-channel-roas.sql`. Copy and fill:

```sql
SELECT
  SUM(attr_shopify_sales) AS sales,
  SUM(ad_spend)           AS ad_spend,
  SUM(attr_shopify_sales) / NULLIF(SUM(ad_spend), 0) AS attr_roas
FROM dws_view_copilot_attr_channel_level_daily_latest
WHERE tenant_id        = 12345
  AND attr_model_name  = 'idda'
  AND src_channel      = 'ads'
  AND ads_platform     = 'Meta'           -- case-sensitive!
  AND event_date      >= '2026-06-10'
  AND event_date       < '2026-06-17'
HAVING SUM(ad_spend) > 0
```

### Step 6 — Return

| sales | ad_spend | attr_roas |
|-|-|-|
| \$420,160 | \$135,200 | 3.11 |

Reading: *"Meta ROAS last 7 days is **3.11x**, on \$135K spend. (iDDA model — your default since lift tests are calibrated.)"*

## What this example illustrates

- **Template copy + fill**, not "write from scratch"
- **One-line reading** in business language — no long analysis
- **Case-sensitive platform name** (`'Meta'` not `'meta'`) — inline comment in the SQL is the cue
- **iDDA model surfacing** only because the tenant has lift tests AND we default to it; we don't lecture, just acknowledge
- **Exclusive end date** (`event_date < '2026-06-17'`) — last 7 days = Jun 10-16, not 10-17
