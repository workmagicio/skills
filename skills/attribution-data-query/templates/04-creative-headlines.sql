-- Creative-level headline performance (JSON-array dimension)
-- Use case: "Top 5 headlines by sales last week on Meta."
-- creative_text_headline is returned as a JSON-array string — parse CLIENT-SIDE.
-- Fill: <tenant_id>, <attr_model>, <platform>, <start_date>, <end_date>, <limit>

SELECT
  creative_text_headline,
  SUM(impressions)        AS impressions,
  SUM(attr_shopify_sales) AS sales,
  SUM(ad_spend)           AS ad_spend
FROM dws_view_copilot_attr_ads_creative_level_daily_latest
WHERE tenant_id        = <tenant_id>
  AND attr_model_name  = '<attr_model>'
  AND ads_platform     = '<platform>'
  AND event_date      >= '<start_date>'
  AND event_date       < '<end_date>'
GROUP BY creative_text_headline
HAVING SUM(impressions) > 0
ORDER BY sales DESC
LIMIT <limit>
