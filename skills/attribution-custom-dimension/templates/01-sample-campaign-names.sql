-- Step 2/3: Pull 5-10 real campaign names to read before proposing an NC rule
-- Fill: {ads_platform} (optional channel filter), {limit} (default 10)
-- Returns: distinct campaign_name values, ordered by recent spend
-- Tenant isolation injected by platform-mcp — do NOT add tenant_id filters.

SELECT DISTINCT
    campaign_name,
    SUM(ad_spend) AS spend_last_30d
FROM ads_attribution
WHERE event_date >= CURRENT_DATE - INTERVAL '30' DAY
  AND ad_spend > 0
  {ads_platform_filter}      -- e.g., AND ads_platform = 'Meta'
GROUP BY campaign_name
ORDER BY spend_last_30d DESC
LIMIT {limit}

