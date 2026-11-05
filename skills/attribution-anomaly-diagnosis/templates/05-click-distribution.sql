-- Branch A2: Click distribution shift — new campaign diluting share?
-- Fill: {ads_platform}, {baseline_start}, {baseline_end}, {anomaly_start}, {anomaly_end}

SELECT
    campaign_name,
    MIN(event_date) AS first_seen_date,
    SUM(CASE WHEN event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN clicks ELSE 0 END) AS clicks_baseline,
    SUM(CASE WHEN event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN clicks ELSE 0 END) AS clicks_anomaly,
    SUM(CASE WHEN event_date BETWEEN '{baseline_start}' AND '{baseline_end}'
        THEN ad_spend ELSE 0 END) AS spend_baseline,
    SUM(CASE WHEN event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        THEN ad_spend ELSE 0 END) AS spend_anomaly,
    SUM(CASE WHEN event_date BETWEEN '{anomaly_start}' AND '{anomaly_end}'
        AND json_overlaps(attr_model_array, json_array(21))
        THEN attr_orders ELSE 0 END) AS ac_orders_anomaly
FROM platform_offline.dws_view_analytics_ads_ad_level_metrics_attrs_settings_latest
WHERE attr_enhanced IN (1, 4)
  AND LOWER(ads_platform) LIKE LOWER('%{ads_platform}%')
  AND event_date BETWEEN '{baseline_start}' AND '{anomaly_end}'
GROUP BY 1
ORDER BY clicks_anomaly DESC

