-- Channel-level ROAS for one ad platform
-- Use case: "What is my Meta ROAS for the last 7 days?" / "Google ROAS last week."
-- Fill: <tenant_id>, <attr_model> (idda|dda|last_click), <platform> (Meta|Google|TikTok — case-sensitive), <start_date>, <end_date>

SELECT
  SUM(attr_shopify_sales) AS sales,
  SUM(ad_spend)           AS ad_spend,
  SUM(attr_shopify_sales) / NULLIF(SUM(ad_spend), 0) AS attr_roas
FROM dws_view_copilot_attr_channel_level_daily_latest
WHERE tenant_id        = <tenant_id>
  AND attr_model_name  = '<attr_model>'
  AND src_channel      = 'ads'
  AND ads_platform     = '<platform>'
  AND event_date      >= '<start_date>'
  AND event_date       < '<end_date>'
HAVING SUM(ad_spend) > 0
