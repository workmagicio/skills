-- Top-N campaigns by ROAS
-- Use case: "Which campaigns had the highest ROAS last week?" / "Top 10 campaigns by ROAS."
-- Fill: <tenant_id>, <attr_model>, <start_date>, <end_date>, <limit> (default 10)

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
LIMIT <limit>
