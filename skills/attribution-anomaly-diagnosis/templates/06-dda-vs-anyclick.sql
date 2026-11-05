-- Branch B1: Compare DDA vs Any Click trend
-- If identical, issue is on click/touchpoint side → go back to Branch A.
-- Fill: {ads_platform}, {baseline_start}, {anomaly_end}

SELECT
    DATE_TRUNC('week', event_date) AS week,
    src_source AS ads_platform,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(21))
        THEN attr_orders ELSE 0 END) AS anyclick_orders,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(31))
        THEN attr_orders ELSE 0 END) AS dda_orders,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(0))
        THEN attr_orders ELSE 0 END) AS platform_orders,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(0))
        THEN ad_spend ELSE 0 END) AS spend
FROM platform_offline.dws_view_analytics_attribution_channel_level_latest
WHERE attr_enhanced IN (1, 4)
  AND LOWER(src_source) LIKE LOWER('%{ads_platform}%')
  AND event_date BETWEEN '{baseline_start}' AND '{anomaly_end}'
GROUP BY 1, 2
ORDER BY 1

