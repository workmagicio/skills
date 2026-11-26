-- Step 7: share of spend that got a value for a new / changed NC property
-- Run only once the property shows up as a dimension (can take several hours after the rule is created).
-- Call database-query-ask first (schema + ctx), then run via database-query-run.
-- Fill: {property_name} (exact case, as naming-convention-list returns it), {ads_platform}
-- Tenant isolation is injected by platform-mcp — do NOT add tenant_id filters.

SELECT
    {property_name},
    SUM(ad_spend) AS spend_last_30d,
    SUM(ad_spend) * 1.0 / SUM(SUM(ad_spend)) OVER () AS spend_share
FROM ads_attribution
WHERE event_date >= CURRENT_DATE - INTERVAL '30' DAY
  AND ad_spend > 0
  AND ads_platform = '{ads_platform}'
GROUP BY {property_name}
ORDER BY spend_last_30d DESC
LIMIT 30

-- Read: the NULL / empty row's spend_share is the uncovered spend on that platform.
