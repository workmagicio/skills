-- Step 1: Cross-model comparison — which attribution model diverged?
-- Use this BEFORE diagnosing why, to pinpoint whose attribution is broken.
-- Fill: {ads_platform}, {baseline_start}, {baseline_end}, {anomaly_start}, {anomaly_end}

SELECT
    src_source AS ads_platform,
    CAST(attr_model_array AS VARCHAR) AS model_array,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(1))
        AND event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN attr_orders ELSE 0 END) AS lc_orders_baseline,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(1))
        AND event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN attr_orders ELSE 0 END) AS lc_orders_anomaly,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(21))
        AND event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN attr_orders ELSE 0 END) AS ac_orders_baseline,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(21))
        AND event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN attr_orders ELSE 0 END) AS ac_orders_anomaly,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(31))
        AND event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN attr_orders ELSE 0 END) AS dda_orders_baseline,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(31))
        AND event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN attr_orders ELSE 0 END) AS dda_orders_anomaly,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(32))
        AND event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN attr_orders ELSE 0 END) AS idda_orders_baseline,
    SUM(CASE WHEN json_overlaps(attr_model_array, json_array(32))
        AND event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN attr_orders ELSE 0 END) AS idda_orders_anomaly
FROM platform_offline.dws_view_analytics_attribution_channel_level_latest
WHERE attr_enhanced IN (1, 4)
  AND LOWER(src_source) LIKE LOWER('%{ads_platform}%')
  AND event_date BETWEEN '{baseline_start}' AND '{anomaly_end}'
GROUP BY 1, 2
ORDER BY 1

