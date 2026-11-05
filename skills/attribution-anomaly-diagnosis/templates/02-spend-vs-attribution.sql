-- Step 3a: Did spend change? — fastest first check
-- If spend dropped proportionally and attr_orders dropped proportionally, STOP here.
-- Fill: {ads_platform}, {sales_platform}, {baseline_start}, {anomaly_end}

SELECT
    DATE_TRUNC('week', event_date) AS week,
    ads_platform,
    tactic_name,
    sales_platform,
    SUM(ad_spend) AS spend,
    SUM(calibrated_orders) AS idda_orders,
    SUM(calibrated_new_customer_orders) AS idda_nc_orders,
    SUM(calibrated_sales) AS idda_sales,
    CASE WHEN SUM(ad_spend) > 0
        THEN SUM(calibrated_sales) / SUM(ad_spend) END AS roas,
    CASE WHEN SUM(ad_spend) > 0
        THEN SUM(calibrated_new_customer_sales) / SUM(ad_spend) END AS nc_roas
FROM platform_offline.dws_view_mmm_tactic_daily_metrics_latest
WHERE LOWER(ads_platform) LIKE LOWER('%{ads_platform}%')
  AND LOWER(sales_platform) LIKE LOWER('%{sales_platform}%')
  AND event_date BETWEEN '{baseline_start}' AND '{anomaly_end}'
GROUP BY 1, 2, 3, 4
ORDER BY 1

