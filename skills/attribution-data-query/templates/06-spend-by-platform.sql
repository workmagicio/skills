-- Total ad spend across ALL ad platforms, broken down by platform
-- Use case: "What did we spend on ads in the last 7 days?" / "Spend by platform last week." / "Which platforms are spending?"
-- Fill: <tenant_id>, <attr_model> (tenant default from the pre-flight query), <start_date>, <end_date>
-- Source table is FIXED: channel-level, never ad-level (ad-level loads the most recent day later -> totals come out low).

SELECT
  ads_platform,
  SUM(ad_spend) AS ad_spend
FROM dws_view_copilot_attr_channel_level_daily_latest
WHERE tenant_id        = <tenant_id>
  AND attr_model_name  = '<attr_model>'
  AND src_channel      = 'ads'
  AND event_date      >= '<start_date>'
  AND event_date       < '<end_date>'
GROUP BY ads_platform
HAVING SUM(ad_spend) > 0
ORDER BY ad_spend DESC
