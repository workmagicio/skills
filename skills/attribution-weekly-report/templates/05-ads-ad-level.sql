-- Parts 4-5 — the channel/tactic funnel for ONE settled 7-day window.
-- Run twice: once for the current window, once for the prior one. The board
-- derives both window boundaries from the settled-window walk, so this query is
-- issued only after 02 has returned.
-- tactic_name is '' or '-1' for platforms without tactics — render as "All activity".
-- Fill: <attr_model> (from 01), <start_date>, <end_date> (inclusive).
-- Tenant isolation is injected by the query tool — do NOT add a tenant_id filter.

SELECT
  ads_platform,
  tactic_name,
  SUM(impressions)                     AS impressions,
  SUM(clicks)                          AS clicks,
  SUM(ad_spend)                        AS ad_spend,
  SUM(ads_conversions)                 AS ads_conversions,
  SUM(attr_all_orders)                 AS attr_all_orders,
  SUM(attr_all_sales)                  AS attr_all_sales,
  SUM(attr_new_customer_all_orders)    AS attr_new_customer_all_orders,
  SUM(attr_new_customer_all_sales)     AS attr_new_customer_all_sales
FROM dws_view_copilot_attr_ads_ad_level_daily_latest
WHERE attr_model_name = '<attr_model>'
  AND event_date     >= '<start_date>'
  AND event_date     <= '<end_date>'
GROUP BY 1, 2
