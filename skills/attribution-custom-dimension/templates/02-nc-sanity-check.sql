-- Step 4: Sanity-check that the new NC property resolves to non-empty values for most rows
-- Run AFTER naming-convention-create succeeds
-- Fill: {new_property_name} (exact case from naming-convention-list response)
-- Threshold rule: if NULL ratio > 30%, surface to user and offer to adjust

SELECT
    {new_property_name},
    COUNT(*) AS row_count,
    COUNT(*) * 1.0 / SUM(COUNT(*)) OVER () AS row_share
FROM ads_attribution
WHERE event_date >= CURRENT_DATE - INTERVAL '30' DAY
  AND ad_spend > 0
GROUP BY {new_property_name}
ORDER BY row_count DESC
LIMIT 20

