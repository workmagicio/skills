-- Parts 1-3 — daily paid-ads spend and attributed revenue.
-- Queried at DAILY grain over a padded window; the board buckets into weeks
-- client-side and trims trailing days that are still ingesting. Do not
-- pre-aggregate to weeks here — the settled-window walk needs the daily tail.
-- Fill: <attr_model> (from 01), <start_date>, <end_date> (exclusive).
-- Tenant isolation is injected by the query tool — do NOT add a tenant_id filter.

SELECT
  src_channel,
  event_date,
  SUM(ad_spend)        AS ad_spend,
  SUM(attr_all_sales)  AS attr_all_sales,
  SUM(attr_all_orders) AS attr_all_orders
FROM dws_view_copilot_attr_channel_level_daily_latest
WHERE attr_model_name = '<attr_model>'
  AND src_channel     = 'ads'
  AND event_date     >= '<start_date>'
  AND event_date      < '<end_date>'
GROUP BY 1, 2
